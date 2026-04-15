# 7. FUNCTIONAL REQUIREMENTS

## 7.1 Functional Requirement Structure

| ID | Module | Requirement | Priority |
|----|--------|-------------|----------|
| FR-001 | Authentication | The system shall support JWT-based login with username or email | Critical |
| FR-002 | Authentication | The system shall provide password reset via email token and recovery key | High |
| FR-003 | Authentication | The system shall check passwords against the HIBP breach database | High |
| FR-004 | Authentication | The system shall support token refresh with configurable lifetimes | Critical |
| FR-005 | User Management | Superadmins shall be able to create, update, activate/deactivate, and reset passwords for users | Critical |
| FR-006 | User Management | Users shall be able to update their own profile (name, phone, avatar) | High |
| FR-007 | User Management | The system shall auto-generate unique usernames from name initials | Medium |
| FR-008 | Ticket Management | Admin-level users shall be able to create tickets with client, product, and service information (sales scope: own intake tickets) | Critical |
| FR-009 | Ticket Management | The system shall auto-generate unique STF numbers (STF-MT-YYYYMMDDXXXXXX) | Critical |
| FR-010 | Ticket Management | Supervisors (admin/superadmin permission group) shall be able to assign tickets to technicians | Critical |
| FR-011 | Ticket Management | Supervisors (admin/superadmin permission group) shall be able to reassign tickets to different technicians | High |
| FR-012 | Ticket Management | Technicians shall be able to start work on assigned tickets (recording time_in) | Critical |
| FR-013 | Ticket Management | Technicians shall be able to update action taken, remarks, job status, and other work fields | Critical |
| FR-014 | Ticket Management | Technicians shall be able to upload resolution proof attachments | Critical |
| FR-015 | Ticket Management | Technicians shall be able to request ticket closure (recording time_out) | Critical |
| FR-016 | Ticket Management | Supervisors shall be able to close tickets after submitting technical staff feedback rating | Critical |
| FR-017 | Ticket Management | Admins and sales users shall be able to confirm tickets (sales scope: own call-verified tickets) | High |
| FR-018 | Ticket Management | Admins and sales users shall be able to review tickets and set priority (sales scope: own call workflow) | High |
| FR-019 | Ticket Management | The system shall track ticket progress percentage based on lifecycle milestones | Medium |
| FR-020 | Ticket Management | Admins shall be able to link related tickets | Medium |
| FR-021 | Escalation | Technicians shall be able to escalate tickets internally (back to admin) | High |
| FR-022 | Escalation | Technicians shall be able to pass tickets to other technicians | High |
| FR-023 | Escalation | Admins/Technicians shall be able to escalate tickets to external vendors | High |
| FR-024 | Escalation | All escalations shall create EscalationLog records with full metadata | High |
| FR-025 | Observation | Technicians shall be able to submit tickets for observation without resolution | Medium |
| FR-026 | Chat | Admins and assigned technicians shall be able to communicate via real-time chat per ticket | Critical |
| FR-027 | Chat | Chat shall support message replies, emoji reactions, and read receipts | Medium |
| FR-028 | Chat | The system shall broadcast system messages for key ticket events | High |
| FR-029 | Notifications | The system shall send real-time push notifications for ticket events | Critical |
| FR-030 | Notifications | Users shall be able to mark notifications as read individually or in bulk | High |
| FR-031 | Knowledge Hub | Admins shall be able to publish resolution proofs as knowledge articles | High |
| FR-032 | Knowledge Hub | All authenticated users shall be able to search and view published articles | High |
| FR-033 | Knowledge Hub | Admins shall be able to archive and unarchive knowledge articles | Medium |
| FR-034 | Client Management | Admins shall be able to create, update, and manage client records | High |
| FR-035 | Product Management | Admins shall be able to create, update, and manage product/equipment records | High |
| FR-036 | Category Management | Admins shall be able to create and manage product categories | Medium |
| FR-037 | Type of Service | Admins shall be able to create and manage service types with SLA days | High |
| FR-038 | Call Logs | Admin-level users shall be able to create/manage support call logs with duration tracking (role-scoped visibility) | Medium |
| FR-039 | Feedback Rating | Supervisors shall be able to submit employee feedback ratings (1-5) before closure | High |
| FR-040 | Audit Logging | The system shall log all significant actions with actor, timestamp, IP, and change details | Critical |
| FR-041 | Audit Logging | Superadmin, admin, and sales roles shall be able to search, filter, and export audit logs within role scope | High |
| FR-042 | Dashboard | The system shall provide role-specific dashboards with ticket statistics | High |
| FR-043 | Announcements | Superadmins shall be able to create role-targeted announcements with scheduling | Medium |
| FR-044 | Retention Policy | Superadmins shall be able to configure data retention periods for logs | Low |
| FR-045 | Digital Signatures | The system shall capture and store digital signatures for ticket resolution | Medium |
| FR-046 | PDF Generation | The system shall generate STF documents in PDF format | Medium |
| FR-047 | Excel Export | The system shall support data export to Excel format | Medium |

---

## 7.2 Core Functional Modules

### 7.2.1 Authentication Module

**Description:** Handles user authentication, session management, and password security.

**Inputs:**
- Username or email address
- Password
- Recovery key (for key-based reset)
- Password reset token (for email-based reset)

**Outputs:**
- JWT access token (1-day lifetime)
- JWT refresh token (30-day lifetime)
- Authenticated user profile data

**User Interactions:**
- Login form with username/email + password
- Forgot password form (email-based or recovery key)
- Change password form (current + new password)

**System Responses:**
- Returns JWT tokens on successful authentication
- Returns user profile with role and permissions
- Validates passwords against HIBP breach database
- Auto-refreshes tokens with rotation

---

### 7.2.2 Ticket Management Module

**Description:** Core module managing the complete ticket lifecycle from creation through closure.

**Inputs:**
- Client information (name, contact, address, organization)
- Product/equipment details (device, serial number, warranty status)
- Service type selection
- Problem description
- Assignment target (employee selection)

**Outputs:**
- Auto-generated STF number
- Ticket record with full metadata
- Status updates and audit trail
- SLA progress tracking
- Resolution documentation

**User Interactions:**
- Admin (Supervisor): Create/assign/reassign tickets, manage lifecycle, close tickets
- Sales: Create tickets, complete call verification, set priority, confirm ticket, route to supervisor
- Employee: View assigned tickets, start work, update fields, upload proofs, request closure
- Both: View ticket details, progress tracking, chat

**System Responses:**
- Auto-generates unique STF numbers
- Creates/ends AssignmentSessions on assignment changes
- Calculates progress percentage based on lifecycle stage
- Validates resolution proof requirements before allowing closure requests
- Sends real-time notifications on status changes

---

### 7.2.3 Real-Time Communication Module

**Description:** Provides live chat and notification capabilities via WebSocket connections.

**Inputs:**
- Chat messages (text content, optional reply reference)
- Emoji reactions on messages
- Read receipt acknowledgments
- Typing indicators
- Notification mark-read actions

**Outputs:**
- Real-time message delivery to connected participants
- Typing indicator broadcasts
- Reaction updates
- Read receipt confirmations
- Push notifications with unread count

**User Interactions:**
- Chat panel within ticket detail view
- Notification panel (bell icon) in header
- Mark individual/all notifications as read

**System Responses:**
- Broadcasts messages to ticket chat group
- Stores messages with sender, timestamp, and session context
- Sends notifications to personal WebSocket groups
- Maintains unread count and delivers on connect

---

### 7.2.4 Escalation Module

**Description:** Manages internal and external escalation workflows for ticket resolution.

**Inputs:**
- Escalation type (internal / external)
- Target employee (for internal pass)
- External vendor name (for external escalation)
- Escalation notes

**Outputs:**
- EscalationLog record
- Updated ticket status and assignment
- System chat messages
- Notifications to affected parties

**User Interactions:**
- Employee: Escalate button (returns to admin), Pass button (to another employee)
- Admin/Employee: External escalation form (vendor name + notes)

**System Responses:**
- Ends current AssignmentSession
- Creates EscalationLog with full metadata
- Broadcasts system message in ticket chat
- Sends force_disconnect WebSocket event to old assignee
- Creates new AssignmentSession for new assignee

---

### 7.2.5 Knowledge Hub Module

**Description:** Manages the publication and consumption of resolution documentation as knowledge articles.

**Inputs:**
- Resolution proof attachments (from tickets)
- Published title, description, and tags (max 3)

**Outputs:**
- Published articles searchable by all authenticated users
- Summary statistics (published, unpublished, archived counts)

**User Interactions:**
- Admin: Browse resolution proofs, publish with metadata, unpublish, archive/unarchive
- Employee: Search and view published articles

**System Responses:**
- Filters published articles for employee view
- Provides search across title and description
- Tracks publication metadata (published_by, published_at)

---

### 7.2.6 Audit & Compliance Module

**Description:** Comprehensive action logging for accountability and compliance.

**Inputs:**
- Automatic capture from system events (Django signals)
- Manual creation from view actions

**Outputs:**
- Timestamped audit log entries
- CSV export of filtered logs
- Summary dashboard statistics

**User Interactions:**
- Admin/Superadmin: Browse, search, filter, and export audit logs

**System Responses:**
- Logs every CRUD action, status change, login/logout, escalation, and assignment
- Captures actor identity, IP address, user agent, and field-level changes
- Provides role-scoped visibility (superadmin sees admin+employee logs, admin/sales see employee logs)

---

## 7.3 Use Case Specifications

### UC-001: Admin/Sales Creates a Ticket

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-001 |
| **Description** | Supervisor or sales user creates a new support ticket on behalf of a client |
| **Actors** | Admin (Supervisor), Sales |
| **Preconditions** | User is authenticated; client information is available |
| **Main Flow** | 1. User navigates to Create Ticket page. 2. User fills client information (new or existing). 3. User enters service/problem details and optional product details. 4. User submits the form. 5. System creates ticket with auto-generated STF number. 6. System creates client and product records if needed. 7. For supervisor-created tickets, assignment may proceed immediately. 8. For sales-created tickets, ticket enters call/priority workflow before supervisor assignment. |
| **Alternate Flow** | A1: Existing client is selected and fields are pre-filled. A2: No employee is assigned at creation and ticket remains open for supervisor assignment. A3: Sales sets priority and confirms ticket through call workflow first. |
| **Postconditions** | Ticket exists with unique STF number; related records are linked; audit logs and notifications are generated according to workflow. |

---

### UC-002: Employee Works on a Ticket

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-002 |
| **Description** | Technician receives assignment, starts work, and resolves the ticket |
| **Actors** | Employee (Technician) |
| **Preconditions** | Employee is authenticated; ticket is assigned to this employee |
| **Main Flow** | 1. Employee receives notification of assignment. 2. Employee views ticket in My Tickets or dashboard. 3. Employee clicks "Start Work" — system records time_in, status changes to IN_PROGRESS. 4. Employee communicates with supervisor via live chat as needed. 5. Employee conducts diagnosis and takes corrective action. 6. Employee updates ticket fields (action_taken, remarks, job_status). 7. Employee uploads resolution proof (photos, documents). 8. Employee captures client digital signature. 9. Employee clicks "Request Closure" — system verifies resolution proof exists, sets status to PENDING_CLOSURE, records time_out. |
| **Alternate Flow** | A1: Employee cannot resolve — escalates internally (UC-003). A2: Employee needs to pass — passes to another employee (UC-004). A3: Issue needs monitoring — submits for observation (UC-006). |
| **Postconditions** | Ticket in PENDING_CLOSURE status; resolution proof uploaded; time_in and time_out recorded; supervisor notified. |

---

### UC-003: Employee Escalates Ticket Internally

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-003 |
| **Description** | Technician escalates a ticket back to the supervisor for reassignment |
| **Actors** | Employee (Technician) |
| **Preconditions** | Employee is authenticated; ticket is assigned to this employee and in IN_PROGRESS status |
| **Main Flow** | 1. Employee clicks "Escalate" on the ticket. 2. System ends current AssignmentSession. 3. System creates EscalationLog (type: internal). 4. System changes status to ESCALATED. 5. System reassigns ticket to the original admin creator. 6. System sends notification to admin. 7. System broadcasts system message in ticket chat. |
| **Postconditions** | Ticket escalated; old session closed; admin notified; escalation logged. |

---

### UC-004: Employee Passes Ticket

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-004 |
| **Description** | Technician passes ticket to another technician |
| **Actors** | Employee (Technician) |
| **Preconditions** | Employee is authenticated; ticket is assigned; target employee is active |
| **Main Flow** | 1. Employee selects target technician and provides optional notes. 2. System ends current AssignmentSession. 3. System creates EscalationLog with from_user and to_user. 4. System creates new AssignmentSession for target employee. 5. System sends force_disconnect to old employee's WebSocket. 6. System sends notification to new employee. 7. System broadcasts system message in chat. |
| **Postconditions** | Ticket reassigned; sessions rotated; both parties notified. |

---

### UC-005: Admin Closes a Ticket

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-005 |
| **Description** | Supervisor reviews resolution and formally closes the ticket |
| **Actors** | Admin (Supervisor) |
| **Preconditions** | Admin is authenticated; ticket is in PENDING_CLOSURE status |
| **Main Flow** | 1. Admin views ticket in PENDING_CLOSURE status. 2. Admin reviews proof, action taken, and remarks. 3. Admin submits feedback rating for the assigned employee. 4. Admin clicks "Close Ticket." 5. System sets status to CLOSED. 6. System ends active AssignmentSession. 7. System sends notification to the assigned employee. 8. System writes audit logs. |
| **Postconditions** | Ticket status is CLOSED; feedback rating recorded; employee notified; session ended. |

---

### UC-006: Submit Ticket for Observation

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-006 |
| **Description** | Technician submits a ticket for monitoring without immediate resolution |
| **Actors** | Employee (Technician) |
| **Preconditions** | Working on the ticket (IN_PROGRESS status) |
| **Main Flow** | 1. Employee records observation notes, action taken, and job status. 2. Employee submits for observation. 3. System sets status to FOR_OBSERVATION. 4. System creates system message in chat with observation details. 5. Admin is notified to monitor the ticket. |
| **Postconditions** | Ticket in FOR_OBSERVATION; admin aware; observation details recorded. |

---

### UC-007: Real-Time Chat Between Admin and Employee

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-007 |
| **Description** | Supervisor and assigned technician communicate about a ticket in real-time |
| **Actors** | Admin, Employee (assigned to ticket) |
| **Preconditions** | Both users authenticated; ticket exists with active assignment |
| **Main Flow** | 1. User opens ticket detail page and enters the chat panel. 2. WebSocket connection established (authenticated via JWT). 3. System sends existing message history. 4. User types message — typing indicator shown to other party. 5. User sends message — appears instantly for both parties. 6. Recipient sees message; read receipt sent automatically. 7. Users can react with emojis and reply to specific messages. |
| **Postconditions** | Messages stored in database; read receipts tracked; typing events transient. |

---

### UC-008: Superadmin Manages Users

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-008 |
| **Description** | Superadmin creates, edits, activates/deactivates, and resets passwords for user accounts |
| **Actors** | Superadmin |
| **Preconditions** | Superadmin is authenticated |
| **Main Flow** | 1. Superadmin navigates to User Management page. 2. Views list of all users with roles and status. 3. Creates new user (system generates username and temporary password). 4. Edits user profile and role as needed. 5. Deactivates/reactivates accounts. 6. Resets passwords for locked-out users. |
| **Postconditions** | User accounts managed; audit log entries created for all actions. |

---

### UC-009: Publish Knowledge Article

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-009 |
| **Description** | Admin publishes a ticket resolution proof as a knowledge base article |
| **Actors** | Admin |
| **Preconditions** | Resolution proof attachment exists on a ticket |
| **Main Flow** | 1. Admin navigates to Knowledge Hub. 2. Admin browses resolution proofs. 3. Admin clicks "Publish" on an attachment. 4. Admin provides title, description, and up to 3 tags. 5. System marks attachment as published with metadata. 6. Article becomes visible to all authenticated users. |
| **Postconditions** | Article published and searchable; metadata recorded. |

---

*End of Section 7*
