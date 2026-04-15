# 9. DATA ARCHITECTURE

## 9.1 Data Model Overview

The Maptech Ticketing System uses a relational data model implemented through Django's ORM. The database consists of **18 primary tables** (models) organized into the following logical groups:

| Group | Models | Purpose |
|-------|--------|---------|
| **Identity** | User | User accounts and authentication |
| **Core Ticketing** | Ticket, TicketAttachment, TicketTask | Ticket records, file attachments, and sub-tasks |
| **Assignment & Messaging** | AssignmentSession, Message, MessageReaction, MessageReadReceipt | Ticket assignment tracking and real-time communication |
| **Lifecycle & Escalation** | EscalationLog | Escalation history and tracking |
| **Audit & Compliance** | AuditLog | System-wide action audit trail |
| **Notifications** | Notification | User notifications for ticket events |
| **Support Operations** | CallLog, FeedbackRating | Call tracking and employee feedback ratings |
| **Catalog / Lookup** | TypeOfService, Category, Product, Client | Service types, product categories, equipment, and client records |
| **Configuration** | RetentionPolicy, Announcement | System configuration and announcements |

---

## 9.2 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User {
        int id PK
        string username UK
        string email UK
        string role
        string first_name
        string middle_name
        string last_name
        string suffix
        string phone
        string profile_picture
        string recovery_key UK
        boolean is_active
    }

    Ticket {
        int id PK
        string stf_no UK
        string status
        string priority
        int created_by FK
        int assigned_to FK
        int type_of_service FK
        int client_record FK
        int product_record FK
        int current_session FK
        date date
        datetime time_in
        datetime time_out
        text description_of_problem
        text action_taken
        text remarks
        string job_status
        string cascade_type
        text observation
        text signature
        string signed_by_name
        boolean confirmed_by_admin
    }

    AssignmentSession {
        int id PK
        int ticket FK
        int employee FK
        datetime started_at
        datetime ended_at
        boolean is_active
    }

    Message {
        int id PK
        int ticket FK
        int assignment_session FK
        string channel_type
        int sender FK
        text content
        int reply_to FK
        boolean is_system_message
        datetime created_at
    }

    MessageReaction {
        int id PK
        int message FK
        int user FK
        string emoji
    }

    MessageReadReceipt {
        int id PK
        int message FK
        int user FK
        datetime read_at
    }

    TicketAttachment {
        int id PK
        int ticket FK
        string file
        int uploaded_by FK
        datetime uploaded_at
        boolean is_resolution_proof
        boolean is_published
        string published_title
        int published_by FK
        boolean is_archived
    }

    TicketTask {
        int id PK
        int ticket FK
        int assigned_to FK
        string description
        string status
    }

    EscalationLog {
        int id PK
        int ticket FK
        int from_user FK
        int to_user FK
    }

    AuditLog {
        int id PK
        datetime timestamp
        string entity
        int entity_id
        string action
        text activity
        int actor FK
        string actor_email
        string ip_address
        json changes
    }

    Notification {
        int id PK
        int recipient FK
        int ticket FK
        string type
        string title
        string message
        boolean is_read
        datetime created_at
    }

    CallLog {
        int id PK
        int ticket FK
        int admin FK
        string client_name
        string phone_number
        datetime call_start
        datetime call_end
        text notes
    }

    FeedbackRating {
        int id PK
        int ticket FK
        int employee FK
        int admin FK
        int rating
        text comments
    }

    TypeOfService {
        int id PK
        string name
        text description
        boolean is_active
        int estimated_resolution_days
    }

    Category {
        int id PK
        string name
        text description
        boolean is_active
    }

    Product {
        int id PK
        int category FK
        string device_equipment
        string serial_no
        boolean has_warranty
        string product_name
        string brand
        string model_name
        boolean is_active
    }

    Client {
        int id PK
        string client_name
        string contact_person
        string mobile_no
        string designation
        string dept_org
        string email_address
        text address
        boolean is_active
    }

    RetentionPolicy {
        int id PK
        int audit_log_days
        int call_log_days
        int updated_by FK
        datetime updated_at
    }

    Announcement {
        int id PK
        string title
        text description
        string type
        string visibility
        boolean is_active
        date start_date
        date end_date
        int created_by FK
    }

    User ||--o{ Ticket : "created_by"
    User ||--o{ Ticket : "assigned_to"
    User ||--o{ AssignmentSession : "employee"
    User ||--o{ AuditLog : "actor"
    User ||--o{ Notification : "recipient"
    User ||--o{ CallLog : "admin"
    User ||--o{ Message : "sender"
    User ||--o{ MessageReaction : "reacts"
    User ||--o{ MessageReadReceipt : "reads"
    User ||--o{ EscalationLog : "from_user"
    User ||--o{ EscalationLog : "to_user"
    User ||--o{ TicketAttachment : "uploaded_by"
    User ||--o{ TicketTask : "assigned_to"
    User ||--o{ FeedbackRating : "employee"
    User ||--o{ FeedbackRating : "admin"
    User ||--o{ Announcement : "created_by"
    User ||--o{ RetentionPolicy : "updated_by"

    Ticket ||--o{ AssignmentSession : "has"
    Ticket ||--o{ Message : "has"
    Ticket ||--o{ TicketAttachment : "has"
    Ticket ||--o{ TicketTask : "has"
    Ticket ||--o{ EscalationLog : "has"
    Ticket ||--o{ Notification : "references"
    Ticket ||--o{ CallLog : "references"
    Ticket ||--|| FeedbackRating : "has"

    AssignmentSession ||--o{ Message : "within"
    Message ||--o{ MessageReaction : "has"
    Message ||--o{ MessageReadReceipt : "has"
    Message o|--o| Message : "reply_to"

    TypeOfService ||--o{ Ticket : "service_type"
    Client ||--o{ Ticket : "client_record"
    Product ||--o{ Ticket : "product_record"
    Category ||--o{ Product : "category"
```

---

## 9.3 Database Schema

### Table Listing

| Table Name | Description | Key Relationships |
|------------|-------------|-------------------|
| `users_user` | User accounts (extends Django AbstractUser) | Referenced by nearly all other tables |
| `tickets_ticket` | Core ticket records | FK → User (created_by, assigned_to), FK → TypeOfService, FK → Client, FK → Product, FK → AssignmentSession, M2M → self (linked_tickets) |
| `tickets_ticketattachment` | File attachments for tickets | FK → Ticket, FK → User (uploaded_by, published_by) |
| `tickets_tickettask` | Sub-tasks within tickets | FK → Ticket, FK → User (assigned_to) |
| `tickets_assignmentsession` | Employee assignment periods | FK → Ticket, FK → User (employee) |
| `tickets_message` | Chat messages | FK → Ticket, FK → AssignmentSession, FK → User (sender), FK → self (reply_to) |
| `tickets_messagereaction` | Emoji reactions on messages | FK → Message, FK → User |
| `tickets_messagereadreceipt` | Read receipts for messages | FK → Message, FK → User |
| `tickets_escalationlog` | Escalation history records | FK → Ticket, FK → User (from_user, to_user) |
| `tickets_auditlog` | System-wide audit trail | FK → User (actor) |
| `tickets_notification` | User notifications | FK → User (recipient), FK → Ticket |
| `tickets_calllog` | Support call records | FK → Ticket, FK → User (admin) |
| `tickets_feedbackrating` | Employee feedback ratings | OneToOne → Ticket, FK → User (employee, admin) |
| `tickets_typeofservice` | Service type definitions | Referenced by Ticket |
| `tickets_category` | Product categories | Referenced by Product |
| `tickets_product` | Product/equipment records | FK → Category, Referenced by Ticket |
| `tickets_client` | Client organization records | Referenced by Ticket |
| `tickets_retentionpolicy` | Singleton system config | FK → User (updated_by) |
| `tickets_announcement` | System announcements | FK → User (created_by) |

---

## 9.4 Data Dictionary

### User Table (`users_user`)

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| id | BigAutoField | PK, Auto-increment | Unique user identifier |
| username | CharField(150) | Unique, Required | Login username (auto-generated from initials) |
| email | EmailField | Unique, Required | User email address |
| password | CharField(128) | Required | Hashed password (Argon2) |
| role | CharField(12) | Choices: employee/sales/admin/superadmin | User role determining access level |
| first_name | CharField(150) | Optional | User's first name |
| middle_name | CharField(150) | Optional | User's middle name |
| last_name | CharField(150) | Optional | User's last name |
| suffix | CharField(3) | Optional | Name suffix (Jr., Sr., III) |
| phone | CharField(13) | Optional | Phone in +63XXXXXXXXXX format |
| profile_picture | ImageField | Optional, Nullable | Upload path: profile_pictures/ |
| recovery_key | CharField(39) | Unique, Auto-generated | Format: xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx |
| is_active | BooleanField | Default: True | Account activation status |
| is_staff | BooleanField | Default: False | Django admin access |
| is_superuser | BooleanField | Default: False | Django superuser flag |
| date_joined | DateTimeField | Auto | Account creation timestamp |
| last_login | DateTimeField | Nullable | Last successful login |

### Ticket Table (`tickets_ticket`)

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| id | BigAutoField | PK | Unique ticket identifier |
| stf_no | CharField(30) | Unique, Auto-generated | Service Ticket Form number (STF-MT-YYYYMMDDXXXXXX) |
| status | CharField(20) | Choices, Default: 'open' | Current ticket status |
| priority | CharField(10) | Choices, Optional | Ticket priority (low/medium/high/critical) |
| created_by | ForeignKey(User) | CASCADE | Supervisor who created the ticket |
| assigned_to | ForeignKey(User) | SET_NULL, Nullable | Currently assigned technician |
| type_of_service | ForeignKey | SET_NULL, Nullable | Selected service type |
| type_of_service_others | CharField(200) | Optional | Custom service type text |
| client_record | ForeignKey(Client) | SET_NULL, Nullable | Linked client organization |
| product_record | ForeignKey(Product) | SET_NULL, Nullable | Linked product/equipment |
| current_session | ForeignKey(Session) | SET_NULL, Nullable | Current active assignment session |
| date | DateField | Default: today | Ticket creation date |
| time_in | DateTimeField | Nullable | When technician started work |
| time_out | DateTimeField | Nullable | When technician submitted resolution |
| description_of_problem | TextField | Optional | Problem description from supervisor |
| action_taken | TextField | Optional | Technician's resolution actions |
| remarks | TextField | Optional | Additional notes |
| job_status | CharField(20) | Choices, Optional | Job completion status |
| cascade_type | CharField(20) | Choices, Optional | Internal/External cascade type |
| observation | TextField | Optional | Observation notes |
| signature | TextField | Optional | Base64-encoded digital signature |
| signed_by_name | CharField(200) | Optional | Name of person who signed |
| confirmed_by_admin | BooleanField | Default: False | Client verification confirmed |
| preferred_support_type | CharField(20) | Choices, Optional | Remote/Onsite/Chat/Call |
| estimated_resolution_days_override | PositiveIntegerField | Nullable | Manual SLA override |
| external_escalated_to | CharField(300) | Optional | External vendor name |
| external_escalation_notes | TextField | Optional | External escalation details |
| external_escalated_at | DateTimeField | Nullable | External escalation timestamp |
| linked_tickets | ManyToManyField(self) | Optional | Related tickets |
| created_at | DateTimeField | Auto | Record creation timestamp |
| updated_at | DateTimeField | Auto | Last modification timestamp |

### TicketAttachment Table (`tickets_ticketattachment`)

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| id | BigAutoField | PK | Unique attachment identifier |
| ticket | ForeignKey(Ticket) | CASCADE | Parent ticket |
| file | FileField | Required | Upload path: ticket_attachments/YYYY/MM/DD/ |
| uploaded_by | ForeignKey(User) | SET_NULL, Nullable | User who uploaded the file |
| uploaded_at | DateTimeField | Auto | Upload timestamp |
| is_resolution_proof | BooleanField | Default: False | Marks as resolution evidence |
| is_published | BooleanField | Default: False | Published to Knowledge Hub |
| published_title | CharField(300) | Optional | Knowledge article title |
| published_description | TextField | Optional | Knowledge article description |
| published_tags | JSONField | Default: [], Max 3 | Searchable tags |
| published_by | ForeignKey(User) | SET_NULL, Nullable | User who published |
| published_at | DateTimeField | Nullable | Publication timestamp |
| is_archived | BooleanField | Default: False | Archive status |

### Message Table (`tickets_message`)

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| id | BigAutoField | PK | Unique message identifier |
| ticket | ForeignKey(Ticket) | CASCADE | Parent ticket |
| assignment_session | ForeignKey(Session) | SET_NULL, Nullable | Session during which message was sent |
| channel_type | CharField(20) | Choices: 'admin_employee' | Communication channel |
| sender | ForeignKey(User) | CASCADE | Message author |
| content | TextField | Required | Message text content |
| reply_to | ForeignKey(Message) | SET_NULL, Nullable | Referenced message for replies |
| is_system_message | BooleanField | Default: False | Auto-generated system message flag |
| created_at | DateTimeField | Auto | Send timestamp |

### AuditLog Table (`tickets_auditlog`)

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| id | BigAutoField | PK | Unique log entry identifier |
| timestamp | DateTimeField | Auto, Indexed | When the action occurred |
| entity | CharField(30) | Choices, Indexed | Entity type (User/Ticket/etc.) |
| entity_id | PositiveIntegerField | Nullable | Affected entity's ID |
| action | CharField(20) | Choices, Indexed | Action type (CREATE/UPDATE/LOGIN/etc.) |
| activity | TextField | Required | Human-readable description |
| actor | ForeignKey(User) | SET_NULL, Nullable | User who performed the action |
| actor_email | EmailField | Optional | Snapshot of actor's email at time of action |
| ip_address | GenericIPAddressField | Nullable | Client IP address |
| changes | JSONField | Nullable | JSON diff of changed fields |

### Additional Tables

Additional data dictionary entries for remaining tables (EscalationLog, Notification, CallLog, FeedbackRating, TypeOfService, Category, Product, Client, RetentionPolicy, Announcement, AssignmentSession, TicketTask, MessageReaction, MessageReadReceipt) follow the same structure documented in Section 5.5 Component Architecture and the ERD above.

---

## 9.5 Data Flow Diagrams

### Level 0 — Context Diagram

```mermaid
flowchart LR
    CL["Clients\n(External)"]
    SU["Supervisors\n(Admin)"]
    TE["Technicians\n(Employee)"]
    SA["Superadmin"]

    CL -->|"Support Requests"| MTS
    MTS -->|"Status Updates / Reports"| CL
    SU <-->|"Ticket Mgmt / Chat / Reports"| MTS
    TE <-->|"Assignments / Updates / Chat"| MTS
    SA <-->|"User Mgmt / Config / Audit"| MTS

    MTS["Maptech\nTicketing\nSystem"]
```

### Level 1 — Major Processes

```mermaid
flowchart TB
    subgraph Processes[" "]
        direction LR
        AUTH["<b>Auth Process</b>\n• Login\n• JWT\n• Reset"]
        TLM["<b>Ticket Lifecycle</b>\n<b>Management</b>\n• Create • Assign\n• Escalate\n• Resolve • Close"]
        CE["<b>Communication</b>\n<b>Engine</b>\n• Chat (WS)\n• Notifications\n• System Msgs"]
        KH["<b>Knowledge Hub</b>\n• Publish\n• Search\n• Archive"]
    end

    AUTH --> DS
    TLM --> DS
    CE --> DS
    KH --> DS

    subgraph DS["DATA STORE"]
        direction LR
        D1["Users"]
        D2["Tickets"]
        D3["Messages"]
        D4["Attachments"]
        D5["AuditLogs"]
        D6["Notifications"]
    end
```

### Level 2 — Ticket Lifecycle Data Flow

```mermaid
flowchart TB
    AI["Admin Input"] --> CT["Create Ticket"]
    CT --> TDB[(Ticket DB)]
    CT --> CCR["Create Client Record"] --> CDB[(Client DB)]
    CT --> CPR["Create Product Record"] --> PDB[(Product DB)]
    CT --> CAS["Create Assignment Session"] --> SDB[(Session DB)]
    CAS --> SN1["Send Notification"] --> NDB[(Notification DB)] --> WS1(("WebSocket"))
    CAS --> CA1["Create Audit Log"] --> ADB1[(AuditLog DB)]

    EI1["Employee Input"] --> SW["Start Work"]
    SW --> TDB2[(Ticket DB — time_in, status)]
    SW --> CA2["Create Audit Log"]

    EI2["Employee Input"] --> UT["Update Ticket"]
    UT --> TDB3[(Ticket DB — action, remarks)]
    UT --> CA3["Create Audit Log"]

    EI3["Employee Input"] --> UP["Upload Proof"]
    UP --> ATDB[(Attachment DB + File Storage)]

    EI4["Employee Input"] --> RC["Request Closure"]
    RC --> TDB4[(Ticket DB — status, time_out)]
    RC --> SN2["Notify Admin"]
    RC --> CA4["Create Audit Log"]

    ADI["Admin Input"] --> CLT["Close Ticket"]
    CLT --> TDB5[(Ticket DB — status → closed)]
    CLT --> ES["End Session"] --> SDB2[(Session DB)]
    CLT --> FR["Create Feedback Rating"] --> FRDB[(FeedbackRating DB)]
    CLT --> SN3["Notify Employee"]
    CLT --> CA5["Create Audit Log"]
```

---

*End of Section 9*
