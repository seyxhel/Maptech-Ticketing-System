# 15. TESTING STRATEGY

## 15.1 Testing Objectives

The testing strategy for the Maptech Ticketing System aims to:

1. **Verify Functional Correctness** — Ensure all ticket lifecycle operations, role-based access controls, and business logic perform as specified.
2. **Validate Security Controls** — Confirm authentication, authorization, and data protection mechanisms work correctly.
3. **Ensure Real-Time Reliability** — Verify WebSocket communication (chat and notifications) operates reliably under various conditions.
4. **Confirm Data Integrity** — Validate that all CRUD operations maintain referential integrity and produce correct audit trails.
5. **Assess User Experience** — Ensure the frontend provides responsive, intuitive interactions across supported browsers and devices.

---

## 15.2 Test Types

### Unit Testing

| Aspect | Details |
|--------|---------|
| **Scope** | Individual model methods, serializer validation, utility functions, permission classes |
| **Framework** | Django TestCase / pytest-django (backend), Jest / Vitest (frontend) |
| **Focus Areas** | STF number generation, SLA calculation, progress percentage, password hashing, role-based field filtering, phone number formatting, username generation |
| **Execution** | Automated, run on every code change |

### Integration Testing

| Aspect | Details |
|--------|---------|
| **Scope** | API endpoint behavior including authentication, serialization, database operations, and permission enforcement |
| **Framework** | Django REST Framework APITestCase |
| **Focus Areas** | Ticket CRUD lifecycle, assignment/reassignment flows, escalation workflows, notification dispatch, audit log creation, file upload/delete, WebSocket connection/message flow |
| **Execution** | Automated, run as part of CI pipeline |

### System Testing

| Aspect | Details |
|--------|---------|
| **Scope** | End-to-end workflows spanning frontend and backend |
| **Framework** | Manual testing or Playwright/Cypress for browser automation |
| **Focus Areas** | Complete ticket lifecycle (create → assign → work → resolve → close), chat communication flow, notification delivery, dashboard data accuracy, PDF/Excel export, dark mode rendering |
| **Execution** | Semi-automated or manual, run before releases |

### User Acceptance Testing (UAT)

| Aspect | Details |
|--------|---------|
| **Scope** | Business workflow validation by actual end users |
| **Participants** | Supervisors, technicians, management representatives |
| **Focus Areas** | Usability, workflow correctness, data accuracy, reporting quality, real-world scenarios |
| **Execution** | Manual, conducted during pre-release phase |

---

## 15.3 Test Environment

| Environment | Purpose | Configuration |
|-------------|---------|---------------|
| **Development** | Unit and integration testing during development | SQLite database, InMemory channel layer, Vite dev server with proxy |
| **Staging** | System and UAT testing before production deployment | PostgreSQL database, Redis channel layer, production-like configuration |
| **Production** | Smoke testing after deployment | Live environment with monitoring; read-only verification tests |

### Test Data Management

| Strategy | Details |
|----------|---------|
| **Fixtures** | Predefined test data for service types, categories, and initial admin account |
| **Factory Pattern** | Generate test data dynamically for users, tickets, clients, and products |
| **Database Reset** | Test database is recreated for each test suite run |
| **Mock Data** | Frontend uses `mockTickets.ts` for UI development and testing without backend |

---

## 15.4 Test Cases Structure

### Authentication Test Cases

| Test Case ID | Description | Expected Result |
|-------------|-------------|-----------------|
| TC-AUTH-001 | Login with valid username and password | Returns 200 with JWT access and refresh tokens |
| TC-AUTH-002 | Login with valid email and password | Returns 200 with JWT tokens (email fallback) |
| TC-AUTH-003 | Login with invalid credentials | Returns 401 Unauthorized |
| TC-AUTH-004 | Login with deactivated account | Returns 401 Unauthorized |
| TC-AUTH-005 | Access protected endpoint without token | Returns 401 "Authentication credentials not provided" |
| TC-AUTH-006 | Access protected endpoint with expired token | Returns 401 "Token is invalid or expired" |
| TC-AUTH-007 | Refresh token with valid refresh token | Returns new access token |
| TC-AUTH-008 | Change password with valid current password | Returns 200 with new tokens |
| TC-AUTH-009 | Change password with breached password | Returns 200 with warning (non-blocking) |
| TC-AUTH-010 | Reset password by recovery key | Returns 200. Password changed. |
| TC-AUTH-011 | Reset password with invalid recovery key | Returns 400 "Invalid recovery key" |

### Ticket Lifecycle Test Cases

| Test Case ID | Description | Expected Result |
|-------------|-------------|-----------------|
| TC-TKT-001 | Admin creates ticket with all fields | Ticket created with auto STF number; client/product records created |
| TC-TKT-002 | Admin creates ticket with existing client | Ticket linked to existing client_record |
| TC-TKT-003 | Admin assigns ticket to employee | AssignmentSession created; notification sent; status unchanged |
| TC-TKT-004 | Admin reassigns ticket to different employee | Old session ended; new session created; force_disconnect sent |
| TC-TKT-005 | Employee starts work on assigned ticket | time_in recorded; status → in_progress |
| TC-TKT-006 | Employee updates action_taken, remarks | Fields updated; non-allowed fields ignored |
| TC-TKT-007 | Employee uploads resolution proof | Attachment created with is_resolution_proof=True |
| TC-TKT-008 | Employee requests closure without proof | Returns 400 "Resolution proof required" |
| TC-TKT-009 | Employee requests closure with proof | Status → pending_closure; time_out recorded |
| TC-TKT-010 | Admin closes ticket with feedback rating | Status → closed; session ended; feedback rating recorded |
| TC-TKT-011 | Employee views only assigned tickets | Only assigned tickets returned in list |
| TC-TKT-012 | Admin views all tickets | All tickets returned in list |
| TC-TKT-013 | STF number uniqueness | Concurrent creation produces unique STF numbers |

### Escalation Test Cases

| Test Case ID | Description | Expected Result |
|-------------|-------------|-----------------|
| TC-ESC-001 | Employee escalates internally | Status → escalated; session ended; admin notified |
| TC-ESC-002 | Employee passes to another employee | New session created; new employee notified; old employee disconnected |
| TC-ESC-003 | Admin escalates externally | Status → escalated_external; external vendor info recorded |
| TC-ESC-004 | Non-assigned employee tries to escalate | Returns 403 "Only assigned employee" |

### Permission Test Cases

| Test Case ID | Description | Expected Result |
|-------------|-------------|-----------------|
| TC-PERM-001 | Employee tries to create ticket | Returns 403 or handled by role-based logic |
| TC-PERM-002 | Employee tries to close ticket | Returns 403 "Only admins" |
| TC-PERM-003 | Admin tries to manage users | Returns 403 "Only superadmins" |
| TC-PERM-004 | Admin tries to access retention policy | Returns 403 "Only superadmins" |
| TC-PERM-005 | Employee tries to access audit logs | Returns 403 "Only admins" |
| TC-PERM-006 | Unauthenticated user tries to access tickets | Returns 401 |

### WebSocket Test Cases

| Test Case ID | Description | Expected Result |
|-------------|-------------|-----------------|
| TC-WS-001 | Connect to notifications with valid token | Connection accepted; unread count sent |
| TC-WS-002 | Connect to notifications without token | Connection rejected |
| TC-WS-003 | Connect to chat as assigned employee | Connection accepted; message history sent |
| TC-WS-004 | Connect to chat as non-assigned employee | Connection rejected |
| TC-WS-005 | Send message in chat | Message stored and broadcast to group |
| TC-WS-006 | React to message with emoji | Reaction toggled; update broadcast |
| TC-WS-007 | Mark messages as read | Read receipts created; update broadcast |
| TC-WS-008 | Receive notification after ticket assignment | Notification pushed to assigned employee's WebSocket |

### Knowledge Hub Test Cases

| Test Case ID | Description | Expected Result |
|-------------|-------------|-----------------|
| TC-KH-001 | Admin publishes resolution proof | Article visible to all authenticated users |
| TC-KH-002 | Admin unpublishes article | Article no longer visible in published list |
| TC-KH-003 | Employee searches published articles | Returns matching articles by title/description |
| TC-KH-004 | Admin archives published article | Article moves to archived status |

---

*End of Section 15*
