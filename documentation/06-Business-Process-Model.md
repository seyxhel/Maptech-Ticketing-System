# 6. BUSINESS PROCESS MODEL

## 6.1 Business Workflow Overview

The Maptech Ticketing System supports a multi-stage ticket lifecycle with branching workflows for escalation, observation, and external referral. The primary workflow involves the following stages:

1. **Ticket Intake & Creation** — A supervisor or sales user creates a ticket with client and issue details.
2. **Call Verification & Priority Setup** — Sales-created tickets go through a call-status step (call completion + priority review/confirmation).
3. **Supervisor Assignment** — The supervisor assigns a confirmed ticket to an available technician.
4. **Work Execution** — The technician starts work, diagnoses, and takes action.
5. **Resolution, Observation, or Escalation** — The technician may submit for observation, request closure, or escalate.
6. **Closure** — The supervisor reviews final details, submits feedback rating, and closes the ticket.

---

## 6.2 Current Process (As-Is)

Prior to the ticketing system, the support process operated as follows:

```mermaid
flowchart TB
    A["Client calls/emails"] --> B["Paper STF Form\nfilled out"]
    B --> C["Faxed or emailed\nto office"]
    C --> D["Filed in cabinet\n(paper archive)"]

    E["Supervisor receives request"] --> F["Manually logs in spreadsheet"]
    F --> G["Calls/messages technician"]
    G --> H["Technician visits client"]
    H --> I["Technician calls back\nwith update"]
    I --> J["Supervisor manually\nupdates spreadsheet"]
    J --> K["Follow-up via\nphone/email"]
```

### As-Is Process Challenges

| Challenge | Impact |
|-----------|--------|
| Paper-based STF forms | Prone to loss, damage, and illegibility |
| Spreadsheet tracking | No real-time updates, version control issues, no concurrent access |
| Phone/email coordination | Communication delays, no audit trail |
| Manual SLA tracking | Missed deadlines, no proactive alerts |
| No centralized knowledge base | Repeated troubleshooting of known issues |
| No audit trail | Inability to track who did what and when |

---

## 6.3 Proposed Process (To-Be)

With the Maptech Ticketing System, the process operates as follows:

```mermaid
flowchart TB
    A["Client contacts Maptech"] --> B["Supervisor logs into system"]
    B --> C["Creates ticket — auto STF#\nEnters client & product info"]
    C --> D["Assigns to technician\n(system sends notification)"]
    D --> E["Technician receives real-time notification\nViews ticket details in dashboard"]
    E --> F["Starts work — time_in recorded\nCommunicates via live chat"]
    F --> G{"Outcome?"}
    G -->|"Resolves"| H["Resolves Issue\nUploads proof"]
    G -->|"Escalates"| I["Escalates\n(Internal / External)"]
    H --> J["Requests closure\n(time_out set)"]
    I --> K["Re-assigned or\nsent to vendor"]
    J --> L["Supervisor reviews\nSubmits feedback rating\nCloses ticket"]
    K --> M["Process repeats\nuntil resolved"]
    L --> N["Knowledge Hub\n(publish proof)"]
    M --> O["Resolution captured\nwhen eventually closed"]
```

### To-Be Process Benefits

| Benefit | Description |
|---------|-------------|
| Automated STF generation | Unique ticket numbers auto-assigned (STF-MT-YYYYMMDDXXXXXX) |
| Real-time notifications | Instant alerts for assignments, status changes, escalations |
| Live chat | Supervisors and technicians communicate in real-time within each ticket |
| SLA tracking | Automatic estimated resolution days and progress percentage |
| Audit trail | Every action logged with actor, timestamp, IP address, and changes |
| Knowledge retention | Resolution proofs published for organizational learning |
| Digital signatures | Clients sign off on completed work digitally |

### 6.3.1 Current Production Workflow Notes (April 2026)

The live implementation includes an intake split between Sales and Supervisors:

1. Sales can create tickets and complete client call verification.
2. Sales sets ticket priority during the call workflow and confirms the ticket.
3. Confirmed tickets are routed to supervisor assignment.
4. Supervisors assign technicians and continue lifecycle oversight.
5. Technicians execute, escalate/pass if needed, then request closure.
6. Supervisors submit feedback rating before final closure.

---

## 6.4 Process Diagrams

### 6.4.1 Ticket Lifecycle State Diagram

```mermaid
stateDiagram-v2
    [*] --> open : Ticket Created

    open : OPEN
    in_progress : IN PROGRESS
    escalated : ESCALATED (Internal)
    escalated_ext : ESCALATED (External)
    for_observation : FOR OBSERVATION
    pending_closure : PENDING CLOSURE
    closed : CLOSED
    unresolved : UNRESOLVED

    open --> in_progress : Assigned & Work Started

    in_progress --> escalated : Escalate Internally
    in_progress --> escalated_ext : Escalate Externally
    in_progress --> for_observation : Submit for Observation
    in_progress --> pending_closure : Request Closure
    in_progress --> unresolved : Admin marks unresolved

    escalated --> in_progress : Re-assigned

    for_observation --> in_progress : Returns to In Progress
    for_observation --> closed : Admin closes after observation

    pending_closure --> closed : Admin reviews & closes

    unresolved --> in_progress : Re-opened
```

### Ticket Status Definitions

| Status | Code | Description |
|--------|------|-------------|
| Open | `open` | Ticket has been created but work has not yet started |
| In Progress | `in_progress` | Technician has started working on the ticket |
| Escalated (Internal) | `escalated` | Ticket escalated to another staff member internally |
| Escalated (External) | `escalated_external` | Ticket escalated to an external distributor or principal |
| Pending Closure | `pending_closure` | Technician has submitted resolution and requested closure |
| For Observation | `for_observation` | Ticket submitted for monitoring without immediate resolution |
| Closed | `closed` | Ticket has been formally closed by a supervisor |
| Unresolved | `unresolved` | Ticket marked as unresolvable |

### 6.4.2 Ticket Assignment Flow

```mermaid
flowchart TB
    A["Supervisor creates ticket"] --> B["Selects technician\n(views workload)"]
    B --> C["System creates AssignmentSession\nSends notification to technician"]
    C --> D["Technician receives notification"]
    D --> E["Technician starts work\n(time_in set)"]
    E --> F{"Outcome?"}
    F -->|"Resolves"| G["Request closure"]
    F -->|"Needs escalation"| H["Pass or Escalate"]
    G --> I["Admin closes\n(old session ends)"]
    H --> J["New AssignmentSession\n(old session ends)"]
```

Implementation note:
When a ticket is created by Sales, assignment is gated until call verification and priority confirmation are completed.

### 6.4.3 Escalation Workflow

```mermaid
flowchart TB
    subgraph internal["INTERNAL ESCALATION"]
        direction TB
        IA["Technician → Escalate (returns to admin)\nOR\nTechnician → Pass (to another technician)"]
        IB["1. Current session ends\n2. EscalationLog created\n3. System message in chat\n4. New assignment (if pass)\n5. Notification sent"]
        IA --> IB
    end

    subgraph external["EXTERNAL ESCALATION"]
        direction TB
        EA["Admin/Employee → Escalate External\n(to distributor or principal)"]
        EB["1. EscalationLog (type: external)\n2. Ticket status → escalated_ext\n3. External entity name recorded\n4. Escalation notes stored\n5. Timestamp captured"]
        EA --> EB
    end
```

### 6.4.4 Resolution & Closure Flow

```mermaid
flowchart TB
    A["Technician completes work"] --> B["Uploads resolution proof\n(attachments)"]
    B --> C["Updates action taken,\nremarks, job status"]
    C --> D["Captures client signature\n(digital)"]
    D --> E["Requests closure\n(status → pending_closure, time_out set)"]
    E --> F["Supervisor receives notification"]
    F --> G["Reviews resolution\ndetails & proof"]
    G --> H["Submits feedback rating\n(1-5)"]
    H --> I["Closes ticket\n(status → closed)"]
    I --> J["Optional: Publishes resolution\nproof to Knowledge Hub"]
```

---

*End of Section 6*
