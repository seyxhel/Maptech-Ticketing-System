# 19. RISK MANAGEMENT

## 19.1 Risk Assessment Overview

This section identifies known technical, operational, and security risks for the Maptech Ticketing System, evaluates their likelihood and impact, and defines mitigation strategies.

**Risk Rating Matrix:**

| | Low Impact | Medium Impact | High Impact | Critical Impact |
|---|-----------|---------------|-------------|-----------------|
| **High Likelihood** | Medium | High | Critical | Critical |
| **Medium Likelihood** | Low | Medium | High | Critical |
| **Low Likelihood** | Low | Low | Medium | High |

---

## 19.2 Technical Risks

### RISK-T01: SQLite Database Scalability

| Attribute | Detail |
|-----------|--------|
| **Description** | The system currently uses SQLite as its database. SQLite does not support concurrent write operations well and has limitations with large datasets. |
| **Likelihood** | High (in production deployment) |
| **Impact** | High — Data corruption risk under concurrent writes; performance degradation with growth |
| **Current Status** | Active risk in development; configured in `settings.py` |
| **Mitigation** | Migrate to PostgreSQL before production deployment. Django's ORM abstraction makes this a configuration change with minimal code impact. |
| **Contingency** | Apply write-ahead logging (WAL) mode for SQLite as temporary measure. |

### RISK-T02: InMemory Channel Layer Limitation

| Attribute | Detail |
|-----------|--------|
| **Description** | The WebSocket channel layer uses `InMemoryChannelLayer`, which does not persist across process restarts and does not support multi-process deployments. |
| **Likelihood** | High (in production) |
| **Impact** | Medium — WebSocket notifications and chat messages may be lost on server restart; no cross-process communication |
| **Current Status** | Active risk; configured in `settings.py` CHANNEL_LAYERS setting |
| **Mitigation** | Switch to `channels_redis.core.RedisChannelLayer` with a Redis server for production. Configuration is already documented in Django Channels. |
| **Contingency** | Implement HTTP polling fallback for notifications. |

### RISK-T03: Single Server Deployment

| Attribute | Detail |
|-----------|--------|
| **Description** | No horizontal scaling or load balancing strategy is currently implemented. |
| **Likelihood** | Medium |
| **Impact** | High — Single point of failure; limited capacity under peak load |
| **Mitigation** | Deploy behind a load balancer (Nginx/HAProxy) with multiple Daphne workers. Use sticky sessions for WebSocket connections. |
| **Contingency** | Vertical scaling (increase server resources) as short-term measure. |

### RISK-T04: No Automated Test Suite

| Attribute | Detail |
|-----------|--------|
| **Description** | The codebase does not have a comprehensive automated test suite. The `users/tests.py` file exists but may not have extensive coverage. |
| **Likelihood** | High |
| **Impact** | Medium — Regressions may go undetected; higher risk during refactoring or feature additions |
| **Mitigation** | Implement unit tests for critical models and views, integration tests for API endpoints, and E2E tests for key user workflows. |
| **Contingency** | Manual QA testing before each release with a defined test checklist. |

### RISK-T05: Media File Storage on Local Filesystem

| Attribute | Detail |
|-----------|--------|
| **Description** | Uploaded files (profile pictures, ticket attachments, resolution proofs) are stored on the local filesystem under `media/`. |
| **Likelihood** | Medium |
| **Impact** | Medium — Files lost if server disk fails; not accessible in multi-server deployment; disk space exhaustion |
| **Mitigation** | Migrate to cloud object storage (AWS S3, Azure Blob Storage) using `django-storages`. Implement file size limits and cleanup routines. |
| **Contingency** | Regular filesystem backups with rsync to offsite storage. |

---

## 19.3 Security Risks

### RISK-S01: JWT Token Exposure

| Attribute | Detail |
|-----------|--------|
| **Description** | JWT access tokens provide full API access for their lifetime (configured as 1 day). If intercepted, they cannot be individually revoked without a blacklist mechanism. |
| **Likelihood** | Low |
| **Impact** | High — Unauthorized access to the system for the token's remaining lifetime |
| **Mitigation** | Reduce access token lifetime (e.g., 15–30 minutes). Implement token blacklisting via `rest_framework_simplejwt.token_blacklist`. Use HTTPS exclusively. Store tokens securely (httpOnly cookies preferred over localStorage). |
| **Contingency** | Force password reset to invalidate all tokens; rotate SECRET_KEY as last resort (invalidates all tokens system-wide). |

### RISK-S02: Insufficient Input Validation

| Attribute | Detail |
|-----------|--------|
| **Description** | While Django REST Framework serializers provide basic validation, custom validation for business logic may have gaps. |
| **Likelihood** | Low |
| **Impact** | Medium — Potential for XSS via user-generated content, SQL injection (mitigated by ORM), or business logic bypass |
| **Mitigation** | DRF serializers and Django ORM provide strong default protection. Review all custom endpoint actions for proper input validation. Sanitize HTML content in chat messages. |
| **Contingency** | WAF (Web Application Firewall) at the network layer for defense-in-depth. |

### RISK-S03: CORS Misconfiguration

| Attribute | Detail |
|-----------|--------|
| **Description** | The `CORS_ALLOW_ALL_ORIGINS` setting may be enabled in development and accidentally deployed to production. |
| **Likelihood** | Medium |
| **Impact** | Medium — Cross-origin request forgery attacks could exploit API endpoints |
| **Mitigation** | Ensure `CORS_ALLOW_ALL_ORIGINS = False` in production. Use `CORS_ALLOWED_ORIGINS` with explicit origin list. Environment-specific settings files. |
| **Contingency** | Network-level CORS enforcement via Nginx configuration. |

### RISK-S04: Inadequate Rate Limiting

| Attribute | Detail |
|-----------|--------|
| **Description** | The DRF throttle classes are configured but may not cover all attack vectors (brute-force login, API abuse). |
| **Likelihood** | Medium |
| **Impact** | Medium — Brute-force attacks on login, denial-of-service via API abuse |
| **Mitigation** | Implement stricter throttling on authentication endpoints. Add IP-based rate limiting at Nginx level. Consider fail2ban for repeated failed login attempts. |
| **Contingency** | Temporary IP blocking via Nginx or firewall rules. |

---

## 19.4 Operational Risks

### RISK-O01: Key Personnel Dependency

| Attribute | Detail |
|-----------|--------|
| **Description** | System knowledge may be concentrated in a small number of developers. |
| **Likelihood** | Medium |
| **Impact** | High — Loss of key personnel could delay bug fixes, feature development, and incident response |
| **Mitigation** | Comprehensive documentation (this document), code reviews, pair programming, and knowledge sharing sessions. |
| **Contingency** | External consulting engagement for emergency support. |

### RISK-O02: Data Loss

| Attribute | Detail |
|-----------|--------|
| **Description** | Database corruption, accidental deletion, or hardware failure could result in data loss. |
| **Likelihood** | Low |
| **Impact** | Critical — Loss of ticket history, audit trails, and user data |
| **Mitigation** | Automated daily backups with offsite replication. Database transaction logging. Regular backup restoration tests. |
| **Contingency** | Point-in-time recovery from WAL archives (PostgreSQL). |

### RISK-O03: Third-Party Dependency Vulnerabilities

| Attribute | Detail |
|-----------|--------|
| **Description** | The system relies on numerous third-party packages (Django, DRF, SimpleJWT, React, etc.) that may have undiscovered vulnerabilities. |
| **Likelihood** | Medium |
| **Impact** | Variable (Low to Critical depending on vulnerability) |
| **Mitigation** | Regular dependency auditing (`pip-audit`, `npm audit`). Subscribe to security advisories for key dependencies. Automated dependency update tools (Dependabot, Renovate). |
| **Contingency** | Patch or pin vulnerable versions immediately upon disclosure. |

---

## 19.5 Risk Register Summary

| ID | Risk | Likelihood | Impact | Rating | Status |
|----|------|-----------|--------|--------|--------|
| RISK-T01 | SQLite scalability | High | High | **Critical** | Open |
| RISK-T02 | InMemory channel layer | High | Medium | **High** | Open |
| RISK-T03 | Single server deployment | Medium | High | **High** | Open |
| RISK-T04 | No automated test suite | High | Medium | **High** | Open |
| RISK-T05 | Local filesystem storage | Medium | Medium | **Medium** | Open |
| RISK-S01 | JWT token exposure | Low | High | **Medium** | Open |
| RISK-S02 | Input validation gaps | Low | Medium | **Low** | Monitored |
| RISK-S03 | CORS misconfiguration | Medium | Medium | **Medium** | Open |
| RISK-S04 | Inadequate rate limiting | Medium | Medium | **Medium** | Open |
| RISK-O01 | Key personnel dependency | Medium | High | **High** | Mitigated (docs) |
| RISK-O02 | Data loss | Low | Critical | **Medium** | Open |
| RISK-O03 | Third-party vulnerabilities | Medium | Variable | **Medium** | Monitored |

---

*End of Section 19*
