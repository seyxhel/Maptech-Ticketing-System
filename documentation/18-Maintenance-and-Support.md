# 18. MAINTENANCE AND SUPPORT

## 18.1 Maintenance Plan

### Scheduled Maintenance Windows

| Type | Frequency | Duration | Window |
|------|-----------|----------|--------|
| **Security Patches** | As required (critical) | 30 min – 1 hour | Within 24 hours of disclosure |
| **Dependency Updates** | Monthly | 1–2 hours | First Saturday of the month, 2:00 AM |
| **Database Maintenance** | Weekly | 15–30 min | Sunday 3:00 AM (VACUUM, REINDEX) |
| **System Updates (OS)** | Monthly | 1–2 hours | Second Saturday of the month, 2:00 AM |
| **Feature Releases** | Sprint-based (bi-weekly) | 30 min – 1 hour | As scheduled |

### Maintenance Procedures

**Pre-Maintenance Checklist:**
1. Notify users of scheduled downtime via in-app Announcement (existing model).
2. Create a database backup before applying changes.
3. Tag the current release in Git for rollback reference.
4. Verify backup integrity.

**Post-Maintenance Checklist:**
1. Run database migrations if applicable (`python manage.py migrate`).
2. Run `collectstatic` if static files changed.
3. Restart Daphne ASGI server.
4. Verify health check endpoints respond successfully.
5. Confirm WebSocket connectivity.
6. Monitor error logs for 30 minutes post-deployment.
7. Update the Announcement to confirm maintenance is complete.

---

## 18.2 Version Control

### Git Workflow

The project uses **Git** for source code version control.

**Branch Strategy (Recommended — Git Flow):**

| Branch | Purpose | Lifetime |
|--------|---------|----------|
| `main` | Production-ready code | Permanent |
| `develop` | Integration branch for the next release | Permanent |
| `feature/<name>` | New feature development | Temporary (merged to develop) |
| `bugfix/<name>` | Bug fixes for develop | Temporary (merged to develop) |
| `hotfix/<name>` | Emergency production fixes | Temporary (merged to main + develop) |
| `release/<version>` | Release preparation and QA | Temporary (merged to main + develop) |

**Commit Message Convention:**
```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
Scopes: backend, frontend, tickets, users, auth, ws, ui

Examples:
  feat(tickets): add escalation to external support
  fix(ws): resolve WebSocket disconnect on token refresh
  docs(api): update Swagger schema for new endpoints
```

### Versioning Strategy

Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`

| Component | Meaning |
|-----------|---------|
| **MAJOR** | Breaking API changes or major architecture shifts |
| **MINOR** | New features, backward-compatible |
| **PATCH** | Bug fixes, security patches |

---

## 18.3 System Updates

### Dependency Management

**Backend (Python):**
- Dependencies defined in `requirements.txt`
- Pin exact versions for reproducibility
- Use `pip-audit` or `safety` to check for known vulnerabilities
- Update process:
  1. Create a `feature/dependency-update` branch
  2. Run `pip install --upgrade <package>`
  3. Update `requirements.txt`
  4. Run full test suite
  5. Merge after review

**Frontend (Node.js):**
- Dependencies defined in `package.json` with lockfile
- Use `npm audit` to check for known vulnerabilities
- Update process:
  1. Create a `feature/dependency-update` branch
  2. Run `npm update` or `npm install <package>@latest`
  3. Run `npm run build` to verify no build errors
  4. Run tests if available
  5. Merge after review

### Database Schema Updates

- Managed via **Django Migrations**
- Schema changes are tracked in `tickets/migrations/` and `users/migrations/`
- Migration workflow:
  1. Modify model code
  2. Run `python manage.py makemigrations`
  3. Review generated migration file
  4. Run `python manage.py migrate` in development
  5. Test thoroughly before deploying to production
  6. Apply to production during maintenance window

**Current Migration Count (as of documentation date):**
- `tickets` app: 20+ migrations (0001_initial through 0020+)
- `users` app: Standard Django auth migrations

---

## 18.4 Technical Support

### Support Tiers

| Tier | Responsibility | Personnel | Response SLA |
|------|---------------|-----------|-------------|
| **Tier 1** | Basic troubleshooting, password resets, user guidance | Help Desk / Admin users | < 1 hour |
| **Tier 2** | Application-level issues, configuration changes, data fixes | System Administrator | < 4 hours |
| **Tier 3** | Code-level bugs, architecture issues, database recovery | Development Team | < 1 business day |

### Common Support Procedures

**User Account Issues:**
1. Navigate to Django Admin (`/admin/`) → Users
2. Reset password or update user profile
3. Verify role assignment (superadmin / admin / employee)

**Ticket Data Issues:**
1. Use Django Admin or the `AuditLog` to trace changes
2. Review `AssignmentSession` records for assignment history
3. Check `EscalationLog` for escalation trail

**WebSocket Connectivity Issues:**
1. Verify Redis is running (production) or InMemory layer is configured (development)
2. Check Nginx configuration for WebSocket upgrade headers
3. Review browser console for WebSocket connection errors
4. Verify JWT token is valid and not expired

**Performance Issues:**
1. Review Django query logs (DEBUG mode) for N+1 queries
2. Check database indexes on frequently queried fields
3. Monitor Redis memory usage for channel layer
4. Review Daphne process resource consumption

### Support Contact Channels

| Channel | Purpose |
|---------|---------|
| **In-App Ticketing** | Users create support tickets through the system itself |
| **Admin Dashboard** | Supervisors monitor SLA compliance and ticket status |
| **Direct Escalation** | Critical issues escalated to development team via defined process |

---

## 18.5 Data Retention and Archival

The system includes a `RetentionPolicy` model that defines data lifecycle rules:

| Field | Description |
|-------|-------------|
| `name` | Policy name (e.g., "Standard Ticket Retention") |
| `duration_days` | Number of days to retain data before archival |
| `description` | Description of the policy |
| `is_active` | Whether the policy is currently enforced |

**Retention Recommendations:**

| Data Type | Retention Period | Action After Expiry |
|-----------|-----------------|---------------------|
| Active Tickets | Indefinite | N/A |
| Closed Tickets | Per policy (e.g., 365 days) | Archive to cold storage |
| Audit Logs | Per policy (e.g., 730 days) | Archive or delete |
| Chat Messages | Per policy (e.g., 365 days) | Archive with ticket |
| Notification Records | 90 days | Soft delete |
| User Accounts (inactive) | Per policy (e.g., 365 days inactive) | Deactivate |

---

*End of Section 18*
