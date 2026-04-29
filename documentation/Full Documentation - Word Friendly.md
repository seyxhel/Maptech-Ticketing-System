# Maptech Ticketing System - Full Documentation

> Conversion-friendly version for Word/PDF export. Diagrams are replaced with text placeholders and tables are flattened into bullet lists.

> Consolidated markdown preview file generated from Sections 01-21.

---


<!-- Source: 01-Document-Control.md -->

# 1. DOCUMENT CONTROL

## 1.1 Document Information

- **Document Title**: Maptech Information Solutions Inc. — Ticketing System: Enterprise System Documentation
- **System Name**: Maptech Ticketing System
- **Version**: 1.3
- **Date Created**: March 11, 2026
- **Last Updated**: April 28, 2026
- **Prepared By**: Cuadra, Gerard R. — FullStack
- **Prepared By**: Pelagio, Sealtiel Joseph B. — FullStack
- **Prepared By**: Vebayo, Rivo M. — FullStack
- **Prepared By**: Quieta, Kianshane B. — Quality Assurance
- **Prepared By**: Sulaiman, Carmela M. — Quality Assurance
- **Reviewed By**: [To be filled]
- **Approved By**: [To be filled]

---

## 1.2 Revision History

- **1.0**: Date: March 11, 2026; Author: Cuadra, G., Pelagio, S., Quieta, K., Sulaiman, C., Vebayo, R.; Changes Made: Initial comprehensive documentation release covering all system modules, architecture, data models, API design, security architecture, and deployment specifications.
- **1.1**: Date: March 31, 2026; Author: System Update; Changes Made: Added **Sales** role to the RBAC model. Sales users have admin-level access for ticket management and catalog operations but are restricted from supervisor-specific actions (ticket closure, assignment, user management). Updated all role-related sections across documentation.
- **1.2**: Date: April 15, 2026; Author: System Update; Changes Made: Updated documentation to match current implementation: sales-led call/priority workflow, supervisor assignment gating, current role routes and modules, updated API/custom action endpoints, and revised permission matrices in overview and appendices.
- **1.3**: Date: April 28, 2026; Author: System Update; Changes Made: Finalized user manual deliverables: all role-based module manuals (Sales, SuperAdmin, Supervisor, Technical) and Ticket Lifecycle Workflow standardized under shared Maptech header/footer template. Filenames normalized to canonical format. Ready for distribution.

---

## 1.3 Distribution List

- **Cuadra, Gerard R.**: Role: FullStack Developer; Copy Type: Intern
- **Pelagio, Sealtiel Joseph B.**: Role: FullStack Developer; Copy Type: Intern
- **Quieta, Kianshane B.**: Role: Quality Assurance; Copy Type: Intern
- **Sulaiman, Carmela M.**: Role: Quality Assurance; Copy Type: Intern
- **Vebayo, Rivo M.**: Role: FullStack Developer; Copy Type: Intern
---

## 1.4 Document Conventions

- **Bold**: Key terms, field names, or emphasis
- **Code**: Code snippets, filenames, commands, API endpoints
- **Italic**: Placeholder values to be filled in
- **> Blockquote**: Important notes or warnings
- **Tables**: Structured data references

---

*End of Section 1*


---


<!-- Source: 02-Executive-Summary.md -->

# 2. EXECUTIVE SUMMARY

## 2.1 System Overview

The **Maptech Ticketing System** is a comprehensive, web-based IT service management platform developed by Maptech Information Solutions Inc. It serves as the organization's centralized hub for managing technical support requests, tracking service delivery, and ensuring timely resolution of client issues.

The system provides an end-to-end workflow for the complete lifecycle of a support ticket — from creation and assignment through escalation, resolution, and closure — with built-in real-time communication, SLA tracking, knowledge management, and audit capabilities.

Built on a modern technology stack with a Django REST Framework backend and React TypeScript frontend, the system supports real-time WebSocket communication for live chat and notifications, role-based access control for multiple user tiers, and a responsive web interface accessible from any modern browser.

---

## 2.2 Business Value

The Maptech Ticketing System delivers measurable business value across several dimensions:

- **Operational Efficiency:** Replaces manual ticket tracking (spreadsheets, emails, paper-based STF forms) with an automated digital workflow, reducing administrative overhead and eliminating lost or duplicate tickets.

- **Service Level Compliance:** Automated SLA tracking with estimated resolution timelines per service type ensures that support commitments are met and deviations are flagged early.

- **Accountability & Transparency:** Every action — from ticket creation to status changes, escalations, and resolutions — is captured in an immutable audit log, providing full traceability.

- **Real-Time Collaboration:** WebSocket-powered live chat between supervisors and technicians eliminates communication delays, enabling faster diagnosis and resolution.

- **Knowledge Retention:** A built-in Knowledge Hub captures resolution proofs and publishes them as reusable articles, preventing knowledge loss when staff changes.

- **Technical Staff Feedback Tracking:** Integrated 1-5 feedback ratings support structured performance review before ticket closure.

- **Data-Driven Decisions:** Dashboard analytics, reporting, and export capabilities provide management with actionable insights into team performance, ticket volumes, and service trends.

---

## 2.3 Key Capabilities

- **Ticket Lifecycle Management**: Create, assign, track, escalate, resolve, and close support tickets with full status workflow
- **Role-Based Access Control**: Four user tiers (Superadmin, Admin/Supervisor, Sales, Employee/Technician) with granular permissions
- **Real-Time Chat**: WebSocket-based live messaging between admins and assigned technicians per ticket
- **Real-Time Notifications**: Instant push notifications for ticket assignments, status changes, escalations, and messages
- **SLA Tracking**: Automated estimated resolution days based on service type, with progress percentage calculation
- **Internal & External Escalation**: Support for escalating tickets to other staff members or to external distributors/principals
- **Knowledge Hub**: Publish and manage resolution proof documents as searchable knowledge base articles
- **Client & Product Records**: Comprehensive client database and product/equipment registry linked to tickets
- **Call Log Management**: Track inbound/outbound support calls with duration tracking and notes
- **Feedback Rating**: Post-resolution technical staff feedback (1-5) submitted before ticket closure
- **Audit Logging**: Complete action audit trail with actor, timestamp, IP address, and change details
- **User Management**: Superadmin-controlled user creation, role assignment, activation/deactivation, and password management
- **Announcements**: System-wide or role-targeted announcements with scheduling and expiry
- **Data Retention Policies**: Configurable retention periods for audit and call logs
- **PDF Generation & Export**: Generate STF (Service Ticket Form) documents and export data to Excel
- **Digital Signatures**: Capture client signatures on resolved tickets
- **Dark Mode**: User-selectable dark/light theme for the web interface

---

## 2.4 Intended Audience

This documentation is intended for the following audiences:

- **Developers**: Interest Areas: System architecture, API design, data models, module design, code structure
- **System Administrators**: Interest Areas: Deployment, operations, configuration, backup/recovery, monitoring
- **Business Managers**: Interest Areas: Business process models, functional requirements, KPIs, reporting
- **End Users**: Interest Areas: User interface design, navigation, feature descriptions (see Appendix C — User Manuals)
- **IT Auditors**: Interest Areas: Security architecture, audit logging, access control, data protection, compliance
- **Quality Assurance**: Interest Areas: Testing strategy, test cases, non-functional requirements, acceptance criteria
- **Project Stakeholders**: Interest Areas: Executive summary, risk management, future enhancements

---

*End of Section 2*


---


<!-- Source: 03-Introduction.md -->

# 3. INTRODUCTION

## 3.1 Background

**Maptech Information Solutions Inc.** is an information technology solutions provider that delivers technical support services, software solutions, and IT equipment management to a diverse portfolio of clients. The organization's technical support operations involve receiving, diagnosing, and resolving various IT-related issues reported by clients — ranging from hardware malfunctions and software problems to network configuration requests and warranty-related service.

As the client base and support volume grew, the need for a purpose-built ticketing system became critical. Previously, support tracking relied on manual methods such as paper-based Service Ticket Forms (STFs), email threads, and spreadsheet logs. These methods, while functional at a small scale, became increasingly inadequate as the volume of support requests increased and the organization expanded its service offerings.

The **Maptech Ticketing System** was conceived to address these operational needs — providing a digital, centralized, and real-time platform for managing the entire support lifecycle.

---

## 3.2 Problem Statement

Prior to the implementation of this system, Maptech Information Solutions Inc. faced the following challenges:

1. **Manual Ticket Tracking:** Support requests were tracked using paper-based STF forms and spreadsheets, leading to data entry errors, lost tickets, and difficulty in searching or reporting on historical data.

2. **Communication Delays:** Coordination between supervisors (admins) and field technicians (employees) relied on phone calls, emails, and messaging apps, causing delays in information transfer and lack of audit trail for support conversations.

3. **No Real-Time Visibility:** Management lacked real-time visibility into ticket statuses, technician workloads, and SLA compliance. Dashboard-level insights were unavailable without manual data aggregation.

4. **Knowledge Loss:** Resolution details and best practices were scattered across individual notes and emails. When technicians left the organization, their accumulated knowledge was lost.

5. **No Escalation Tracking:** Internal and external escalations were handled informally, with no structured workflow or audit trail to track escalation history.

6. **Client Data Fragmentation:** Client information, product records, and support history were maintained in separate, disconnected systems, making it difficult to get a consolidated view of a client's service history.

7. **Limited Accountability:** Without centralized audit logging, it was difficult to determine who performed specific actions, when they occurred, and what changes were made.

---

## 3.3 Purpose of the Document

This document serves as the **comprehensive enterprise system documentation** for the Maptech Ticketing System. Its objectives are to:

- Provide a complete technical reference for all aspects of the system's design, architecture, and implementation.
- Document the functional and non-functional requirements that the system fulfills.
- Describe the data architecture, API specifications, and security measures implemented.
- Serve as a reference for onboarding new developers and system administrators.
- Support IT auditors in understanding the system's access control, data protection, and audit mechanisms.
- Guide future enhancement and maintenance efforts by establishing a clear baseline of the current system state.

---

## 3.4 Scope

### In Scope

The following are covered within this documentation:

- **Backend System:** Django-based REST API, WebSocket consumers, data models, and business logic
- **Frontend Applications:** React TypeScript web interfaces for all user roles
- **Authentication & Authorization:** JWT-based authentication, role-based access control
- **Real-Time Features:** WebSocket-powered chat and notification systems
- **Data Management:** Database schema, data dictionary, and data flow
- **API Documentation:** Complete REST API endpoint specifications
- **Security Architecture:** Authentication, encryption, access control, and audit logging
- **Deployment:** Deployment architecture and environment configuration
- **Operations:** Monitoring, logging, backup, and incident management
- **Testing:** Testing strategy, test types, and test case structure

### Out of Scope

The following are explicitly outside the scope of this documentation:

- Third-party vendor documentation (Django, React, etc.) — referenced but not reproduced
- Organizational policies not directly related to the system
- Client-specific customizations or configurations
- Future mobile application development (planned but not yet implemented)
- Email server configuration and integration (planned, not yet active)

---

## 3.5 Definitions, Acronyms, and Abbreviations

- **STF**: Definition: Service Ticket Form — the unique identifier format for support tickets (e.g., STF-MT-20260311000001)
- **SLA**: Definition: Service Level Agreement — the agreed-upon timeframe for ticket resolution
- **Feedback Rating**: Definition: A 1-5 supervisor/admin assessment of technical staff performance before ticket closure
- **JWT**: Definition: JSON Web Token — a compact, URL-safe token format for secure authentication
- **RBAC**: Definition: Role-Based Access Control — a security model where access permissions are assigned to roles
- **API**: Definition: Application Programming Interface — the set of endpoints through which the frontend communicates with the backend
- **REST**: Definition: Representational State Transfer — an architectural style for designing web APIs
- **ASGI**: Definition: Asynchronous Server Gateway Interface — the Python standard for async web servers
- **WSGI**: Definition: Web Server Gateway Interface — the traditional Python web server interface
- **WebSocket**: Definition: A communication protocol providing full-duplex communication channels over a TCP connection
- **CORS**: Definition: Cross-Origin Resource Sharing — a mechanism for allowing restricted resources on a web page from another domain
- **DRF**: Definition: Django REST Framework — the REST API framework used in this system
- **ORM**: Definition: Object-Relational Mapping — a technique that maps database tables to Python objects
- **ERD**: Definition: Entity Relationship Diagram — a visual representation of database table relationships
- **BPMN**: Definition: Business Process Model and Notation — a standard for business process modeling
- **CI/CD**: Definition: Continuous Integration / Continuous Deployment — automated build, test, and deployment pipelines
- **Daphne**: Definition: An HTTP, HTTP2, and WebSocket protocol server for ASGI
- **Argon2**: Definition: A password hashing algorithm, winner of the Password Hashing Competition
- **HIBP**: Definition: Have I Been Pwned — a service that checks whether passwords have been compromised in data breaches
- **Admin/Supervisor**: Definition: A user role with privileges to create, assign, and manage tickets and monitor operations
- **Employee/Technician**: Definition: A user role assigned to resolve tickets and perform field service tasks
- **Superadmin**: Definition: The highest-privilege user role with full system administration capabilities
- **Escalation**: Definition: The process of transferring a ticket to a higher-skill technician (internal) or external vendor (external)
- **Knowledge Hub**: Definition: A repository of published resolution documents accessible to all authenticated users

---

*End of Section 3*


---


<!-- Source: 04-System-Overview.md -->

# 4. SYSTEM OVERVIEW

## 4.1 System Description

The Maptech Ticketing System is a web-based IT service management platform designed to digitize and streamline the end-to-end technical support workflow at Maptech Information Solutions Inc. The system manages the complete lifecycle of support tickets — from initial creation and client verification through technician assignment, diagnosis, resolution, and formal closure.

The system operates as a client-server web application with a RESTful API backend and a modern single-page application (SPA) frontend. It supports real-time communication through WebSocket connections, enabling live chat between supervisors and technicians as well as instant push notifications for critical events.

### Core Operational Flow

1. **Ticket Intake & Creation** — Supervisors or Sales create tickets on behalf of clients, capturing client information, product/equipment details, service type, and problem description.
2. **Client Call Verification & Priority** — For newly created sales tickets, the call workflow is completed first: call log capture, ticket review, and priority confirmation.
3. **Supervisor Assignment** — Supervisors assign confirmed tickets to available technicians based on workload and expertise.
4. **Work Execution** — Technicians start work, diagnose issues, take action, and document findings.
5. **Escalation** — Tickets may be escalated internally (staff handoff) or externally (vendor/distributor/principal).
6. **Resolution Request** — Technicians upload proof and request closure (or submit for observation when monitoring is required).
7. **Closure with Feedback** — Supervisors review final output, submit technical staff feedback rating, and close the ticket.
8. **Knowledge Capture** — Resolution proofs can be published to the Knowledge Hub for organizational learning.

---

## 4.2 System Context

The Maptech Ticketing System operates within the following context:

![Diagram 01](./images/diagram-01.png)

### External Entity Interactions

- **Web Browser**: Interaction Type: HTTPS / WSS; Description: Users access the system through modern web browsers
- **External Vendors**: Interaction Type: Manual (via notes); Description: Escalation information is recorded in-system; direct integration is not yet implemented
- **HIBP API**: Interaction Type: HTTPS (outbound); Description: Password breach checking during password changes/resets

---

## 4.3 Stakeholders

- **Maptech Management**: Role: Business Owner; Responsibility: Defines business requirements, approves system direction, reviews reports
- **IT Operations Team**: Role: System Operations; Responsibility: Deploys, monitors, and maintains the system infrastructure
- **Development Team**: Role: System Development; Responsibility: Designs, develops, tests, and maintains the application codebase
- **Supervisors (Admins)**: Role: Primary Operations Leads; Responsibility: Manage ticket operations, assign technicians, monitor SLAs, and close tickets
- **Sales Team**: Role: Intake and Client Coordination; Responsibility: Create tickets, complete call and priority workflow, maintain client/product master data
- **Technicians (Employees)**: Role: Field Service Workers; Responsibility: Receive assignments, perform diagnostics, resolve issues, submit proofs
- **Superadmins**: Role: System Administrators; Responsibility: Manage user accounts, configure system settings, review audit logs
- **Clients (External)**: Role: Service Recipients; Responsibility: Report issues via phone/email; tracked in system by sales and supervisors
- **QA Team**: Role: Quality Assurance; Responsibility: Validates system functionality and performance through testing

---

## 4.4 User Roles and Responsibilities

The system implements a role-based access control (RBAC) model with the following roles:

- **Superadmin**: Description: Highest-privilege system administrator. Full access to all features including user management, system configuration, audit logs, and retention policies.; Access Level: Full system access
- **Admin (Supervisor)**: Description: Manages day-to-day ticket operations. Handles assignment/reassignment, escalation handling, ticket review, closure, feedback ratings, and catalog/service maintenance.; Access Level: Full operational ticket control
- **Sales**: Description: Handles ticket intake and client coordination. Creates tickets, performs call verification and priority confirmation on sales-created tickets, and manages clients/products/categories.; Access Level: Ticket intake and catalog management
- **Employee (Technician)**: Description: Assigned technical staff. Starts work, updates work fields, uploads proof, escalates/pass tickets, submits for observation, and requests closure.; Access Level: Assigned-ticket execution and updates

### Role Hierarchy

![Diagram 02](./images/diagram-02.png)

### Detailed Role Permissions

- **View Dashboard & Stats**: Superadmin: ✅; Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ✅ (own)
- **Create Tickets**: Superadmin: ✅ (API); Admin (Supervisor): ✅; Sales: ✅ (own intake); Employee (Technician): ❌
- **Assign Tickets**: Superadmin: ❌ (no ticket UI); Admin (Supervisor): ✅; Sales: ❌; Employee (Technician): ❌
- **Start Work on Ticket**: Superadmin: ❌ (no ticket UI); Admin (Supervisor): ✅ (escalation handling); Sales: ❌; Employee (Technician): ✅
- **Update Ticket Fields**: Superadmin: ❌ (no ticket UI); Admin (Supervisor): ✅; Sales: ✅ (call review scope); Employee (Technician): ✅ (assigned scope)
- **Escalate Internally**: Superadmin: ❌; Admin (Supervisor): ❌; Sales: ❌; Employee (Technician): ✅
- **Pass Ticket**: Superadmin: ❌; Admin (Supervisor): ❌; Sales: ❌; Employee (Technician): ✅
- **Escalate Externally**: Superadmin: ❌ (no ticket UI); Admin (Supervisor): ✅; Sales: ❌; Employee (Technician): ✅
- **Request Closure**: Superadmin: ❌; Admin (Supervisor): ❌; Sales: ❌; Employee (Technician): ✅
- **Close Ticket**: Superadmin: ❌ (no ticket UI); Admin (Supervisor): ✅; Sales: ❌; Employee (Technician): ❌
- **Confirm Ticket**: Superadmin: ❌ (no ticket UI); Admin (Supervisor): ✅; Sales: ✅ (own intake flow); Employee (Technician): ❌
- **Review Ticket**: Superadmin: ❌ (no ticket UI); Admin (Supervisor): ✅; Sales: ✅ (own intake flow); Employee (Technician): ❌
- **Link Tickets**: Superadmin: ❌ (no ticket UI); Admin (Supervisor): ✅; Sales: ❌; Employee (Technician): ❌
- **Manage Knowledge Hub**: Superadmin: ❌; Admin (Supervisor): ✅; Sales: ❌; Employee (Technician): ❌
- **View Knowledge Hub**: Superadmin: ❌; Admin (Supervisor): ✅; Sales: ❌; Employee (Technician): ✅
- **Manage Products**: Superadmin: ❌; Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ❌
- **Manage Clients**: Superadmin: ❌; Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ❌
- **Manage Categories**: Superadmin: ❌; Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ❌
- **Manage Types of Service**: Superadmin: ❌; Admin (Supervisor): ✅; Sales: ❌; Employee (Technician): ❌
- **Manage Call Logs**: Superadmin: ✅; Admin (Supervisor): ✅; Sales: ✅ (ticket call workflow); Employee (Technician): ✅ (ticket participant scope)
- **Submit Feedback Ratings**: Superadmin: ❌; Admin (Supervisor): ✅; Sales: ❌; Employee (Technician): ❌
- **View Audit Logs**: Superadmin: ✅; Admin (Supervisor): ✅ (scoped); Sales: ✅ (scoped); Employee (Technician): ❌
- **Export Audit Logs**: Superadmin: ✅; Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ❌
- **Manage Users**: Superadmin: ✅; Admin (Supervisor): ❌; Sales: ❌; Employee (Technician): ❌
- **Manage Announcements**: Superadmin: ✅; Admin (Supervisor): ❌; Sales: ❌; Employee (Technician): ❌
- **Manage Retention Policy**: Superadmin: ✅; Admin (Supervisor): ❌; Sales: ❌; Employee (Technician): ❌
- **View Announcements**: Superadmin: ✅; Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ✅
- **Chat (Ticket Channel)**: Superadmin: ✅; Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ✅
- **Receive Notifications**: Superadmin: ✅; Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ✅
- **Update Profile**: Superadmin: ✅; Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ✅
- **Change Password**: Superadmin: ✅; Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ✅

Notes:
Sales ticket visibility is scoped to tickets they created.
Supervisor-only assignment controls are enforced by the `IsSupervisorLevel` permission.

---

## 4.5 Operational Environment

### Hardware Requirements

- **Server CPU**: Minimum: 2 cores; Recommended: 4+ cores
- **Server RAM**: Minimum: 2 GB; Recommended: 4+ GB
- **Server Storage**: Minimum: 10 GB (SSD); Recommended: 50+ GB (SSD) for media/attachments growth
- **Client Device**: Minimum: Any device with a modern web browser; Recommended: Desktop or laptop for optimal admin experience

### Software Requirements

- **Server OS**: Requirement: Windows 10+, Linux (Ubuntu 20.04+), macOS
- **Python**: Requirement: 3.10 or higher
- **Node.js**: Requirement: 18.x or higher (for frontend build)
- **Database**: Requirement: SQLite 3 (development); PostgreSQL recommended for production
- **Web Browser**: Requirement: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+

### Network Infrastructure

- **Protocol**: HTTPS (recommended for production), HTTP (development)
- **WebSocket**: WSS (production) / WS (development) for real-time features
- **Ports**: Backend: 8000 (default), Frontend: 3000 (development proxy)
- **CORS**: Configurable allowed origins via environment variables
- **Bandwidth**: Standard broadband; system is optimized for low bandwidth

### Security Environment

- **Authentication**: JWT (JSON Web Tokens) with access/refresh token pair
- **Password Hashing**: Argon2 (primary), PBKDF2, BCrypt, Scrypt (fallback chain)
- **Token Lifetime**: Access: 1 day, Refresh: 30 days (configurable)
- **API Security**: Token-based authentication required for all protected endpoints
- **WebSocket Security**: JWT token passed via query string for WebSocket authentication
- **Password Breach Check**: Integration with HIBP API for compromised password detection

---

*End of Section 4*


---


<!-- Source: 05-System-Architecture.md -->

# 5. SYSTEM ARCHITECTURE

## 5.1 Architecture Overview

The Maptech Ticketing System follows a modern **client-server architecture** with a clear separation of concerns between the presentation layer (React SPA), the application/business logic layer (Django REST Framework + Channels), and the data layer (SQLite/PostgreSQL + filesystem).

The system supports both synchronous HTTP request-response communication (for REST API operations) and asynchronous bidirectional communication (for real-time chat and notifications via WebSockets).

---

## 5.2 Architecture Design Pattern

The system employs a combination of established architectural patterns:

- **Client-Server**: Application: React frontend (client) communicates with Django backend (server) via HTTP and WebSocket
- **MVC / MTV**: Application: Django follows the Model-Template-View pattern (analogous to MVC); DRF extends this with Serializers
- **RESTful API**: Application: Backend exposes a stateless REST API following REST conventions for CRUD operations
- **Event-Driven**: Application: Django signals trigger side-effects (notifications, audit logging) on model events
- **Layered Architecture**: Application: Presentation → Application → Business Logic → Data access layers
- **Repository Pattern**: Application: Django ORM acts as the data access layer, abstracting database queries
- **Observer Pattern**: Application: WebSocket consumers observe and broadcast real-time events to connected clients

---

## 5.3 Logical Architecture

The system is organized into the following logical layers:

![Diagram 03](./images/diagram-03.png)

### Layer Descriptions

- **Presentation Layer**: The React SPA handles all user interface rendering, form inputs, navigation, and real-time UI updates. It communicates with the backend exclusively through the service layer (HTTP API calls and WebSocket connections).
- **Application Layer**: Django REST Framework handles HTTP request routing, input validation via serializers, authentication, and permission enforcement. Django Channels handles WebSocket lifecycle and real-time message routing.
- **Business Logic Layer**: Core domain logic including ticket lifecycle state management, assignment algorithms, SLA tracking, escalation workflows, audit logging, and notification dispatch. Implemented within ViewSet methods and Django signal handlers.
- **Data Layer**: Django ORM provides database abstraction. Models define the schema. Migrations handle schema evolution. File storage handles media uploads including ticket attachments and profile pictures.

---

## 5.4 Physical Architecture

### Development Environment

![Diagram 04](./images/diagram-04.png)

### Production Environment (Recommended)

![Diagram 05](./images/diagram-05.png)

---

## 5.5 Component Architecture

- **React SPA**: Single-page application built with React 18, TypeScript, React Router, and Tailwind CSS. Produces a static build served by the backend or a CDN.
- **Vite**: Frontend build tool with HMR (Hot Module Replacement) for development and optimized production builds. Proxies API/WebSocket requests to the Django backend in development.
- **Django REST Framework**: Provides REST API viewsets, serializers for input/output, permission classes for authorization, and browsable API for development.
- **Django Channels**: Extends Django with ASGI support for WebSocket handling. Provides the channel layer for broadcasting messages to connected clients.
- **Daphne**: ASGI server that serves both HTTP and WebSocket connections. Runs the Django application with full async support.
- **SimpleJWT**: Handles JWT token generation, validation, and refresh. Provides access and refresh token management.
- **drf-yasg**: Auto-generates Swagger/OpenAPI documentation from DRF viewsets and serializers. Provides Swagger UI and ReDoc interfaces.
- **Django ORM**: Abstracts database operations. Manages 18 models with relationships, indexes, and constraints.
- **SQLite**: Default development database. File-based, zero-configuration.
- **Whitenoise**: Serves static files directly from the Django application without requiring a separate web server. Compresses and caches static assets.
- **Argon2**: Primary password hashing algorithm. Memory-hard, resistant to GPU-based attacks.
- **Pillow**: Image processing library for handling profile picture uploads, validation, and storage.

---

## 5.6 Technology Stack

### Backend

- **Language**: Technology: Python; Version: 3.10+; Purpose: Server-side programming
- **Web Framework**: Technology: Django; Version: 4.2+; Purpose: Application framework
- **API Framework**: Technology: Django REST Framework; Version: 3.16.1; Purpose: REST API development
- **Authentication**: Technology: djangorestframework-simplejwt; Version: 5.5.1; Purpose: JWT token management
- **WebSocket**: Technology: Django Channels; Version: 4.3.2; Purpose: Real-time WebSocket support
- **ASGI Server**: Technology: Daphne; Version: (bundled with Channels); Purpose: HTTP & WebSocket server
- **API Documentation**: Technology: drf-yasg; Version: 1.21.15; Purpose: Swagger/OpenAPI auto-generation
- **CORS**: Technology: django-cors-headers; Version: 4.9.0; Purpose: Cross-origin request handling
- **Password Hashing**: Technology: argon2-cffi; Version: 25.1.0; Purpose: Argon2 password hashing
- **Static Files**: Technology: Whitenoise; Version: 6.12.0; Purpose: Static file serving
- **Image Processing**: Technology: Pillow; Version: 12.1.1; Purpose: Profile picture handling
- **Environment Variables**: Technology: python-dotenv; Version: 1.2.2; Purpose: Environment configuration
- **HTTP Client**: Technology: Requests; Version: 2.32.5; Purpose: External API calls (HIBP)
- **Database**: Technology: SQLite 3 (dev) / PostgreSQL (prod); Version: —; Purpose: Relational data storage

### Frontend (Primary — Maptech_FrontendUI-main)

- **Language**: Technology: TypeScript; Version: 5.5.4; Purpose: Type-safe JavaScript
- **UI Library**: Technology: React; Version: 18.3.1; Purpose: Component-based UI framework
- **Routing**: Technology: React Router; Version: 7.13.0; Purpose: Client-side routing
- **Styling**: Technology: Tailwind CSS; Version: 3.4.17; Purpose: Utility-first CSS framework
- **UI Utilities**: Technology: Emotion; Version: 11.13.3; Purpose: CSS-in-JS for dynamic styles
- **Icons**: Technology: Lucide React; Version: 0.522.0; Purpose: Icon library
- **Notifications/Toast**: Technology: Sonner; Version: 2.0.1; Purpose: Toast notification component
- **Charts**: Technology: Recharts; Version: 2.12.7; Purpose: Dashboard chart visualizations
- **Excel Export**: Technology: xlsx-js-style; Version: 1.2.0; Purpose: Data export to Excel format
- **Build Tool**: Technology: Vite; Version: 5.2.0; Purpose: Frontend build and dev server
- **Linting**: Technology: ESLint + @typescript-eslint; Version: 8.50.0; Purpose: Code quality enforcement

### Frontend (Legacy — frontend/)

- **UI Library**: Technology: React; Version: 18.2.0; Purpose: Component-based UI framework
- **Routing**: Technology: React Router; Version: 6.12.0; Purpose: Client-side routing
- **Forms**: Technology: React Hook Form; Version: 7.71.1; Purpose: Form state management
- **OAuth**: Technology: Azure MSAL, Google OAuth; Version: Various; Purpose: SSO authentication (planned)
- **Toast**: Technology: React Toastify; Version: 11.0.5; Purpose: Toast notifications
- **Build Tool**: Technology: Vite; Version: 5.0.0; Purpose: Frontend build tool

---

## 5.7 Communication Protocols

- **HTTP/HTTPS**: Usage: REST API calls; Standard request-response for CRUD operations. JSON payloads.
- **WebSocket (WS/WSS)**: Usage: Real-time chat & notifications; Persistent bidirectional connection for live messaging and push notifications.
- **JSON**: Usage: Data format; All API requests and responses use JSON serialization.
- **JWT**: Usage: Authentication token; Bearer tokens passed in HTTP `Authorization` header and WebSocket query strings.
- **Multipart/Form-Data**: Usage: File uploads; Used for ticket attachment and profile picture uploads.

---

*End of Section 5*


---


<!-- Source: 06-Business-Process-Model.md -->

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

![Diagram 06](./images/diagram-06.png)

### As-Is Process Challenges

- **Paper-based STF forms**: Impact: Prone to loss, damage, and illegibility
- **Spreadsheet tracking**: Impact: No real-time updates, version control issues, no concurrent access
- **Phone/email coordination**: Impact: Communication delays, no audit trail
- **Manual SLA tracking**: Impact: Missed deadlines, no proactive alerts
- **No centralized knowledge base**: Impact: Repeated troubleshooting of known issues
- **No audit trail**: Impact: Inability to track who did what and when

---

## 6.3 Proposed Process (To-Be)

With the Maptech Ticketing System, the process operates as follows:

![Diagram 07](./images/diagram-07.png)

### To-Be Process Benefits

- **Automated STF generation**: Unique ticket numbers auto-assigned (STF-MT-YYYYMMDDXXXXXX)
- **Real-time notifications**: Instant alerts for assignments, status changes, escalations
- **Live chat**: Supervisors and technicians communicate in real-time within each ticket
- **SLA tracking**: Automatic estimated resolution days and progress percentage
- **Audit trail**: Every action logged with actor, timestamp, IP address, and changes
- **Knowledge retention**: Resolution proofs published for organizational learning
- **Digital signatures**: Clients sign off on completed work digitally

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

![Diagram 08](./images/diagram-08.png)

### Ticket Status Definitions

- **Open**: Code: open; Description: Ticket has been created but work has not yet started
- **In Progress**: Code: in_progress; Description: Technician has started working on the ticket
- **Escalated (Internal)**: Code: escalated; Description: Ticket escalated to another staff member internally
- **Escalated (External)**: Code: escalated_external; Description: Ticket escalated to an external distributor or principal
- **Pending Closure**: Code: pending_closure; Description: Technician has submitted resolution and requested closure
- **For Observation**: Code: for_observation; Description: Ticket submitted for monitoring without immediate resolution
- **Closed**: Code: closed; Description: Ticket has been formally closed by a supervisor
- **Unresolved**: Code: unresolved; Description: Ticket marked as unresolvable

### 6.4.2 Ticket Assignment Flow

![Diagram 09](./images/diagram-09.png)

Implementation note:
When a ticket is created by Sales, assignment is gated until call verification and priority confirmation are completed.

### 6.4.3 Escalation Workflow

![Diagram 10](./images/diagram-10.png)

### 6.4.4 Resolution & Closure Flow

![Diagram 11](./images/diagram-11.png)

---

*End of Section 6*


---


<!-- Source: 07-Functional-Requirements.md -->

# 7. FUNCTIONAL REQUIREMENTS

## 7.1 Functional Requirement Structure

- **FR-001**: Module: Authentication; Requirement: The system shall support JWT-based login with username or email; Priority: Critical
- **FR-002**: Module: Authentication; Requirement: The system shall provide password reset via email token and recovery key; Priority: High
- **FR-003**: Module: Authentication; Requirement: The system shall check passwords against the HIBP breach database; Priority: High
- **FR-004**: Module: Authentication; Requirement: The system shall support token refresh with configurable lifetimes; Priority: Critical
- **FR-005**: Module: User Management; Requirement: Superadmins shall be able to create, update, activate/deactivate, and reset passwords for users; Priority: Critical
- **FR-006**: Module: User Management; Requirement: Users shall be able to update their own profile (name, phone, avatar); Priority: High
- **FR-007**: Module: User Management; Requirement: The system shall auto-generate unique usernames from name initials; Priority: Medium
- **FR-008**: Module: Ticket Management; Requirement: Admin-level users shall be able to create tickets with client, product, and service information (sales scope: own intake tickets); Priority: Critical
- **FR-009**: Module: Ticket Management; Requirement: The system shall auto-generate unique STF numbers (STF-MT-YYYYMMDDXXXXXX); Priority: Critical
- **FR-010**: Module: Ticket Management; Requirement: Supervisors (admin/superadmin permission group) shall be able to assign tickets to technicians; Priority: Critical
- **FR-011**: Module: Ticket Management; Requirement: Supervisors (admin/superadmin permission group) shall be able to reassign tickets to different technicians; Priority: High
- **FR-012**: Module: Ticket Management; Requirement: Technicians shall be able to start work on assigned tickets (recording time_in); Priority: Critical
- **FR-013**: Module: Ticket Management; Requirement: Technicians shall be able to update action taken, remarks, job status, and other work fields; Priority: Critical
- **FR-014**: Module: Ticket Management; Requirement: Technicians shall be able to upload resolution proof attachments; Priority: Critical
- **FR-015**: Module: Ticket Management; Requirement: Technicians shall be able to request ticket closure (recording time_out); Priority: Critical
- **FR-016**: Module: Ticket Management; Requirement: Supervisors shall be able to close tickets after submitting technical staff feedback rating; Priority: Critical
- **FR-017**: Module: Ticket Management; Requirement: Admins and sales users shall be able to confirm tickets (sales scope: own call-verified tickets); Priority: High
- **FR-018**: Module: Ticket Management; Requirement: Admins and sales users shall be able to review tickets and set priority (sales scope: own call workflow); Priority: High
- **FR-019**: Module: Ticket Management; Requirement: The system shall track ticket progress percentage based on lifecycle milestones; Priority: Medium
- **FR-020**: Module: Ticket Management; Requirement: Admins shall be able to link related tickets; Priority: Medium
- **FR-021**: Module: Escalation; Requirement: Technicians shall be able to escalate tickets internally (back to admin); Priority: High
- **FR-022**: Module: Escalation; Requirement: Technicians shall be able to pass tickets to other technicians; Priority: High
- **FR-023**: Module: Escalation; Requirement: Admins/Technicians shall be able to escalate tickets to external vendors; Priority: High
- **FR-024**: Module: Escalation; Requirement: All escalations shall create EscalationLog records with full metadata; Priority: High
- **FR-025**: Module: Observation; Requirement: Technicians shall be able to submit tickets for observation without resolution; Priority: Medium
- **FR-026**: Module: Chat; Requirement: Admins and assigned technicians shall be able to communicate via real-time chat per ticket; Priority: Critical
- **FR-027**: Module: Chat; Requirement: Chat shall support message replies, emoji reactions, and read receipts; Priority: Medium
- **FR-028**: Module: Chat; Requirement: The system shall broadcast system messages for key ticket events; Priority: High
- **FR-029**: Module: Notifications; Requirement: The system shall send real-time push notifications for ticket events; Priority: Critical
- **FR-030**: Module: Notifications; Requirement: Users shall be able to mark notifications as read individually or in bulk; Priority: High
- **FR-031**: Module: Knowledge Hub; Requirement: Admins shall be able to publish resolution proofs as knowledge articles; Priority: High
- **FR-032**: Module: Knowledge Hub; Requirement: All authenticated users shall be able to search and view published articles; Priority: High
- **FR-033**: Module: Knowledge Hub; Requirement: Admins shall be able to archive and unarchive knowledge articles; Priority: Medium
- **FR-034**: Module: Client Management; Requirement: Admins shall be able to create, update, and manage client records; Priority: High
- **FR-035**: Module: Product Management; Requirement: Admins shall be able to create, update, and manage product/equipment records; Priority: High
- **FR-036**: Module: Category Management; Requirement: Admins shall be able to create and manage product categories; Priority: Medium
- **FR-037**: Module: Type of Service; Requirement: Admins shall be able to create and manage service types with SLA days; Priority: High
- **FR-038**: Module: Call Logs; Requirement: Admin-level users shall be able to create/manage support call logs with duration tracking (role-scoped visibility); Priority: Medium
- **FR-039**: Module: Feedback Rating; Requirement: Supervisors shall be able to submit employee feedback ratings (1-5) before closure; Priority: High
- **FR-040**: Module: Audit Logging; Requirement: The system shall log all significant actions with actor, timestamp, IP, and change details; Priority: Critical
- **FR-041**: Module: Audit Logging; Requirement: Superadmin, admin, and sales roles shall be able to search, filter, and export audit logs within role scope; Priority: High
- **FR-042**: Module: Dashboard; Requirement: The system shall provide role-specific dashboards with ticket statistics; Priority: High
- **FR-043**: Module: Announcements; Requirement: Superadmins shall be able to create role-targeted announcements with scheduling; Priority: Medium
- **FR-044**: Module: Retention Policy; Requirement: Superadmins shall be able to configure data retention periods for logs; Priority: Low
- **FR-045**: Module: Digital Signatures; Requirement: The system shall capture and store digital signatures for ticket resolution; Priority: Medium
- **FR-046**: Module: PDF Generation; Requirement: The system shall generate STF documents in PDF format; Priority: Medium
- **FR-047**: Module: Excel Export; Requirement: The system shall support data export to Excel format; Priority: Medium

---

## 7.2 Core Functional Modules

### 7.2.1 Authentication Module

**Description:** Handles user authentication, session management, and password security.

**Inputs:**
- Username or email address
- Password
- Recovery key (for key-based reset)
- Password reset token (for email-based reset)

**Outputs:**
- JWT access token (1-day lifetime)
- JWT refresh token (30-day lifetime)
- Authenticated user profile data

**User Interactions:**
- Login form with username/email + password
- Forgot password form (email-based or recovery key)
- Change password form (current + new password)

**System Responses:**
- Returns JWT tokens on successful authentication
- Returns user profile with role and permissions
- Validates passwords against HIBP breach database
- Auto-refreshes tokens with rotation

---

### 7.2.2 Ticket Management Module

**Description:** Core module managing the complete ticket lifecycle from creation through closure.

**Inputs:**
- Client information (name, contact, address, organization)
- Product/equipment details (device, serial number, warranty status)
- Service type selection
- Problem description
- Assignment target (employee selection)

**Outputs:**
- Auto-generated STF number
- Ticket record with full metadata
- Status updates and audit trail
- SLA progress tracking
- Resolution documentation

**User Interactions:**
- Admin (Supervisor): Create/assign/reassign tickets, manage lifecycle, close tickets
- Sales: Create tickets, complete call verification, set priority, confirm ticket, route to supervisor
- Employee: View assigned tickets, start work, update fields, upload proofs, request closure
- Both: View ticket details, progress tracking, chat

**System Responses:**
- Auto-generates unique STF numbers
- Creates/ends AssignmentSessions on assignment changes
- Calculates progress percentage based on lifecycle stage
- Validates resolution proof requirements before allowing closure requests
- Sends real-time notifications on status changes

---

### 7.2.3 Real-Time Communication Module

**Description:** Provides live chat and notification capabilities via WebSocket connections.

**Inputs:**
- Chat messages (text content, optional reply reference)
- Emoji reactions on messages
- Read receipt acknowledgments
- Typing indicators
- Notification mark-read actions

**Outputs:**
- Real-time message delivery to connected participants
- Typing indicator broadcasts
- Reaction updates
- Read receipt confirmations
- Push notifications with unread count

**User Interactions:**
- Chat panel within ticket detail view
- Notification panel (bell icon) in header
- Mark individual/all notifications as read

**System Responses:**
- Broadcasts messages to ticket chat group
- Stores messages with sender, timestamp, and session context
- Sends notifications to personal WebSocket groups
- Maintains unread count and delivers on connect

---

### 7.2.4 Escalation Module

**Description:** Manages internal and external escalation workflows for ticket resolution.

**Inputs:**
- Escalation type (internal / external)
- Target employee (for internal pass)
- External vendor name (for external escalation)
- Escalation notes

**Outputs:**
- EscalationLog record
- Updated ticket status and assignment
- System chat messages
- Notifications to affected parties

**User Interactions:**
- Employee: Escalate button (returns to admin), Pass button (to another employee)
- Admin/Employee: External escalation form (vendor name + notes)

**System Responses:**
- Ends current AssignmentSession
- Creates EscalationLog with full metadata
- Broadcasts system message in ticket chat
- Sends force_disconnect WebSocket event to old assignee
- Creates new AssignmentSession for new assignee

---

### 7.2.5 Knowledge Hub Module

**Description:** Manages the publication and consumption of resolution documentation as knowledge articles.

**Inputs:**
- Resolution proof attachments (from tickets)
- Published title, description, and tags (max 3)

**Outputs:**
- Published articles searchable by all authenticated users
- Summary statistics (published, unpublished, archived counts)

**User Interactions:**
- Admin: Browse resolution proofs, publish with metadata, unpublish, archive/unarchive
- Employee: Search and view published articles

**System Responses:**
- Filters published articles for employee view
- Provides search across title and description
- Tracks publication metadata (published_by, published_at)

---

### 7.2.6 Audit & Compliance Module

**Description:** Comprehensive action logging for accountability and compliance.

**Inputs:**
- Automatic capture from system events (Django signals)
- Manual creation from view actions

**Outputs:**
- Timestamped audit log entries
- CSV export of filtered logs
- Summary dashboard statistics

**User Interactions:**
- Admin/Superadmin: Browse, search, filter, and export audit logs

**System Responses:**
- Logs every CRUD action, status change, login/logout, escalation, and assignment
- Captures actor identity, IP address, user agent, and field-level changes
- Provides role-scoped visibility (superadmin sees admin+employee logs, admin/sales see employee logs)

---

## 7.3 Use Case Specifications

### UC-001: Admin/Sales Creates a Ticket

- **Use Case ID**: UC-001
- **Description**: Supervisor or sales user creates a new support ticket on behalf of a client
- **Actors**: Admin (Supervisor), Sales
- **Preconditions**: User is authenticated; client information is available
- **Main Flow**: 1. User navigates to Create Ticket page. 2. User fills client information (new or existing). 3. User enters service/problem details and optional product details. 4. User submits the form. 5. System creates ticket with auto-generated STF number. 6. System creates client and product records if needed. 7. For supervisor-created tickets, assignment may proceed immediately. 8. For sales-created tickets, ticket enters call/priority workflow before supervisor assignment.
- **Alternate Flow**: A1: Existing client is selected and fields are pre-filled. A2: No employee is assigned at creation and ticket remains open for supervisor assignment. A3: Sales sets priority and confirms ticket through call workflow first.
- **Postconditions**: Ticket exists with unique STF number; related records are linked; audit logs and notifications are generated according to workflow.

---

### UC-002: Employee Works on a Ticket

- **Use Case ID**: UC-002
- **Description**: Technician receives assignment, starts work, and resolves the ticket
- **Actors**: Employee (Technician)
- **Preconditions**: Employee is authenticated; ticket is assigned to this employee
- **Main Flow**: 1. Employee receives notification of assignment. 2. Employee views ticket in My Tickets or dashboard. 3. Employee clicks "Start Work" — system records time_in, status changes to IN_PROGRESS. 4. Employee communicates with supervisor via live chat as needed. 5. Employee conducts diagnosis and takes corrective action. 6. Employee updates ticket fields (action_taken, remarks, job_status). 7. Employee uploads resolution proof (photos, documents). 8. Employee captures client digital signature. 9. Employee clicks "Request Closure" — system verifies resolution proof exists, sets status to PENDING_CLOSURE, records time_out.
- **Alternate Flow**: A1: Employee cannot resolve — escalates internally (UC-003). A2: Employee needs to pass — passes to another employee (UC-004). A3: Issue needs monitoring — submits for observation (UC-006).
- **Postconditions**: Ticket in PENDING_CLOSURE status; resolution proof uploaded; time_in and time_out recorded; supervisor notified.

---

### UC-003: Employee Escalates Ticket Internally

- **Use Case ID**: UC-003
- **Description**: Technician escalates a ticket back to the supervisor for reassignment
- **Actors**: Employee (Technician)
- **Preconditions**: Employee is authenticated; ticket is assigned to this employee and in IN_PROGRESS status
- **Main Flow**: 1. Employee clicks "Escalate" on the ticket. 2. System ends current AssignmentSession. 3. System creates EscalationLog (type: internal). 4. System changes status to ESCALATED. 5. System reassigns ticket to the original admin creator. 6. System sends notification to admin. 7. System broadcasts system message in ticket chat.
- **Postconditions**: Ticket escalated; old session closed; admin notified; escalation logged.

---

### UC-004: Employee Passes Ticket

- **Use Case ID**: UC-004
- **Description**: Technician passes ticket to another technician
- **Actors**: Employee (Technician)
- **Preconditions**: Employee is authenticated; ticket is assigned; target employee is active
- **Main Flow**: 1. Employee selects target technician and provides optional notes. 2. System ends current AssignmentSession. 3. System creates EscalationLog with from_user and to_user. 4. System creates new AssignmentSession for target employee. 5. System sends force_disconnect to old employee's WebSocket. 6. System sends notification to new employee. 7. System broadcasts system message in chat.
- **Postconditions**: Ticket reassigned; sessions rotated; both parties notified.

---

### UC-005: Admin Closes a Ticket

- **Use Case ID**: UC-005
- **Description**: Supervisor reviews resolution and formally closes the ticket
- **Actors**: Admin (Supervisor)
- **Preconditions**: Admin is authenticated; ticket is in PENDING_CLOSURE status
- **Main Flow**: 1. Admin views ticket in PENDING_CLOSURE status. 2. Admin reviews proof, action taken, and remarks. 3. Admin submits feedback rating for the assigned employee. 4. Admin clicks "Close Ticket." 5. System sets status to CLOSED. 6. System ends active AssignmentSession. 7. System sends notification to the assigned employee. 8. System writes audit logs.
- **Postconditions**: Ticket status is CLOSED; feedback rating recorded; employee notified; session ended.

---

### UC-006: Submit Ticket for Observation

- **Use Case ID**: UC-006
- **Description**: Technician submits a ticket for monitoring without immediate resolution
- **Actors**: Employee (Technician)
- **Preconditions**: Working on the ticket (IN_PROGRESS status)
- **Main Flow**: 1. Employee records observation notes, action taken, and job status. 2. Employee submits for observation. 3. System sets status to FOR_OBSERVATION. 4. System creates system message in chat with observation details. 5. Admin is notified to monitor the ticket.
- **Postconditions**: Ticket in FOR_OBSERVATION; admin aware; observation details recorded.

---

### UC-007: Real-Time Chat Between Admin and Employee

- **Use Case ID**: UC-007
- **Description**: Supervisor and assigned technician communicate about a ticket in real-time
- **Actors**: Admin, Employee (assigned to ticket)
- **Preconditions**: Both users authenticated; ticket exists with active assignment
- **Main Flow**: 1. User opens ticket detail page and enters the chat panel. 2. WebSocket connection established (authenticated via JWT). 3. System sends existing message history. 4. User types message — typing indicator shown to other party. 5. User sends message — appears instantly for both parties. 6. Recipient sees message; read receipt sent automatically. 7. Users can react with emojis and reply to specific messages.
- **Postconditions**: Messages stored in database; read receipts tracked; typing events transient.

---

### UC-008: Superadmin Manages Users

- **Use Case ID**: UC-008
- **Description**: Superadmin creates, edits, activates/deactivates, and resets passwords for user accounts
- **Actors**: Superadmin
- **Preconditions**: Superadmin is authenticated
- **Main Flow**: 1. Superadmin navigates to User Management page. 2. Views list of all users with roles and status. 3. Creates new user (system generates username and temporary password). 4. Edits user profile and role as needed. 5. Deactivates/reactivates accounts. 6. Resets passwords for locked-out users.
- **Postconditions**: User accounts managed; audit log entries created for all actions.

---

### UC-009: Publish Knowledge Article

- **Use Case ID**: UC-009
- **Description**: Admin publishes a ticket resolution proof as a knowledge base article
- **Actors**: Admin
- **Preconditions**: Resolution proof attachment exists on a ticket
- **Main Flow**: 1. Admin navigates to Knowledge Hub. 2. Admin browses resolution proofs. 3. Admin clicks "Publish" on an attachment. 4. Admin provides title, description, and up to 3 tags. 5. System marks attachment as published with metadata. 6. Article becomes visible to all authenticated users.
- **Postconditions**: Article published and searchable; metadata recorded.

---

*End of Section 7*


---


<!-- Source: 08-Non-Functional-Requirements.md -->

# 8. NON-FUNCTIONAL REQUIREMENTS

## 8.1 Performance Requirements

- **API Response Time**: Specification: REST API endpoints shall respond within 500ms under normal load for standard CRUD operations
- **WebSocket Latency**: Specification: Real-time messages shall be delivered to connected clients within 200ms of submission
- **Page Load Time**: Specification: Initial SPA load shall complete within 3 seconds on a standard broadband connection
- **Concurrent Users**: Specification: The system shall support a minimum of 50 concurrent authenticated users in the standard deployment
- **Database Queries**: Specification: Complex list views (tickets with nested relations) shall execute within 1 second
- **File Upload**: Specification: Ticket attachment uploads (up to 10MB per file) shall complete within 10 seconds on standard broadband
- **Dashboard Rendering**: Specification: Dashboard statistics and charts shall render within 2 seconds

---

## 8.2 Scalability

- **Database**: Current Design: SQLite (single-file, suitable for low-medium workloads); Scale Path: Migrate to PostgreSQL for concurrent access and larger datasets
- **Channel Layer**: Current Design: InMemoryChannelLayer (single-process only); Scale Path: Migrate to Redis channel layer for multi-process/multi-server WebSocket support
- **Application Server**: Current Design: Single Daphne process; Scale Path: Deploy multiple Daphne/Uvicorn workers behind a load balancer
- **Static Files**: Current Design: Whitenoise (served from application); Scale Path: Move to CDN or dedicated static file server
- **Media Storage**: Current Design: Local filesystem; Scale Path: Migrate to cloud storage (AWS S3, Azure Blob)
- **Caching**: Current Design: No application-level caching; Scale Path: Add Redis or Memcached for query result caching
- **Search**: Current Design: Django ORM icontains queries; Scale Path: Add Elasticsearch or PostgreSQL full-text search for large datasets

---

## 8.3 Security Requirements

### 8.3.1 Authentication

- **Authentication Method**: Implementation: JWT (JSON Web Tokens) via djangorestframework-simplejwt
- **Token Lifetime**: Implementation: Access token: 1 day; Refresh token: 30 days
- **Token Rotation**: Implementation: Refresh tokens are rotated on each refresh (ROTATE_REFRESH_TOKENS=True)
- **Password Hashing**: Implementation: Argon2 (primary), with PBKDF2, BCrypt, and Scrypt as fallbacks
- **Password Strength**: Implementation: Minimum 8 characters enforced at application level
- **Password Breach Check**: Implementation: Passwords checked against HIBP (Have I Been Pwned) API during changes/resets
- **WebSocket Authentication**: Implementation: JWT token passed via query string and validated by custom JWTAuthMiddleware
- **Login Audit**: Implementation: All login events logged to AuditLog with IP address and timestamp

### 8.3.2 Authorization

- **Access Control Model**: Implementation: Role-Based Access Control (RBAC) with four roles: superadmin, admin, sales, employee
- **Permission Classes**: Implementation: Seven custom DRF permission classes enforcing role-based access at the API level
- **Object-Level Permissions**: Implementation: ViewSets filter querysets by user role (e.g., employees see only assigned tickets)
- **WebSocket Access Control**: Implementation: Chat consumers validate that users are ticket participants before allowing connection
- **Route Protection**: Implementation: Frontend ProtectedRoute components verify user role before rendering pages

### 8.3.3 Data Encryption

- **Passwords**: Implementation: Hashed with Argon2 (memory-hard, salted) — never stored in plaintext
- **Transport**: Implementation: HTTPS recommended for production; all API calls use token-based authentication
- **Tokens**: Implementation: JWT tokens signed with Django SECRET_KEY; short-lived access tokens reduce exposure
- **Sensitive Data**: Implementation: Recovery keys stored encrypted; profile pictures served through authenticated endpoints

### 8.3.4 Audit Logging

- **Scope**: Implementation: All significant system actions logged: CRUD, login/logout, assignment, escalation, status changes
- **Metadata**: Implementation: Each log entry captures: timestamp, entity, action, activity description, actor, actor email, IP address, field-level changes (JSON diff)
- **Retention**: Implementation: Configurable retention policy (default: 365 days for audit and call logs)
- **Access**: Implementation: Superadmins see admin + employee logs; admins see employee logs; employees have no audit log access
- **Export**: Implementation: CSV export limited to 5,000 records with filtering

---

## 8.4 Reliability

- **System Uptime**: Specification: Target 99.5% uptime during business hours (excluding planned maintenance)
- **Data Integrity**: Specification: Django ORM transactions ensure atomic database operations
- **WebSocket Recovery**: Specification: Frontend clients implement automatic reconnection on WebSocket disconnect
- **Error Handling**: Specification: All API endpoints return structured error responses with appropriate HTTP status codes
- **Data Persistence**: Specification: All ticket data, messages, and audit logs are persisted to database immediately
- **Graceful Degradation**: Specification: Real-time features (chat, notifications) degrade gracefully — system remains functional via REST API if WebSocket connection fails

---

## 8.5 Availability

- **Operational Hours**: Specification: The system is designed for 24/7 availability
- **Maintenance Windows**: Specification: Planned maintenance performed during off-peak hours with advance notification
- **Recovery Time**: Specification: Target RTO (Recovery Time Objective): 2 hours
- **Recovery Point**: Specification: Target RPO (Recovery Point Objective): 24 hours (aligned with backup frequency)
- **Network Error Handling**: Specification: Frontend displays network error modal when backend is unreachable (NetworkErrorModal component)

---

## 8.6 Maintainability

- **Code Organization**: Specification: Backend follows Django app structure with separated models, serializers, views, and permissions
- **Modularity**: Specification: Models split into topical files (ticket.py, messaging.py, lifecycle.py, audit.py, etc.)
- **API Documentation**: Specification: Auto-generated Swagger/OpenAPI docs via drf-yasg, accessible at `/swagger/` and `/redoc/`
- **Database Migrations**: Specification: Django migration system tracks all schema changes with version control
- **Configuration**: Specification: Environment variables via python-dotenv for deployment-specific settings
- **Frontend Architecture**: Specification: Component-based React with TypeScript for type safety; pages organized by role
- **Dependency Management**: Specification: Backend: requirements.txt; Frontend: package.json with locked versions

---

## 8.7 Usability

- **Responsive Design**: Specification: Tailwind CSS responsive utilities ensure usability across desktop and tablet
- **Dark Mode**: Specification: User-selectable dark/light theme (persisted to localStorage)
- **Role-Based Navigation**: Specification: Each role has a dedicated layout with relevant sidebar navigation items
- **Toast Notifications**: Specification: In-app toast messages (via Sonner) for action confirmations and errors
- **Real-Time Feedback**: Specification: Typing indicators, read receipts, and live message delivery provide immediate feedback
- **Search**: Specification: All list views support search/filter functionality
- **Form Validation**: Specification: Client-side validation with user-friendly error messages
- **Loading States**: Specification: Skeleton loaders and spinners indicate pending operations
- **Accessibility**: Specification: UI components follow semantic HTML practices; keyboard navigation supported

---

*End of Section 8*


---


<!-- Source: 09-Data-Architecture.md -->

# 9. DATA ARCHITECTURE

## 9.1 Data Model Overview

The Maptech Ticketing System uses a relational data model implemented through Django's ORM. The database consists of **18 primary tables** (models) organized into the following logical groups:

- **Identity**: Models: User; Purpose: User accounts and authentication
- **Core Ticketing**: Models: Ticket, TicketAttachment, TicketTask; Purpose: Ticket records, file attachments, and sub-tasks
- **Assignment & Messaging**: Models: AssignmentSession, Message, MessageReaction, MessageReadReceipt; Purpose: Ticket assignment tracking and real-time communication
- **Lifecycle & Escalation**: Models: EscalationLog; Purpose: Escalation history and tracking
- **Audit & Compliance**: Models: AuditLog; Purpose: System-wide action audit trail
- **Notifications**: Models: Notification; Purpose: User notifications for ticket events
- **Support Operations**: Models: CallLog, FeedbackRating; Purpose: Call tracking and employee feedback ratings
- **Catalog / Lookup**: Models: TypeOfService, Category, Product, Client; Purpose: Service types, product categories, equipment, and client records
- **Configuration**: Models: RetentionPolicy, Announcement; Purpose: System configuration and announcements

---

## 9.2 Entity Relationship Diagram (ERD)

![Diagram 12](./images/diagram-12.png)

---

## 9.3 Database Schema

### Table Listing

- **users_user**: Description: User accounts (extends Django AbstractUser); Key Relationships: Referenced by nearly all other tables
- **tickets_ticket**: Description: Core ticket records; Key Relationships: FK → User (created_by, assigned_to), FK → TypeOfService, FK → Client, FK → Product, FK → AssignmentSession, M2M → self (linked_tickets)
- **tickets_ticketattachment**: Description: File attachments for tickets; Key Relationships: FK → Ticket, FK → User (uploaded_by, published_by)
- **tickets_tickettask**: Description: Sub-tasks within tickets; Key Relationships: FK → Ticket, FK → User (assigned_to)
- **tickets_assignmentsession**: Description: Employee assignment periods; Key Relationships: FK → Ticket, FK → User (employee)
- **tickets_message**: Description: Chat messages; Key Relationships: FK → Ticket, FK → AssignmentSession, FK → User (sender), FK → self (reply_to)
- **tickets_messagereaction**: Description: Emoji reactions on messages; Key Relationships: FK → Message, FK → User
- **tickets_messagereadreceipt**: Description: Read receipts for messages; Key Relationships: FK → Message, FK → User
- **tickets_escalationlog**: Description: Escalation history records; Key Relationships: FK → Ticket, FK → User (from_user, to_user)
- **tickets_auditlog**: Description: System-wide audit trail; Key Relationships: FK → User (actor)
- **tickets_notification**: Description: User notifications; Key Relationships: FK → User (recipient), FK → Ticket
- **tickets_calllog**: Description: Support call records; Key Relationships: FK → Ticket, FK → User (admin)
- **tickets_feedbackrating**: Description: Employee feedback ratings; Key Relationships: OneToOne → Ticket, FK → User (employee, admin)
- **tickets_typeofservice**: Description: Service type definitions; Key Relationships: Referenced by Ticket
- **tickets_category**: Description: Product categories; Key Relationships: Referenced by Product
- **tickets_product**: Description: Product/equipment records; Key Relationships: FK → Category, Referenced by Ticket
- **tickets_client**: Description: Client organization records; Key Relationships: Referenced by Ticket
- **tickets_retentionpolicy**: Description: Singleton system config; Key Relationships: FK → User (updated_by)
- **tickets_announcement**: Description: System announcements; Key Relationships: FK → User (created_by)

---

## 9.4 Data Dictionary

### User Table (`users_user`)

- **id**: Type: BigAutoField; Constraints: PK, Auto-increment; Description: Unique user identifier
- **username**: Type: CharField(150); Constraints: Unique, Required; Description: Login username (auto-generated from initials)
- **email**: Type: EmailField; Constraints: Unique, Required; Description: User email address
- **password**: Type: CharField(128); Constraints: Required; Description: Hashed password (Argon2)
- **role**: Type: CharField(12); Constraints: Choices: employee/sales/admin/superadmin; Description: User role determining access level
- **first_name**: Type: CharField(150); Constraints: Optional; Description: User's first name
- **middle_name**: Type: CharField(150); Constraints: Optional; Description: User's middle name
- **last_name**: Type: CharField(150); Constraints: Optional; Description: User's last name
- **suffix**: Type: CharField(3); Constraints: Optional; Description: Name suffix (Jr., Sr., III)
- **phone**: Type: CharField(13); Constraints: Optional; Description: Phone in +63XXXXXXXXXX format
- **profile_picture**: Type: ImageField; Constraints: Optional, Nullable; Description: Upload path: profile_pictures/
- **recovery_key**: Type: CharField(39); Constraints: Unique, Auto-generated; Description: Format: xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx
- **is_active**: Type: BooleanField; Constraints: Default: True; Description: Account activation status
- **is_staff**: Type: BooleanField; Constraints: Default: False; Description: Django admin access
- **is_superuser**: Type: BooleanField; Constraints: Default: False; Description: Django superuser flag
- **date_joined**: Type: DateTimeField; Constraints: Auto; Description: Account creation timestamp
- **last_login**: Type: DateTimeField; Constraints: Nullable; Description: Last successful login

### Ticket Table (`tickets_ticket`)

- **id**: Type: BigAutoField; Constraints: PK; Description: Unique ticket identifier
- **stf_no**: Type: CharField(30); Constraints: Unique, Auto-generated; Description: Service Ticket Form number (STF-MT-YYYYMMDDXXXXXX)
- **status**: Type: CharField(20); Constraints: Choices, Default: 'open'; Description: Current ticket status
- **priority**: Type: CharField(10); Constraints: Choices, Optional; Description: Ticket priority (low/medium/high/critical)
- **created_by**: Type: ForeignKey(User); Constraints: CASCADE; Description: Supervisor who created the ticket
- **assigned_to**: Type: ForeignKey(User); Constraints: SET_NULL, Nullable; Description: Currently assigned technician
- **type_of_service**: Type: ForeignKey; Constraints: SET_NULL, Nullable; Description: Selected service type
- **type_of_service_others**: Type: CharField(200); Constraints: Optional; Description: Custom service type text
- **client_record**: Type: ForeignKey(Client); Constraints: SET_NULL, Nullable; Description: Linked client organization
- **product_record**: Type: ForeignKey(Product); Constraints: SET_NULL, Nullable; Description: Linked product/equipment
- **current_session**: Type: ForeignKey(Session); Constraints: SET_NULL, Nullable; Description: Current active assignment session
- **date**: Type: DateField; Constraints: Default: today; Description: Ticket creation date
- **time_in**: Type: DateTimeField; Constraints: Nullable; Description: When technician started work
- **time_out**: Type: DateTimeField; Constraints: Nullable; Description: When technician submitted resolution
- **description_of_problem**: Type: TextField; Constraints: Optional; Description: Problem description from supervisor
- **action_taken**: Type: TextField; Constraints: Optional; Description: Technician's resolution actions
- **remarks**: Type: TextField; Constraints: Optional; Description: Additional notes
- **job_status**: Type: CharField(20); Constraints: Choices, Optional; Description: Job completion status
- **cascade_type**: Type: CharField(20); Constraints: Choices, Optional; Description: Internal/External cascade type
- **observation**: Type: TextField; Constraints: Optional; Description: Observation notes
- **signature**: Type: TextField; Constraints: Optional; Description: Base64-encoded digital signature
- **signed_by_name**: Type: CharField(200); Constraints: Optional; Description: Name of person who signed
- **confirmed_by_admin**: Type: BooleanField; Constraints: Default: False; Description: Client verification confirmed
- **preferred_support_type**: Type: CharField(20); Constraints: Choices, Optional; Description: Remote/Onsite/Chat/Call
- **estimated_resolution_days_override**: Type: PositiveIntegerField; Constraints: Nullable; Description: Manual SLA override
- **external_escalated_to**: Type: CharField(300); Constraints: Optional; Description: External vendor name
- **external_escalation_notes**: Type: TextField; Constraints: Optional; Description: External escalation details
- **external_escalated_at**: Type: DateTimeField; Constraints: Nullable; Description: External escalation timestamp
- **linked_tickets**: Type: ManyToManyField(self); Constraints: Optional; Description: Related tickets
- **created_at**: Type: DateTimeField; Constraints: Auto; Description: Record creation timestamp
- **updated_at**: Type: DateTimeField; Constraints: Auto; Description: Last modification timestamp

### TicketAttachment Table (`tickets_ticketattachment`)

- **id**: Type: BigAutoField; Constraints: PK; Description: Unique attachment identifier
- **ticket**: Type: ForeignKey(Ticket); Constraints: CASCADE; Description: Parent ticket
- **file**: Type: FileField; Constraints: Required; Description: Upload path: ticket_attachments/YYYY/MM/DD/
- **uploaded_by**: Type: ForeignKey(User); Constraints: SET_NULL, Nullable; Description: User who uploaded the file
- **uploaded_at**: Type: DateTimeField; Constraints: Auto; Description: Upload timestamp
- **is_resolution_proof**: Type: BooleanField; Constraints: Default: False; Description: Marks as resolution evidence
- **is_published**: Type: BooleanField; Constraints: Default: False; Description: Published to Knowledge Hub
- **published_title**: Type: CharField(300); Constraints: Optional; Description: Knowledge article title
- **published_description**: Type: TextField; Constraints: Optional; Description: Knowledge article description
- **published_tags**: Type: JSONField; Constraints: Default: [], Max 3; Description: Searchable tags
- **published_by**: Type: ForeignKey(User); Constraints: SET_NULL, Nullable; Description: User who published
- **published_at**: Type: DateTimeField; Constraints: Nullable; Description: Publication timestamp
- **is_archived**: Type: BooleanField; Constraints: Default: False; Description: Archive status

### Message Table (`tickets_message`)

- **id**: Type: BigAutoField; Constraints: PK; Description: Unique message identifier
- **ticket**: Type: ForeignKey(Ticket); Constraints: CASCADE; Description: Parent ticket
- **assignment_session**: Type: ForeignKey(Session); Constraints: SET_NULL, Nullable; Description: Session during which message was sent
- **channel_type**: Type: CharField(20); Constraints: Choices: 'admin_employee'; Description: Communication channel
- **sender**: Type: ForeignKey(User); Constraints: CASCADE; Description: Message author
- **content**: Type: TextField; Constraints: Required; Description: Message text content
- **reply_to**: Type: ForeignKey(Message); Constraints: SET_NULL, Nullable; Description: Referenced message for replies
- **is_system_message**: Type: BooleanField; Constraints: Default: False; Description: Auto-generated system message flag
- **created_at**: Type: DateTimeField; Constraints: Auto; Description: Send timestamp

### AuditLog Table (`tickets_auditlog`)

- **id**: Type: BigAutoField; Constraints: PK; Description: Unique log entry identifier
- **timestamp**: Type: DateTimeField; Constraints: Auto, Indexed; Description: When the action occurred
- **entity**: Type: CharField(30); Constraints: Choices, Indexed; Description: Entity type (User/Ticket/etc.)
- **entity_id**: Type: PositiveIntegerField; Constraints: Nullable; Description: Affected entity's ID
- **action**: Type: CharField(20); Constraints: Choices, Indexed; Description: Action type (CREATE/UPDATE/LOGIN/etc.)
- **activity**: Type: TextField; Constraints: Required; Description: Human-readable description
- **actor**: Type: ForeignKey(User); Constraints: SET_NULL, Nullable; Description: User who performed the action
- **actor_email**: Type: EmailField; Constraints: Optional; Description: Snapshot of actor's email at time of action
- **ip_address**: Type: GenericIPAddressField; Constraints: Nullable; Description: Client IP address
- **changes**: Type: JSONField; Constraints: Nullable; Description: JSON diff of changed fields

### Additional Tables

Additional data dictionary entries for remaining tables (EscalationLog, Notification, CallLog, FeedbackRating, TypeOfService, Category, Product, Client, RetentionPolicy, Announcement, AssignmentSession, TicketTask, MessageReaction, MessageReadReceipt) follow the same structure documented in Section 5.5 Component Architecture and the ERD above.

---

## 9.5 Data Flow Diagrams

### Level 0 — Context Diagram

![Diagram 13](./images/diagram-13.png)

### Level 1 — Major Processes

![Diagram 14](./images/diagram-14.png)

### Level 2 — Ticket Lifecycle Data Flow

![Diagram 15](./images/diagram-15.png)

---

*End of Section 9*


---


<!-- Source: 10-System-Module-Design.md -->

# 10. SYSTEM MODULE DESIGN

## Module Overview

The backend application is organized into two Django apps (`tickets` and `users`) with the following module structure:

```
backend/
├── tickets/                    # Core ticketing application
│   ├── models/                 # Data models (split by domain)
│   │   ├── ticket.py          # Ticket, TicketAttachment, TicketTask
│   │   ├── messaging.py       # AssignmentSession, Message, Reaction, ReadReceipt
│   │   ├── lifecycle.py       # EscalationLog
│   │   ├── audit.py           # AuditLog
│   │   ├── notification.py    # Notification
│   │   ├── support.py         # CallLog, FeedbackRating
│   │   ├── lookup.py          # TypeOfService, Category
│   │   ├── product.py         # Product
│   │   ├── client.py          # Client
│   │   └── config.py          # RetentionPolicy, Announcement
│   ├── views/                  # API ViewSets (split by domain)
│   │   ├── tickets.py         # TicketViewSet + TypeOfServiceViewSet + EscalationLogViewSet
│   │   ├── audit.py           # AuditLogViewSet
│   │   ├── catalog.py         # CategoryViewSet, ProductViewSet, ClientViewSet
│   │   ├── config.py          # RetentionPolicyViewSet, AnnouncementViewSet
│   │   ├── knowledge.py       # KnowledgeHubViewSet, PublishedArticleViewSet
│   │   ├── notifications.py   # NotificationViewSet
│   │   └── support.py         # CallLogViewSet, FeedbackRatingViewSet
│   ├── serializers/            # DRF serializers (split by domain)
│   ├── consumers.py           # WebSocket consumers (Chat, Notifications)
│   ├── permissions.py         # Custom DRF permission classes
│   ├── middleware.py          # JWT WebSocket middleware
│   ├── signals.py             # Django signal handlers
│   ├── routing.py             # WebSocket URL routing
│   └── admin.py               # Django admin configuration
├── users/                      # User management application
│   ├── models.py              # Custom User model
│   ├── views.py               # AuthViewSet, UserViewSet
│   └── serializers.py         # UserSerializer, AdminUserCreateSerializer
└── tickets_backend/            # Project configuration
    ├── settings.py            # Django settings
    ├── urls.py                # Root URL configuration
    ├── asgi.py                # ASGI application config
    └── wsgi.py                # WSGI application config
```

---

## Module 1: Ticket Management (`tickets.views.tickets`)

- **Module Name**: Ticket Management
- **Description**: Core module managing the complete ticket lifecycle including creation, assignment, work tracking, escalation, resolution, and closure
- **Responsibilities**: CRUD for tickets; assignment/reassignment; status transitions; SLA tracking; task management; attachment handling; dashboard statistics
- **Primary ViewSet**: `TicketViewSet` (ModelViewSet)
- **Serializers**: TicketSerializer`, `AdminCreateTicketSerializer`, `EmployeeTicketActionSerializer`, `TicketTaskSerializer`, `TicketAttachmentSerializer
- **Permissions**: IsAuthenticated, IsAdminLevel, IsAssignedEmployee, IsAdminOrAssignedEmployee, IsTicketParticipant

### Key Actions

- **List/Create**: Method: GET/POST; URL: /api/tickets/; Permission: IsAuthenticated; Description: List tickets (role-scoped) or create new ticket
- **Retrieve/Update**: Method: GET/PUT; URL: /api/tickets/{id}/; Permission: IsAuthenticated; Description: Get or update ticket details
- **Assign**: Method: POST; URL: /api/tickets/{id}/assign/; Permission: IsSupervisorLevel; Description: Assign/reassign ticket to technician
- **Escalate**: Method: POST; URL: /api/tickets/{id}/escalate/; Permission: IsAssignedEmployee; Description: Internal escalation (back to admin)
- **Pass Ticket**: Method: POST; URL: /api/tickets/{id}/pass_ticket/; Permission: IsAssignedEmployee; Description: Transfer to another technician
- **Review**: Method: POST; URL: /api/tickets/{id}/review/; Permission: IsAdminLevel; Description: Admin reviews ticket, sets priority
- **Confirm**: Method: POST; URL: /api/tickets/{id}/confirm_ticket/; Permission: IsAdminLevel; Description: Confirm client verification
- **Escalate External**: Method: POST; URL: /api/tickets/{id}/escalate_external/; Permission: IsAdminOrAssignedEmployee; Description: Escalate to external vendor
- **Close**: Method: POST; URL: /api/tickets/{id}/close_ticket/; Permission: IsAdminLevel; Description: Formally close ticket
- **Start Work**: Method: POST; URL: /api/tickets/{id}/start_work/; Permission: IsAdminOrAssignedEmployee; Description: Technician starts (records time_in)
- **Request Closure**: Method: POST; URL: /api/tickets/{id}/request_closure/; Permission: IsAssignedEmployee; Description: Submit resolution for closure
- **Upload Proof**: Method: POST; URL: /api/tickets/{id}/upload_resolution_proof/; Permission: IsAdminOrAssignedEmployee; Description: Upload resolution proof files
- **Submit Observation**: Method: POST; URL: /api/tickets/{id}/submit_for_observation/; Permission: IsAdminOrAssignedEmployee; Description: Submit for monitoring
- **Save Product**: Method: PATCH; URL: /api/tickets/{id}/save_product_details/; Permission: IsAdminOrAssignedEmployee; Description: Save product/equipment info
- **Update Fields**: Method: PATCH; URL: /api/tickets/{id}/update_employee_fields/; Permission: IsAdminOrAssignedEmployee; Description: Employee updates work fields
- **Link Tickets**: Method: POST; URL: /api/tickets/{id}/link_tickets/; Permission: IsAdminLevel; Description: Link related tickets
- **Update Task**: Method: PATCH; URL: /api/tickets/{id}/update_task/{task_id}/; Permission: IsAdminOrAssignedEmployee; Description: Update sub-task status
- **Delete Attachment**: Method: DELETE; URL: /api/tickets/{id}/delete_attachment/{att_id}/; Permission: IsTicketParticipant; Description: Remove attachment
- **Stats**: Method: GET; URL: /api/tickets/stats/; Permission: IsAuthenticated; Description: Dashboard statistics
- **Messages**: Method: GET; URL: /api/tickets/{id}/messages/; Permission: IsTicketParticipant; Description: Chat message history
- **History**: Method: GET; URL: /api/tickets/{id}/assignment_history/; Permission: IsTicketParticipant; Description: Assignment session history

### Dependencies
- User model (authentication, assignment)
- TypeOfService model (SLA calculation)
- Client and Product models (referenced records)
- AssignmentSession model (work tracking)
- EscalationLog model (escalation tracking)
- Notification model (event notifications)
- AuditLog model (action logging)
- WebSocket channel layer (chat system messages, force_disconnect)

### Data Interactions
- **Creates:** Ticket, TicketAttachment, TicketTask, AssignmentSession, EscalationLog, AuditLog, Notification, Client, Product
- **Reads:** User (for assignment/workload), TypeOfService (for SLA), all ticket-related models
- **Updates:** Ticket (status, fields, assignment), TicketTask (status), AssignmentSession (end session)
- **Deletes:** TicketAttachment (file and record)

---

## Module 2: User Management (`users.views`)

- **Module Name**: User Management
- **Description**: Manages user accounts, authentication, profile updates, and password operations
- **Responsibilities**: JWT authentication; user CRUD (superadmin); profile management; avatar upload; password change/reset; account activation
- **Primary ViewSets**: AuthViewSet`, `UserViewSet`, `CustomTokenObtainPairView
- **Serializers**: UserSerializer`, `AdminUserCreateSerializer
- **Permissions**: IsAuthenticated (profile), IsSuperAdmin (user management)

### Key Actions

- **Login**: Method: POST; URL: /api/auth/login/; Permission: Public; Description: JWT token authentication
- **Token Refresh**: Method: POST; URL: /api/auth/token/refresh/; Permission: Public; Description: Refresh access token
- **Current User**: Method: GET; URL: /api/auth/me/; Permission: IsAuthenticated; Description: Get authenticated user profile
- **Upload Avatar**: Method: POST; URL: /api/auth/upload_avatar/; Permission: IsAuthenticated; Description: Upload profile picture (max 5MB)
- **Remove Avatar**: Method: DELETE; URL: /api/auth/remove_avatar/; Permission: IsAuthenticated; Description: Delete profile picture
- **Update Profile**: Method: PATCH; URL: /api/auth/update_profile/; Permission: IsAuthenticated; Description: Edit name, phone, username
- **Change Password**: Method: POST; URL: /api/auth/change_password/; Permission: IsAuthenticated; Description: Change own password
- **Logout**: Method: POST; URL: /api/auth/logout/; Permission: IsAuthenticated; Description: Clear auth cookies and log logout event
- **Password Reset**: Method: POST; URL: /api/auth/password-reset/; Permission: Public; Description: Request email-based reset
- **Reset by Key**: Method: POST; URL: /api/auth/password-reset-by-key/; Permission: Public; Description: Reset via recovery key
- **Reset Confirm**: Method: POST; URL: /api/auth/password-reset-confirm/; Permission: Public; Description: Complete email-based reset
- **List Users**: Method: GET; URL: /api/users/list_users/; Permission: IsSuperAdmin; Description: List all user accounts
- **Create User**: Method: POST; URL: /api/users/create_user/; Permission: IsSuperAdmin; Description: Create new user account
- **Update User**: Method: PATCH; URL: /api/users/{id}/update_user/; Permission: IsSuperAdmin; Description: Edit user profile/role
- **Toggle Active**: Method: POST; URL: /api/users/{id}/toggle_active/; Permission: IsSuperAdmin; Description: Activate/deactivate account
- **Reset Password**: Method: POST; URL: /api/users/{id}/reset_password/; Permission: IsSuperAdmin; Description: Reset user password

### Dependencies
- Django auth system (AbstractUser, token_generator)
- SimpleJWT (token generation/validation)
- HIBP API (password breach checking)
- AuditLog model (action logging)
- File system (profile picture storage)

---

## Module 3: Real-Time Communication (`tickets.consumers`)

- **Module Name**: Real-Time Communication
- **Description**: WebSocket-based live chat and notification delivery
- **Responsibilities**: Ticket chat (messaging, reactions, read receipts, typing); notification push and management
- **Primary Consumers**: TicketChatConsumer`, `NotificationConsumer
- **Middleware**: `JWTAuthMiddleware` (WebSocket authentication)

### WebSocket Endpoints

- **NotificationConsumer**: URL Pattern: ws/notifications/?token=<jwt>; Purpose: Personal notification channel
- **TicketChatConsumer**: URL Pattern: ws/chat/{ticket_id}/admin_employee/?token=<jwt>; Purpose: Ticket-specific chat

### Chat Consumer Actions

- **send_message**: Direction: Client → Server; Description: Send chat message (content, optional reply_to)
- **typing**: Direction: Client → Server; Description: Toggle typing indicator
- **react**: Direction: Client → Server; Description: Toggle emoji reaction on message
- **mark_read**: Direction: Client → Server; Description: Mark messages as read

### Notification Consumer Actions

- **mark_read**: Direction: Client → Server; Description: Mark specific notification IDs as read
- **mark_all_read**: Direction: Client → Server; Description: Mark all notifications as read

### Dependencies
- Channel layer (InMemory or Redis for production)
- Ticket model (access control)
- AssignmentSession model (session context)
- Message model (persistence)
- Notification model (persistence and dispatch)

---

## Module 4: Audit & Compliance (`tickets.views.audit`)

- **Module Name**: Audit & Compliance
- **Description**: System-wide action audit logging with search, filter, and export capabilities
- **Responsibilities**: Audit log storage; role-scoped access; filtering and search; CSV export; summary statistics
- **Primary ViewSet**: `AuditLogViewSet` (ReadOnlyModelViewSet)
- **Serializers**: AuditLogSerializer
- **Permissions**: IsAuthenticated + IsAdminLevel

### Key Actions

- **List**: Method: GET; URL: /api/audit-logs/; Description: Browse audit logs with filters
- **Retrieve**: Method: GET; URL: /api/audit-logs/{id}/; Description: View single log entry
- **Summary**: Method: GET; URL: /api/audit-logs/summary/; Description: Dashboard statistics
- **Export**: Method: GET; URL: /api/audit-logs/export/; Description: CSV download (max 5,000 records)

### Query Parameters
- `entity` — Filter by entity type
- `action` — Filter by action type
- `actor_email` — Filter by actor email (partial match)
- `search` — Full-text search across activity, email, entity
- `date_from`, `date_to` — Date range filter

### Dependencies
- AuditLog model (data source)
- Django signal handlers (automatic log creation)
- User model (role-scoped visibility)

---

## Module 5: Catalog Management (`tickets.views.catalog`)

- **Module Name**: Catalog Management
- **Description**: CRUD operations for product categories, products/equipment, and client records
- **Responsibilities**: Category CRUD; Product CRUD with search; Client CRUD with ticket linking
- **Primary ViewSets**: CategoryViewSet`, `ProductViewSet`, `ClientViewSet
- **Serializers**: CategorySerializer`, `ProductSerializer`, `ClientSerializer
- **Permissions**: IsAuthenticated (read), IsAdminLevel (write)

### Data Interactions
- Non-admin users see only active records
- Categories link to Products (FK)
- Clients link to Tickets (FK)
- Products link to Tickets (FK)

---

## Module 6: Knowledge Hub (`tickets.views.knowledge`)

- **Module Name**: Knowledge Hub
- **Description**: Publication and consumption of ticket resolution documentation as knowledge articles
- **Responsibilities**: Browse resolution proofs; publish/unpublish articles; archive management; summary stats; employee-facing article search
- **Primary ViewSets**: KnowledgeHubViewSet`, `PublishedArticleViewSet
- **Serializers**: KnowledgeHubAttachmentSerializer`, `PublishedArticleSerializer
- **Permissions**: IsAdminLevel (management), IsAuthenticated (published articles)

---

## Module 7: Support Operations (`tickets.views.support`)

- **Module Name**: Support Operations
- **Description**: Call log tracking and employee feedback ratings
- **Responsibilities**: Call log CRUD with duration tracking; feedback rating submission before closure
- **Primary ViewSets**: CallLogViewSet`, `FeedbackRatingViewSet
- **Serializers**: CallLogSerializer`, `FeedbackRatingSerializer
- **Permissions**: IsAuthenticated + IsAdminLevel

---

## Module 8: System Configuration (`tickets.views.config`)

- **Module Name**: System Configuration
- **Description**: System-wide configuration including data retention policies and announcements
- **Responsibilities**: Retention policy management (singleton); announcement CRUD with scheduling and visibility
- **Primary ViewSets**: RetentionPolicyViewSet`, `AnnouncementViewSet
- **Serializers**: RetentionPolicySerializer`, `AnnouncementSerializer
- **Permissions**: IsSuperAdmin (retention policy), IsAuthenticated (announcements read), IsSuperAdmin (announcements write)

---

## Module 9: Signal Handlers (`tickets.signals`)

- **Module Name**: Event-Driven Side Effects
- **Description**: Django signal handlers that trigger automated actions on model events
- **Responsibilities**: Login/logout audit logging; user creation logging; ticket creation notifications; assignment change notifications; status change notifications; escalation notifications

### Signal Map

- **post_migrate**: Model/Event: App ready; Handler: create_initial_admin; Effect: Creates default admin account
- **user_logged_in**: Model/Event: Auth signal; Handler: audit_user_login; Effect: Audit log + IP capture
- **user_logged_out**: Model/Event: Auth signal; Handler: audit_user_logout; Effect: Audit log + IP capture
- **post_save**: Model/Event: User created; Handler: audit_user_save; Effect: Audit log for user creation
- **post_save**: Model/Event: Ticket created; Handler: notify_ticket_changes; Effect: Notification to all admins
- **pre_save**: Model/Event: Ticket saving; Handler: capture_ticket_old_values; Effect: Store old assignment/status
- **post_save**: Model/Event: Ticket saved; Handler: notify_ticket_assignment_and_status; Effect: Notifications for assignment/status changes
- **post_save**: Model/Event: EscalationLog; Handler: notify_escalation_log; Effect: Notification to escalation target

---

*End of Section 10*


---


<!-- Source: 11-User-Interface-Design.md -->

# 11. USER INTERFACE DESIGN

## 11.1 UI Design Principles

The Maptech Ticketing System frontend follows these design principles:

- **Role-Based Layouts**: Implementation: Each user role (Superadmin, Admin, Sales, Employee) has a dedicated layout with role-appropriate navigation and features
- **Responsive Design**: Implementation: Tailwind CSS utility classes ensure the interface adapts across desktop, tablet, and mobile viewports
- **Dark/Light Theme**: Implementation: User-selectable theme with persistence (ThemeContext + localStorage + Tailwind dark mode)
- **Consistent Navigation**: Implementation: Left sidebar navigation with icon + label for all primary sections; top header with notifications and profile
- **Real-Time Feedback**: Implementation: Toast notifications (Sonner), typing indicators, live message delivery, and badge counts for unread items
- **Progressive Disclosure**: Implementation: Complex forms use collapsible sections and multi-step flows to reduce cognitive load
- **Data Visualization**: Implementation: Recharts-powered dashboard charts for ticket statistics and trends
- **Accessibility**: Implementation: Semantic HTML elements, proper heading hierarchy, keyboard-navigable components

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
🎫 Assigned Tickets
📈 Reports
↗️ Escalation
📚 Knowledge Hub
⚙️ Settings
```

### Sales Navigation

```
📊 Dashboard
🎫 Tickets
➕ Create Ticket
👤 Clients
📦 Products
🖥️ Categories
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

- **Dashboard**: Overview with system-wide statistics, user activity summary, and ticket volume charts
- **Users**: Table of all user accounts with columns: Name, Email, Role, Status, Last Login. Actions: Create, Edit, Toggle Active, Reset Password
- **Audit Logs**: Searchable/filterable table of system actions. Filters: entity type, action type, date range, actor. Export to CSV button
- **Reports**: Analytics dashboards with charts for ticket trends, resolution times, and team performance
- **Settings**: System configuration: Retention policies, announcements management, profile settings

### Admin (Supervisor) Pages

- **Dashboard**: Ticket statistics by status/priority, active ticket count, recent activity feed, charts
- **Tickets**: Table of all tickets with filters (status, priority, date range). Columns: STF#, Client, Status, Priority, Assigned To, Created At
- **Ticket Details**: Full ticket view with: client info, product info, problem description, status timeline, action taken, attachments, chat panel, assignment history, linked tickets
- **Create Ticket**: Multi-section form: Client Information (new/existing), Product/Equipment details, Service Type, Problem Description, Priority, Employee Assignment
- **Escalation**: List of escalated tickets with escalation history and re-assignment options
- **Call Logs**: Table of support calls. Create: client name, phone, ticket link, notes. End call action with auto-duration
- **Knowledge Hub**: Three-tab view: Uploaded (resolution proofs), Published (articles), Archived. Publish, unpublish, archive actions
- **Types of Service**: CRUD table for service types with name, description, SLA days, active status
- **Products**: CRUD table for products with category, brand, model, serial, warranty filters
- **Device/Equipment**: Equipment registry with device details and category assignment
- **Clients**: CRUD table for client organizations with contact details. View client ticket history
- **Audit Logs**: Same as superadmin but scoped to employee-level actions
- **Reports**: Ticket analytics, resolution time trends, technician performance metrics
- **Settings**: Profile editing (name, phone, avatar), password change, announcement viewing

### Sales Pages

- **Dashboard**: Sales overview of intake metrics, ticket trends, and client/product summaries
- **Tickets**: List of sales-created tickets with filters and quick navigation to ticket details
- **Create Ticket**: Multi-step STF creation flow for sales intake, including client call workflow and priority setting
- **Products**: CRUD table for products with category, brand, model, serial, warranty filters
- **Clients**: CRUD table for client organizations with contact details. View client ticket history
- **Categories**: CRUD table for device/equipment categories used in product registration
- **Settings**: Profile editing and password change

### Employee (Technician) Pages

- **Dashboard**: Assigned ticket summary, active ticket count, recent notifications, announcements
- **Assigned Tickets**: List of all tickets assigned to the technician with status/SLA filters
- **Reports**: Personal operational report view for assigned/in-progress/resolved workload
- **Ticket Details**: Ticket view with: problem details, action fields (action_taken, remarks, job_status), product detail form, attachment upload, resolution proof upload, digital signature capture, chat panel with supervisor
- **Knowledge Hub**: Read-only searchable list of published knowledge articles
- **Escalation**: Escalation history and own ticket escalation tracking
- **Settings**: Profile editing, password change

### Authentication Pages

- **Login**: Username/email + password form with "Remember Me" option
- **Forgot Password**: Email input for password reset link; optional recovery key input
- **Signup**: New account registration *(planned)*
- **Privacy Policy**: Static privacy policy page
- **Terms of Service**: Static terms of service page
- **Not Found (404)**: Friendly 404 page with navigation back to dashboard

---

## 11.4 Wireframes

### Ticket Detail View Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Back to Tickets          STF-MT-20260311000001        [Actions ▼] │
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
│  │ • Ticket STF-MT-20260311000001 assigned to Tech A    2 min ago │  │
│  │ • New ticket created for ABC Corp                     5 min ago │  │
│  │ • Ticket STF-MT-20260310000003 closed               15 min ago │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 11.5 UI Accessibility Considerations

- **Semantic HTML**: Implementation: Proper use of `<nav>`, `<main>`, `<article>`, `<section>`, headings hierarchy
- **Keyboard Navigation**: Implementation: All interactive elements are keyboard accessible; focus management for modals
- **Color Contrast**: Implementation: Tailwind color palette ensures WCAG AA contrast ratios in both light and dark modes
- **Screen Reader Support**: Implementation: Descriptive labels on form inputs; aria attributes on interactive components
- **Responsive Layout**: Implementation: Content reflows for different screen sizes; no horizontal scrolling at standard breakpoints
- **Loading States**: Implementation: Visual indicators (spinners, skeleton loaders) communicate pending operations
- **Error States**: Implementation: Clear, descriptive error messages displayed inline with form fields
- **Focus Indicators**: Implementation: Visible focus outlines on interactive elements for keyboard users

---

*End of Section 11*


---


<!-- Source: 12-API-Design.md -->

# 12. API DESIGN

## 12.1 API Overview

The Maptech Ticketing System exposes a RESTful JSON API built on Django REST Framework. All endpoints follow REST conventions and are auto-documented via Swagger/OpenAPI (drf-yasg).

- **Base URL**: `http://localhost:8000/api/` (development)
- **Protocol**: HTTP (development), HTTPS (production recommended)
- **Data Format**: JSON (application/json) for all request/response bodies
- **File Uploads**: Multipart form-data (multipart/form-data)
- **API Documentation**: Swagger UI: `/swagger/` — ReDoc: `/redoc/` — Schema: `/swagger.json`
- **Versioning**: Not currently versioned (single version)
- **Pagination**: Default DRF pagination (configurable)

---

## 12.2 API Authentication

### JWT Authentication

All protected endpoints require a valid JWT access token in the `Authorization` header.

**Token Acquisition:**
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "john_doe",     // or email address
  "password": "secure_pass"
}
```

**Response:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "admin",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Token Usage:**
```http
GET /api/tickets/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Refresh:**
```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Token Configuration

- **Access Token Lifetime**: 1 day
- **Refresh Token Lifetime**: 30 days
- **Token Rotation**: Enabled (new refresh token on each refresh)
- **Blacklist After Rotation**: Disabled

### WebSocket Authentication

WebSocket connections authenticate by passing the JWT token as a query parameter:

```
ws://localhost:8000/ws/notifications/?token=eyJhbGciOiJIUzI1NiIs...
ws://localhost:8000/ws/chat/42/admin_employee/?token=eyJhbGciOiJIUzI1NiIs...
```

---

## 12.3 Endpoint Structure

### Authentication Endpoints

- **/api/auth/login/**: Method: POST; Description: Obtain JWT access + refresh tokens; Auth: Public
- **/api/auth/token/refresh/**: Method: POST; Description: Refresh access token; Auth: Public
- **/api/auth/me/**: Method: GET; Description: Get current user profile; Auth: Required
- **/api/auth/upload_avatar/**: Method: POST; Description: Upload profile picture (max 5MB, image/*); Auth: Required
- **/api/auth/remove_avatar/**: Method: DELETE; Description: Remove profile picture; Auth: Required
- **/api/auth/update_profile/**: Method: PATCH; Description: Update name, phone, username; Auth: Required
- **/api/auth/change_password/**: Method: POST; Description: Change own password; Auth: Required
- **/api/auth/logout/**: Method: POST; Description: Logout and clear auth cookies; Auth: Required
- **/api/auth/password-reset/**: Method: POST; Description: Request password reset (email); Auth: Public
- **/api/auth/password-reset-by-key/**: Method: POST; Description: Reset password via recovery key; Auth: Public
- **/api/auth/password-reset-confirm/**: Method: POST; Description: Confirm email-based password reset; Auth: Public

### User Management Endpoints (Superadmin Only)

- **/api/users/list_users/**: Method: GET; Description: List all users; Auth: Superadmin
- **/api/users/create_user/**: Method: POST; Description: Create new user account; Auth: Superadmin
- **/api/users/{id}/update_user/**: Method: PATCH; Description: Update user profile/role; Auth: Superadmin
- **/api/users/{id}/toggle_active/**: Method: POST; Description: Activate/deactivate account; Auth: Superadmin
- **/api/users/{id}/reset_password/**: Method: POST; Description: Reset user password; Auth: Superadmin

### Ticket Endpoints

- **/api/tickets/**: Method: GET; Description: List tickets (role-scoped); Auth: Required
- **/api/tickets/**: Method: POST; Description: Create new ticket; Auth: Admin-level
- **/api/tickets/{id}/**: Method: GET; Description: Retrieve ticket details; Auth: Required
- **/api/tickets/{id}/**: Method: PUT/PATCH; Description: Update ticket (role-scoped fields); Auth: Required
- **/api/tickets/{id}/**: Method: DELETE; Description: Delete ticket; Auth: Admin-level
- **/api/tickets/{id}/assign/**: Method: POST; Description: Assign/reassign to technician; Auth: Supervisor-level
- **/api/tickets/{id}/escalate/**: Method: POST; Description: Internal escalation; Auth: Employee
- **/api/tickets/{id}/pass_ticket/**: Method: POST; Description: Pass to another technician; Auth: Employee
- **/api/tickets/{id}/review/**: Method: POST; Description: Review ticket, set priority; Auth: Admin-level
- **/api/tickets/{id}/confirm_ticket/**: Method: POST; Description: Confirm client verification; Auth: Admin-level
- **/api/tickets/{id}/escalate_external/**: Method: POST; Description: Escalate to external vendor; Auth: Admin/Employee
- **/api/tickets/{id}/close_ticket/**: Method: POST; Description: Close ticket; Auth: Admin-level
- **/api/tickets/{id}/start_work/**: Method: POST; Description: Start work (record time_in); Auth: Admin/Employee
- **/api/tickets/{id}/request_closure/**: Method: POST; Description: Submit resolution for closure; Auth: Employee
- **/api/tickets/{id}/upload_resolution_proof/**: Method: POST; Description: Upload resolution proof files; Auth: Admin/Employee
- **/api/tickets/{id}/submit_for_observation/**: Method: POST; Description: Submit for monitoring; Auth: Admin/Employee
- **/api/tickets/{id}/save_product_details/**: Method: PATCH; Description: Save product info; Auth: Admin/Employee
- **/api/tickets/{id}/update_employee_fields/**: Method: PATCH; Description: Update work fields; Auth: Admin/Employee
- **/api/tickets/{id}/link_tickets/**: Method: POST; Description: Link related tickets; Auth: Admin-level
- **/api/tickets/{id}/update_task/{task_id}/**: Method: PATCH; Description: Update sub-task status; Auth: Admin/Employee
- **/api/tickets/{id}/delete_attachment/{att_id}/**: Method: DELETE; Description: Remove attachment; Auth: Participant
- **/api/tickets/next_stf_no/**: Method: GET; Description: Preview next STF number; Auth: Required
- **/api/tickets/stats/**: Method: GET; Description: Dashboard statistics; Auth: Required
- **/api/tickets/{id}/messages/**: Method: GET; Description: Chat message history; Auth: Participant
- **/api/tickets/{id}/assignment_history/**: Method: GET; Description: Assignment session history; Auth: Participant

### Catalog Endpoints

- **/api/type-of-service/**: Method: GET; Description: List service types; Auth: Required
- **/api/type-of-service/**: Method: POST; Description: Create service type; Auth: Admin
- **/api/type-of-service/{id}/**: Method: GET/PUT/DELETE; Description: Retrieve/Update/Delete service type; Auth: Admin (write)
- **/api/categories/**: Method: GET; Description: List product categories; Auth: Required
- **/api/categories/**: Method: POST; Description: Create category; Auth: Admin
- **/api/categories/{id}/**: Method: GET/PUT/DELETE; Description: Retrieve/Update/Delete category; Auth: Admin (write)
- **/api/products/**: Method: GET; Description: List products; Auth: Required
- **/api/products/**: Method: POST; Description: Create product; Auth: Admin
- **/api/products/{id}/**: Method: GET/PUT/DELETE; Description: Retrieve/Update/Delete product; Auth: Admin (write)
- **/api/clients/**: Method: GET; Description: List clients; Auth: Required
- **/api/clients/**: Method: POST; Description: Create client; Auth: Admin
- **/api/clients/{id}/**: Method: GET/PUT/DELETE; Description: Retrieve/Update/Delete client; Auth: Admin (write)
- **/api/clients/{id}/tickets/**: Method: GET; Description: Get client's tickets; Auth: Required

### Escalation & Audit Endpoints

- **/api/escalation-logs/**: Method: GET; Description: List escalation logs (role-scoped); Auth: Required
- **/api/escalation-logs/{id}/**: Method: GET; Description: Retrieve escalation log; Auth: Required
- **/api/audit-logs/**: Method: GET; Description: List audit logs (filterable); Auth: Admin
- **/api/audit-logs/{id}/**: Method: GET; Description: Retrieve audit log entry; Auth: Admin
- **/api/audit-logs/summary/**: Method: GET; Description: Audit log dashboard stats; Auth: Admin
- **/api/audit-logs/export/**: Method: GET; Description: Export audit logs as CSV; Auth: Admin

### Support Endpoints

- **/api/call-logs/**: Method: GET/POST; Description: List/Create call logs; Auth: Required (role-scoped)
- **/api/call-logs/{id}/**: Method: GET/PUT/PATCH/DELETE; Description: Retrieve/Update/Delete call log; Auth: Required (role-scoped)
- **/api/call-logs/{id}/end_call/**: Method: POST; Description: End call (set call_end to now); Auth: Required (role-scoped)
- **/api/feedback-ratings/**: Method: GET/POST; Description: List/Create feedback ratings; Auth: Admin-level
- **/api/feedback-ratings/{id}/**: Method: GET/PUT/PATCH/DELETE; Description: Retrieve/Update/Delete feedback rating; Auth: Admin-level

### Knowledge Hub Endpoints

- **/api/knowledge-hub/**: Method: GET; Description: List resolution proofs (filterable); Auth: Admin
- **/api/knowledge-hub/{id}/**: Method: GET; Description: Retrieve proof detail; Auth: Admin
- **/api/knowledge-hub/{id}/publish/**: Method: POST; Description: Publish as knowledge article; Auth: Admin
- **/api/knowledge-hub/{id}/unpublish/**: Method: POST; Description: Unpublish article; Auth: Admin
- **/api/knowledge-hub/{id}/archive/**: Method: POST; Description: Archive article; Auth: Admin
- **/api/knowledge-hub/{id}/unarchive/**: Method: POST; Description: Unarchive article; Auth: Admin
- **/api/knowledge-hub/summary/**: Method: GET; Description: Knowledge Hub statistics; Auth: Admin
- **/api/published-articles/**: Method: GET; Description: List published articles; Auth: Required
- **/api/published-articles/{id}/**: Method: GET; Description: Retrieve published article; Auth: Required

### Notification Endpoints

- **/api/notifications/**: Method: GET; Description: List user's notifications; Auth: Required
- **/api/notifications/{id}/**: Method: GET; Description: Retrieve notification; Auth: Required
- **/api/notifications/unread_count/**: Method: GET; Description: Get unread notification count; Auth: Required
- **/api/notifications/mark_read/**: Method: POST; Description: Mark specific notifications as read; Auth: Required
- **/api/notifications/mark_all_read/**: Method: POST; Description: Mark all notifications as read; Auth: Required
- **/api/notifications/clear_all/**: Method: POST; Description: Delete all notifications; Auth: Required

### Configuration Endpoints

- **/api/retention-policy/**: Method: GET; Description: Get current retention policy; Auth: Superadmin
- **/api/retention-policy/**: Method: POST; Description: Update retention policy; Auth: Superadmin
- **/api/announcements/**: Method: GET; Description: List announcements (role-scoped visibility); Auth: Required
- **/api/announcements/**: Method: POST; Description: Create announcement; Auth: Superadmin
- **/api/announcements/{id}/**: Method: GET/PUT/DELETE; Description: Retrieve/Update/Delete announcement; Auth: Superadmin (write)

### Employee List Endpoint

- **/api/employees/**: Method: GET; Description: List employees with active ticket counts; Auth: Required
- **/api/sales-users/**: Method: GET; Description: List active sales users; Auth: Required
- **/api/supervisors/**: Method: GET; Description: List active supervisors; Auth: Required

---

## 12.4 Request and Response Format

### Standard Success Response

```json
// Single Object
{
  "id": 1,
  "stf_no": "STF-MT-20260311000001",
  "status": "open",
  "priority": "high",
  "created_at": "2026-03-11T08:30:00Z"
}

// List Response
[
  { "id": 1, "stf_no": "STF-MT-20260311000001", ... },
  { "id": 2, "stf_no": "STF-MT-20260311000002", ... }
]
```

### Create Ticket Request Example

```json
POST /api/tickets/
Authorization: Bearer <token>
Content-Type: application/json

{
  "type_of_service": 1,
  "description_of_problem": "Printer not responding to print commands",
  "preferred_support_type": "onsite",
  "priority": "high",
  "client": "ABC Corporation",
  "contact_person": "John Smith",
  "mobile_no": "09171234567",
  "email_address": "john@abc.com",
  "address": "123 Main St, Makati",
  "department_organization": "IT Department",
  "assign_to": 5,
  "is_existing_client": false
}
```

### Assign Ticket Request

```json
POST /api/tickets/42/assign/
Authorization: Bearer <token>
Content-Type: application/json

{
  "employee_id": 5
}
```

---

## 12.5 Error Handling

### Standard Error Responses

- **400**: Meaning: Bad Request — Invalid input data; Example: {"detail": "Resolution proof is required before requesting closure."}
- **401**: Meaning: Unauthorized — No or invalid token; Example: {"detail": "Authentication credentials were not provided."}
- **403**: Meaning: Forbidden — Insufficient permissions; Example: {"detail": "Only admins can perform this action."}
- **404**: Meaning: Not Found — Resource doesn't exist; Example: {"detail": "Not found."}
- **405**: Meaning: Method Not Allowed; Example: {"detail": "Method \"DELETE\" not allowed."}
- **500**: Meaning: Internal Server Error; Example: {"detail": "Internal server error."}

### Validation Error Format

```json
{
  "field_name": ["Error message 1", "Error message 2"],
  "another_field": ["This field is required."]
}
```

### WebSocket Error Messages

```json
{
  "type": "error",
  "message": "You are not a participant of this ticket."
}
```

---

## 12.6 WebSocket API

### Notification WebSocket

**URL:** `ws://localhost:8000/ws/notifications/?token=<jwt>`

**Server → Client Messages:**

```json
// New notification
{
  "type": "new_notification",
  "notification": {
    "id": 42,
    "notification_type": "assignment",
    "title": "New Ticket Assigned",
    "message": "You have been assigned ticket STF-MT-20260311000001",
    "ticket_id": 1,
    "is_read": false,
    "created_at": "2026-03-11T10:00:00Z"
  },
  "unread_count": 5
}

// Unread count update
{
  "type": "unread_count",
  "count": 3
}
```

**Client → Server Messages:**

```json
// Mark specific notifications as read
{
  "action": "mark_read",
  "notification_ids": [1, 2, 3]
}

// Mark all as read
{
  "action": "mark_all_read"
}
```

### Chat WebSocket

**URL:** `ws://localhost:8000/ws/chat/{ticket_id}/admin_employee/?token=<jwt>`

**Server → Client Messages:**

```json
// Chat message
{
  "type": "chat_message",
  "message": {
    "id": 100,
    "sender_id": 1,
    "sender_username": "admin1",
    "sender_role": "admin",
    "content": "Please check the printer status",
    "reply_to": null,
    "is_system_message": false,
    "reactions": {},
    "read_by": [],
    "created_at": "2026-03-11T10:30:00Z"
  }
}

// Typing indicator
{
  "type": "typing_indicator",
  "user_id": 1,
  "username": "admin1",
  "is_typing": true
}

// System message
{
  "type": "system_message",
  "message": { ... }
}

// Force disconnect
{
  "type": "force_disconnect",
  "reason": "You have been reassigned from this ticket."
}
```

**Client → Server Messages:**

```json
// Send message
{
  "action": "send_message",
  "content": "Printer is offline, need replacement parts",
  "reply_to": 100
}

// Typing indicator
{
  "action": "typing",
  "is_typing": true
}

// React to message
{
  "action": "react",
  "message_id": 100,
  "emoji": "👍"
}

// Mark messages as read
{
  "action": "mark_read",
  "message_ids": [100, 101, 102]
}
```

---

*End of Section 12*


---


<!-- Source: 13-Security-Architecture.md -->

# 13. SECURITY ARCHITECTURE

## 13.1 Security Policies

The Maptech Ticketing System implements a defense-in-depth security model with the following policies:

- **Least Privilege**: Users are granted only the permissions necessary for their role. Employees cannot access admin functions; admins cannot access superadmin functions.
- **Authentication Required**: All API endpoints (except login and password reset) require valid JWT authentication.
- **Secure Password Storage**: Passwords are never stored in plaintext. Argon2 hashing (memory-hard, GPU-resistant) is used as the primary algorithm.
- **Password Breach Checking**: New and changed passwords are validated against the HIBP (Have I Been Pwned) database to prevent use of known compromised credentials.
- **Audit Trail**: All significant system actions are logged with actor identity, timestamp, IP address, and change details.
- **Input Validation**: All API input is validated through DRF serializers before processing.
- **CORS Protection**: Cross-origin requests are restricted to explicitly allowed origins.
- **Session Rotation**: JWT refresh tokens rotate on each use, limiting the window of token reuse.

---

## 13.2 Access Control Model

### Role-Based Access Control (RBAC)

The system implements RBAC with four hierarchical roles:

![Diagram 16](./images/diagram-16.png)

### Permission Classes

The system uses seven custom DRF permission classes, enforced at the API endpoint level:

- **IsEmployee**: Logic: user.is_authenticated AND user.role == 'employee'
- **IsAdminLevel**: Logic: user.is_authenticated AND user.role IN ('sales', 'admin', 'superadmin')
- **IsSupervisorLevel**: Logic: `user.is_authenticated AND user.role IN ('admin', 'superadmin')` (excludes sales)
- **IsSuperAdmin**: Logic: user.is_authenticated AND user.role == 'superadmin'
- **IsAssignedEmployee**: Logic: user.is_authenticated AND user.role == 'employee' AND ticket.assigned_to == user
- **IsAdminOrAssignedEmployee**: Logic: IsAdminLevel OR IsAssignedEmployee
- **IsTicketParticipant**: Logic: IsAdminLevel OR (IsEmployee AND ticket.assigned_to == user)

### Object-Level Security

Beyond permission classes, the system implements object-level filtering:

- **Ticket List**: Filtering Logic: Admins see all tickets; employees see only assigned tickets
- **Audit Logs**: Filtering Logic: Superadmins see admin+employee logs; admins see only employee logs
- **Escalation Logs**: Filtering Logic: Admins see all; employees see only logs involving themselves
- **Notifications**: Filtering Logic: Each user sees only their own notifications
- **Knowledge Hub**: Filtering Logic: Admins manage all articles; employees see only published articles
- **Service Types/Products/Clients**: Filtering Logic: Non-admins see only active records
- **Announcements**: Filtering Logic: Filtered by visibility (all/admin/employee) and date range

### WebSocket Access Control

- **NotificationConsumer**: Access Rule: Must be authenticated; joins personal group `notifications_{user_id}`
- **TicketChatConsumer**: Access Rule: Must be authenticated; must be admin or currently assigned employee for the specific ticket

---

## 13.3 Data Protection

### Password Security

- **Hashing Algorithm**: Implementation: Argon2 (primary) — memory-hard, resistant to GPU/ASIC attacks
- **Fallback Hashers**: Implementation: PBKDF2SHA256, PBKDF2SHA1, BCryptSHA256, Scrypt (for migration compatibility)
- **Minimum Length**: Implementation: 8 characters enforced at application level
- **Breach Detection**: Implementation: Passwords checked against HIBP API using k-anonymity (only first 5 chars of SHA-1 hash sent)
- **Recovery Keys**: Implementation: Auto-generated 32-character keys (xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx format) for account recovery
- **Default Passwords**: Implementation: New accounts created with temporary password; password change encouraged

### Data Sensitivity Classification

- **Passwords**: Sensitivity: Critical; Protection: Argon2 hashed, never exposed via API
- **JWT Tokens**: Sensitivity: High; Protection: Short-lived, signed with SECRET_KEY
- **Recovery Keys**: Sensitivity: High; Protection: Stored in database, shown only to account owner
- **User Emails**: Sensitivity: Medium; Protection: Unique constraint, used for authentication
- **Audit Logs**: Sensitivity: Medium; Protection: Immutable, accessible only to admins
- **Client Information**: Sensitivity: Medium; Protection: Accessible only to authenticated users
- **Ticket Attachments**: Sensitivity: Medium; Protection: Stored in media directory, served via Django
- **System Configuration**: Sensitivity: Low-Medium; Protection: Accessible only to superadmins

### File Upload Security

- **Profile Pictures**: Implementation: Must be image/* MIME type; max 5MB; stored in `media/profile_pictures/`
- **Ticket Attachments**: Implementation: Stored in `media/ticket_attachments/YYYY/MM/DD/`; uploaded via authenticated endpoint
- **File Deletion**: Implementation: Only the uploader or an admin can delete attachments; file removed from storage on delete

---

## 13.4 Secure Communication

- **HTTP Transport**: Security Mechanism: HTTPS recommended for production (SSL/TLS encryption)
- **WebSocket Transport**: Security Mechanism: WSS (WebSocket Secure) recommended for production
- **API Authentication**: Security Mechanism: JWT Bearer tokens in HTTP Authorization header
- **WebSocket Authentication**: Security Mechanism: JWT token in query string parameter, validated by custom middleware
- **CORS**: Security Mechanism: Cross-Origin Resource Sharing restricted to configured allowed origins
- **CSRF**: Security Mechanism: Django CSRF middleware active; DRF uses JWT authentication (CSRF not required for token auth)
- **Security Headers**: Security Mechanism: Django SecurityMiddleware provides: X-Content-Type-Options, X-XSS-Protection, Referrer-Policy
- **Clickjacking Protection**: Security Mechanism: XFrameOptionsMiddleware prevents embedding in iframes

---

## 13.5 Audit Logging

### What Is Logged

- **Authentication**: Actions Logged: LOGIN, LOGOUT (with IP address and user agent)
- **User Management**: Actions Logged: CREATE (new user), UPDATE (role/profile changes), PASSWORD_RESET, activation toggles
- **Ticket Lifecycle**: Actions Logged: CREATE, UPDATE, STATUS_CHANGE, ASSIGN, ESCALATE, CLOSE, RESOLVE, CONFIRM, OBSERVE, UNRESOLVED
- **Attachments**: Actions Logged: UPLOAD (resolution proofs)
- **Escalation**: Actions Logged: ESCALATE (internal/external), PASS (between employees)
- **Ticket Links**: Actions Logged: LINK (linking related tickets)

### Audit Log Entry Structure

Each audit log entry captures:

```json
{
  "timestamp": "2026-03-11T10:30:00.000Z",
  "entity": "Ticket",
  "entity_id": 42,
  "action": "STATUS_CHANGE",
  "activity": "Ticket STF-MT-20260311000001 status changed from 'open' to 'in_progress'",
  "actor": 5,
  "actor_email": "technician@maptech.com",
  "ip_address": "192.168.1.100",
  "changes": {
    "status": {"old": "open", "new": "in_progress"},
    "time_in": {"old": null, "new": "2026-03-11T10:30:00Z"}
  }
}
```

### Audit Log Access Control

- **Superadmin**: Visibility: Sees logs where actor role is admin or employee (or actor is null)
- **Admin**: Visibility: Sees logs where actor role is employee only
- **Employee**: Visibility: No access to audit logs

### Audit Log Retention

- Configurable via RetentionPolicy model (singleton)
- Default: 365 days for both audit logs and call logs
- Set to 0 to retain indefinitely
- Managed by superadmins only

### Audit Log Export

- CSV export available at `/api/audit-logs/export/`
- Limited to 5,000 records per export
- Supports same filters as list view
- Columns: Timestamp, Entity, Entity ID, Activity, Action, Actor Name, Actor Email, IP Address, Changes

---

*End of Section 13*


---


<!-- Source: 14-System-Integration.md -->

# 14. SYSTEM INTEGRATION

## 14.1 External System Integration

- **HIBP (Have I Been Pwned)**: Integration Method: REST API (HTTPS); Status: Active; Description: Password breach checking during password changes and resets. Uses k-anonymity model — only first 5 characters of SHA-1 hash are sent to the API.
- **Email Service**: Integration Method: SMTP (Planned); Status: Planned; Description: Password reset emails — currently generates reset tokens but does not send emails. The reset URL, UID, and token are returned in the API response for frontend to handle.
- **Azure Active Directory**: Integration Method: MSAL (OAuth 2.0); Status: Available (Frontend 1); Description: Azure AD SSO integration is configured in the legacy frontend (`@azure/msal-browser`). Not actively used in the primary frontend.
- **Google OAuth**: Integration Method: OAuth 2.0; Status: Available (Frontend 1); Description: Google sign-in via `@react-oauth/google` configured in the legacy frontend. Not actively used in the primary frontend.
- **External Vendors/Distributors**: Integration Method: Manual (In-System Notes); Status: Active (Manual); Description: External escalation information is recorded within the ticketing system (vendor name, notes, timestamp) but there is no automated API integration with external vendor systems.

### HIBP Integration Details

```
Password Change/Reset Flow:
    1. User submits new password
    2. Server computes SHA-1 hash of password
    3. First 5 characters of hash sent to: https://api.pwnedpasswords.com/range/{prefix}
    4. API returns all hashes matching prefix
    5. Server checks if full hash appears in response
    6. If match found:
       - Password change: warns but allows (user informed of breach)
       - Password reset (by key/token): rejects the password
```

---

## 14.2 Data Exchange Formats

- **JSON**: Usage: Primary data exchange format for all REST API request/response bodies. Used for WebSocket message payloads as well.
- **CSV**: Usage: Used for audit log export (`/api/audit-logs/export/`). Columns include timestamp, entity, action, activity, actor details, IP address, and changes.
- **Excel (XLSX)**: Usage: Supported via the `xlsx-js-style` frontend library for client-side data export with styled formatting.
- **Multipart/Form-Data**: Usage: Used for file uploads including ticket attachments and profile pictures.
- **Base64**: Usage: Used for digital signature storage. Client signature images are captured on the frontend and stored as Base64-encoded strings in the `signature` field.
- **JWT (JSON Web Token)**: Usage: Used for authentication tokens. Access and refresh tokens are Base64-encoded JSON payloads signed with HMAC-SHA256.
- **ISO 8601**: Usage: All datetime values in API responses use ISO 8601 format (e.g., `2026-03-11T10:30:00.000Z`).

---

## 14.3 Internal System Communication

### Frontend ↔ Backend Communication

![Diagram 17](./images/diagram-17.png)

### Development Proxy Configuration

![Diagram 18](./images/diagram-18.png)

### Signal-Based Internal Integration

Django signals provide event-driven integration between system modules:

![Diagram 19](./images/diagram-19.png)

---

*End of Section 14*


---


<!-- Source: 15-Testing-Strategy.md -->

# 15. TESTING STRATEGY

## 15.1 Testing Objectives

The testing strategy for the Maptech Ticketing System aims to:

1. **Verify Functional Correctness** — Ensure all ticket lifecycle operations, role-based access controls, and business logic perform as specified.
2. **Validate Security Controls** — Confirm authentication, authorization, and data protection mechanisms work correctly.
3. **Ensure Real-Time Reliability** — Verify WebSocket communication (chat and notifications) operates reliably under various conditions.
4. **Confirm Data Integrity** — Validate that all CRUD operations maintain referential integrity and produce correct audit trails.
5. **Assess User Experience** — Ensure the frontend provides responsive, intuitive interactions across supported browsers and devices.

---

## 15.2 Test Types

### Unit Testing

- **Scope**: Individual model methods, serializer validation, utility functions, permission classes
- **Framework**: Django TestCase / pytest-django (backend), Jest / Vitest (frontend)
- **Focus Areas**: STF number generation, SLA calculation, progress percentage, password hashing, role-based field filtering, phone number formatting, username generation
- **Execution**: Automated, run on every code change

### Integration Testing

- **Scope**: API endpoint behavior including authentication, serialization, database operations, and permission enforcement
- **Framework**: Django REST Framework APITestCase
- **Focus Areas**: Ticket CRUD lifecycle, assignment/reassignment flows, escalation workflows, notification dispatch, audit log creation, file upload/delete, WebSocket connection/message flow
- **Execution**: Automated, run as part of CI pipeline

### System Testing

- **Scope**: End-to-end workflows spanning frontend and backend
- **Framework**: Manual testing or Playwright/Cypress for browser automation
- **Focus Areas**: Complete ticket lifecycle (create → assign → work → resolve → close), chat communication flow, notification delivery, dashboard data accuracy, PDF/Excel export, dark mode rendering
- **Execution**: Semi-automated or manual, run before releases

### User Acceptance Testing (UAT)

- **Scope**: Business workflow validation by actual end users
- **Participants**: Supervisors, technicians, management representatives
- **Focus Areas**: Usability, workflow correctness, data accuracy, reporting quality, real-world scenarios
- **Execution**: Manual, conducted during pre-release phase

---

## 15.3 Test Environment

- **Development**: Purpose: Unit and integration testing during development; Configuration: SQLite database, InMemory channel layer, Vite dev server with proxy
- **Staging**: Purpose: System and UAT testing before production deployment; Configuration: PostgreSQL database, Redis channel layer, production-like configuration
- **Production**: Purpose: Smoke testing after deployment; Configuration: Live environment with monitoring; read-only verification tests

### Test Data Management

- **Fixtures**: Predefined test data for service types, categories, and initial admin account
- **Factory Pattern**: Generate test data dynamically for users, tickets, clients, and products
- **Database Reset**: Test database is recreated for each test suite run
- **Mock Data**: Frontend uses `mockTickets.ts` for UI development and testing without backend

---

## 15.4 Test Cases Structure

### Authentication Test Cases

- **TC-AUTH-001**: Description: Login with valid username and password; Expected Result: Returns 200 with JWT access and refresh tokens
- **TC-AUTH-002**: Description: Login with valid email and password; Expected Result: Returns 200 with JWT tokens (email fallback)
- **TC-AUTH-003**: Description: Login with invalid credentials; Expected Result: Returns 401 Unauthorized
- **TC-AUTH-004**: Description: Login with deactivated account; Expected Result: Returns 401 Unauthorized
- **TC-AUTH-005**: Description: Access protected endpoint without token; Expected Result: Returns 401 "Authentication credentials not provided"
- **TC-AUTH-006**: Description: Access protected endpoint with expired token; Expected Result: Returns 401 "Token is invalid or expired"
- **TC-AUTH-007**: Description: Refresh token with valid refresh token; Expected Result: Returns new access token
- **TC-AUTH-008**: Description: Change password with valid current password; Expected Result: Returns 200 with new tokens
- **TC-AUTH-009**: Description: Change password with breached password; Expected Result: Returns 200 with warning (non-blocking)
- **TC-AUTH-010**: Description: Reset password by recovery key; Expected Result: Returns 200. Password changed.
- **TC-AUTH-011**: Description: Reset password with invalid recovery key; Expected Result: Returns 400 "Invalid recovery key"

### Ticket Lifecycle Test Cases

- **TC-TKT-001**: Description: Admin creates ticket with all fields; Expected Result: Ticket created with auto STF number; client/product records created
- **TC-TKT-002**: Description: Admin creates ticket with existing client; Expected Result: Ticket linked to existing client_record
- **TC-TKT-003**: Description: Admin assigns ticket to employee; Expected Result: AssignmentSession created; notification sent; status unchanged
- **TC-TKT-004**: Description: Admin reassigns ticket to different employee; Expected Result: Old session ended; new session created; force_disconnect sent
- **TC-TKT-005**: Description: Employee starts work on assigned ticket; Expected Result: time_in recorded; status → in_progress
- **TC-TKT-006**: Description: Employee updates action_taken, remarks; Expected Result: Fields updated; non-allowed fields ignored
- **TC-TKT-007**: Description: Employee uploads resolution proof; Expected Result: Attachment created with is_resolution_proof=True
- **TC-TKT-008**: Description: Employee requests closure without proof; Expected Result: Returns 400 "Resolution proof required"
- **TC-TKT-009**: Description: Employee requests closure with proof; Expected Result: Status → pending_closure; time_out recorded
- **TC-TKT-010**: Description: Admin closes ticket with feedback rating; Expected Result: Status → closed; session ended; feedback rating recorded
- **TC-TKT-011**: Description: Employee views only assigned tickets; Expected Result: Only assigned tickets returned in list
- **TC-TKT-012**: Description: Admin views all tickets; Expected Result: All tickets returned in list
- **TC-TKT-013**: Description: STF number uniqueness; Expected Result: Concurrent creation produces unique STF numbers

### Escalation Test Cases

- **TC-ESC-001**: Description: Employee escalates internally; Expected Result: Status → escalated; session ended; admin notified
- **TC-ESC-002**: Description: Employee passes to another employee; Expected Result: New session created; new employee notified; old employee disconnected
- **TC-ESC-003**: Description: Admin escalates externally; Expected Result: Status → escalated_external; external vendor info recorded
- **TC-ESC-004**: Description: Non-assigned employee tries to escalate; Expected Result: Returns 403 "Only assigned employee"

### Permission Test Cases

- **TC-PERM-001**: Description: Employee tries to create ticket; Expected Result: Returns 403 or handled by role-based logic
- **TC-PERM-002**: Description: Employee tries to close ticket; Expected Result: Returns 403 "Only admins"
- **TC-PERM-003**: Description: Admin tries to manage users; Expected Result: Returns 403 "Only superadmins"
- **TC-PERM-004**: Description: Admin tries to access retention policy; Expected Result: Returns 403 "Only superadmins"
- **TC-PERM-005**: Description: Employee tries to access audit logs; Expected Result: Returns 403 "Only admins"
- **TC-PERM-006**: Description: Unauthenticated user tries to access tickets; Expected Result: Returns 401

### WebSocket Test Cases

- **TC-WS-001**: Description: Connect to notifications with valid token; Expected Result: Connection accepted; unread count sent
- **TC-WS-002**: Description: Connect to notifications without token; Expected Result: Connection rejected
- **TC-WS-003**: Description: Connect to chat as assigned employee; Expected Result: Connection accepted; message history sent
- **TC-WS-004**: Description: Connect to chat as non-assigned employee; Expected Result: Connection rejected
- **TC-WS-005**: Description: Send message in chat; Expected Result: Message stored and broadcast to group
- **TC-WS-006**: Description: React to message with emoji; Expected Result: Reaction toggled; update broadcast
- **TC-WS-007**: Description: Mark messages as read; Expected Result: Read receipts created; update broadcast
- **TC-WS-008**: Description: Receive notification after ticket assignment; Expected Result: Notification pushed to assigned employee's WebSocket

### Knowledge Hub Test Cases

- **TC-KH-001**: Description: Admin publishes resolution proof; Expected Result: Article visible to all authenticated users
- **TC-KH-002**: Description: Admin unpublishes article; Expected Result: Article no longer visible in published list
- **TC-KH-003**: Description: Employee searches published articles; Expected Result: Returns matching articles by title/description
- **TC-KH-004**: Description: Admin archives published article; Expected Result: Article moves to archived status

---

*End of Section 15*


---


<!-- Source: 16-Deployment-Architecture.md -->

# 16. DEPLOYMENT ARCHITECTURE

## 16.1 Deployment Strategy

The Maptech Ticketing System supports two deployment configurations:

- **Development**: Single-machine deployment with Vite dev server (frontend) + Daphne (backend) + SQLite + InMemory channel layer
- **Production**: Reverse proxy (Nginx/Caddy) + ASGI server (Daphne/Uvicorn) + PostgreSQL + Redis + static file serving (CDN or Whitenoise)

### Deployment Approach

- **Frontend:** Build the React SPA to static assets (`npm run build`), then serve via Nginx or the Django backend (Whitenoise).
- **Backend:** Run through Daphne (ASGI server) to support both HTTP and WebSocket connections.
- **Database:** SQLite for development; PostgreSQL for production (concurrent access, better performance).
- **Channel Layer:** InMemory for development; Redis for production (multi-process WebSocket support).

---

## 16.2 Deployment Environment

- **Local Development**: Purpose: Developer workstation; Database: SQLite; Channel Layer: InMemoryChannelLayer; Frontend: Vite dev server (port 3000) with proxy
- **Staging**: Purpose: Pre-production testing; Database: PostgreSQL; Channel Layer: Redis; Frontend: Static build served by Nginx
- **Production**: Purpose: Live system; Database: PostgreSQL; Channel Layer: Redis; Frontend: Static build served by Nginx/CDN

---

## 16.3 Infrastructure Setup

### Development Environment Setup

**Backend:**
```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with required variables
# SECRET_KEY, DEBUG, CORS_ALLOWED_ORIGINS, etc.

# Run migrations
python manage.py migrate

# Create initial data
python manage.py loaddata initial_data  # if fixtures exist

# Start development server (Daphne ASGI)
python manage.py runserver 0.0.0.0:8000
```

**Frontend (Primary — Maptech_FrontendUI-main):**
```powershell
# Navigate to frontend directory
cd Maptech_FrontendUI-main

# Install dependencies
npm install

# Start development server
npm run dev
# → Serves on http://localhost:3000
# → Proxies /api, /media, /ws to http://localhost:8000
```

### Production Environment Setup (Recommended)

**System Requirements:**
- Ubuntu 22.04+ or equivalent Linux distribution
- Python 3.10+
- Node.js 18+ (for build step only)
- PostgreSQL 14+
- Redis 7+
- Nginx 1.22+

**Backend Deployment:**
```bash
# Clone repository
git clone <repo_url>
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install production dependencies
pip install -r requirements.txt
pip install gunicorn  # optional: for HTTP-only serving

# Configure environment variables
cp .env.example .env
# Edit .env: SECRET_KEY, DATABASE_URL, REDIS_URL, ALLOWED_HOSTS, etc.

# Run migrations
python manage.py migrate
python manage.py collectstatic --noinput

# Start with Daphne (supports HTTP + WebSocket)
daphne -b 0.0.0.0 -p 8000 tickets_backend.asgi:application
```

**Frontend Build:**
```bash
cd Maptech_FrontendUI-main
npm ci
npm run build
# Output in dist/ — serve via Nginx
```

**Nginx Configuration (Reference):**
```nginx
upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 443 ssl;
    server_name ticketing.maptech.com;

    ssl_certificate /etc/ssl/certs/maptech.pem;
    ssl_certificate_key /etc/ssl/private/maptech.key;

    # Frontend static files
    root /var/www/ticketing/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Media files
    location /media/ {
        alias /var/www/ticketing/backend/media/;
    }

    # WebSocket proxy
    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files (Django admin, DRF)
    location /static/ {
        alias /var/www/ticketing/backend/staticfiles/;
    }
}
```

---

## 16.4 CI/CD Pipeline

### Recommended CI/CD Workflow

![Diagram 20](./images/diagram-20.png)

### Pipeline Stages

- **Lint**: Backend: `flake8` / `ruff` Python linting; Frontend: `eslint` TypeScript linting
- **Type Check**: Backend: `mypy` (optional); Frontend: `tsc --noEmit` TypeScript checking
- **Unit Test**: Backend: python manage.py test` / `pytest; Frontend: `npm run test` (Vitest/Jest)
- **Integration Test**: Backend: DRF APITestCase; Frontend: Playwright/Cypress E2E
- **Build**: Backend: collectstatic; Frontend: npm run build
- **Deploy**: Backend: Copy to server, restart Daphne; Frontend: Copy dist/ to Nginx root

### Environment Variables

- **SECRET_KEY**: Description: Django secret key for cryptographic signing; Required: Yes
- **DEBUG**: Description: Debug mode (False in production); Required: Yes
- **DATABASE_URL**: Description: PostgreSQL connection string (production); Required: Production
- **REDIS_URL**: Description: Redis connection string for channel layer; Required: Production
- **ALLOWED_HOSTS**: Description: Comma-separated list of allowed hostnames; Required: Yes
- **CORS_ALLOWED_ORIGINS**: Description: Comma-separated list of allowed frontend origins; Required: Yes
- **CORS_ALLOW_ALL_ORIGINS**: Description: Allow all origins (development only); Required: Development

---

*End of Section 16*


---


<!-- Source: 17-System-Operations.md -->

# 17. SYSTEM OPERATIONS

## 17.1 Operational Overview

This section defines the monitoring, logging, backup, and incident management procedures for the Maptech Ticketing System in a production environment.

---

## 17.2 Monitoring

### Application Monitoring

- **Django Backend**: Metric: Request latency, error rates (4xx/5xx), active connections; Recommended Tool: Prometheus + Grafana / New Relic
- **Daphne ASGI**: Metric: WebSocket connection count, memory usage, CPU; Recommended Tool: Process monitoring (systemd, supervisord)
- **PostgreSQL**: Metric: Query performance, connection pool, disk I/O; Recommended Tool: pg_stat_statements, pgAdmin
- **Redis**: Metric: Memory usage, connected clients, pub/sub channels; Recommended Tool: Redis CLI / RedisInsight
- **Frontend (SPA)**: Metric: Page load time, API call latency, JavaScript errors; Recommended Tool: Sentry / LogRocket

### Infrastructure Monitoring

- **CPU Usage**: Threshold: > 80% sustained; Alert: Warning
- **Memory Usage**: Threshold: > 85%; Alert: Warning
- **Disk Space**: Threshold: > 90%; Alert: Critical
- **WebSocket Connections**: Threshold: > 500 concurrent; Alert: Warning
- **API Response Time**: Threshold: > 2 seconds (p95); Alert: Warning
- **Error Rate (5xx)**: Threshold: > 1%; Alert: Critical

### Health Check Endpoints

The system provides the following endpoints for health monitoring:

- **GET /api/**: Purpose: API root — confirms DRF is running
- **GET /api/schema/swagger/**: Purpose: Swagger UI — confirms documentation service
- **GET /admin/**: Purpose: Django Admin — confirms template rendering
- **ws://host/ws/notifications/**: Purpose: WebSocket connectivity test

### Uptime Monitoring

- **External Ping:** Use UptimeRobot or Pingdom to monitor the public endpoint every 60 seconds.
- **Internal Check:** Scheduled health checks via cron or systemd timers that hit the API root and verify a 200 response.

---

## 17.3 Logging

### Backend Logging Architecture

Django's built-in logging framework is used with Python's `logging` module.

**Log Levels:**

- **DEBUG**: Usage: Detailed diagnostic information (development only)
- **INFO**: Usage: General operational events (user login, ticket creation)
- **WARNING**: Usage: Unexpected conditions that don't halt operation
- **ERROR**: Usage: Errors that prevent a specific operation
- **CRITICAL**: Usage: System-wide failures requiring immediate attention

**Recommended Logging Configuration:**
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/maptech/ticketing.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {'handlers': ['file', 'console'], 'level': 'INFO'},
        'tickets': {'handlers': ['file', 'console'], 'level': 'INFO'},
        'users': {'handlers': ['file', 'console'], 'level': 'INFO'},
    },
}
```

### Application-Level Audit Logging

The system has a built-in `AuditLog` model that records:

- **user**: The user who performed the action
- **action**: Description of the action taken
- **model_name**: The model affected (e.g., Ticket, User)
- **object_id**: The primary key of the affected record
- **changes**: JSON field containing before/after values
- **ip_address**: The IP address of the request
- **created_at**: Timestamp of the action

**Audit events are automatically captured via Django signals for:**
- Ticket creation, updates, assignments, and status changes
- User creation and profile updates
- Escalation events
- Message sending and reactions

### Log Retention

- **Application logs**: Retention Period: 90 days; Storage: Filesystem / Log aggregator
- **Audit logs (database)**: Retention Period: Governed by `RetentionPolicy` model; Storage: Database
- **Access logs (Nginx)**: Retention Period: 30 days; Storage: Filesystem
- **Error logs**: Retention Period: 180 days; Storage: Filesystem / Error tracker

---

## 17.4 Backup and Recovery

### Backup Strategy

- **Database (PostgreSQL)**: Method: `pg_dump` full backup; Frequency: Daily (2:00 AM); Retention: 30 days
- **Database (PostgreSQL)**: Method: WAL archiving (point-in-time); Frequency: Continuous; Retention: 7 days
- **Media Files**: Method: File-level backup (rsync); Frequency: Daily; Retention: 30 days
- **Application Code**: Method: Git repository; Frequency: On every commit; Retention: Indefinite
- **Configuration**: Method: Encrypted backup of `.env` files; Frequency: Weekly; Retention: 90 days

### Backup Procedures

**Database Backup (PostgreSQL):**
```bash
#!/bin/bash
# Daily database backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
pg_dump -h localhost -U maptech_user maptech_db \
  --format=custom \
  --file="${BACKUP_DIR}/maptech_${TIMESTAMP}.dump"

# Remove backups older than 30 days
find ${BACKUP_DIR} -name "*.dump" -mtime +30 -delete
```

**Media Files Backup:**
```bash
#!/bin/bash
# Daily media backup
rsync -avz --delete \
  /var/www/ticketing/backend/media/ \
  /backups/media/
```

### Recovery Procedures

**Database Recovery:**
```bash
# Full restore from backup
pg_restore -h localhost -U maptech_user \
  --dbname=maptech_db \
  --clean \
  /backups/database/maptech_YYYYMMDD_HHMMSS.dump
```

**Recovery Time Objectives:**

- **Database corruption**: RTO: < 2 hours; RPO: < 24 hours
- **Server failure**: RTO: < 4 hours; RPO: < 24 hours
- **Data center failure**: RTO: < 8 hours; RPO: < 24 hours

---

## 17.5 Incident Management

### Incident Severity Levels

- **P1 — Critical**: Description: System down, all users affected; Response Time: < 15 minutes; Example: Database failure, server crash
- **P2 — High**: Description: Major feature unavailable; Response Time: < 1 hour; Example: WebSocket failure, authentication down
- **P3 — Medium**: Description: Feature degraded; Response Time: < 4 hours; Example: Slow API responses, minor UI bugs
- **P4 — Low**: Description: Cosmetic or minor issue; Response Time: Next business day; Example: Typo, style inconsistency

### Incident Response Process

![Diagram 21](./images/diagram-21.png)

1. **Detection:** Alert received via monitoring tool, or user report through the ticketing system itself.
2. **Triage:** On-call engineer assesses severity, assigns to appropriate team member.
3. **Resolution:** Engineer investigates using logs and audit trail, applies fix, restores service.
4. **Post-Mortem:** Document root cause, impact assessment, and preventive measures.

---

*End of Section 17*


---


<!-- Source: 18-Maintenance-and-Support.md -->

# 18. MAINTENANCE AND SUPPORT

## 18.1 Maintenance Plan

### Scheduled Maintenance Windows

- **Security Patches**: Frequency: As required (critical); Duration: 30 min – 1 hour; Window: Within 24 hours of disclosure
- **Dependency Updates**: Frequency: Monthly; Duration: 1–2 hours; Window: First Saturday of the month, 2:00 AM
- **Database Maintenance**: Frequency: Weekly; Duration: 15–30 min; Window: Sunday 3:00 AM (VACUUM, REINDEX)
- **System Updates (OS)**: Frequency: Monthly; Duration: 1–2 hours; Window: Second Saturday of the month, 2:00 AM
- **Feature Releases**: Frequency: Sprint-based (bi-weekly); Duration: 30 min – 1 hour; Window: As scheduled

### Maintenance Procedures

**Pre-Maintenance Checklist:**
1. Notify users of scheduled downtime via in-app Announcement (existing model).
2. Create a database backup before applying changes.
3. Tag the current release in Git for rollback reference.
4. Verify backup integrity.

**Post-Maintenance Checklist:**
1. Run database migrations if applicable (`python manage.py migrate`).
2. Run `collectstatic` if static files changed.
3. Restart Daphne ASGI server.
4. Verify health check endpoints respond successfully.
5. Confirm WebSocket connectivity.
6. Monitor error logs for 30 minutes post-deployment.
7. Update the Announcement to confirm maintenance is complete.

---

## 18.2 Version Control

### Git Workflow

The project uses **Git** for source code version control.

**Branch Strategy (Recommended — Git Flow):**

- **main**: Purpose: Production-ready code; Lifetime: Permanent
- **develop**: Purpose: Integration branch for the next release; Lifetime: Permanent
- **feature/<name>**: Purpose: New feature development; Lifetime: Temporary (merged to develop)
- **bugfix/<name>**: Purpose: Bug fixes for develop; Lifetime: Temporary (merged to develop)
- **hotfix/<name>**: Purpose: Emergency production fixes; Lifetime: Temporary (merged to main + develop)
- **release/<version>**: Purpose: Release preparation and QA; Lifetime: Temporary (merged to main + develop)

**Commit Message Convention:**
```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
Scopes: backend, frontend, tickets, users, auth, ws, ui

Examples:
  feat(tickets): add escalation to external support
  fix(ws): resolve WebSocket disconnect on token refresh
  docs(api): update Swagger schema for new endpoints
```

### Versioning Strategy

Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`

- **MAJOR**: Meaning: Breaking API changes or major architecture shifts
- **MINOR**: Meaning: New features, backward-compatible
- **PATCH**: Meaning: Bug fixes, security patches

---

## 18.3 System Updates

### Dependency Management

**Backend (Python):**
- Dependencies defined in `requirements.txt`
- Pin exact versions for reproducibility
- Use `pip-audit` or `safety` to check for known vulnerabilities
- Update process:
  1. Create a `feature/dependency-update` branch
  2. Run `pip install --upgrade <package>`
  3. Update `requirements.txt`
  4. Run full test suite
  5. Merge after review

**Frontend (Node.js):**
- Dependencies defined in `package.json` with lockfile
- Use `npm audit` to check for known vulnerabilities
- Update process:
  1. Create a `feature/dependency-update` branch
  2. Run `npm update` or `npm install <package>@latest`
  3. Run `npm run build` to verify no build errors
  4. Run tests if available
  5. Merge after review

### Database Schema Updates

- Managed via **Django Migrations**
- Schema changes are tracked in `tickets/migrations/` and `users/migrations/`
- Migration workflow:
  1. Modify model code
  2. Run `python manage.py makemigrations`
  3. Review generated migration file
  4. Run `python manage.py migrate` in development
  5. Test thoroughly before deploying to production
  6. Apply to production during maintenance window

**Current Migration Count (as of documentation date):**
- `tickets` app: 20+ migrations (0001_initial through 0020+)
- `users` app: Standard Django auth migrations

---

## 18.4 Technical Support

### Support Tiers

- **Tier 1**: Responsibility: Basic troubleshooting, password resets, user guidance; Personnel: Help Desk / Admin users; Response SLA: < 1 hour
- **Tier 2**: Responsibility: Application-level issues, configuration changes, data fixes; Personnel: System Administrator; Response SLA: < 4 hours
- **Tier 3**: Responsibility: Code-level bugs, architecture issues, database recovery; Personnel: Development Team; Response SLA: < 1 business day

### Common Support Procedures

**User Account Issues:**
1. Navigate to Django Admin (`/admin/`) → Users
2. Reset password or update user profile
3. Verify role assignment (superadmin / admin / sales / employee)

**Ticket Data Issues:**
1. Use Django Admin or the `AuditLog` to trace changes
2. Review `AssignmentSession` records for assignment history
3. Check `EscalationLog` for escalation trail

**WebSocket Connectivity Issues:**
1. Verify Redis is running (production) or InMemory layer is configured (development)
2. Check Nginx configuration for WebSocket upgrade headers
3. Review browser console for WebSocket connection errors
4. Verify JWT token is valid and not expired

**Performance Issues:**
1. Review Django query logs (DEBUG mode) for N+1 queries
2. Check database indexes on frequently queried fields
3. Monitor Redis memory usage for channel layer
4. Review Daphne process resource consumption

### Support Contact Channels

- **In-App Ticketing**: Purpose: Users create support tickets through the system itself
- **Admin Dashboard**: Purpose: Supervisors monitor SLA compliance and ticket status
- **Direct Escalation**: Purpose: Critical issues escalated to development team via defined process

---

## 18.5 Data Retention and Archival

The system includes a `RetentionPolicy` model that defines data lifecycle rules:

- **name**: Policy name (e.g., "Standard Ticket Retention")
- **duration_days**: Number of days to retain data before archival
- **description**: Description of the policy
- **is_active**: Whether the policy is currently enforced

**Retention Recommendations:**

- **Active Tickets**: Retention Period: Indefinite; Action After Expiry: N/A
- **Closed Tickets**: Retention Period: Per policy (e.g., 365 days); Action After Expiry: Archive to cold storage
- **Audit Logs**: Retention Period: Per policy (e.g., 730 days); Action After Expiry: Archive or delete
- **Chat Messages**: Retention Period: Per policy (e.g., 365 days); Action After Expiry: Archive with ticket
- **Notification Records**: Retention Period: 90 days; Action After Expiry: Soft delete
- **User Accounts (inactive)**: Retention Period: Per policy (e.g., 365 days inactive); Action After Expiry: Deactivate

---

*End of Section 18*


---


<!-- Source: 19-Risk-Management.md -->

# 19. RISK MANAGEMENT

## 19.1 Risk Assessment Overview

This section identifies known technical, operational, and security risks for the Maptech Ticketing System, evaluates their likelihood and impact, and defines mitigation strategies.

**Risk Rating Matrix:**

- **High Likelihood**: Low Impact: Medium; Medium Impact: High; High Impact: Critical; Critical Impact: Critical
- **Medium Likelihood**: Low Impact: Low; Medium Impact: Medium; High Impact: High; Critical Impact: Critical
- **Low Likelihood**: Low Impact: Low; Medium Impact: Low; High Impact: Medium; Critical Impact: High

---

## 19.2 Technical Risks

### RISK-T01: SQLite Database Scalability

- **Description**: Detail: The system currently uses SQLite as its database. SQLite does not support concurrent write operations well and has limitations with large datasets.
- **Likelihood**: Detail: High (in production deployment)
- **Impact**: Detail: High — Data corruption risk under concurrent writes; performance degradation with growth
- **Current Status**: Detail: Active risk in development; configured in `settings.py`
- **Mitigation**: Detail: Migrate to PostgreSQL before production deployment. Django's ORM abstraction makes this a configuration change with minimal code impact.
- **Contingency**: Detail: Apply write-ahead logging (WAL) mode for SQLite as temporary measure.

### RISK-T02: InMemory Channel Layer Limitation

- **Description**: Detail: The WebSocket channel layer uses `InMemoryChannelLayer`, which does not persist across process restarts and does not support multi-process deployments.
- **Likelihood**: Detail: High (in production)
- **Impact**: Detail: Medium — WebSocket notifications and chat messages may be lost on server restart; no cross-process communication
- **Current Status**: Detail: Active risk; configured in `settings.py` CHANNEL_LAYERS setting
- **Mitigation**: Detail: Switch to `channels_redis.core.RedisChannelLayer` with a Redis server for production. Configuration is already documented in Django Channels.
- **Contingency**: Detail: Implement HTTP polling fallback for notifications.

### RISK-T03: Single Server Deployment

- **Description**: Detail: No horizontal scaling or load balancing strategy is currently implemented.
- **Likelihood**: Detail: Medium
- **Impact**: Detail: High — Single point of failure; limited capacity under peak load
- **Mitigation**: Detail: Deploy behind a load balancer (Nginx/HAProxy) with multiple Daphne workers. Use sticky sessions for WebSocket connections.
- **Contingency**: Detail: Vertical scaling (increase server resources) as short-term measure.

### RISK-T04: No Automated Test Suite

- **Description**: Detail: The codebase does not have a comprehensive automated test suite. The `users/tests.py` file exists but may not have extensive coverage.
- **Likelihood**: Detail: High
- **Impact**: Detail: Medium — Regressions may go undetected; higher risk during refactoring or feature additions
- **Mitigation**: Detail: Implement unit tests for critical models and views, integration tests for API endpoints, and E2E tests for key user workflows.
- **Contingency**: Detail: Manual QA testing before each release with a defined test checklist.

### RISK-T05: Media File Storage on Local Filesystem

- **Description**: Detail: Uploaded files (profile pictures, ticket attachments, resolution proofs) are stored on the local filesystem under `media/`.
- **Likelihood**: Detail: Medium
- **Impact**: Detail: Medium — Files lost if server disk fails; not accessible in multi-server deployment; disk space exhaustion
- **Mitigation**: Detail: Migrate to cloud object storage (AWS S3, Azure Blob Storage) using `django-storages`. Implement file size limits and cleanup routines.
- **Contingency**: Detail: Regular filesystem backups with rsync to offsite storage.

---

## 19.3 Security Risks

### RISK-S01: JWT Token Exposure

- **Description**: Detail: JWT access tokens provide full API access for their lifetime (configured as 1 day). If intercepted, they cannot be individually revoked without a blacklist mechanism.
- **Likelihood**: Detail: Low
- **Impact**: Detail: High — Unauthorized access to the system for the token's remaining lifetime
- **Mitigation**: Detail: Reduce access token lifetime (e.g., 15–30 minutes). Implement token blacklisting via `rest_framework_simplejwt.token_blacklist`. Use HTTPS exclusively. Store tokens securely (httpOnly cookies preferred over localStorage).
- **Contingency**: Detail: Force password reset to invalidate all tokens; rotate SECRET_KEY as last resort (invalidates all tokens system-wide).

### RISK-S02: Insufficient Input Validation

- **Description**: Detail: While Django REST Framework serializers provide basic validation, custom validation for business logic may have gaps.
- **Likelihood**: Detail: Low
- **Impact**: Detail: Medium — Potential for XSS via user-generated content, SQL injection (mitigated by ORM), or business logic bypass
- **Mitigation**: Detail: DRF serializers and Django ORM provide strong default protection. Review all custom endpoint actions for proper input validation. Sanitize HTML content in chat messages.
- **Contingency**: Detail: WAF (Web Application Firewall) at the network layer for defense-in-depth.

### RISK-S03: CORS Misconfiguration

- **Description**: Detail: The `CORS_ALLOW_ALL_ORIGINS` setting may be enabled in development and accidentally deployed to production.
- **Likelihood**: Detail: Medium
- **Impact**: Detail: Medium — Cross-origin request forgery attacks could exploit API endpoints
- **Mitigation**: Detail: Ensure `CORS_ALLOW_ALL_ORIGINS = False` in production. Use `CORS_ALLOWED_ORIGINS` with explicit origin list. Environment-specific settings files.
- **Contingency**: Detail: Network-level CORS enforcement via Nginx configuration.

### RISK-S04: Inadequate Rate Limiting

- **Description**: Detail: The DRF throttle classes are configured but may not cover all attack vectors (brute-force login, API abuse).
- **Likelihood**: Detail: Medium
- **Impact**: Detail: Medium — Brute-force attacks on login, denial-of-service via API abuse
- **Mitigation**: Detail: Implement stricter throttling on authentication endpoints. Add IP-based rate limiting at Nginx level. Consider fail2ban for repeated failed login attempts.
- **Contingency**: Detail: Temporary IP blocking via Nginx or firewall rules.

---

## 19.4 Operational Risks

### RISK-O01: Key Personnel Dependency

- **Description**: Detail: System knowledge may be concentrated in a small number of developers.
- **Likelihood**: Detail: Medium
- **Impact**: Detail: High — Loss of key personnel could delay bug fixes, feature development, and incident response
- **Mitigation**: Detail: Comprehensive documentation (this document), code reviews, pair programming, and knowledge sharing sessions.
- **Contingency**: Detail: External consulting engagement for emergency support.

### RISK-O02: Data Loss

- **Description**: Detail: Database corruption, accidental deletion, or hardware failure could result in data loss.
- **Likelihood**: Detail: Low
- **Impact**: Detail: Critical — Loss of ticket history, audit trails, and user data
- **Mitigation**: Detail: Automated daily backups with offsite replication. Database transaction logging. Regular backup restoration tests.
- **Contingency**: Detail: Point-in-time recovery from WAL archives (PostgreSQL).

### RISK-O03: Third-Party Dependency Vulnerabilities

- **Description**: Detail: The system relies on numerous third-party packages (Django, DRF, SimpleJWT, React, etc.) that may have undiscovered vulnerabilities.
- **Likelihood**: Detail: Medium
- **Impact**: Detail: Variable (Low to Critical depending on vulnerability)
- **Mitigation**: Detail: Regular dependency auditing (`pip-audit`, `npm audit`). Subscribe to security advisories for key dependencies. Automated dependency update tools (Dependabot, Renovate).
- **Contingency**: Detail: Patch or pin vulnerable versions immediately upon disclosure.

---

## 19.5 Risk Register Summary

- **RISK-T01**: Risk: SQLite scalability; Likelihood: High; Impact: High; Rating: Critical; Status: Open
- **RISK-T02**: Risk: InMemory channel layer; Likelihood: High; Impact: Medium; Rating: High; Status: Open
- **RISK-T03**: Risk: Single server deployment; Likelihood: Medium; Impact: High; Rating: High; Status: Open
- **RISK-T04**: Risk: No automated test suite; Likelihood: High; Impact: Medium; Rating: High; Status: Open
- **RISK-T05**: Risk: Local filesystem storage; Likelihood: Medium; Impact: Medium; Rating: Medium; Status: Open
- **RISK-S01**: Risk: JWT token exposure; Likelihood: Low; Impact: High; Rating: Medium; Status: Open
- **RISK-S02**: Risk: Input validation gaps; Likelihood: Low; Impact: Medium; Rating: Low; Status: Monitored
- **RISK-S03**: Risk: CORS misconfiguration; Likelihood: Medium; Impact: Medium; Rating: Medium; Status: Open
- **RISK-S04**: Risk: Inadequate rate limiting; Likelihood: Medium; Impact: Medium; Rating: Medium; Status: Open
- **RISK-O01**: Risk: Key personnel dependency; Likelihood: Medium; Impact: High; Rating: High; Status: Mitigated (docs)
- **RISK-O02**: Risk: Data loss; Likelihood: Low; Impact: Critical; Rating: Medium; Status: Open
- **RISK-O03**: Risk: Third-party vulnerabilities; Likelihood: Medium; Impact: Variable; Rating: Medium; Status: Monitored

---

*End of Section 19*


---


<!-- Source: 20-Future-Enhancements.md -->

# 20. FUTURE ENHANCEMENTS

## 20.1 Enhancement Roadmap Overview

This section outlines planned and recommended enhancements for the Maptech Ticketing System, prioritized by business value and technical impact.

---

## 20.2 Short-Term Enhancements (0–3 Months)

### ENH-01: PostgreSQL Migration

- **Priority**: Detail: Critical
- **Effort**: Detail: Low (1–2 days)
- **Description**: Detail: Migrate from SQLite to PostgreSQL for production readiness. Django's ORM abstraction makes this primarily a configuration change.
- **Benefits**: Detail: Concurrent write support, better performance at scale, point-in-time recovery, full-text search capabilities.
- **Implementation**: Detail: Update `DATABASES` in `settings.py` to use `django.db.backends.postgresql`. Install `psycopg2-binary`. Run `migrate` on the new database.

### ENH-02: Redis Channel Layer

- **Priority**: Detail: Critical
- **Effort**: Detail: Low (< 1 day)
- **Description**: Detail: Replace `InMemoryChannelLayer` with `channels_redis.core.RedisChannelLayer` for reliable WebSocket communication in production.
- **Benefits**: Detail: Multi-process/multi-server WebSocket support, message persistence across restarts, pub/sub scalability.
- **Implementation**: Detail: Install Redis server, install `channels-redis`, update `CHANNEL_LAYERS` in `settings.py`.

### ENH-03: Automated Test Suite

- **Priority**: Detail: High
- **Effort**: Detail: Medium (2–4 weeks)
- **Description**: Detail: Implement comprehensive automated testing covering models, serializers, views, and WebSocket consumers.
- **Scope**: Detail: Unit tests for models and serializers, integration tests for API endpoints, WebSocket consumer tests, E2E tests for critical user workflows.
- **Tools**: Detail: pytest + pytest-django (backend), Vitest (frontend), Playwright (E2E).

### ENH-04: Reduce JWT Access Token Lifetime

- **Priority**: Detail: High
- **Effort**: Detail: Low (< 1 day)
- **Description**: Detail: Reduce access token lifetime from 1 day to 15–30 minutes with automatic silent refresh using the refresh token.
- **Benefits**: Detail: Reduced window of exposure if tokens are compromised.
- **Implementation**: Detail: Update `SIMPLE_JWT` settings in `settings.py`. Implement silent refresh logic in the frontend API interceptor.

---

## 20.3 Medium-Term Enhancements (3–6 Months)

### ENH-05: Email Integration

- **Priority**: Detail: High
- **Effort**: Detail: Medium (2–3 weeks)
- **Description**: Detail: Implement email notifications for ticket events and support email-to-ticket creation.
- **Features**: Detail: Email notifications on ticket creation/assignment/escalation/closure, email-based ticket creation (parse incoming emails to create tickets), email reply integration for ticket messages.
- **Tools**: Detail: Django `send_mail`, django-post-office, or third-party email service (SendGrid, AWS SES).

### ENH-06: Cloud File Storage

- **Priority**: Detail: Medium
- **Effort**: Detail: Low (1–2 days)
- **Description**: Detail: Migrate file uploads from local filesystem to cloud object storage for scalability and reliability.
- **Implementation**: Detail: Install `django-storages` and `boto3` (AWS S3) or `azure-storage-blob` (Azure). Update `DEFAULT_FILE_STORAGE` in settings.
- **Benefits**: Detail: Automatic redundancy, CDN integration, unlimited storage scaling, multi-server file access.

### ENH-07: Advanced Reporting and Analytics

- **Priority**: Detail: Medium
- **Effort**: Detail: Medium (3–4 weeks)
- **Description**: Detail: Enhance the existing Recharts-based dashboards with advanced analytics capabilities.
- **Features**: Detail: SLA compliance trending, technician performance metrics, category/service type analysis, peak hour analysis, first-response time tracking, resolution time trends, feedback rating analytics.
- **Current Foundation**: Detail: Recharts integration exists in SuperAdmin/Admin dashboards, basic statistics endpoints available.

### ENH-08: Mobile Application

- **Priority**: Detail: Medium
- **Effort**: Detail: High (8–12 weeks)
- **Description**: Detail: Develop a mobile application for technicians to manage tickets on the go.
- **Options**: Detail: React Native (shares React expertise), Progressive Web App (lower effort, limited native features), Flutter (cross-platform, new technology stack).
- **Features**: Detail: Push notifications, ticket management, real-time chat, photo attachments from camera, offline support.

---

## 20.4 Long-Term Enhancements (6–12 Months)

### ENH-09: Single Sign-On (SSO) Integration

- **Priority**: Detail: Medium
- **Effort**: Detail: Medium (2–3 weeks)
- **Description**: Detail: Integrate enterprise SSO providers for streamlined authentication. The legacy frontend already has Azure MSAL and Google OAuth scaffolding.
- **Providers**: Detail: Microsoft Entra ID (Azure AD), Google Workspace, SAML 2.0 generic.
- **Implementation**: Detail: `django-allauth` or `python-social-auth` for backend. Port existing MSAL/Google OAuth code from legacy frontend.

### ENH-10: Knowledge Base System

- **Priority**: Detail: Medium
- **Effort**: Detail: Medium (3–4 weeks)
- **Description**: Detail: Expand the existing knowledge base endpoints into a full self-service knowledge management system.
- **Features**: Detail: Article creation and editing (Markdown/rich text), category organization, search functionality, article rating and feedback, automatic suggestion based on ticket content, FAQ section.
- **Current Foundation**: Detail: `knowledge.py` views exist with basic knowledge base endpoints.

### ENH-11: AI-Powered Ticket Classification

- **Priority**: Detail: Low
- **Effort**: Detail: High (4–6 weeks)
- **Description**: Detail: Implement machine learning for automatic ticket categorization, priority assignment, and technician recommendation.
- **Features**: Detail: Auto-categorize tickets based on description, suggest priority level, recommend best-suited technician based on expertise and workload, auto-suggest knowledge base articles.
- **Tools**: Detail: scikit-learn (basic), OpenAI API (advanced), or Hugging Face transformers.

### ENH-12: Multi-Tenant Architecture

- **Priority**: Detail: Low
- **Effort**: Detail: High (6–10 weeks)
- **Description**: Detail: Support multiple organizations/clients in a single deployment with data isolation.
- **Implementation**: Detail: Schema-based multi-tenancy (`django-tenants`) or row-level multi-tenancy with organization foreign keys.
- **Benefits**: Detail: SaaS deployment model, shared infrastructure cost, centralized management.

### ENH-13: Webhook and External API Integration

- **Priority**: Detail: Low
- **Effort**: Detail: Medium (2–3 weeks)
- **Description**: Detail: Allow external systems to subscribe to ticket events via webhooks and provide a public API for third-party integrations.
- **Features**: Detail: Configurable webhook endpoints, event-based triggers (ticket created, status changed, escalated), API key authentication for external consumers, rate-limited public API.

---

## 20.5 Enhancement Priority Matrix

- **ENH-01: PostgreSQL**: Priority: Critical; Effort: Low; Business Value: High; Risk Reduction: High
- **ENH-02: Redis Channel Layer**: Priority: Critical; Effort: Low; Business Value: Medium; Risk Reduction: High
- **ENH-03: Test Suite**: Priority: High; Effort: Medium; Business Value: Medium; Risk Reduction: High
- **ENH-04: JWT Token Lifetime**: Priority: High; Effort: Low; Business Value: Low; Risk Reduction: High
- **ENH-05: Email Integration**: Priority: High; Effort: Medium; Business Value: High; Risk Reduction: Low
- **ENH-06: Cloud Storage**: Priority: Medium; Effort: Low; Business Value: Medium; Risk Reduction: Medium
- **ENH-07: Advanced Analytics**: Priority: Medium; Effort: Medium; Business Value: High; Risk Reduction: Low
- **ENH-08: Mobile App**: Priority: Medium; Effort: High; Business Value: High; Risk Reduction: Low
- **ENH-09: SSO Integration**: Priority: Medium; Effort: Medium; Business Value: Medium; Risk Reduction: Medium
- **ENH-10: Knowledge Base**: Priority: Medium; Effort: Medium; Business Value: Medium; Risk Reduction: Low
- **ENH-11: AI Classification**: Priority: Low; Effort: High; Business Value: High; Risk Reduction: Low
- **ENH-12: Multi-Tenant**: Priority: Low; Effort: High; Business Value: Medium; Risk Reduction: Low
- **ENH-13: Webhooks**: Priority: Low; Effort: Medium; Business Value: Medium; Risk Reduction: Low

---

*End of Section 20*


---


<!-- Source: 21-Appendices.md -->

# 21. APPENDICES

## Appendix A: System Architecture Diagram

![Diagram 22](./images/diagram-22.png)

---

## Appendix B: Database Entity-Relationship Summary

### Core Entities

```
User (1) ─────────── (N) Ticket          [created_by]
User (1) ─────────── (N) AssignmentSession [assigned_to / assigned_by]
Ticket (1) ────────── (N) AssignmentSession
Ticket (1) ────────── (N) TicketAttachment
Ticket (1) ────────── (N) TicketTask
Ticket (1) ────────── (N) Message
Ticket (1) ────────── (N) EscalationLog
Ticket (1) ────────── (1) FeedbackRating
Message (1) ─────────(N) MessageReaction
Message (1) ─────────(N) MessageReadReceipt
User (1) ─────────── (N) Notification
User (1) ─────────── (N) CallLog          [caller / receiver]
User (1) ─────────── (N) AuditLog
TypeOfService (1) ── (N) Category
Category (1) ──────── (N) Ticket
Product (1) ────────── (N) Ticket
Client (1) ─────────── (N) Ticket
```

### Model Field Summary

- **User**: Key Fields: email (PK), first_name, last_name, middle_name, role (employee/sales/admin/superadmin), department, phone, profile_picture, is_agreed_privacy_policy
- **Ticket**: Key Fields: ticket_number, status, priority, category, product, client, created_by, sla_deadline, current_session
- **AssignmentSession**: Key Fields: ticket, assigned_to, assigned_by, started_at, ended_at, is_active
- **Message**: Key Fields: ticket, sender, content, message_type, parent_message, is_edited, is_deleted
- **TicketAttachment**: Key Fields: ticket, file, uploaded_by, file_name, file_size, file_type
- **TicketTask**: Key Fields: ticket, title, description, is_completed, completed_by, completed_at
- **EscalationLog**: Key Fields: ticket, escalated_by, escalation_type, reason, previous_assignee, new_assignee
- **AuditLog**: Key Fields: user, action, model_name, object_id, changes (JSON), ip_address
- **Notification**: Key Fields: user, title, message, notification_type, is_read, related_ticket
- **CallLog**: Key Fields: caller, receiver, related_ticket, call_type, duration, notes
- **FeedbackRating**: Key Fields: ticket, employee, admin, rating, comments
- **TypeOfService**: Key Fields: name, description, is_active
- **Category**: Key Fields: name, type_of_service, description, is_active
- **Product**: Key Fields: name, description, is_active
- **Client**: Key Fields: name, email, phone, address, is_active
- **RetentionPolicy**: Key Fields: name, duration_days, description, is_active
- **Announcement**: Key Fields: title, content, author, priority, is_active, start_date, end_date, target_roles
- **MessageReaction**: Key Fields: message, user, reaction_type
- **MessageReadReceipt**: Key Fields: message, user, read_at

---

## Appendix C: API Endpoint Reference

### Authentication Endpoints (`/api/auth/`)

- **POST**: Endpoint: /api/auth/login/; Description: User login (returns JWT pair)
- **POST**: Endpoint: /api/auth/token/refresh/; Description: Refresh access token
- **POST**: Endpoint: /api/auth/logout/; Description: User logout
- **GET**: Endpoint: /api/auth/me/; Description: Get current user profile
- **POST**: Endpoint: /api/auth/upload_avatar/; Description: Upload profile picture
- **DELETE**: Endpoint: /api/auth/remove_avatar/; Description: Remove profile picture
- **PATCH**: Endpoint: /api/auth/update_profile/; Description: Update own profile
- **POST**: Endpoint: /api/auth/change_password/; Description: Change own password
- **POST**: Endpoint: /api/auth/password-reset/; Description: Request password reset (email)
- **POST**: Endpoint: /api/auth/password-reset-by-key/; Description: Reset password via recovery key
- **POST**: Endpoint: /api/auth/password-reset-confirm/; Description: Confirm password reset token + new password

### User Endpoints (`/api/users/`)

- **GET**: Endpoint: /api/users/list_users/; Description: List users (superadmin)
- **POST**: Endpoint: /api/users/create_user/; Description: Create user
- **PATCH**: Endpoint: /api/users/{id}/update_user/; Description: Update user
- **POST**: Endpoint: /api/users/{id}/toggle_active/; Description: Activate/deactivate user
- **POST**: Endpoint: /api/users/{id}/reset_password/; Description: Admin reset password
- **GET**: Endpoint: /api/auth/me/; Description: Current user profile
- **PATCH**: Endpoint: /api/auth/update_profile/; Description: Update own profile
- **POST**: Endpoint: /api/auth/change_password/; Description: Change own password
- **POST**: Endpoint: /api/auth/upload_avatar/; Description: Upload profile picture

### Ticket Endpoints (`/api/tickets/`)

- **GET**: Endpoint: /api/tickets/; Description: List tickets (filtered by role)
- **POST**: Endpoint: /api/tickets/; Description: Create ticket
- **GET**: Endpoint: /api/tickets/{id}/; Description: Retrieve ticket detail
- **PUT/PATCH**: Endpoint: /api/tickets/{id}/; Description: Update ticket
- **POST**: Endpoint: /api/tickets/{id}/assign/; Description: Assign ticket to technician
- **POST**: Endpoint: /api/tickets/{id}/escalate/; Description: Escalate ticket
- **POST**: Endpoint: /api/tickets/{id}/pass_ticket/; Description: Pass ticket to another technician
- **POST**: Endpoint: /api/tickets/{id}/start_work/; Description: Start working on ticket
- **POST**: Endpoint: /api/tickets/{id}/request_closure/; Description: Submit ticket for closure
- **POST**: Endpoint: /api/tickets/{id}/review/; Description: Review pending closure
- **POST**: Endpoint: /api/tickets/{id}/confirm_ticket/; Description: Confirm ticket
- **POST**: Endpoint: /api/tickets/{id}/close_ticket/; Description: Close ticket (admin-level)
- **POST**: Endpoint: /api/tickets/{id}/submit_for_observation/; Description: Set for observation period
- **POST**: Endpoint: /api/tickets/{id}/upload_resolution_proof/; Description: Upload proof of resolution
- **POST**: Endpoint: /api/tickets/{id}/escalate_external/; Description: Escalate ticket externally
- **PATCH**: Endpoint: /api/tickets/{id}/save_product_details/; Description: Save product detail snapshot
- **PATCH**: Endpoint: /api/tickets/{id}/update_employee_fields/; Description: Update employee ticket fields
- **POST**: Endpoint: /api/tickets/{id}/link_tickets/; Description: Link related tickets
- **GET**: Endpoint: /api/tickets/{id}/assignment_history/; Description: Get assignment history
- **GET**: Endpoint: /api/tickets/{id}/messages/; Description: Get ticket messages
- **GET**: Endpoint: /api/tickets/stats/; Description: Get ticket statistics

### Notification Endpoints (`/api/notifications/`)

- **GET**: Endpoint: /api/notifications/; Description: List user notifications
- **POST**: Endpoint: /api/notifications/mark_read/; Description: Mark selected notifications as read
- **POST**: Endpoint: /api/notifications/mark_all_read/; Description: Mark all notifications as read
- **POST**: Endpoint: /api/notifications/clear_all/; Description: Delete all notifications

### Additional Endpoints

- **GET**: Endpoint: /api/categories/; Description: List categories
- **GET**: Endpoint: /api/type-of-service/; Description: List service types
- **GET**: Endpoint: /api/products/; Description: List products
- **GET**: Endpoint: /api/clients/; Description: List clients
- **GET**: Endpoint: /api/audit-logs/; Description: List audit logs (admin+)
- **GET/POST**: Endpoint: /api/announcements/; Description: Manage announcements
- **GET/POST**: Endpoint: /api/feedback-ratings/; Description: Manage feedback ratings
- **GET/POST**: Endpoint: /api/call-logs/; Description: Manage call logs
- **GET/POST**: Endpoint: /api/retention-policy/; Description: Get/update retention policy
- **GET**: Endpoint: /api/knowledge-hub/; Description: Knowledge Hub attachments
- **GET**: Endpoint: /api/published-articles/; Description: Published Knowledge Hub articles
- **GET**: Endpoint: /api/employees/; Description: Employee list with active ticket counts
- **GET**: Endpoint: /api/sales-users/; Description: Active sales users
- **GET**: Endpoint: /api/supervisors/; Description: Active supervisors

### WebSocket Endpoints

- **ws/notifications/**: Real-time notifications (authenticated)
- **ws/chat/<ticket_id>/admin_employee/**: Real-time ticket chat (admin/employee)

---

## Appendix D: Technology Stack Summary

### Backend

- **Python**: Version: 3.10+; Purpose: Runtime
- **Django**: Version: 4.2+; Purpose: Web framework
- **Django REST Framework**: Version: 3.16.1; Purpose: REST API
- **djangorestframework-simplejwt**: Version: 5.5.1; Purpose: JWT authentication
- **Django Channels**: Version: 4.3.2; Purpose: WebSocket support
- **Daphne**: Version: 4.1.2; Purpose: ASGI server
- **drf-yasg**: Version: 1.21.15; Purpose: Swagger/OpenAPI documentation
- **django-cors-headers**: Version: 4.7.0; Purpose: CORS handling
- **Pillow**: Version: 11.2.1; Purpose: Image processing
- **Whitenoise**: Version: 6.9.0; Purpose: Static file serving
- **argon2-cffi**: Version: 23.1.0; Purpose: Password hashing
- **python-dotenv**: Version: 1.1.0; Purpose: Environment configuration

### Frontend (Primary — Maptech_FrontendUI-main)

- **React**: Version: 18.2.0; Purpose: UI framework
- **TypeScript**: Version: 5.5.4; Purpose: Type-safe JavaScript
- **React Router**: Version: 6.12.0; Purpose: Client-side routing
- **Tailwind CSS**: Version: 3.4.17; Purpose: Utility-first CSS
- **Vite**: Version: 5.0.0; Purpose: Build tool & dev server
- **Recharts**: Version: 2.12.7; Purpose: Data visualization
- **Lucide React**: Version: 0.503.0; Purpose: Icon library
- **Sonner**: Version: 2.0.1; Purpose: Toast notifications
- **xlsx-js-style**: Version: 1.2.0; Purpose: Excel export
- **js-cookie**: Version: 3.0.5; Purpose: Cookie management

### Frontend (Legacy — frontend/)

- **React**: Version: 18.3.1; Purpose: UI framework
- **TypeScript**: Version: 5.5.4; Purpose: Type-safe JavaScript
- **React Router**: Version: 7.13.0; Purpose: Client-side routing
- **Tailwind CSS**: Version: 4.1.5; Purpose: Utility-first CSS
- **Vite**: Version: 5.2.0; Purpose: Build tool
- **@azure/msal-browser**: Version: 4.12.0; Purpose: Azure AD auth
- **@react-oauth/google**: Version: 0.12.1; Purpose: Google auth
- **React Hook Form**: Version: 7.56.4; Purpose: Form management

---

## Appendix E: User Role Permissions Matrix

- **View tickets**: SuperAdmin: ❌ (no ticket UI); Admin (Supervisor): ✅; Sales: ✅ (own created); Employee (Technician): ✅ (assigned only)
- **Create tickets**: SuperAdmin: ❌ (no ticket UI); Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ❌
- **Assign tickets**: SuperAdmin: ❌; Admin (Supervisor): ✅; Sales: ❌; Employee (Technician): ❌
- **Escalate tickets**: SuperAdmin: ❌; Admin (Supervisor): ✅ (external only); Sales: ❌; Employee (Technician): ✅
- **Pass tickets**: SuperAdmin: ❌; Admin (Supervisor): ❌; Sales: ❌; Employee (Technician): ✅
- **Close tickets (direct)**: SuperAdmin: ❌ (no ticket UI); Admin (Supervisor): ✅; Sales: ❌; Employee (Technician): ❌
- **Request closure**: SuperAdmin: ❌; Admin (Supervisor): ❌; Sales: ❌; Employee (Technician): ✅
- **Review/confirm call status**: SuperAdmin: ❌; Admin (Supervisor): ✅; Sales: ✅ (own intake flow); Employee (Technician): ❌
- **Manage users**: SuperAdmin: ✅; Admin (Supervisor): ❌; Sales: ❌; Employee (Technician): ❌
- **View audit logs**: SuperAdmin: ✅; Admin (Supervisor): ✅; Sales: ✅ (scoped); Employee (Technician): ❌
- **Manage categories**: SuperAdmin: ✅; Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ❌
- **Manage products**: SuperAdmin: ✅; Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ❌
- **Manage clients**: SuperAdmin: ✅; Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ❌
- **Send messages**: SuperAdmin: ✅; Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ✅
- **Upload attachments**: SuperAdmin: ❌ (no ticket UI); Admin (Supervisor): ✅; Sales: ✅ (ticket scope); Employee (Technician): ✅
- **View statistics**: SuperAdmin: ✅; Admin (Supervisor): ✅; Sales: ✅; Employee (Technician): ✅ (limited)
- **Manage announcements**: SuperAdmin: ✅; Admin (Supervisor): ❌; Sales: ❌; Employee (Technician): ❌
- **Manage retention policies**: SuperAdmin: ✅; Admin (Supervisor): ❌; Sales: ❌; Employee (Technician): ❌

---

## Appendix F: Ticket Status Flow

![Diagram 23](./images/diagram-23.png)

**Status Definitions:**

- **open**: Newly created, awaiting assignment
- **in_progress**: Assigned to technician, actively being worked on
- **escalated**: Escalated to higher-level support within the organization
- **escalated_external**: Escalated to external/third-party support
- **pending_closure**: Technician has requested closure, awaiting admin review
- **for_observation**: Resolution applied, under observation period
- **closed**: Ticket resolved and closed
- **unresolved**: Ticket cannot be resolved

---

## Appendix G: Glossary

- **ASGI**: Definition: Asynchronous Server Gateway Interface — Python standard for async web applications
- **Assignment Session**: Definition: A record linking a technician to a ticket for a specific period
- **Feedback Rating**: Definition: Supervisor/admin 1-5 rating of technical staff performance before ticket closure
- **DRF**: Definition: Django REST Framework — toolkit for building REST APIs in Django
- **Escalation**: Definition: Process of transferring a ticket to higher-level support
- **JWT**: Definition: JSON Web Token — stateless authentication token format
- **SLA**: Definition: Service Level Agreement — defined response/resolution time commitments
- **SPA**: Definition: Single Page Application — client-side rendered web application
- **WebSocket**: Definition: Full-duplex communication protocol over a single TCP connection
- **Channel Layer**: Definition: Django Channels abstraction for message passing between consumers
- **WAL**: Definition: Write-Ahead Logging — database transaction logging mechanism
- **CORS**: Definition: Cross-Origin Resource Sharing — HTTP header mechanism for cross-domain requests
- **ORM**: Definition: Object-Relational Mapping — technique for querying databases using objects
- **Argon2**: Definition: Memory-hard password hashing algorithm (winner of Password Hashing Competition)
- **HIBP**: Definition: Have I Been Pwned — service for checking if passwords appear in known data breaches

---

## Appendix H: File Structure Reference

```
project-root/
├── backend/
│   ├── manage.py                    # Django management script
│   ├── requirements.txt             # Python dependencies
│   ├── db.sqlite3                   # Development database
│   ├── media/                       # User-uploaded files
│   │   ├── profile_pictures/
│   │   └── ticket_attachments/
│   ├── staticfiles/                 # Collected static files
│   ├── tickets/                     # Core ticketing app
│   │   ├── models/                  # Database models (10 files)
│   │   ├── views/                   # API views (7 files)
│   │   ├── serializers/             # DRF serializers
│   │   ├── migrations/              # Database migrations (20+)
│   │   ├── consumers.py             # WebSocket consumers
│   │   ├── routing.py               # WebSocket URL routing
│   │   ├── permissions.py           # Custom permission classes
│   │   ├── middleware.py             # JWT WebSocket middleware
│   │   ├── signals.py               # Django signal handlers
│   │   ├── admin.py                 # Django admin configuration
│   │   └── swagger.py               # API documentation config
│   ├── users/                       # User management app
│   │   ├── models.py                # Custom User model
│   │   ├── views.py                 # Auth & User ViewSets
│   │   ├── serializers.py           # User serializers
│   │   └── admin.py                 # User admin config
│   └── tickets_backend/             # Django project settings
│       ├── settings.py              # Main configuration
│       ├── urls.py                  # Root URL configuration
│       ├── asgi.py                  # ASGI application
│       └── wsgi.py                  # WSGI application
├── frontend/                        # Legacy frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── admin/                   # Admin components
│   │   ├── employee/                # Employee components
│   │   ├── authentication/          # Auth components
│   │   ├── context/                 # React contexts
│   │   ├── services/                # API services
│   │   └── shared/                  # Shared components
│   └── package.json
├── Maptech_FrontendUI-main/         # Primary frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/                   # Page components
│   │   ├── components/              # Reusable components
│   │   ├── layouts/                 # Role-based layouts
│   │   ├── context/                 # State management
│   │   ├── services/                # API/WebSocket services
│   │   └── shared/                  # Shared utilities
│   └── package.json
└── documentation/                   # This documentation
    ├── README.md                    # Table of contents
    └── 01-21 section files
```

---

*End of Section 21 — End of Documentation*


---

