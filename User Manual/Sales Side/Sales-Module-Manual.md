# Sales Module User Manual

## 1. Role Objective
The Sales role is responsible for accurate ticket intake, client call verification, and priority setup before ticket handoff to Supervisor.

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

Steps:
1. Use search/filter for quick lookup.
2. Open ticket details from action column.
3. Confirm status progression after supervisor/technical actions.

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
