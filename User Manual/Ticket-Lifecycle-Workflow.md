# Ticket Lifecycle Workflow Manual

## Purpose
This document gives a single, detailed, line-by-line flow of the full ticketing lifecycle from creation up to resolution and closure.

## Roles in This Workflow
- Sales: intake and verification
- Supervisor: assignment, oversight, closure
- Technical Staff: execution and resolution

## Stage 0: Intake Readiness
Before creating a ticket, prepare:
1. Client identity and contact details
2. Product/equipment details (existing or new)
3. Service type and support preference
4. Initial problem statement

## Stage 1: Ticket Creation (Sales or Supervisor)

### Screen References
![Sales New Client Intake](Sales%20Side/Sales%20Create%20ticket%20new%20client.png)
![Sales Existing Client Intake](Sales%20Side/Sales%20Create%20Ticket%20existing%20client.png)
![Sales Existing Client Selector](Sales%20Side/Sales%20create%20ticket%20exist%20client%20modal.png)
![Sales Existing Product Intake](Sales%20Side/Sales%20create%20ticket%20existing%20product.png)
![Sales Existing Product Selector](Sales%20Side/Sales%20create%20ticket%20exist%20product%20modal.png)
![Sales Additional Product Details](Sales%20Side/Sales%20create%20ticket%20addtional%20product%20details.png)
![Sales Service Type](Sales%20Side/Sales%20create%20ticket%20types%20of%20services.png)
![Sales Review Submit](Sales%20Side/Sales%20create%20ticket%20review%20submit.png)

### Flow Lines
Flow Line 1: User opens `Create Ticket` and chooses `New Client` or `Existing Client`.

Flow Line 2: If `Existing Client`, user searches and selects client from modal list.

Flow Line 3: User enters/validates contact and organization details.

Flow Line 4: User chooses `New Product` or `Existing Product`.

Flow Line 5: If `Existing Product`, user selects catalog item from product modal.

Flow Line 6: User completes additional product and reference fields.

Flow Line 7: User selects service type and preferred support type.

Flow Line 8: User encodes detailed problem description.

Flow Line 9: User reviews summary and submits ticket.

Flow Line 10: System generates STF number and stores ticket as `Open`.

## Stage 2: Verification and Priority (Sales Flow)
### Screen References
![Sales Tickets View](Sales%20Side/Sales%20Tickets.png)

### Flow Lines
Flow Line 11: Sales performs client call verification.

Flow Line 12: Sales sets ticket priority according to impact/urgency.

Flow Line 13: Sales confirms ticket for supervisor assignment.

## Stage 3: Supervisor Assignment
### Screen References
![Supervisor Tickets](Supervisor%20Side/Supervisor%20All%20tickets.png)
![Supervisor Pending Queue](Supervisor%20Side/Supervisor%20Pending%20tickets.png)

### Flow Lines
Flow Line 14: Supervisor opens incoming ticket from queue.

Flow Line 15: Supervisor validates service details and priority.

Flow Line 16: Supervisor assigns technician based on workload and suitability.

Flow Line 17: Assigned ticket becomes available in technical queue.

## Stage 4: Technical Execution
### Screen References
![Technical Dashboard](Technical%20Side/Technical%20Dashboard.png)
![Technical Assigned Tickets](Technical%20Side/Technical%20Assigned%20tickets.png)

### Flow Lines
Flow Line 18: Technician receives assignment notification.

Flow Line 19: Technician opens ticket and starts work (`In Progress`).

Flow Line 20: Technician performs diagnosis and corrective actions.

Flow Line 21: Technician updates work notes and supporting details.

Flow Line 22: Technician uploads evidence/proof files.

## Stage 5: Branching Decisions During Work
### Internal Escalation Branch
![Technical Escalation History](Technical%20Side/Technical%20Escalation%20History.png)
![Supervisor Escalation Logs](Supervisor%20Side/Supervisor%20Escalation%20logs.png)

Flow Line 23: If unresolved at current level, technician escalates internally.

Flow Line 24: Supervisor receives escalation and reassigns/redirects work.

Flow Line 25: Ticket returns to active execution path.

### Observation Branch
Flow Line 26: If behavior needs monitoring, ticket can enter `For Observation`.

Flow Line 27: Ticket returns to active path or closure decision based on findings.

### External Escalation Branch
Flow Line 28: If third-party intervention is needed, ticket is escalated externally.

Flow Line 29: Supervisor tracks external updates until closure readiness.

## Stage 6: Closure Request and Supervisor Review
### Screen References
![Supervisor Closing Tickets](Supervisor%20Side/Supervisor%20Closing%20tickets.png)
![Supervisor Completed Tickets](Supervisor%20Side/Supervisor%20Completed%20Tickets.png)

### Flow Lines
Flow Line 30: Technician submits closure request with complete evidence.

Flow Line 31: Ticket moves to `Pending Closure`.

Flow Line 32: Supervisor reviews proof and work notes.

Flow Line 33: Supervisor submits technical feedback/rating.

Flow Line 34: Supervisor closes ticket -> status `Closed`.

## Stage 7: Knowledge Capture (Optional but Recommended)
### Screen References
![Supervisor Knowledge Hub Upload](Supervisor%20Side/Supervisor%20knowledge%20hub%20upload.png)
![Supervisor Knowledge Hub Publish](Supervisor%20Side/Supervisor%20knowledge%20hub%20publish.png)

### Flow Lines
Flow Line 35: Supervisor opens attachment repository for resolved tickets.

Flow Line 36: Supervisor publishes reusable proof as knowledge content.

Flow Line 37: Published article becomes searchable by technical staff.

## Ticket Lifecycle Control Matrix
1. Creation control: Sales/Supervisor
2. Assignment control: Supervisor
3. Execution control: Technical Staff
4. Escalation control: Technical Staff + Supervisor
5. Closure control: Supervisor
6. Governance visibility: Superadmin

## Mandatory Validation Checklist per Ticket
1. Client and service details are complete.
2. Priority is set correctly before operational routing.
3. Assignment is performed by supervisor.
4. Work notes are updated before closure request.
5. Evidence files are attached before closure request.
6. Supervisor rating is provided before final close.

## Quick State Path
`Open -> In Progress -> Pending Closure -> Closed`

Alternate paths:
- `In Progress -> Escalated -> In Progress`
- `In Progress -> Escalated External -> In Progress/Closed`
- `In Progress -> For Observation -> In Progress/Closed`
