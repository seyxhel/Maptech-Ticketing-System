# 6. BUSINESS PROCESS MODEL

## 6.1 Business Workflow Overview

The Maptech Ticketing System supports a multi-stage ticket lifecycle with branching workflows for escalation, observation, and external referral. The primary workflow involves the following stages:

1. **Ticket Creation** — A supervisor creates a ticket with client and issue details.
2. **Assignment** — The supervisor assigns the ticket to an available technician.
3. **Work Execution** — The technician starts work, diagnoses, and takes action.
4. **Resolution or Escalation** — The technician either resolves the issue or escalates it.
5. **Closure** — The supervisor reviews the resolution and formally closes the ticket.

---

## 6.2 Current Process (As-Is)

Prior to the ticketing system, the support process operated as follows:

```
Client calls/emails          Supervisor receives request
      │                              │
      ▼                              ▼
  Paper STF Form        Manually logs in spreadsheet
  filled out                         │
      │                              ▼
      ▼                   Calls/messages technician
  Faxed or emailed                   │
  to office                          ▼
      │                   Technician visits client
      ▼                              │
  Filed in cabinet                   ▼
  (paper archive)        Technician calls back with update
                                     │
                                     ▼
                         Supervisor manually updates spreadsheet
                                     │
                                     ▼
                         Follow-up via phone/email
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

```
Client contacts Maptech ──► Supervisor logs into system
                                     │
                                     ▼
                            Creates ticket (auto STF#)
                            Enters client & product info
                                     │
                                     ▼
                            Assigns to technician
                            (system sends notification)
                                     │
                                     ▼
                    Technician receives real-time notification
                    Views ticket details in dashboard
                                     │
                                     ▼
                    Starts work (time_in recorded)
                    Communicates via live chat
                                     │
                            ┌────────┴────────┐
                            │                 │
                            ▼                 ▼
                     Resolves Issue      Escalates
                     Uploads proof       (Internal/External)
                            │                 │
                            ▼                 ▼
                     Requests closure    Re-assigned or
                     (time_out set)      sent to vendor
                            │                 │
                            ▼                 ▼
                     Supervisor reviews  Process repeats
                     Submits CSAT           │
                     Closes ticket          │
                            │                 │
                            ▼                 ▼
                     Knowledge Hub      Resolution captured
                     (publish proof)    when eventually closed
```

### To-Be Process Benefits

| Benefit | Description |
|---------|-------------|
| Automated STF generation | Unique ticket numbers auto-assigned (STF-MP-YYYYMMDDXXXXXX) |
| Real-time notifications | Instant alerts for assignments, status changes, escalations |
| Live chat | Supervisors and technicians communicate in real-time within each ticket |
| SLA tracking | Automatic estimated resolution days and progress percentage |
| Audit trail | Every action logged with actor, timestamp, IP address, and changes |
| Knowledge retention | Resolution proofs published for organizational learning |
| Digital signatures | Clients sign off on completed work digitally |

---

## 6.4 Process Diagrams

### 6.4.1 Ticket Lifecycle State Diagram

```
                           ┌──────────┐
                           │  OPEN    │ ◄── Ticket Created
                           └─────┬────┘
                                 │
                          Assigned & Work Started
                                 │
                           ┌─────▼─────────┐
                      ┌───►│ IN_PROGRESS    │◄───────────────────────┐
                      │    └──┬──┬──┬───────┘                        │
                      │       │  │  │                                │
                      │       │  │  └──── Escalate Internally ──►┌───┴───────┐
                      │       │  │                               │ ESCALATED │
                      │       │  │        Escalate Externally──►│ (Internal)│
                      │       │  │                               └───────────┘
                      │       │  │
                      │       │  └────── Escalate Externally ──►┌────────────────┐
                      │       │                                 │ ESCALATED      │
                      │       │                                 │ (External)     │
                      │       │                                 └────────────────┘
                      │       │
                      │       ├──── Submit for Observation ──►┌─────────────────┐
                      │       │                               │ FOR_OBSERVATION  │
                      │       │                               └────────┬────────┘
                      │       │                                        │
                      │       │                            Admin reviews│
                      │       │                                        ▼
                      │       │                          (Returns to IN_PROGRESS
                      │       │                           or proceeds to closure)
                      │       │
                      │       └──── Request Closure ──────►┌─────────────────┐
                      │                                    │ PENDING_CLOSURE  │
                      │                                    └────────┬────────┘
                      │                                             │
                      │                                   Admin reviews &
                      │                                   closes ticket
                      │                                             │
                      │                                    ┌────────▼────────┐
                      │                                    │    CLOSED       │
                      │                                    └─────────────────┘
                      │
                      │         ┌──────────────┐
                      └─────────│  UNRESOLVED  │ ◄── Admin marks unresolved
                                └──────────────┘     (can be re-opened)
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

```
Supervisor creates ticket
         │
         ▼
Selects technician (views workload)
         │
         ▼
System creates AssignmentSession
Sends notification to technician
         │
         ▼
Technician receives notification
         │
         ▼
Technician starts work (time_in set)
         │
    ┌────┴─────────────────┐
    │                      │
    ▼                      ▼
 Resolves            Needs escalation
    │                      │
    ▼                      ▼
Request closure      Pass or Escalate
    │                      │
    ▼                      ▼
Admin closes         New AssignmentSession
(old session ends)   (old session ends)
```

### 6.4.3 Escalation Workflow

```
┌─────────────────────────────────────────────┐
│            INTERNAL ESCALATION               │
│                                             │
│  Technician → Escalate (returns to admin)   │
│       OR                                     │
│  Technician → Pass (to another technician)  │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 1. Current session ends             │    │
│  │ 2. EscalationLog created            │    │
│  │ 3. System message in chat           │    │
│  │ 4. New assignment (if pass)         │    │
│  │ 5. Notification sent                │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│            EXTERNAL ESCALATION               │
│                                             │
│  Admin/Employee → Escalate External         │
│  (to distributor or principal)              │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 1. EscalationLog (type: external)   │    │
│  │ 2. Ticket status → escalated_ext    │    │
│  │ 3. External entity name recorded    │    │
│  │ 4. Escalation notes stored          │    │
│  │ 5. Timestamp captured               │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### 6.4.4 Resolution & Closure Flow

```
Technician completes work
         │
         ▼
Uploads resolution proof (attachments)
         │
         ▼
Updates action taken, remarks, job status
         │
         ▼
Captures client signature (digital)
         │
         ▼
Requests closure (status → pending_closure, time_out set)
         │
         ▼
Supervisor receives notification
         │
         ▼
Reviews resolution details & proof
         │
         ▼
Submits CSAT feedback (1-5 rating)
         │
         ▼
Closes ticket (status → closed)
         │
         ▼
[Optional] Publishes resolution proof to Knowledge Hub
```

---

*End of Section 6*
