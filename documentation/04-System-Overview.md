# 4. SYSTEM OVERVIEW

## 4.1 System Description

The Maptech Ticketing System is a web-based IT service management platform designed to digitize and streamline the end-to-end technical support workflow at Maptech Information Solutions Inc. The system manages the complete lifecycle of support tickets — from initial creation and client verification through technician assignment, diagnosis, resolution, and formal closure.

The system operates as a client-server web application with a RESTful API backend and a modern single-page application (SPA) frontend. It supports real-time communication through WebSocket connections, enabling live chat between supervisors and technicians as well as instant push notifications for critical events.

### Core Operational Flow

1. **Ticket Creation** — Supervisors create tickets on behalf of clients, capturing client information, product/equipment details, service type, and problem description.
2. **Assignment** — Supervisors assign tickets to available technicians based on workload and expertise.
3. **Work Execution** — Technicians start work, diagnose issues, take action, and document their findings.
4. **Escalation** — If needed, tickets can be escalated internally to other technicians or externally to distributors/principals.
5. **Resolution** — Technicians submit resolution proofs and request ticket closure.
6. **Closure** — Supervisors review resolution, provide CSAT feedback, and formally close the ticket.
7. **Knowledge Capture** — Resolution proofs can be published to the Knowledge Hub for organizational learning.

---

## 4.2 System Context

The Maptech Ticketing System operates within the following context:

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL ENTITIES                        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────────┐ │
│  │  Clients  │  │ External │  │  Administrator Browsers   │ │
│  │ (Future)  │  │ Vendors  │  │  (Chrome, Firefox, Edge)  │ │
│  └─────┬─────┘  └────┬─────┘  └────────────┬──────────────┘ │
│        │              │                      │               │
└────────┼──────────────┼──────────────────────┼───────────────┘
         │              │                      │
         ▼              ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│              MAPTECH TICKETING SYSTEM                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          Frontend (React SPA)                         │  │
│  │   • Admin Dashboard    • Employee Dashboard           │  │
│  │   • Superadmin Panel   • Client Portal (Planned)      │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │ HTTP/WebSocket                    │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │          Backend (Django + Channels)                   │  │
│  │   • REST API          • WebSocket Consumers           │  │
│  │   • Business Logic    • Authentication                │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │          Data Layer                                   │  │
│  │   • SQLite Database   • File Storage (Media)          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### External Entity Interactions

| External Entity | Interaction Type | Description |
|----------------|-----------------|-------------|
| Web Browser | HTTPS / WSS | Users access the system through modern web browsers |
| External Vendors | Manual (via notes) | Escalation information is recorded in-system; direct integration is not yet implemented |
| HIBP API | HTTPS (outbound) | Password breach checking during password changes/resets |

---

## 4.3 Stakeholders

| Stakeholder | Role | Responsibility |
|-------------|------|---------------|
| Maptech Management | Business Owner | Defines business requirements, approves system direction, reviews reports |
| IT Operations Team | System Operations | Deploys, monitors, and maintains the system infrastructure |
| Development Team | System Development | Designs, develops, tests, and maintains the application codebase |
| Supervisors (Admins) | Primary System Users | Create and manage tickets, assign technicians, monitor SLAs, close tickets |
| Technicians (Employees) | Field Service Workers | Receive assignments, perform diagnostics, resolve issues, submit proofs |
| Superadmins | System Administrators | Manage user accounts, configure system settings, review audit logs |
| Clients | Service Recipients | Report issues, track ticket status (future: via client portal) |
| QA Team | Quality Assurance | Validates system functionality and performance through testing |

---

## 4.4 User Roles and Responsibilities

The system implements a role-based access control (RBAC) model with the following roles:

| Role | Description | Access Level |
|------|-------------|-------------|
| **Superadmin** | Highest-privilege system administrator. Full access to all features including user management, system configuration, audit logs, and retention policies. | Full system access |
| **Admin (Supervisor)** | Manages day-to-day ticket operations. Creates tickets, assigns technicians, reviews resolutions, confirms clients, manages products/clients/categories, and closes tickets. Can view audit logs scoped to employee actions. | Full ticket management, catalog management, knowledge hub management |
| **Employee (Technician)** | Field service technician assigned to tickets. Can view assigned tickets, start work, update findings, escalate internally, pass tickets, submit for observation, request closure, and upload resolution proofs. | Limited to assigned tickets and own profile |
| **Client** | External service recipient. Can view own tickets and track status. *(Client portal is in frontend development — backend support is planned.)* | View-only access to own tickets (planned) |

### Role Hierarchy

```
Superadmin (Full System Access)
    └── Admin / Supervisor (Ticket & Catalog Management)
            └── Employee / Technician (Assigned Ticket Operations)
                    └── Client (View Own Tickets — Planned)
```

### Detailed Role Permissions

| Feature | Superadmin | Admin | Employee | Client |
|---------|:----------:|:-----:|:--------:|:------:|
| View Dashboard & Stats | ✅ | ✅ | ✅ (own) | ✅ (own) |
| Create Tickets | ✅ | ✅ | ❌ | ✅ (planned) |
| Assign Tickets | ✅ | ✅ | ❌ | ❌ |
| Start Work on Ticket | ✅ | ✅ | ✅ | ❌ |
| Update Ticket Fields | ✅ | ✅ | ✅ (limited) | ❌ |
| Escalate Internally | ❌ | ❌ | ✅ | ❌ |
| Pass Ticket | ❌ | ❌ | ✅ | ❌ |
| Escalate Externally | ✅ | ✅ | ✅ | ❌ |
| Request Closure | ❌ | ❌ | ✅ | ❌ |
| Close Ticket | ✅ | ✅ | ❌ | ❌ |
| Confirm Ticket | ✅ | ✅ | ❌ | ❌ |
| Review Ticket | ✅ | ✅ | ❌ | ❌ |
| Link Tickets | ✅ | ✅ | ❌ | ❌ |
| Manage Knowledge Hub | ✅ | ✅ | ❌ | ❌ |
| View Knowledge Hub | ✅ | ✅ | ✅ | ❌ |
| Manage Products | ✅ | ✅ | ❌ | ❌ |
| Manage Clients | ✅ | ✅ | ❌ | ❌ |
| Manage Categories | ✅ | ✅ | ❌ | ❌ |
| Manage Types of Service | ✅ | ✅ | ❌ | ❌ |
| Manage Call Logs | ✅ | ✅ | ❌ | ❌ |
| Submit CSAT Feedback | ✅ | ✅ | ❌ | ❌ |
| View Audit Logs | ✅ | ✅ (scoped) | ❌ | ❌ |
| Export Audit Logs | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Manage Announcements | ✅ | ❌ | ❌ | ❌ |
| Manage Retention Policy | ✅ | ❌ | ❌ | ❌ |
| View Announcements | ✅ | ✅ | ✅ | ❌ |
| Chat (Admin ↔ Employee) | ✅ | ✅ | ✅ | ❌ |
| Receive Notifications | ✅ | ✅ | ✅ | ❌ |
| Update Profile | ✅ | ✅ | ✅ | ✅ |
| Change Password | ✅ | ✅ | ✅ | ✅ |

---

## 4.5 Operational Environment

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Server CPU** | 2 cores | 4+ cores |
| **Server RAM** | 2 GB | 4+ GB |
| **Server Storage** | 10 GB (SSD) | 50+ GB (SSD) for media/attachments growth |
| **Client Device** | Any device with a modern web browser | Desktop or laptop for optimal admin experience |

### Software Requirements

| Component | Requirement |
|-----------|-------------|
| **Server OS** | Windows 10+, Linux (Ubuntu 20.04+), macOS |
| **Python** | 3.10 or higher |
| **Node.js** | 18.x or higher (for frontend build) |
| **Database** | SQLite 3 (development); PostgreSQL recommended for production |
| **Web Browser** | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ |

### Network Infrastructure

| Aspect | Details |
|--------|---------|
| **Protocol** | HTTPS (recommended for production), HTTP (development) |
| **WebSocket** | WSS (production) / WS (development) for real-time features |
| **Ports** | Backend: 8000 (default), Frontend: 3000 (development proxy) |
| **CORS** | Configurable allowed origins via environment variables |
| **Bandwidth** | Standard broadband; system is optimized for low bandwidth |

### Security Environment

| Aspect | Details |
|--------|---------|
| **Authentication** | JWT (JSON Web Tokens) with access/refresh token pair |
| **Password Hashing** | Argon2 (primary), PBKDF2, BCrypt, Scrypt (fallback chain) |
| **Token Lifetime** | Access: 1 day, Refresh: 30 days (configurable) |
| **API Security** | Token-based authentication required for all protected endpoints |
| **WebSocket Security** | JWT token passed via query string for WebSocket authentication |
| **Password Breach Check** | Integration with HIBP API for compromised password detection |

---

*End of Section 4*
