# 17. SYSTEM OPERATIONS

## 17.1 Operational Overview

This section defines the monitoring, logging, backup, and incident management procedures for the Maptech Ticketing System in a production environment.

---

## 17.2 Monitoring

### Application Monitoring

| Component | Metric | Recommended Tool |
|-----------|--------|-----------------|
| **Django Backend** | Request latency, error rates (4xx/5xx), active connections | Prometheus + Grafana / New Relic |
| **Daphne ASGI** | WebSocket connection count, memory usage, CPU | Process monitoring (systemd, supervisord) |
| **PostgreSQL** | Query performance, connection pool, disk I/O | pg_stat_statements, pgAdmin |
| **Redis** | Memory usage, connected clients, pub/sub channels | Redis CLI / RedisInsight |
| **Frontend (SPA)** | Page load time, API call latency, JavaScript errors | Sentry / LogRocket |

### Infrastructure Monitoring

| Resource | Threshold | Alert |
|----------|-----------|-------|
| CPU Usage | > 80% sustained | Warning |
| Memory Usage | > 85% | Warning |
| Disk Space | > 90% | Critical |
| WebSocket Connections | > 500 concurrent | Warning |
| API Response Time | > 2 seconds (p95) | Warning |
| Error Rate (5xx) | > 1% | Critical |

### Health Check Endpoints

The system provides the following endpoints for health monitoring:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/` | API root — confirms DRF is running |
| `GET /api/schema/swagger/` | Swagger UI — confirms documentation service |
| `GET /admin/` | Django Admin — confirms template rendering |
| `ws://host/ws/notifications/` | WebSocket connectivity test |

### Uptime Monitoring

- **External Ping:** Use UptimeRobot or Pingdom to monitor the public endpoint every 60 seconds.
- **Internal Check:** Scheduled health checks via cron or systemd timers that hit the API root and verify a 200 response.

---

## 17.3 Logging

### Backend Logging Architecture

Django's built-in logging framework is used with Python's `logging` module.

**Log Levels:**

| Level | Usage |
|-------|-------|
| `DEBUG` | Detailed diagnostic information (development only) |
| `INFO` | General operational events (user login, ticket creation) |
| `WARNING` | Unexpected conditions that don't halt operation |
| `ERROR` | Errors that prevent a specific operation |
| `CRITICAL` | System-wide failures requiring immediate attention |

**Recommended Logging Configuration:**
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/maptech/ticketing.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {'handlers': ['file', 'console'], 'level': 'INFO'},
        'tickets': {'handlers': ['file', 'console'], 'level': 'INFO'},
        'users': {'handlers': ['file', 'console'], 'level': 'INFO'},
    },
}
```

### Application-Level Audit Logging

The system has a built-in `AuditLog` model that records:

| Field | Description |
|-------|-------------|
| `user` | The user who performed the action |
| `action` | Description of the action taken |
| `model_name` | The model affected (e.g., Ticket, User) |
| `object_id` | The primary key of the affected record |
| `changes` | JSON field containing before/after values |
| `ip_address` | The IP address of the request |
| `created_at` | Timestamp of the action |

**Audit events are automatically captured via Django signals for:**
- Ticket creation, updates, assignments, and status changes
- User creation and profile updates
- Escalation events
- Message sending and reactions

### Log Retention

| Log Type | Retention Period | Storage |
|----------|-----------------|---------|
| Application logs | 90 days | Filesystem / Log aggregator |
| Audit logs (database) | Governed by `RetentionPolicy` model | Database |
| Access logs (Nginx) | 30 days | Filesystem |
| Error logs | 180 days | Filesystem / Error tracker |

---

## 17.4 Backup and Recovery

### Backup Strategy

| Component | Method | Frequency | Retention |
|-----------|--------|-----------|-----------|
| **Database (PostgreSQL)** | `pg_dump` full backup | Daily (2:00 AM) | 30 days |
| **Database (PostgreSQL)** | WAL archiving (point-in-time) | Continuous | 7 days |
| **Media Files** | File-level backup (rsync) | Daily | 30 days |
| **Application Code** | Git repository | On every commit | Indefinite |
| **Configuration** | Encrypted backup of `.env` files | Weekly | 90 days |

### Backup Procedures

**Database Backup (PostgreSQL):**
```bash
#!/bin/bash
# Daily database backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
pg_dump -h localhost -U maptech_user maptech_db \
  --format=custom \
  --file="${BACKUP_DIR}/maptech_${TIMESTAMP}.dump"

# Remove backups older than 30 days
find ${BACKUP_DIR} -name "*.dump" -mtime +30 -delete
```

**Media Files Backup:**
```bash
#!/bin/bash
# Daily media backup
rsync -avz --delete \
  /var/www/ticketing/backend/media/ \
  /backups/media/
```

### Recovery Procedures

**Database Recovery:**
```bash
# Full restore from backup
pg_restore -h localhost -U maptech_user \
  --dbname=maptech_db \
  --clean \
  /backups/database/maptech_YYYYMMDD_HHMMSS.dump
```

**Recovery Time Objectives:**

| Scenario | RTO | RPO |
|----------|-----|-----|
| Database corruption | < 2 hours | < 24 hours |
| Server failure | < 4 hours | < 24 hours |
| Data center failure | < 8 hours | < 24 hours |

---

## 17.5 Incident Management

### Incident Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|--------------|---------|
| **P1 — Critical** | System down, all users affected | < 15 minutes | Database failure, server crash |
| **P2 — High** | Major feature unavailable | < 1 hour | WebSocket failure, authentication down |
| **P3 — Medium** | Feature degraded | < 4 hours | Slow API responses, minor UI bugs |
| **P4 — Low** | Cosmetic or minor issue | Next business day | Typo, style inconsistency |

### Incident Response Process

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Detect    │───►│  Triage &   │───►│  Resolve &  │───►│  Post-      │
│  (Alert /   │    │  Assign     │    │  Restore    │    │  Mortem     │
│   Report)   │    │  Severity   │    │  Service    │    │  Review     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

1. **Detection:** Alert received via monitoring tool, or user report through the ticketing system itself.
2. **Triage:** On-call engineer assesses severity, assigns to appropriate team member.
3. **Resolution:** Engineer investigates using logs and audit trail, applies fix, restores service.
4. **Post-Mortem:** Document root cause, impact assessment, and preventive measures.

---

*End of Section 17*
