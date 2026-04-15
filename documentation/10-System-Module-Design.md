# 10. SYSTEM MODULE DESIGN

## Module Overview

The backend application is organized into two Django apps (`tickets` and `users`) with the following module structure:

```
backend/
├── tickets/                    # Core ticketing application
│   ├── models/                 # Data models (split by domain)
│   │   ├── ticket.py          # Ticket, TicketAttachment, TicketTask
│   │   ├── messaging.py       # AssignmentSession, Message, Reaction, ReadReceipt
│   │   ├── lifecycle.py       # EscalationLog
│   │   ├── audit.py           # AuditLog
│   │   ├── notification.py    # Notification
│   │   ├── support.py         # CallLog, FeedbackRating
│   │   ├── lookup.py          # TypeOfService, Category
│   │   ├── product.py         # Product
│   │   ├── client.py          # Client
│   │   └── config.py          # RetentionPolicy, Announcement
│   ├── views/                  # API ViewSets (split by domain)
│   │   ├── tickets.py         # TicketViewSet + TypeOfServiceViewSet + EscalationLogViewSet
│   │   ├── audit.py           # AuditLogViewSet
│   │   ├── catalog.py         # CategoryViewSet, ProductViewSet, ClientViewSet
│   │   ├── config.py          # RetentionPolicyViewSet, AnnouncementViewSet
│   │   ├── knowledge.py       # KnowledgeHubViewSet, PublishedArticleViewSet
│   │   ├── notifications.py   # NotificationViewSet
│   │   └── support.py         # CallLogViewSet, FeedbackRatingViewSet
│   ├── serializers/            # DRF serializers (split by domain)
│   ├── consumers.py           # WebSocket consumers (Chat, Notifications)
│   ├── permissions.py         # Custom DRF permission classes
│   ├── middleware.py          # JWT WebSocket middleware
│   ├── signals.py             # Django signal handlers
│   ├── routing.py             # WebSocket URL routing
│   └── admin.py               # Django admin configuration
├── users/                      # User management application
│   ├── models.py              # Custom User model
│   ├── views.py               # AuthViewSet, UserViewSet
│   └── serializers.py         # UserSerializer, AdminUserCreateSerializer
└── tickets_backend/            # Project configuration
    ├── settings.py            # Django settings
    ├── urls.py                # Root URL configuration
    ├── asgi.py                # ASGI application config
    └── wsgi.py                # WSGI application config
```

---

## Module 1: Ticket Management (`tickets.views.tickets`)

| Attribute | Details |
|-----------|---------|
| **Module Name** | Ticket Management |
| **Description** | Core module managing the complete ticket lifecycle including creation, assignment, work tracking, escalation, resolution, and closure |
| **Responsibilities** | CRUD for tickets; assignment/reassignment; status transitions; SLA tracking; task management; attachment handling; dashboard statistics |
| **Primary ViewSet** | `TicketViewSet` (ModelViewSet) |
| **Serializers** | `TicketSerializer`, `AdminCreateTicketSerializer`, `EmployeeTicketActionSerializer`, `TicketTaskSerializer`, `TicketAttachmentSerializer` |
| **Permissions** | IsAuthenticated, IsAdminLevel, IsAssignedEmployee, IsAdminOrAssignedEmployee, IsTicketParticipant |

### Key Actions

| Action | Method | URL | Permission | Description |
|--------|--------|-----|------------|-------------|
| List/Create | GET/POST | `/api/tickets/` | IsAuthenticated | List tickets (role-scoped) or create new ticket |
| Retrieve/Update | GET/PUT | `/api/tickets/{id}/` | IsAuthenticated | Get or update ticket details |
| Assign | POST | `/api/tickets/{id}/assign/` | IsSupervisorLevel | Assign/reassign ticket to technician |
| Escalate | POST | `/api/tickets/{id}/escalate/` | IsAssignedEmployee | Internal escalation (back to admin) |
| Pass Ticket | POST | `/api/tickets/{id}/pass_ticket/` | IsAssignedEmployee | Transfer to another technician |
| Review | POST | `/api/tickets/{id}/review/` | IsAdminLevel | Admin reviews ticket, sets priority |
| Confirm | POST | `/api/tickets/{id}/confirm_ticket/` | IsAdminLevel | Confirm client verification |
| Escalate External | POST | `/api/tickets/{id}/escalate_external/` | IsAdminOrAssignedEmployee | Escalate to external vendor |
| Close | POST | `/api/tickets/{id}/close_ticket/` | IsAdminLevel | Formally close ticket |
| Start Work | POST | `/api/tickets/{id}/start_work/` | IsAdminOrAssignedEmployee | Technician starts (records time_in) |
| Request Closure | POST | `/api/tickets/{id}/request_closure/` | IsAssignedEmployee | Submit resolution for closure |
| Upload Proof | POST | `/api/tickets/{id}/upload_resolution_proof/` | IsAdminOrAssignedEmployee | Upload resolution proof files |
| Submit Observation | POST | `/api/tickets/{id}/submit_for_observation/` | IsAdminOrAssignedEmployee | Submit for monitoring |
| Save Product | PATCH | `/api/tickets/{id}/save_product_details/` | IsAdminOrAssignedEmployee | Save product/equipment info |
| Update Fields | PATCH | `/api/tickets/{id}/update_employee_fields/` | IsAdminOrAssignedEmployee | Employee updates work fields |
| Link Tickets | POST | `/api/tickets/{id}/link_tickets/` | IsAdminLevel | Link related tickets |
| Update Task | PATCH | `/api/tickets/{id}/update_task/{task_id}/` | IsAdminOrAssignedEmployee | Update sub-task status |
| Delete Attachment | DELETE | `/api/tickets/{id}/delete_attachment/{att_id}/` | IsTicketParticipant | Remove attachment |
| Stats | GET | `/api/tickets/stats/` | IsAuthenticated | Dashboard statistics |
| Messages | GET | `/api/tickets/{id}/messages/` | IsTicketParticipant | Chat message history |
| History | GET | `/api/tickets/{id}/assignment_history/` | IsTicketParticipant | Assignment session history |

### Dependencies
- User model (authentication, assignment)
- TypeOfService model (SLA calculation)
- Client and Product models (referenced records)
- AssignmentSession model (work tracking)
- EscalationLog model (escalation tracking)
- Notification model (event notifications)
- AuditLog model (action logging)
- WebSocket channel layer (chat system messages, force_disconnect)

### Data Interactions
- **Creates:** Ticket, TicketAttachment, TicketTask, AssignmentSession, EscalationLog, AuditLog, Notification, Client, Product
- **Reads:** User (for assignment/workload), TypeOfService (for SLA), all ticket-related models
- **Updates:** Ticket (status, fields, assignment), TicketTask (status), AssignmentSession (end session)
- **Deletes:** TicketAttachment (file and record)

---

## Module 2: User Management (`users.views`)

| Attribute | Details |
|-----------|---------|
| **Module Name** | User Management |
| **Description** | Manages user accounts, authentication, profile updates, and password operations |
| **Responsibilities** | JWT authentication; user CRUD (superadmin); profile management; avatar upload; password change/reset; account activation |
| **Primary ViewSets** | `AuthViewSet`, `UserViewSet`, `CustomTokenObtainPairView` |
| **Serializers** | `UserSerializer`, `AdminUserCreateSerializer` |
| **Permissions** | IsAuthenticated (profile), IsSuperAdmin (user management) |

### Key Actions

| Action | Method | URL | Permission | Description |
|--------|--------|-----|------------|-------------|
| Login | POST | `/api/auth/login/` | Public | JWT token authentication |
| Token Refresh | POST | `/api/auth/token/refresh/` | Public | Refresh access token |
| Current User | GET | `/api/auth/me/` | IsAuthenticated | Get authenticated user profile |
| Upload Avatar | POST | `/api/auth/upload_avatar/` | IsAuthenticated | Upload profile picture (max 5MB) |
| Remove Avatar | DELETE | `/api/auth/remove_avatar/` | IsAuthenticated | Delete profile picture |
| Update Profile | PATCH | `/api/auth/update_profile/` | IsAuthenticated | Edit name, phone, username |
| Change Password | POST | `/api/auth/change_password/` | IsAuthenticated | Change own password |
| Logout | POST | `/api/auth/logout/` | IsAuthenticated | Clear auth cookies and log logout event |
| Password Reset | POST | `/api/auth/password-reset/` | Public | Request email-based reset |
| Reset by Key | POST | `/api/auth/password-reset-by-key/` | Public | Reset via recovery key |
| Reset Confirm | POST | `/api/auth/password-reset-confirm/` | Public | Complete email-based reset |
| List Users | GET | `/api/users/list_users/` | IsSuperAdmin | List all user accounts |
| Create User | POST | `/api/users/create_user/` | IsSuperAdmin | Create new user account |
| Update User | PATCH | `/api/users/{id}/update_user/` | IsSuperAdmin | Edit user profile/role |
| Toggle Active | POST | `/api/users/{id}/toggle_active/` | IsSuperAdmin | Activate/deactivate account |
| Reset Password | POST | `/api/users/{id}/reset_password/` | IsSuperAdmin | Reset user password |

### Dependencies
- Django auth system (AbstractUser, token_generator)
- SimpleJWT (token generation/validation)
- HIBP API (password breach checking)
- AuditLog model (action logging)
- File system (profile picture storage)

---

## Module 3: Real-Time Communication (`tickets.consumers`)

| Attribute | Details |
|-----------|---------|
| **Module Name** | Real-Time Communication |
| **Description** | WebSocket-based live chat and notification delivery |
| **Responsibilities** | Ticket chat (messaging, reactions, read receipts, typing); notification push and management |
| **Primary Consumers** | `TicketChatConsumer`, `NotificationConsumer` |
| **Middleware** | `JWTAuthMiddleware` (WebSocket authentication) |

### WebSocket Endpoints

| Consumer | URL Pattern | Purpose |
|----------|------------|---------|
| NotificationConsumer | `ws/notifications/?token=<jwt>` | Personal notification channel |
| TicketChatConsumer | `ws/chat/{ticket_id}/admin_employee/?token=<jwt>` | Ticket-specific chat |

### Chat Consumer Actions

| Action | Direction | Description |
|--------|-----------|-------------|
| `send_message` | Client → Server | Send chat message (content, optional reply_to) |
| `typing` | Client → Server | Toggle typing indicator |
| `react` | Client → Server | Toggle emoji reaction on message |
| `mark_read` | Client → Server | Mark messages as read |

### Notification Consumer Actions

| Action | Direction | Description |
|--------|-----------|-------------|
| `mark_read` | Client → Server | Mark specific notification IDs as read |
| `mark_all_read` | Client → Server | Mark all notifications as read |

### Dependencies
- Channel layer (InMemory or Redis for production)
- Ticket model (access control)
- AssignmentSession model (session context)
- Message model (persistence)
- Notification model (persistence and dispatch)

---

## Module 4: Audit & Compliance (`tickets.views.audit`)

| Attribute | Details |
|-----------|---------|
| **Module Name** | Audit & Compliance |
| **Description** | System-wide action audit logging with search, filter, and export capabilities |
| **Responsibilities** | Audit log storage; role-scoped access; filtering and search; CSV export; summary statistics |
| **Primary ViewSet** | `AuditLogViewSet` (ReadOnlyModelViewSet) |
| **Serializers** | `AuditLogSerializer` |
| **Permissions** | IsAuthenticated + IsAdminLevel |

### Key Actions

| Action | Method | URL | Description |
|--------|--------|-----|-------------|
| List | GET | `/api/audit-logs/` | Browse audit logs with filters |
| Retrieve | GET | `/api/audit-logs/{id}/` | View single log entry |
| Summary | GET | `/api/audit-logs/summary/` | Dashboard statistics |
| Export | GET | `/api/audit-logs/export/` | CSV download (max 5,000 records) |

### Query Parameters
- `entity` — Filter by entity type
- `action` — Filter by action type
- `actor_email` — Filter by actor email (partial match)
- `search` — Full-text search across activity, email, entity
- `date_from`, `date_to` — Date range filter

### Dependencies
- AuditLog model (data source)
- Django signal handlers (automatic log creation)
- User model (role-scoped visibility)

---

## Module 5: Catalog Management (`tickets.views.catalog`)

| Attribute | Details |
|-----------|---------|
| **Module Name** | Catalog Management |
| **Description** | CRUD operations for product categories, products/equipment, and client records |
| **Responsibilities** | Category CRUD; Product CRUD with search; Client CRUD with ticket linking |
| **Primary ViewSets** | `CategoryViewSet`, `ProductViewSet`, `ClientViewSet` |
| **Serializers** | `CategorySerializer`, `ProductSerializer`, `ClientSerializer` |
| **Permissions** | IsAuthenticated (read), IsAdminLevel (write) |

### Data Interactions
- Non-admin users see only active records
- Categories link to Products (FK)
- Clients link to Tickets (FK)
- Products link to Tickets (FK)

---

## Module 6: Knowledge Hub (`tickets.views.knowledge`)

| Attribute | Details |
|-----------|---------|
| **Module Name** | Knowledge Hub |
| **Description** | Publication and consumption of ticket resolution documentation as knowledge articles |
| **Responsibilities** | Browse resolution proofs; publish/unpublish articles; archive management; summary stats; employee-facing article search |
| **Primary ViewSets** | `KnowledgeHubViewSet`, `PublishedArticleViewSet` |
| **Serializers** | `KnowledgeHubAttachmentSerializer`, `PublishedArticleSerializer` |
| **Permissions** | IsAdminLevel (management), IsAuthenticated (published articles) |

---

## Module 7: Support Operations (`tickets.views.support`)

| Attribute | Details |
|-----------|---------|
| **Module Name** | Support Operations |
| **Description** | Call log tracking and employee feedback ratings |
| **Responsibilities** | Call log CRUD with duration tracking; feedback rating submission before closure |
| **Primary ViewSets** | `CallLogViewSet`, `FeedbackRatingViewSet` |
| **Serializers** | `CallLogSerializer`, `FeedbackRatingSerializer` |
| **Permissions** | IsAuthenticated + IsAdminLevel |

---

## Module 8: System Configuration (`tickets.views.config`)

| Attribute | Details |
|-----------|---------|
| **Module Name** | System Configuration |
| **Description** | System-wide configuration including data retention policies and announcements |
| **Responsibilities** | Retention policy management (singleton); announcement CRUD with scheduling and visibility |
| **Primary ViewSets** | `RetentionPolicyViewSet`, `AnnouncementViewSet` |
| **Serializers** | `RetentionPolicySerializer`, `AnnouncementSerializer` |
| **Permissions** | IsSuperAdmin (retention policy), IsAuthenticated (announcements read), IsSuperAdmin (announcements write) |

---

## Module 9: Signal Handlers (`tickets.signals`)

| Attribute | Details |
|-----------|---------|
| **Module Name** | Event-Driven Side Effects |
| **Description** | Django signal handlers that trigger automated actions on model events |
| **Responsibilities** | Login/logout audit logging; user creation logging; ticket creation notifications; assignment change notifications; status change notifications; escalation notifications |

### Signal Map

| Signal | Model/Event | Handler | Effect |
|--------|-------------|---------|--------|
| `post_migrate` | App ready | `create_initial_admin` | Creates default admin account |
| `user_logged_in` | Auth signal | `audit_user_login` | Audit log + IP capture |
| `user_logged_out` | Auth signal | `audit_user_logout` | Audit log + IP capture |
| `post_save` | User created | `audit_user_save` | Audit log for user creation |
| `post_save` | Ticket created | `notify_ticket_changes` | Notification to all admins |
| `pre_save` | Ticket saving | `capture_ticket_old_values` | Store old assignment/status |
| `post_save` | Ticket saved | `notify_ticket_assignment_and_status` | Notifications for assignment/status changes |
| `post_save` | EscalationLog | `notify_escalation_log` | Notification to escalation target |

---

*End of Section 10*
