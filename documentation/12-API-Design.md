# 12. API DESIGN

## 12.1 API Overview

The Maptech Ticketing System exposes a RESTful JSON API built on Django REST Framework. All endpoints follow REST conventions and are auto-documented via Swagger/OpenAPI (drf-yasg).

| Attribute | Details |
|-----------|---------|
| **Base URL** | `http://localhost:8000/api/` (development) |
| **Protocol** | HTTP (development), HTTPS (production recommended) |
| **Data Format** | JSON (application/json) for all request/response bodies |
| **File Uploads** | Multipart form-data (multipart/form-data) |
| **API Documentation** | Swagger UI: `/swagger/` — ReDoc: `/redoc/` — Schema: `/swagger.json` |
| **Versioning** | Not currently versioned (single version) |
| **Pagination** | Default DRF pagination (configurable) |

---

## 12.2 API Authentication

### JWT Authentication

All protected endpoints require a valid JWT access token in the `Authorization` header.

**Token Acquisition:**
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "john_doe",     // or email address
  "password": "secure_pass"
}
```

**Response:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "admin",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Token Usage:**
```http
GET /api/tickets/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Refresh:**
```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Token Configuration

| Parameter | Value |
|-----------|-------|
| Access Token Lifetime | 1 day |
| Refresh Token Lifetime | 30 days |
| Token Rotation | Enabled (new refresh token on each refresh) |
| Blacklist After Rotation | Disabled |

### WebSocket Authentication

WebSocket connections authenticate by passing the JWT token as a query parameter:

```
ws://localhost:8000/ws/notifications/?token=eyJhbGciOiJIUzI1NiIs...
ws://localhost:8000/ws/chat/42/admin_employee/?token=eyJhbGciOiJIUzI1NiIs...
```

---

## 12.3 Endpoint Structure

### Authentication Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/auth/login/` | POST | Obtain JWT access + refresh tokens | Public |
| `/api/auth/token/refresh/` | POST | Refresh access token | Public |
| `/api/auth/me/` | GET | Get current user profile | Required |
| `/api/auth/upload_avatar/` | POST | Upload profile picture (max 5MB, image/*) | Required |
| `/api/auth/remove_avatar/` | DELETE | Remove profile picture | Required |
| `/api/auth/update_profile/` | PATCH | Update name, phone, username | Required |
| `/api/auth/change_password/` | POST | Change own password | Required |
| `/api/auth/logout/` | POST | Logout and clear auth cookies | Required |
| `/api/auth/password-reset/` | POST | Request password reset (email) | Public |
| `/api/auth/password-reset-by-key/` | POST | Reset password via recovery key | Public |
| `/api/auth/password-reset-confirm/` | POST | Confirm email-based password reset | Public |

### User Management Endpoints (Superadmin Only)

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/users/list_users/` | GET | List all users | Superadmin |
| `/api/users/create_user/` | POST | Create new user account | Superadmin |
| `/api/users/{id}/update_user/` | PATCH | Update user profile/role | Superadmin |
| `/api/users/{id}/toggle_active/` | POST | Activate/deactivate account | Superadmin |
| `/api/users/{id}/reset_password/` | POST | Reset user password | Superadmin |

### Ticket Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/tickets/` | GET | List tickets (role-scoped) | Required |
| `/api/tickets/` | POST | Create new ticket | Admin-level |
| `/api/tickets/{id}/` | GET | Retrieve ticket details | Required |
| `/api/tickets/{id}/` | PUT/PATCH | Update ticket (role-scoped fields) | Required |
| `/api/tickets/{id}/` | DELETE | Delete ticket | Admin-level |
| `/api/tickets/{id}/assign/` | POST | Assign/reassign to technician | Supervisor-level |
| `/api/tickets/{id}/escalate/` | POST | Internal escalation | Employee |
| `/api/tickets/{id}/pass_ticket/` | POST | Pass to another technician | Employee |
| `/api/tickets/{id}/review/` | POST | Review ticket, set priority | Admin-level |
| `/api/tickets/{id}/confirm_ticket/` | POST | Confirm client verification | Admin-level |
| `/api/tickets/{id}/escalate_external/` | POST | Escalate to external vendor | Admin/Employee |
| `/api/tickets/{id}/close_ticket/` | POST | Close ticket | Admin-level |
| `/api/tickets/{id}/start_work/` | POST | Start work (record time_in) | Admin/Employee |
| `/api/tickets/{id}/request_closure/` | POST | Submit resolution for closure | Employee |
| `/api/tickets/{id}/upload_resolution_proof/` | POST | Upload resolution proof files | Admin/Employee |
| `/api/tickets/{id}/submit_for_observation/` | POST | Submit for monitoring | Admin/Employee |
| `/api/tickets/{id}/save_product_details/` | PATCH | Save product info | Admin/Employee |
| `/api/tickets/{id}/update_employee_fields/` | PATCH | Update work fields | Admin/Employee |
| `/api/tickets/{id}/link_tickets/` | POST | Link related tickets | Admin-level |
| `/api/tickets/{id}/update_task/{task_id}/` | PATCH | Update sub-task status | Admin/Employee |
| `/api/tickets/{id}/delete_attachment/{att_id}/` | DELETE | Remove attachment | Participant |
| `/api/tickets/next_stf_no/` | GET | Preview next STF number | Required |
| `/api/tickets/stats/` | GET | Dashboard statistics | Required |
| `/api/tickets/{id}/messages/` | GET | Chat message history | Participant |
| `/api/tickets/{id}/assignment_history/` | GET | Assignment session history | Participant |

### Catalog Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/type-of-service/` | GET | List service types | Required |
| `/api/type-of-service/` | POST | Create service type | Admin |
| `/api/type-of-service/{id}/` | GET/PUT/DELETE | Retrieve/Update/Delete service type | Admin (write) |
| `/api/categories/` | GET | List product categories | Required |
| `/api/categories/` | POST | Create category | Admin |
| `/api/categories/{id}/` | GET/PUT/DELETE | Retrieve/Update/Delete category | Admin (write) |
| `/api/products/` | GET | List products | Required |
| `/api/products/` | POST | Create product | Admin |
| `/api/products/{id}/` | GET/PUT/DELETE | Retrieve/Update/Delete product | Admin (write) |
| `/api/clients/` | GET | List clients | Required |
| `/api/clients/` | POST | Create client | Admin |
| `/api/clients/{id}/` | GET/PUT/DELETE | Retrieve/Update/Delete client | Admin (write) |
| `/api/clients/{id}/tickets/` | GET | Get client's tickets | Required |

### Escalation & Audit Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/escalation-logs/` | GET | List escalation logs (role-scoped) | Required |
| `/api/escalation-logs/{id}/` | GET | Retrieve escalation log | Required |
| `/api/audit-logs/` | GET | List audit logs (filterable) | Admin |
| `/api/audit-logs/{id}/` | GET | Retrieve audit log entry | Admin |
| `/api/audit-logs/summary/` | GET | Audit log dashboard stats | Admin |
| `/api/audit-logs/export/` | GET | Export audit logs as CSV | Admin |

### Support Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/call-logs/` | GET/POST | List/Create call logs | Required (role-scoped) |
| `/api/call-logs/{id}/` | GET/PUT/PATCH/DELETE | Retrieve/Update/Delete call log | Required (role-scoped) |
| `/api/call-logs/{id}/end_call/` | POST | End call (set call_end to now) | Required (role-scoped) |
| `/api/feedback-ratings/` | GET/POST | List/Create feedback ratings | Admin-level |
| `/api/feedback-ratings/{id}/` | GET/PUT/PATCH/DELETE | Retrieve/Update/Delete feedback rating | Admin-level |

### Knowledge Hub Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/knowledge-hub/` | GET | List resolution proofs (filterable) | Admin |
| `/api/knowledge-hub/{id}/` | GET | Retrieve proof detail | Admin |
| `/api/knowledge-hub/{id}/publish/` | POST | Publish as knowledge article | Admin |
| `/api/knowledge-hub/{id}/unpublish/` | POST | Unpublish article | Admin |
| `/api/knowledge-hub/{id}/archive/` | POST | Archive article | Admin |
| `/api/knowledge-hub/{id}/unarchive/` | POST | Unarchive article | Admin |
| `/api/knowledge-hub/summary/` | GET | Knowledge Hub statistics | Admin |
| `/api/published-articles/` | GET | List published articles | Required |
| `/api/published-articles/{id}/` | GET | Retrieve published article | Required |

### Notification Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/notifications/` | GET | List user's notifications | Required |
| `/api/notifications/{id}/` | GET | Retrieve notification | Required |
| `/api/notifications/unread_count/` | GET | Get unread notification count | Required |
| `/api/notifications/mark_read/` | POST | Mark specific notifications as read | Required |
| `/api/notifications/mark_all_read/` | POST | Mark all notifications as read | Required |
| `/api/notifications/clear_all/` | POST | Delete all notifications | Required |

### Configuration Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/retention-policy/` | GET | Get current retention policy | Superadmin |
| `/api/retention-policy/` | POST | Update retention policy | Superadmin |
| `/api/announcements/` | GET | List announcements (role-scoped visibility) | Required |
| `/api/announcements/` | POST | Create announcement | Superadmin |
| `/api/announcements/{id}/` | GET/PUT/DELETE | Retrieve/Update/Delete announcement | Superadmin (write) |

### Employee List Endpoint

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/employees/` | GET | List employees with active ticket counts | Required |
| `/api/sales-users/` | GET | List active sales users | Required |
| `/api/supervisors/` | GET | List active supervisors | Required |

---

## 12.4 Request and Response Format

### Standard Success Response

```json
// Single Object
{
  "id": 1,
  "stf_no": "STF-MT-20260311000001",
  "status": "open",
  "priority": "high",
  "created_at": "2026-03-11T08:30:00Z"
}

// List Response
[
  { "id": 1, "stf_no": "STF-MT-20260311000001", ... },
  { "id": 2, "stf_no": "STF-MT-20260311000002", ... }
]
```

### Create Ticket Request Example

```json
POST /api/tickets/
Authorization: Bearer <token>
Content-Type: application/json

{
  "type_of_service": 1,
  "description_of_problem": "Printer not responding to print commands",
  "preferred_support_type": "onsite",
  "priority": "high",
  "client": "ABC Corporation",
  "contact_person": "John Smith",
  "mobile_no": "09171234567",
  "email_address": "john@abc.com",
  "address": "123 Main St, Makati",
  "department_organization": "IT Department",
  "assign_to": 5,
  "is_existing_client": false
}
```

### Assign Ticket Request

```json
POST /api/tickets/42/assign/
Authorization: Bearer <token>
Content-Type: application/json

{
  "employee_id": 5
}
```

---

## 12.5 Error Handling

### Standard Error Responses

| HTTP Status | Meaning | Example |
|-------------|---------|---------|
| 400 | Bad Request — Invalid input data | `{"detail": "Resolution proof is required before requesting closure."}` |
| 401 | Unauthorized — No or invalid token | `{"detail": "Authentication credentials were not provided."}` |
| 403 | Forbidden — Insufficient permissions | `{"detail": "Only admins can perform this action."}` |
| 404 | Not Found — Resource doesn't exist | `{"detail": "Not found."}` |
| 405 | Method Not Allowed | `{"detail": "Method \"DELETE\" not allowed."}` |
| 500 | Internal Server Error | `{"detail": "Internal server error."}` |

### Validation Error Format

```json
{
  "field_name": ["Error message 1", "Error message 2"],
  "another_field": ["This field is required."]
}
```

### WebSocket Error Messages

```json
{
  "type": "error",
  "message": "You are not a participant of this ticket."
}
```

---

## 12.6 WebSocket API

### Notification WebSocket

**URL:** `ws://localhost:8000/ws/notifications/?token=<jwt>`

**Server → Client Messages:**

```json
// New notification
{
  "type": "new_notification",
  "notification": {
    "id": 42,
    "notification_type": "assignment",
    "title": "New Ticket Assigned",
    "message": "You have been assigned ticket STF-MT-20260311000001",
    "ticket_id": 1,
    "is_read": false,
    "created_at": "2026-03-11T10:00:00Z"
  },
  "unread_count": 5
}

// Unread count update
{
  "type": "unread_count",
  "count": 3
}
```

**Client → Server Messages:**

```json
// Mark specific notifications as read
{
  "action": "mark_read",
  "notification_ids": [1, 2, 3]
}

// Mark all as read
{
  "action": "mark_all_read"
}
```

### Chat WebSocket

**URL:** `ws://localhost:8000/ws/chat/{ticket_id}/admin_employee/?token=<jwt>`

**Server → Client Messages:**

```json
// Chat message
{
  "type": "chat_message",
  "message": {
    "id": 100,
    "sender_id": 1,
    "sender_username": "admin1",
    "sender_role": "admin",
    "content": "Please check the printer status",
    "reply_to": null,
    "is_system_message": false,
    "reactions": {},
    "read_by": [],
    "created_at": "2026-03-11T10:30:00Z"
  }
}

// Typing indicator
{
  "type": "typing_indicator",
  "user_id": 1,
  "username": "admin1",
  "is_typing": true
}

// System message
{
  "type": "system_message",
  "message": { ... }
}

// Force disconnect
{
  "type": "force_disconnect",
  "reason": "You have been reassigned from this ticket."
}
```

**Client → Server Messages:**

```json
// Send message
{
  "action": "send_message",
  "content": "Printer is offline, need replacement parts",
  "reply_to": 100
}

// Typing indicator
{
  "action": "typing",
  "is_typing": true
}

// React to message
{
  "action": "react",
  "message_id": 100,
  "emoji": "👍"
}

// Mark messages as read
{
  "action": "mark_read",
  "message_ids": [100, 101, 102]
}
```

---

*End of Section 12*
