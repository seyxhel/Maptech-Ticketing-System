# Sales Module User Manual

## 1. Role Objective
The Sales role is responsible for accurate ticket intake, client call verification, priority setup, and post-handoff resolution monitoring until ticket completion.

## 2. Module List (Sales)
1. Login
2. Dashboard
3. Create Ticket
4. Tickets
5. Clients
6. Products
7. Device/Equipment Categories
8. Types of Service (view/selection support during ticket creation)
9. Closing and Completed Ticket Views (monitoring)
10. Sales Resolution Monitoring Workflow

## 3. Login Module
![Sales Login](Sales%20login%20page.png)

Steps:
1. Enter registered email/username and password.
2. Click `Sign In`.
3. Confirm successful redirect to Sales dashboard.

## 4. Dashboard Module
![Sales Dashboard](Sales%20Dashboard.png)

Purpose:
- View overall ticket intake health.
- Monitor pending/escalated/resolved counts.
- Track recent ticket activity and basic trends.

Daily Checklist:
1. Check total pending tickets.
2. Review tickets with high and critical priority.
3. Open tickets requiring call verification completion.

## 5. Create Ticket Module (Core Sales Workflow)

### 5.1 Entry Point
Create ticket from dashboard quick action or ticket module action.

### 5.2 Step 1: Client Information
#### New Client Path
![Sales Create Ticket New Client](Sales%20Create%20ticket%20new%20client.png)

Flow Lines:
- Flow Line 1.1: Select `New Client`.
- Flow Line 1.2: Enter required client information.
- Flow Line 1.3: Add sales representative and optional additional contacts.

#### Existing Client Path
![Sales Create Ticket Existing Client](Sales%20Create%20Ticket%20existing%20client.png)
![Sales Existing Client Modal](Sales%20create%20ticket%20exist%20client%20modal.png)

Flow Lines:
- Flow Line 1.4: Select `Existing Client`.
- Flow Line 1.5: Search and select target client in modal.
- Flow Line 1.6: Verify pre-filled contact details before proceeding.

### 5.3 Step 2: Product Information
#### New Product Path
![Sales Create Ticket New Product](Sales%20create%20ticket%20new%20product.png)

Flow Lines:
- Flow Line 2.1: Choose `New Product`.
- Flow Line 2.2: Enter product name, project title, category, brand/model, serial, date purchased, and warranty.

#### Existing Product Path
![Sales Create Ticket Existing Product](Sales%20create%20ticket%20existing%20product.png)
![Sales Existing Product Modal](Sales%20create%20ticket%20exist%20product%20modal.png)

Flow Lines:
- Flow Line 2.3: Choose `Existing Product`.
- Flow Line 2.4: Open product selector modal and search by product/device/brand/model/serial.
- Flow Line 2.5: Select product and verify loaded fields.

### 5.4 Step 3: Additional Product Details
![Sales Additional Product Details](Sales%20create%20ticket%20addtional%20product%20details.png)

Flow Lines:
- Flow Line 3.1: Encode maptech and supplier issued details.
- Flow Line 3.2: Confirm invoice and receipt references are accurate.

### 5.5 Step 4: Type of Service
![Sales Type of Service](Sales%20create%20ticket%20types%20of%20services.png)

Flow Lines:
- Flow Line 4.1: Select service type.
- Flow Line 4.2: Select preferred support mode (remote/on-site/chat/call).
- Flow Line 4.3: Write detailed problem description.

### 5.6 Step 5: Review and Submit
![Sales Review and Submit](Sales%20create%20ticket%20review%20submit.png)

Flow Lines:
- Flow Line 5.1: Review all sections line-by-line.
- Flow Line 5.2: Verify client, product, and service data.
- Flow Line 5.3: Submit service ticket and call client.
- Flow Line 5.4: Confirm STF number generated.

### 5.7 Sales Handoff Process (Critical)
Flow Line H1: Complete call verification and ticket review.

Flow Line H2: Set proper priority (`Critical`, `High`, `Medium`, `Low`, `Unknown`).

Flow Line H3: Confirm ticket for supervisor assignment.

Flow Line H4: Monitor ticket in Sales views until closure.

## 6. Tickets Module
![Sales Tickets](Sales%20Tickets.png)

Purpose:
- View tickets created or visible to Sales scope.
- Search and filter by ticket ID, subject, or client.
- Monitor resolution progress after supervisor and technical handling.

Steps:
1. Use search/filter for quick lookup.
2. Open ticket details from action column.
3. Confirm status progression after supervisor/technical actions.
4. Track whether ticket is in `Open`, `In Progress`, `Escalated`, `Escalated External`, `For Observation`, `Pending Closure`, `Closed`, or `Unresolved`.
5. Ensure high-priority tickets are not stalled and follow up when progress is delayed.

### 6.1 Resolution Monitoring in Tickets Module
Resolution Flow Lines:
- Flow Line R1: Open ticket from Sales list after handoff.
- Flow Line R2: Validate ticket moved from intake state to operational state (`In Progress` or equivalent active handling state).
- Flow Line R3: Check if ticket transitions to `Pending Closure` after technical resolution.
- Flow Line R4: If ticket returns to escalation path (`Escalated` or `Escalated External`), document follow-up and coordinate with supervisor.
- Flow Line R5: If ticket is marked `Unresolved`, coordinate status clarification and reopen direction when applicable.
- Flow Line R6: Confirm final movement to `Closed` in ticket history.

## 7. Clients Module
![Sales Clients](Sales%20Clients.png)
![Sales Add Client Modal](Sales%20clients%20modal.png)

Purpose:
- Maintain accurate client master records.

Steps:
1. Click `Add Client`.
2. Fill required fields (client, contact, designation, mobile, department, full address, sales rep).
3. Save and verify in table list.
4. Use view/edit/delete actions as needed.

## 8. Products Module
![Sales Products](Sales%20Products.png)
![Sales Add Product Modal](Sales%20products%20modal.png)

Purpose:
- Maintain product/equipment records linked to clients and tickets.

Steps:
1. Click `Add Product`.
2. Choose client and category.
3. Encode product details and warranty state.
4. Save and verify catalog entry.

## 9. Device/Equipment Category Module
![Sales Device Equipment](Sales%20device%20equipment.png)
![Sales Device Equipment Modal](Sales%20Device%20equipment%20modal.png)

Purpose:
- Maintain category list used by product registration and ticket intake.

Steps:
1. Add category name and description.
2. Keep descriptions specific for accurate selection.
3. Activate/deactivate categories as needed.

## 10. Types of Service Module
![Sales Types of Service](Sales%20types%20of%20service.png)
![Sales Add Service Type Modal](Sales%20types%20of%20service%20modal.png)

Purpose:
- View service definitions and estimated resolution day references.

Usage in Sales Flow:
1. During ticket creation, choose the closest matching service type.
2. Ensure selected service type aligns with client issue.

## 11. Closing and Completed Tickets Views
![Sales Closing Tickets](Sales%20Closing%20tickets.png)
![Sales Completed Tickets](Sales%20Completed%20Tickets.png)

Purpose:
- Monitor tickets awaiting closure review and finalized tickets.

Closing View Steps:
1. Open `Closing Tickets` to see tickets in supervisor review phase.
2. Confirm key details (client, priority, assignee, and SLA context).
3. Flag overdue or blocked tickets for follow-up.

Completed View Steps:
1. Open `Completed Tickets` to verify final closure.
2. Confirm the resolved ticket appears in completed history.
3. Use completed records for client updates and reference.

Sales Resolution Flow Lines (Closing to Completed):
- Flow Line C1: Ticket enters `Closing Tickets` after technical closure request.
- Flow Line C2: Supervisor validates evidence and finalizes closure.
- Flow Line C3: Ticket moves to `Completed Tickets` once closed.
- Flow Line C4: Sales confirms final outcome and communicates completion to stakeholders as needed.

## 12. Data Accuracy Rules for Sales
1. Do not submit incomplete client identity fields.
2. Ensure product serial/model is accurate when available.
3. Use the correct type of service to avoid SLA misalignment.
4. Confirm priority after call verification before final handoff.

## 13. Sales Workflow Summary Lines
Flow Line S1: Login -> Dashboard check.

Flow Line S2: Create ticket -> client section.

Flow Line S3: Complete product and service sections.

Flow Line S4: Review and submit ticket.

Flow Line S5: Perform call verification and priority setup.

Flow Line S6: Confirm ticket for supervisor assignment.

Flow Line S7: Monitor ticket progression in Tickets module.

Flow Line S8: Track closure queue in Closing Tickets.

Flow Line S9: Confirm finalized result in Completed Tickets.

## 14. Sales Resolution Monitoring Workflow (Per Module)
Module Line M1 (Dashboard): Track pending and escalated counts daily.

Module Line M2 (Tickets): Verify movement from active handling to closure path.

Module Line M3 (Closing Tickets): Watch tickets waiting for supervisor final decision.

Module Line M4 (Completed Tickets): Confirm closure completion and archive-ready status.

Module Line M5 (Clients/Products): Ensure resolved record context remains accurate for future ticket intake.
