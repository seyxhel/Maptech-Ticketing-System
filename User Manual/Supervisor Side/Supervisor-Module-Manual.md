# Supervisor Module User Manual

## 1. Role Objective
The Supervisor (Admin) role manages operational control from assignment through resolution and closure, including escalations, quality checks, and knowledge publication.

## 2. Module List (Supervisor)
1. Login
2. Dashboard
3. Tickets
4. Create Ticket
5. Escalation
6. Knowledge Hub
7. Call Logs
8. Audit Logs
9. Clients
10. Products
11. Device/Equipment Categories
12. Types of Service
13. Reports
14. Settings

## 3. Login Module
![Supervisor Login](Supervisor%20login%20page.png)

Steps:
1. Enter supervisor credentials.
2. Click `Sign In`.
3. Confirm redirect to Supervisor dashboard.

## 4. Dashboard Module
![Supervisor Dashboard](Supervisor%20Dashboard.png)
![Supervisor Dashboard Extended](Supervisor%20Dashboard2.png)

Purpose:
- Monitor overall ticket workload and status distribution.
- Track submitted tickets, escalations, and calendar/SLA cues.

Daily Supervisor Checklist:
1. Review unassigned and high-priority tickets.
2. Check pending closure queue.
3. Check escalated tickets requiring action.
4. Review calendar/SLA urgency items.

## 5. Tickets Module
![Supervisor All Tickets](Supervisor%20All%20tickets.png)
![Supervisor Pending Tickets](Supervisor%20Pending%20tickets.png)
![Supervisor Closing Tickets](Supervisor%20Closing%20tickets.png)
![Supervisor Completed Tickets](Supervisor%20Completed%20Tickets.png)

Purpose:
- Central ticket lifecycle control.

Key Actions:
1. Search/filter by STF number, client, status, priority.
2. Open ticket details for assignment, review, and closure decisions.
3. Track `Open`, `In Progress`, `Pending Closure`, `Escalated`, `Closed` states.
4. Resolve stuck tickets by reassignment, escalation handling, or closure decision.

### 5.1 Resolution Routing by Ticket State
State Line T1 (`Open`): Validate ticket quality and assign technician.

State Line T2 (`In Progress`): Monitor updates, SLA, and intervention needs.

State Line T3 (`Escalated`): Reassess scope and reassign to correct technical resource.

State Line T4 (`For Observation`): Track monitoring outcome and return to active or close when appropriate.

State Line T5 (`Pending Closure`): Perform final review and feedback before closing.

State Line T6 (`Closed`): Confirm closure quality and optionally publish to knowledge base.

## 6. Create Ticket Module (Supervisor Intake)
Purpose:
- Encode complete and valid ticket details before dispatch.

Visual Flow:
`Open Create Ticket -> Select Client Type -> Select Product Type -> Add Service + Problem -> Review -> Submit -> Ticket Open`

### Screens and Explanation
![Supervisor Create Ticket Existing Client](Supervisor%20Create%20Ticket%20existing%20client.png)
Explanation: Use this when the client already exists and supervisor needs to encode the issue quickly.

![Supervisor Existing Client Modal](Supervisor%20create%20ticket%20exist%20client%20modal.png)
Explanation: Search and select the correct existing client record to avoid duplicate entries.

![Supervisor Create Ticket New Client](Supervisor%20Create%20ticket%20new%20client.png)
Explanation: Use this when onboarding a first-time client during ticket intake.

![Supervisor Create Ticket Existing Product](Supervisor%20create%20ticket%20existing%20product.png)
Explanation: Use existing product path when the affected product is already registered.

![Supervisor Existing Product Modal](Supervisor%20create%20ticket%20exist%20product%20modal.png)
Explanation: Select the exact product/device to improve technical diagnosis accuracy.

![Supervisor Create Ticket New Product](Supervisor%20create%20ticket%20new%20product.png)
Explanation: Use this when the product is not yet in the catalog and must be encoded.

![Supervisor Additional Product Details](Supervisor%20create%20ticket%20addtional%20product%20details.png)
Explanation: Capture serial/reference details and additional technical notes needed for troubleshooting.

![Supervisor Type of Service](supervisor%20create%20ticket%20types%20of%20services.png)
Explanation: Set service type and support preference to align handling and SLA behavior.

![Supervisor Review and Submit](Supervisor%20create%20ticket%20review%20submit.png)
Explanation: Perform final validation before submission and STF generation.

Supervisor Intake Steps:
1. Open Create Ticket and select new or existing client path.
2. Complete client details or select client from lookup modal.
3. Select new or existing product path.
4. Complete product details and additional references.
5. Select type of service and support preference.
6. Encode complete problem statement.
7. Review all details and submit.

### 6.1 Pre-Assignment Verification Gate (STF Details -> Call Validation)
Purpose:
- Ensure client reachability, call verification, and correct priority before assignment.

Visual Flow:
`Ticket Open -> Open STF Details -> Check Client Availability => [Yes] Call and Confirm -> Set Priority -> Continue to Assign`

Decision Branch:
`Check Client Availability => [No] Log Failed Contact -> Set Callback Follow-up -> Retry Call -> Confirm -> Continue to Assign`

### Screens and Explanation
![Supervisor STF Details and Availability](Supervisor%20options%20Client%20availability.png)
Explanation: Supervisor reviews STF details and sets client call availability status before dispatch.

![Supervisor Call Validation](Supervisor%20calls.png)
Explanation: Supervisor selects who to call, confirms call status, and validates concern details with the client.

![Supervisor Continue to Assign](Supervisor%20continue%20assign.png)
Explanation: Supervisor finalizes verification and priority, then proceeds to assignment.

![Supervisor Call Logs](Supervisor%20Call%20logs.png)
Explanation: Call records are documented for audit trail, follow-up validation, and proof of contact attempts.

Pre-Assignment Verification Steps:
1. Open STF details from the created/selected ticket.
2. Review client and ticket details for accuracy.
3. Set client availability status.
4. Select the contact person to call.
5. If connected, confirm issue details and mark call as completed.
6. If not connected, log unsuccessful call and set callback follow-up.
7. Confirm call history appears in call log preview.
8. Set ticket priority (Low, Medium, High, Critical).
9. Continue to Assign after verification completion.

## 7. Assignment and Closure Workflow (Critical)
Purpose:
- Control assignment quality, reassignment decisions, and final closure approval.

Visual Flow:
`Continue to Assign -> Open Assign Technical -> Review Technician Workload -> Assign Ticket -> Monitor Progress -> Pending Closure Review -> Close Ticket`

Reassignment Branch:
`Monitor Progress => [Mismatch/Stall/Escalation] Reassign Technician -> Continue Active Resolution`

### Screens and Explanation
![Supervisor All Tickets](Supervisor%20All%20tickets.png)
Explanation: Main ticket queue where supervisor opens verified tickets for assignment action.

![Supervisor Pending Tickets](Supervisor%20Pending%20tickets.png)
Explanation: Pending queue for tickets requiring immediate assignment or routing decision.

![Supervisor Assigning Technical](Supervisor%20assigning%20technical.png)
Explanation: Assignment modal showing technician workload, active tickets, and progress before final assignment.

![Supervisor Reassigning](Supervisor%20Reassigning.png)
Explanation: Reassignment view for changing assigned technician when workload, skill fit, or escalation requires it.

![Supervisor Escalation Logs](Supervisor%20Escalation%20logs.png)
Explanation: Escalation trail used during reassessment and reassignment decisions.

![Supervisor Closing Tickets](Supervisor%20Closing%20tickets.png)
Explanation: Queue for closure requests awaiting supervisor review.

![Supervisor Completed Tickets](Supervisor%20Completed%20Tickets.png)
Explanation: Final queue used to confirm successful closure and record quality completion.

Assignment-to-Closure Steps:
1. Open verified ticket from All/Pending queue or Continue to Assign flow.
2. Recheck ticket details, call verification status, and priority.
3. Open Assign Technical modal.
4. Compare technician active load and current progress indicators.
5. Assign best-fit technician based on availability and capability.
6. Monitor ticket updates, SLA urgency, and work notes.
7. Reassign if assignment fit is poor, progress stalls, or escalation requires specialist handling.
8. Receive closure request with complete proof from technician.
9. Review proof, work notes, and issue-outcome alignment.
10. Submit technical feedback rating.
11. Close ticket and verify appearance in completed queue.

Escalation Decision Flow Lines:
- Flow Line E1: If technician escalates internally, supervisor receives escalated ticket.
- Flow Line E2: Supervisor reassesses scope and reassigns technician when needed.
- Flow Line E3: If external support is needed, escalation is tracked as external.
- Flow Line E4: Ticket re-enters active workflow until closure criteria are met.

### 7.1 Detailed Supervisor Resolution Procedure
Resolution Line R1: Open ticket in `Pending Closure` queue.

Resolution Line R2: Validate technical action notes and remarks for completeness.

Resolution Line R3: Review uploaded proof attachments for quality and relevance.

Resolution Line R4: Check ticket outcome against original issue description.

Resolution Line R5: Submit required technical staff feedback/rating.

Resolution Line R6: Close ticket and confirm status changed to `Closed`.

Resolution Line R7: Verify ticket appears in completed history.

Resolution Line R8: Publish reusable resolution evidence to Knowledge Hub when applicable.

## 8. Escalation Module
![Supervisor Escalated Tickets](Supervisor%20Escalated%20tickets.png)
![Supervisor Escalation Logs](Supervisor%20Escalation%20logs.png)

Purpose:
- Monitor reassignment logs and escalation history.

Steps:
1. Review reassignment records.
2. Review escalation history (internal/external tags).
3. Take action: reassign, monitor, or route externally.

Escalation-to-Resolution Lines:
- Flow Line ER1: Receive escalated ticket in escalation view.
- Flow Line ER2: Confirm escalation reason and context.
- Flow Line ER3: Assign best-fit technician or continue external tracking.
- Flow Line ER4: Monitor returned ticket until it reaches `Pending Closure`.
- Flow Line ER5: Complete final closure procedure when ticket is resolvable.

## 9. Knowledge Hub Module
![Supervisor Knowledge Hub Upload](Supervisor%20knowledge%20hub%20upload.png)
![Supervisor Knowledge Hub Publish](Supervisor%20knowledge%20hub%20publish.png)
![Supervisor Knowledge Hub Archive](Supervisor%20knowledge%20hub%20Archive.png)

Purpose:
- Convert resolved ticket proofs into reusable knowledge.

Publishing Steps:
1. Open uploaded attachments list.
2. Select valid proof file from resolved ticket.
3. Publish with title, summary, and tags.
4. Archive outdated entries when necessary.

## 10. Call Logs Module
![Supervisor Call Logs](Supervisor%20Call%20logs.png)

Purpose:
- Track client call records linked to support workflow.

Steps:
1. Filter or search call records.
2. Review caller, client, call start/end, and duration.
3. Use logs for follow-up validation and auditing.

## 11. Audit Logs Module
![Supervisor Audit Logs](Supervisor%20Audit%20logs.png)

Purpose:
- Track system activities within allowed supervisor visibility scope.

Steps:
1. Filter by action/entity/date range.
2. Review actor, timestamp, and details.
3. Export as needed.

## 12. Clients Module
![Supervisor Clients](Supervisor%20Clients.png)
![Supervisor Add Client Modal](Supervisor%20clients%20modal.png)

Purpose:
- Manage client records used in ticket intake.

## 13. Products Module
![Supervisor Products](Supervisor%20Products.png)
![Supervisor Add Product Modal](Supervisor%20products%20modal.png)

Purpose:
- Maintain product catalog for accurate ticket linkage.

## 14. Device/Equipment Category Module
![Supervisor Device Equipment](Supervisor%20device%20equipment.png)
![Supervisor Device Equipment Modal](Supervisor%20Device%20equipment%20modal.png)

Purpose:
- Maintain category taxonomy for devices and products.

## 15. Types of Service Module
![Supervisor Types of Service](Supervisor%20types%20of%20service.png)
![Supervisor Add Service Type Modal](Supervisor%20types%20of%20service%20modal.png)

Purpose:
- Define service options and estimated resolution days for SLA behavior.

## 16. Reports Module
![Supervisor Reports](Supervisor%20reports.png)
![Supervisor Reports Extended](Supervisor%20reports2.png)

Purpose:
- Analyze monthly volume, SLA trends, and ticket distribution.

Resolution KPIs to Review:
1. Resolved versus pending trend.
2. Escalation recovery rate.
3. Closure turnaround time.
4. SLA compliance performance.

## 17. Settings Module
![Supervisor Settings](Supervisor%20settings.png)

Purpose:
- Update profile and password, and check account-specific preferences.

## 18. Supervisor Quality Controls
1. Do not close tickets without sufficient proof and proper work notes.
2. Ensure feedback/rating is submitted before closure finalization.
3. Use escalation logs to avoid duplicate routing.
4. Publish only reusable and validated knowledge items.

## 19. Supervisor End-to-End Summary
Flow Line S1: Intake ticket (create directly or receive confirmed ticket).

Flow Line S2: Open STF details and verify client availability.

Flow Line S3: Perform/record call validation and set priority.

Flow Line S4: Continue to assign and select best-fit technician.

Flow Line S5: Monitor progress and SLA urgency.

Flow Line S6: Handle escalation or observation branches when needed.

Flow Line S7: Review closure request and submit feedback.

Flow Line S8: Close ticket and optionally publish knowledge proof.

## 20. Supervisor Resolving Ticket Workflow (Per Module)
Module Line M1 (Tickets): Route each ticket to the correct next action by state.

Module Line M2 (Escalation): Convert escalated tickets back into active resolution path.

Module Line M3 (Closing Tickets): Apply review checklist and finalize closure.

Module Line M4 (Completed Tickets): Validate closure completion and audit consistency.

Module Line M5 (Knowledge Hub): Publish reusable closure evidence for future resolutions.

## 21. Lifecycle Reference (Synced with Ticket Lifecycle Manual)
This section is synchronized with `Ticket-Lifecycle-Workflow.md` for supervisor decision consistency.

Lifecycle Line L0 (Pre-Assignment Gate): Verify client availability, call status, and priority before assignment.

Lifecycle Line L1 (`Open`): Validate ticket quality and assign the right technical resource.

Lifecycle Line L2 (`In Progress`): Monitor SLA and technical progress; intervene when stalled.

Lifecycle Line L3 (`Escalated`): Review escalation context and route back to active resolution.

Lifecycle Line L4 (`Pending Closure`): Execute closure review gate before final approval.

Lifecycle Line L5 (`Closed`): Validate completed history and publish reusable proof when appropriate.

Closure Gate CG1: Technical action notes and remarks are complete.

Closure Gate CG2: Proof attachments are valid and relevant.

Closure Gate CG3: Feedback/rating submission is completed prior to close.
