# Maptech Ticketing System User Manual

## Document Purpose
This manual explains how to use the Maptech Ticketing System from login to final ticket closure, with detailed role-based procedures and module-by-module instructions.

This guide is built from the official system documentation and aligned with the current interface screenshots inside this `User Manual` folder.

## Audience and Role Scope
- Sales: ticket intake, client verification, priority setup, and catalog maintenance.
- Supervisor (Admin): assignment, escalation management, closure, reporting, and operations control.
- Superadmin: user and system administration, governance, and global analytics.
- Technical Staff (Employee): ticket execution, escalation, resolution proof submission, and knowledge consumption.

## Manual Structure
- [Sales Manual](Sales%20Side/Sales-Module-Manual.md)
- [Supervisor Manual](Supervisor%20Side/Supervisor-Module-Manual.md)
- [Superadmin Manual](SuperAdmin%20Side/SuperAdmin-Module-Manual.md)
- [Technical Staff Manual](Technical%20Side/Technical-Module-Manual.md)
- [Ticket Lifecycle Workflow (Detailed)](Ticket-Lifecycle-Workflow.md)

## System Workflow (Ticket Creation to Resolution)

### Lifecycle Overview
A service ticket follows a controlled lifecycle:
1. Intake and ticket creation
2. Client call verification and priority setup (Sales flow)
3. Supervisor assignment
4. Technical execution
5. Resolution request or escalation
6. Supervisor review and closure
7. Optional knowledge publication

### Ticket Status Reference
- `Open`: ticket created, work not started yet.
- `In Progress`: technician started execution.
- `Escalated`: internally escalated for reassignment.
- `Escalated External`: escalated to external vendor/distributor.
- `For Observation`: monitoring period before full closure.
- `Pending Closure`: technician submitted resolution for review.
- `Closed`: supervisor finalized ticket closure.
- `Unresolved`: marked not resolved in current cycle.

## End-to-End Workflow Lines

### Flow A: Sales-Initiated Ticket to Resolution
Flow Line 01: Sales logs in and creates ticket with client and issue details.

Flow Line 02: Sales completes call verification and sets ticket priority.

Flow Line 03: Sales confirms ticket and routes it for supervisor action.

Flow Line 04: Supervisor reviews ticket details and assigns technician.

Flow Line 05: Technician starts work and updates ticket fields while troubleshooting.

Flow Line 06: Technician uploads proof, fills action details, and requests closure.

Flow Line 07: Supervisor reviews evidence, submits staff rating, and closes ticket.

Flow Line 08: Supervisor may publish key resolution proof to Knowledge Hub.

### Flow B: Supervisor-Initiated Ticket to Resolution
Flow Line 01: Supervisor creates ticket directly with complete intake details.

Flow Line 02: Supervisor assigns technician immediately.

Flow Line 03: Technician starts work and performs diagnosis.

Flow Line 04: Technician either requests closure, submits for observation, or escalates.

Flow Line 05: If escalated, supervisor reassigns or tracks external handling.

Flow Line 06: On valid closure request, supervisor reviews and closes ticket.

## Decision Lines Inside Execution
Flow Line D1: If issue is resolved, technician requests closure (`Pending Closure`).

Flow Line D2: If issue needs monitoring, technician submits `For Observation`.

Flow Line D3: If issue exceeds scope, technician escalates internally (`Escalated`).

Flow Line D4: If vendor action is needed, admin/technician escalates externally (`Escalated External`).

Flow Line D5: Reassigned tickets return to `In Progress` until closure criteria are met.

## Mandatory Closure Checks
Before a ticket can be closed, verify:
1. Technician action details are completed.
2. Resolution proof attachments are uploaded.
3. Work status fields are updated correctly.
4. Supervisor feedback/rating is submitted.

## Naming and Tracking Conventions
- STF format: `STF-MT-YYYYMMDDXXXXXX`
- Priority levels: `Critical`, `High`, `Medium`, `Low`, `Unknown`
- Ticket timeline is visible in ticket views and dashboards.

## Quick Visual Index
### Sales Side
![Sales Dashboard](Sales%20Side/Sales%20Dashboard.png)

### Supervisor Side
![Supervisor Dashboard](Supervisor%20Side/Supervisor%20Dashboard.png)

### Superadmin Side
![Superadmin Dashboard](SuperAdmin%20Side/SuperAdmin%20dashboard.png)

### Technical Side
![Technical Dashboard](Technical%20Side/Technical%20Dashboard.png)

## Usage Notes
- Use role-specific manuals for detailed module procedures.
- Follow the workflow lines in sequence to avoid process errors.
- Always prioritize data accuracy in client, product, and service fields.
- Use escalation paths only when standard resolution is not possible.

## Supervisor Lifecycle Reference
This quick reference mirrors the detailed supervisor lifecycle in `Ticket-Lifecycle-Workflow.md`.

State Line SR1 (`Open`): Validate ticket completeness and assign technician.

State Line SR2 (`In Progress`): Monitor SLA, progress quality, and blockers.

State Line SR3 (`Escalated`): Validate escalation context and reassign appropriately.

State Line SR4 (`Pending Closure`): Review work notes, proof attachments, and outcome quality.

State Line SR5 (`Closed`): Confirm completed history entry and optional Knowledge Hub publication.

Closure Gate G1: Ensure supervisor feedback/rating is submitted before final close.

Closure Gate G2: Ensure closure quality is traceable through ticket history and completed queue.
