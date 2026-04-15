# Ticket Lifecycle Workflow Manual

## Purpose
This manual explains the complete ticket lifecycle from creation to closure in a clear step-by-step format, aligned with the documented sales call-verification gate, supervisor assignment flow, and technical execution-to-closure process.

## How to Read This Manual
- `Visual Flow`: Quick path using arrow icons.
- `Screens and Explanation`: Image first, then direct explanation under the image.
- `Detailed Steps`: Line-by-line actions users must follow.

## Arrow Legend
- `->` next action
- `=>` decision branch
- `[Yes]` positive decision output
- `[No]` negative decision output

## Roles in This Workflow
- Sales: intake and verification for sales-created tickets
- Supervisor: assignment/reassignment, routing, escalation handling, and closure validation
- Technical Staff: diagnosis, execution, update, and proof submission

## Stage 0: Intake Readiness
Prepare the required information before ticket creation:
1. Client identity and contact details
2. Product/equipment details (existing or new)
3. Service type and support preference
4. Initial problem statement

Visual Flow:
`Prepare client details -> Prepare product details -> Prepare service details -> Ready for ticket creation`

## Stage 1: Ticket Creation (Sales or Supervisor)

Visual Flow:
`Open Create Ticket -> Select Client Type -> Select Product Type -> Add Service + Problem -> Review -> Submit -> STF Generated (Open)`

### Screens and Explanation
![Sales New Client Intake](Sales%20Side/Sales%20Create%20ticket%20new%20client.png)
Explanation: Use this screen when encoding a first-time client profile.

![Sales Existing Client Intake](Sales%20Side/Sales%20Create%20Ticket%20existing%20client.png)
Explanation: Use this when the client already exists in the system and only ticket details are needed.

![Sales Existing Client Selector](Sales%20Side/Sales%20create%20ticket%20exist%20client%20modal.png)
Explanation: Search and select the correct existing client record to avoid duplicate profiles.

![Sales Existing Product Intake](Sales%20Side/Sales%20create%20ticket%20existing%20product.png)
Explanation: Choose this if the product/equipment already exists in the catalog.

![Sales Existing Product Selector](Sales%20Side/Sales%20create%20ticket%20exist%20product%20modal.png)
Explanation: Select the exact product model or registered item linked to the client concern.

![Sales Additional Product Details](Sales%20Side/Sales%20create%20ticket%20addtional%20product%20details.png)
Explanation: Complete serial/reference and any extra technical fields to improve troubleshooting speed.

![Sales Service Type](Sales%20Side/Sales%20create%20ticket%20types%20of%20services.png)
Explanation: Pick the service category and support preference that match the issue type.

![Sales Review Submit](Sales%20Side/Sales%20create%20ticket%20review%20submit.png)
Explanation: Final review screen before creating the ticket and generating STF number.

![Supervisor Create Ticket Existing Client](Supervisor%20Side/Supervisor%20Create%20Ticket%20existing%20client.png)
Explanation: Supervisor uses this when creating a ticket for an existing client and validating details quickly.

![Supervisor Create Ticket New Client](Supervisor%20Side/Supervisor%20Create%20ticket%20new%20client.png)
Explanation: Supervisor uses this for new client onboarding during urgent or direct intake scenarios.

![Supervisor Existing Client Modal](Supervisor%20Side/Supervisor%20create%20ticket%20exist%20client%20modal.png)
Explanation: Supervisor client lookup modal for selecting verified client records.

![Supervisor Existing Product Modal](Supervisor%20Side/Supervisor%20create%20ticket%20exist%20product%20modal.png)
Explanation: Supervisor product lookup modal for selecting existing equipment/product details.

![Supervisor Review Submit](Supervisor%20Side/Supervisor%20create%20ticket%20review%20submit.png)
Explanation: Supervisor final confirmation screen before submitting a newly encoded ticket.

### Detailed Steps
1. Open `Create Ticket` and select `New Client` or `Existing Client`.
2. If `Existing Client`, search and select the client from the modal.
3. Enter or validate contact and organization details.
4. Select `New Product` or `Existing Product`.
5. If `Existing Product`, select the product from the modal.
6. Fill additional product/reference fields.
7. Select service type and support preference.
8. Enter complete problem description.
9. Review all details and submit.
10. System generates STF number and ticket status becomes `Open`.

## Stage 2: Sales Call Verification and Priority Setup

Visual Flow:
`Ticket Created (Sales) -> Perform Client Call Verification -> Review Ticket -> Set Priority -> Confirm Ticket -> Route to Supervisor Assignment`

### Screens and Explanation
![Sales Tickets View](Sales%20Side/Sales%20Tickets.png)
Explanation: Sales verification and review reference before routing ticket to supervisor assignment.

### Detailed Steps
11. Sales opens the newly created ticket from sales ticket views.
12. Sales performs client call verification and confirms issue context.
13. Sales records call workflow details for traceability.
14. Sales reviews ticket completeness and data accuracy.
15. Sales sets priority (`Critical`, `High`, `Medium`, `Low`, `Unknown`).
16. Sales confirms ticket for operational handling.
17. System marks ticket ready for supervisor assignment routing.
18. Supervisor receives confirmed ticket in assignment queue.
19. Ticket proceeds to supervisor assignment stage.

## Stage 3: Supervisor Assignment and Reassignment

Visual Flow:
`Open Ticket Queue -> Open Assign Technical Modal -> Review Technician Workload -> Assign Ticket -> Monitor Progress => [Issue in fit/progress] Reassign -> Continue Work`

State Routing Flow:
`Open -> In Progress -> Pending Closure -> Closed`

### Screens and Explanation
![Supervisor Tickets](Supervisor%20Side/Supervisor%20All%20tickets.png)
Explanation: Main list for opening incoming or self-created verified tickets and starting assignment action.

![Supervisor Assigning Technical](Supervisor%20Side/Supervisor%20assigning%20technical.png)
Explanation: Assignment modal where supervisor compares technician current working tickets, progress, and active load before assigning.

![Supervisor Reassigning](Supervisor%20Side/Supervisor%20Reassigning.png)
Explanation: Reassignment view used when workload, skill mismatch, or escalation requires changing the assigned technician.

![Supervisor Pending Queue](Supervisor%20Side/Supervisor%20Pending%20tickets.png)
Explanation: Queue used to process tickets that still need assignment or immediate routing action.

![Supervisor Escalation Logs](Supervisor%20Side/Supervisor%20Escalation%20logs.png)
Explanation: Used when reassignment is required due to escalation or capability mismatch.

![Supervisor Closing Queue](Supervisor%20Side/Supervisor%20Closing%20tickets.png)
Explanation: Queue for tickets already requesting closure and waiting for supervisor validation.

![Supervisor Completed Queue](Supervisor%20Side/Supervisor%20Completed%20Tickets.png)
Explanation: Final record where supervisor confirms successful closure and quality of completion.

### Detailed Steps
20. Open verified ticket from All/Pending queues.
21. Validate ticket details and priority before dispatch.
22. Open Assign Technical modal.
23. Review technician load using active ticket count, current ticket list, and progress indicators.
24. Assign the best-fit technician based on availability and capability.
25. Ticket becomes visible in technical assigned queue.
26. Monitor progress, SLA, and blockers.
27. Reassign when initial assignment is not suitable, ticket is stalled, or escalation requires different expertise.
28. Route ticket actions based on lifecycle state (`Open`, `In Progress`, `Escalated`, `Escalated External`, `For Observation`, `Pending Closure`, `Closed`, `Unresolved`).

## Stage 4: Technical Execution

Visual Flow:
`Assigned -> Open Ticket Details -> Start Work -> In Progress -> Fill Required Work Fields -> Choose Next Action`

Technical Decision Flow:
`Choose Next Action => [Resolved] Request Closure -> Confirm Request -> Pending Closure`

Observation Decision Flow:
`Choose Next Action => [Needs Monitoring] Submit for Observation -> Confirm Submit -> For Observation`

Escalation Decision Flow:
`Choose Next Action => [Cannot Resolve at Current Level] Escalate => [Internal] Add Notes/Reason -> Submit Escalation -> Escalated`

External Escalation Decision Flow:
`Choose Next Action => [Cannot Resolve at Current Level] Escalate => [External] Enter Distributor/Vendor Name + Notes/Reason -> Submit Escalation -> Escalated External`

### Screens and Explanation
![Technical Dashboard](Technical%20Side/Technical%20Dashboard.png)
Explanation: Technician dashboard for work visibility, priorities, and assignment awareness.

![Technical Assigned Tickets](Technical%20Side/Technical%20Assigned%20tickets.png)
Explanation: Assigned ticket worklist where technician opens and updates ticket progress.

![Technical Viewing Ticket (Assigned)](Technical%20Side/Technical%20viewing%20ticket.png)
Explanation: Assigned-state ticket details page where technician reviews context and starts execution.

![Technical Start Work Confirmation](Technical%20Side/Technical%20start%20work.png)
Explanation: Start Work confirmation modal that records the technician time-in and moves activity into active execution.

![Technical In Progress Ticket](Technical%20Side/Technical%20in%20progress%20ticket.png)
Explanation: In-progress work form where technician encodes action taken, remarks, attachments, and status of job.

![Technical In Progress Ticket (Extended)](Technical%20Side/Technical%20in%20progress%20ticket2.png)
Explanation: Extended in-progress area including product details and digital signature capture required for formal submission.

![Technical Required Fields Before Resolve](Technical%20Side/Technical%20need%20to%20fill%20in%20before%20resolve.png)
Explanation: Example of completed required inputs before triggering request-closure action.

![Technical Resolve Confirmation](Technical%20Side/Technical%20Resolve%20ticket.png)
Explanation: Request-closure confirmation modal shown before sending the ticket to supervisor closure review.

![Technical Submit for Observation](Technical%20Side/Technical%20for%20submit%20for%20observation.png)
Explanation: Observation confirmation modal used when issue behavior requires monitoring before final closure.

![Technical Escalate Modal (Internal)](Technical%20Side/Technical%20eslacating%20ticket%20modal%20internal.png)
Explanation: Internal escalation modal where technician routes ticket to supervisor/admin with required notes/reason.

![Technical Escalate Modal (External)](Technical%20Side/Technical%20escalate%20ticket%20external.png)
Explanation: External escalation modal where technician routes ticket to outside vendor/distributor and must provide distributor/vendor name plus notes/reason.

### Detailed Steps
29. Technician receives assignment.
30. Technician opens assigned ticket details and reviews full ticket context.
31. Technician clicks Start Work and confirms in Start Work modal.
32. System records time-in and ticket moves to active `In Progress` state.
33. Technician performs diagnosis and corrective action.
34. Technician completes `Action Taken` and `Remarks` fields.
35. Technician uploads required attachments (screenshot/picture and recording as applicable).
36. Technician selects `Status of Job` based on actual outcome (`Completed`, `Under Warranty`, `For Quotation`, `Pending`, `Chargeable`, `Under Contract`).
37. Technician completes digital signature section.
38. Technician chooses one of three paths: Request Closure, Submit for Observation, or Escalate.
39. If resolved, technician submits request closure and confirms in modal.
40. Ticket proceeds to supervisor review path (`Pending Closure`).

## Stage 5: Branching During Work (Escalation, Pass, and Observation Control)

Escalation Branch Flow:
`In Progress => [Cannot Resolve at Current Level] Open Escalate Modal => [Internal] Add Notes/Reason -> Submit Escalation -> Supervisor Reassess/Reassign`

External Escalation Branch:
`In Progress => [Needs Third-party Support] Open Escalate Modal => [External] Enter Distributor/Vendor Name + Notes/Reason -> Submit Escalation -> Supervisor Tracks External Resolution`

Pass Ticket Branch:
`In Progress => [Needs Technician Handoff] Pass Ticket -> Select Target Technician + Notes -> New Assignment Session -> Continue Work`

Observation Branch:
`In Progress => [Needs Monitoring] Submit for Observation -> Confirm Submit -> For Observation -> Monitor Result -> Back to In Progress or Move to Pending Closure`

### Screens and Explanation
![Technical Escalate Modal Internal](Technical%20Side/Technical%20eslacating%20ticket%20modal%20internal.png)
Explanation: Internal escalation action window with mandatory notes/reason before submit.

![Technical Escalate Modal External](Technical%20Side/Technical%20escalate%20ticket%20external.png)
Explanation: External escalation action window requiring distributor/vendor name and notes/reason before submit.

![Technical Submit for Observation Modal](Technical%20Side/Technical%20for%20submit%20for%20observation.png)
Explanation: Confirmation modal for moving ticket into observation state.

![Technical Escalation History](Technical%20Side/Technical%20Escalation%20History.png)
Explanation: Technician escalation evidence trail showing why escalation was raised.

![Supervisor Escalation Logs](Supervisor%20Side/Supervisor%20Escalation%20logs.png)
Explanation: Supervisor reassessment and reassignment reference for escalated tickets.

### Detailed Steps
41. If unresolved at current level, technician opens Escalate or Pass action.
42. For internal escalation, technician selects `Internal` and enters notes/reason.
43. For external escalation, technician selects `External`, enters distributor/vendor name, and adds notes/reason.
44. For technician handoff, technician uses Pass flow, selects target technician, and adds pass notes.
45. System submits escalation/pass and updates ticket path (`Escalated`, `Escalated External`, or new assignment session).
46. Supervisor validates escalation context and routes reassignment or external tracking.
47. Ticket returns to active execution path when reassigned or when external updates allow continued work.
48. If monitoring is required instead, technician submits ticket for observation.
49. Observation outcome routes ticket back to `In Progress` or forward to `Pending Closure`.

## Stage 6: Closure Request and Supervisor Review

Visual Flow:
`Pending Closure -> Review Notes and Proof -> Submit Feedback -> Close Ticket -> Verify in Completed`

### Screens and Explanation
![Supervisor Closing Tickets](Supervisor%20Side/Supervisor%20Closing%20tickets.png)
Explanation: Supervisor review queue for closure requests awaiting final validation.

![Supervisor Completed Tickets](Supervisor%20Side/Supervisor%20Completed%20Tickets.png)
Explanation: Final closure confirmation list and post-resolution history check.

### Detailed Steps
50. Ticket moves to `Pending Closure` after technician request.
51. Supervisor reviews proof and work notes for completeness and accuracy.
52. Supervisor confirms the outcome matches original issue scope.
53. Supervisor submits technical feedback/rating.
54. Supervisor closes ticket and confirms status `Closed`.
55. Supervisor verifies ticket appears in completed queue/history.

## Stage 7: Knowledge Capture (Optional but Recommended)

Visual Flow:
`Closed Ticket -> Open Attachment Repository -> Publish Reusable Proof -> Knowledge Available to Team`

### Screens and Explanation
![Supervisor Knowledge Hub Upload](Supervisor%20Side/Supervisor%20knowledge%20hub%20upload.png)
Explanation: Upload area where supervisor selects resolved-ticket evidence for publication.

![Supervisor Knowledge Hub Publish](Supervisor%20Side/Supervisor%20knowledge%20hub%20publish.png)
Explanation: Publication page for adding title, summary, and tags to reusable solutions.

### Detailed Steps
56. Open attachment repository from resolved tickets.
57. Select reusable and valid proof file.
58. Publish as knowledge content with clear tags and description.
59. Confirm published item is searchable by technical staff.

## Supervisor Resolution Gate (Mandatory)
1. Ticket is in `Pending Closure` before final close.
2. Technical action notes and remarks are complete.
3. Proof attachments are valid and relevant.
4. Feedback/rating is submitted.
5. Closure is verified in completed history.

## Ticket Lifecycle Control Matrix
1. Creation control: Sales/Supervisor
2. Verification and call control: Sales (sales-created ticket workflow)
3. Assignment and reassignment control: Supervisor
4. Execution control: Technical Staff
5. Escalation control: Technical Staff + Supervisor
6. Closure control: Supervisor
7. Governance visibility: Superadmin

## Mandatory Validation Checklist per Ticket
1. Client and service details are complete.
2. Sales call verification and priority confirmation are completed for sales-created tickets before supervisor assignment.
3. Priority is set before assignment routing.
4. Assignment or reassignment is performed by supervisor when required.
5. Work notes are updated before closure request.
6. Evidence files are attached before closure request.
7. Supervisor feedback/rating is submitted before final close.

## Quick State Path
`Open -> In Progress -> Pending Closure -> Closed`

Alternate Paths:
- `In Progress -> Escalated -> In Progress`
- `In Progress -> Escalated External -> In Progress/Pending Closure`
- `In Progress -> For Observation -> In Progress/Pending Closure`
- `In Progress -> Unresolved -> In Progress`
