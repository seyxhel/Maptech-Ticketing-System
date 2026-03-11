# 11. USER INTERFACE DESIGN

## 11.1 UI Design Principles

The Maptech Ticketing System frontend follows these design principles:

| Principle | Implementation |
|-----------|---------------|
| **Role-Based Layouts** | Each user role (Superadmin, Admin, Employee, Client) has a dedicated layout with role-appropriate navigation and features |
| **Responsive Design** | Tailwind CSS utility classes ensure the interface adapts across desktop, tablet, and mobile viewports |
| **Dark/Light Theme** | User-selectable theme with persistence (ThemeContext + localStorage + Tailwind dark mode) |
| **Consistent Navigation** | Left sidebar navigation with icon + label for all primary sections; top header with notifications and profile |
| **Real-Time Feedback** | Toast notifications (Sonner), typing indicators, live message delivery, and badge counts for unread items |
| **Progressive Disclosure** | Complex forms use collapsible sections and multi-step flows to reduce cognitive load |
| **Data Visualization** | Recharts-powered dashboard charts for ticket statistics and trends |
| **Accessibility** | Semantic HTML elements, proper heading hierarchy, keyboard-navigable components |

---

## 11.2 Navigation Structure

### Superadmin Navigation

```
📊 Dashboard
👥 Users
📋 Audit Logs
📈 Reports
⚙️ Settings
```

### Admin (Supervisor) Navigation

```
📊 Dashboard
🎫 Tickets
➕ Create Ticket
📞 Call Logs
📚 Knowledge Hub
   ├── Uploaded
   ├── Published
   └── Archived
🔧 Types of Service
📦 Products
🖥️ Device/Equipment
👤 Clients
📋 Audit Logs
📈 Reports
⚙️ Settings
```

### Employee (Technician) Navigation

```
📊 Dashboard
🎫 My Tickets
📚 Knowledge Hub
⚙️ Settings
```

### Client Navigation (Planned)

```
📊 Dashboard
🎫 My Tickets
➕ Create Ticket
⚙️ Settings
```

### Global Header Components

```
┌────────────────────────────────────────────────────────────────────┐
│  [Logo]   Maptech Ticketing System                🔔(3)  [Avatar ▼]│
│                                                   Bell   Profile   │
│                                                   count  Dropdown  │
└────────────────────────────────────────────────────────────────────┘
```

- **Notification Bell** — Shows unread count badge; opens notification panel
- **Profile Dropdown** — Shows user name, role; links to Settings and Logout

---

## 11.3 Page Layouts

### Superadmin Pages

| Screen | Description |
|--------|-------------|
| **Dashboard** | Overview with system-wide statistics, user activity summary, and ticket volume charts |
| **Users** | Table of all user accounts with columns: Name, Email, Role, Status, Last Login. Actions: Create, Edit, Toggle Active, Reset Password |
| **Audit Logs** | Searchable/filterable table of system actions. Filters: entity type, action type, date range, actor. Export to CSV button |
| **Reports** | Analytics dashboards with charts for ticket trends, resolution times, and team performance |
| **Settings** | System configuration: Retention policies, announcements management, profile settings |

### Admin (Supervisor) Pages

| Screen | Description |
|--------|-------------|
| **Dashboard** | Ticket statistics by status/priority, active ticket count, recent activity feed, charts |
| **Tickets** | Table of all tickets with filters (status, priority, date range). Columns: STF#, Client, Status, Priority, Assigned To, Created At |
| **Ticket Details** | Full ticket view with: client info, product info, problem description, status timeline, action taken, attachments, chat panel, assignment history, linked tickets |
| **Create Ticket** | Multi-section form: Client Information (new/existing), Product/Equipment details, Service Type, Problem Description, Priority, Employee Assignment |
| **Escalation** | List of escalated tickets with escalation history and re-assignment options |
| **Call Logs** | Table of support calls. Create: client name, phone, ticket link, notes. End call action with auto-duration |
| **Knowledge Hub** | Three-tab view: Uploaded (resolution proofs), Published (articles), Archived. Publish, unpublish, archive actions |
| **Types of Service** | CRUD table for service types with name, description, SLA days, active status |
| **Products** | CRUD table for products with category, brand, model, serial, warranty filters |
| **Device/Equipment** | Equipment registry with device details and category assignment |
| **Clients** | CRUD table for client organizations with contact details. View client ticket history |
| **Audit Logs** | Same as superadmin but scoped to employee-level actions |
| **Reports** | Ticket analytics, resolution time trends, technician performance metrics |
| **Settings** | Profile editing (name, phone, avatar), password change, announcement viewing |

### Employee (Technician) Pages

| Screen | Description |
|--------|-------------|
| **Dashboard** | Assigned ticket summary, active ticket count, recent notifications, announcements |
| **My Tickets** | List of all tickets assigned to the technician with status filters |
| **Ticket Details** | Ticket view with: problem details, action fields (action_taken, remarks, job_status), product detail form, attachment upload, resolution proof upload, digital signature capture, chat panel with supervisor |
| **Knowledge Hub** | Read-only searchable list of published knowledge articles |
| **Escalation** | View escalation history for own tickets |
| **Settings** | Profile editing, password change |

### Client Pages (Planned)

| Screen | Description |
|--------|-------------|
| **Dashboard** | Summary of submitted tickets and their statuses |
| **My Tickets** | List of tickets created by the client |
| **Create Ticket** | Simple ticket submission form |
| **Ticket Details** | View ticket status, updates, and communication |
| **Settings** | Profile management |

### Authentication Pages

| Screen | Description |
|--------|-------------|
| **Login** | Username/email + password form with "Remember Me" option |
| **Forgot Password** | Email input for password reset link; optional recovery key input |
| **Signup** | New account registration *(planned)* |
| **Privacy Policy** | Static privacy policy page |
| **Terms of Service** | Static terms of service page |
| **Not Found (404)** | Friendly 404 page with navigation back to dashboard |

---

## 11.4 Wireframes

### Ticket Detail View Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Back to Tickets          STF-MP-20260311000001        [Actions ▼] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────┐  ┌──────────────────────────────┐  │
│  │ TICKET INFORMATION          │  │ CHAT                         │  │
│  │                             │  │                              │  │
│  │ Status: [In Progress]       │  │ ┌──────────────────────────┐ │  │
│  │ Priority: [High]            │  │ │ Admin: Please check the  │ │  │
│  │ Service: Software Install   │  │ │ printer status            │ │  │
│  │ SLA: 3 days (75% ████░░)   │  │ │                   10:30  │ │  │
│  │                             │  │ ├──────────────────────────┤ │  │
│  │ CLIENT INFORMATION          │  │ │ Tech: Printer is offline │ │  │
│  │ Name: ABC Corp              │  │ │ Need replacement parts   │ │  │
│  │ Contact: John Smith         │  │ │                   10:35  │ │  │
│  │ Phone: +639171234567        │  │ └──────────────────────────┘ │  │
│  │                             │  │                              │  │
│  │ PRODUCT DETAILS             │  │ [Type a message...] [Send]   │  │
│  │ Device: HP LaserJet Pro     │  │                              │  │
│  │ Serial: SN123456            │  └──────────────────────────────┘  │
│  │ Warranty: ✅ Active          │                                    │
│  │                             │  ┌──────────────────────────────┐  │
│  │ PROBLEM DESCRIPTION         │  │ ATTACHMENTS                  │  │
│  │ Printer not responding to   │  │                              │  │
│  │ print commands...           │  │ 📎 error_photo.jpg          │  │
│  │                             │  │ 📎 diagnostic_report.pdf    │  │
│  │ ACTION TAKEN                │  │                              │  │
│  │ [textarea]                  │  │ [Upload File]                │  │
│  │                             │  └──────────────────────────────┘  │
│  │ REMARKS                     │                                    │
│  │ [textarea]                  │  ┌──────────────────────────────┐  │
│  │                             │  │ ASSIGNMENT HISTORY           │  │
│  │ JOB STATUS: [Completed ▼]  │  │                              │  │
│  │                             │  │ Tech A: Mar 10 - Mar 11     │  │
│  │ [Submit for Observation]    │  │ Tech B: Mar 11 - Active     │  │
│  │ [Request Closure]           │  └──────────────────────────────┘  │
│  └─────────────────────────────┘                                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Dashboard Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                          DASHBOARD                                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  OPEN    │ │IN PROGRESS│ │ ESCALATED│ │ PENDING  │ │  CLOSED  │  │
│  │   12     │ │    8      │ │    3     │ │    5     │ │   47     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                      │
│  ┌────────────────────────────┐  ┌────────────────────────────────┐  │
│  │ Tickets by Status          │  │ Tickets by Priority            │  │
│  │                            │  │                                │  │
│  │    [Pie Chart]             │  │    [Bar Chart]                 │  │
│  │                            │  │                                │  │
│  └────────────────────────────┘  └────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Recent Activity                                                │  │
│  │                                                                │  │
│  │ • Ticket STF-MP-20260311000001 assigned to Tech A    2 min ago │  │
│  │ • New ticket created for ABC Corp                     5 min ago │  │
│  │ • Ticket STF-MP-20260310000003 closed               15 min ago │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 11.5 UI Accessibility Considerations

| Aspect | Implementation |
|--------|---------------|
| **Semantic HTML** | Proper use of `<nav>`, `<main>`, `<article>`, `<section>`, headings hierarchy |
| **Keyboard Navigation** | All interactive elements are keyboard accessible; focus management for modals |
| **Color Contrast** | Tailwind color palette ensures WCAG AA contrast ratios in both light and dark modes |
| **Screen Reader Support** | Descriptive labels on form inputs; aria attributes on interactive components |
| **Responsive Layout** | Content reflows for different screen sizes; no horizontal scrolling at standard breakpoints |
| **Loading States** | Visual indicators (spinners, skeleton loaders) communicate pending operations |
| **Error States** | Clear, descriptive error messages displayed inline with form fields |
| **Focus Indicators** | Visible focus outlines on interactive elements for keyboard users |

---

*End of Section 11*
