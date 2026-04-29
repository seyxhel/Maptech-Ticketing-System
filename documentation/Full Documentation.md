# Maptech Ticketing System - Full Documentation

> Consolidated markdown preview file generated from Sections 01-21.

---


<!-- Source: 01-Document-Control.md -->

# 1. DOCUMENT CONTROL

## 1.1 Document Information

| Field | Details |
|-------|---------|
| **Document Title** | Maptech Information Solutions Inc. — Ticketing System: Enterprise System Documentation |
| **System Name** | Maptech Ticketing System |
| **Version** | 1.3 |
| **Date Created** | March 11, 2026 |
| **Last Updated** | April 28, 2026 |
| **Prepared By** | Cuadra, Gerard R. — FullStack |
| | Pelagio, Sealtiel Joseph B. — FullStack |
| | Vebayo, Rivo M. — FullStack |
| | Quieta, Kianshane B. — Quality Assurance |
| | Sulaiman, Carmela M. — Quality Assurance |
| **Reviewed By** | *[To be filled]* |
| **Approved By** | *[To be filled]* |

---

## 1.2 Revision History

| Version | Date | Author | Changes Made |
|---------|------|--------|--------------|
| 1.0 | March 11, 2026 | Cuadra, G., Pelagio, S., Quieta, K., Sulaiman, C., Vebayo, R. | Initial comprehensive documentation release covering all system modules, architecture, data models, API design, security architecture, and deployment specifications. |
| 1.1 | March 31, 2026 | System Update | Added **Sales** role to the RBAC model. Sales users have admin-level access for ticket management and catalog operations but are restricted from supervisor-specific actions (ticket closure, assignment, user management). Updated all role-related sections across documentation. |
| 1.2 | April 15, 2026 | System Update | Updated documentation to match current implementation: sales-led call/priority workflow, supervisor assignment gating, current role routes and modules, updated API/custom action endpoints, and revised permission matrices in overview and appendices. |
| 1.3 | April 28, 2026 | System Update | Finalized user manual deliverables: all role-based module manuals (Sales, SuperAdmin, Supervisor, Technical) and Ticket Lifecycle Workflow standardized under shared Maptech header/footer template. Filenames normalized to canonical format. Ready for distribution. |

---

## 1.3 Distribution List

| Recipient | Role | Copy Type |
|-----------|------|-----------|
| Cuadra, Gerard R. | FullStack Developer | Intern |
| Pelagio, Sealtiel Joseph B. | FullStack Developer | Intern |
| Quieta, Kianshane B. | Quality Assurance | Intern |
| Sulaiman, Carmela M. | Quality Assurance | Intern |
| Vebayo, Rivo M. | FullStack Developer | Intern |
---

## 1.4 Document Conventions

| Convention | Description |
|------------|-------------|
| **Bold** | Key terms, field names, or emphasis |
| `Code` | Code snippets, filenames, commands, API endpoints |
| *Italic* | Placeholder values to be filled in |
| > Blockquote | Important notes or warnings |
| Tables | Structured data references |

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

| Capability | Description |
|------------|-------------|
| **Ticket Lifecycle Management** | Create, assign, track, escalate, resolve, and close support tickets with full status workflow |
| **Role-Based Access Control** | Four user tiers (Superadmin, Admin/Supervisor, Sales, Employee/Technician) with granular permissions |
| **Real-Time Chat** | WebSocket-based live messaging between admins and assigned technicians per ticket |
| **Real-Time Notifications** | Instant push notifications for ticket assignments, status changes, escalations, and messages |
| **SLA Tracking** | Automated estimated resolution days based on service type, with progress percentage calculation |
| **Internal & External Escalation** | Support for escalating tickets to other staff members or to external distributors/principals |
| **Knowledge Hub** | Publish and manage resolution proof documents as searchable knowledge base articles |
| **Client & Product Records** | Comprehensive client database and product/equipment registry linked to tickets |
| **Call Log Management** | Track inbound/outbound support calls with duration tracking and notes |
| **Feedback Rating** | Post-resolution technical staff feedback (1-5) submitted before ticket closure |
| **Audit Logging** | Complete action audit trail with actor, timestamp, IP address, and change details |
| **User Management** | Superadmin-controlled user creation, role assignment, activation/deactivation, and password management |
| **Announcements** | System-wide or role-targeted announcements with scheduling and expiry |
| **Data Retention Policies** | Configurable retention periods for audit and call logs |
| **PDF Generation & Export** | Generate STF (Service Ticket Form) documents and export data to Excel |
| **Digital Signatures** | Capture client signatures on resolved tickets |
| **Dark Mode** | User-selectable dark/light theme for the web interface |

---

## 2.4 Intended Audience

This documentation is intended for the following audiences:

| Audience | Interest Areas |
|----------|---------------|
| **Developers** | System architecture, API design, data models, module design, code structure |
| **System Administrators** | Deployment, operations, configuration, backup/recovery, monitoring |
| **Business Managers** | Business process models, functional requirements, KPIs, reporting |
| **End Users** | User interface design, navigation, feature descriptions (see Appendix C — User Manuals) |
| **IT Auditors** | Security architecture, audit logging, access control, data protection, compliance |
| **Quality Assurance** | Testing strategy, test cases, non-functional requirements, acceptance criteria |
| **Project Stakeholders** | Executive summary, risk management, future enhancements |

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

| Term | Definition |
|------|-----------|
| **STF** | Service Ticket Form — the unique identifier format for support tickets (e.g., STF-MT-20260311000001) |
| **SLA** | Service Level Agreement — the agreed-upon timeframe for ticket resolution |
| **Feedback Rating** | A 1-5 supervisor/admin assessment of technical staff performance before ticket closure |
| **JWT** | JSON Web Token — a compact, URL-safe token format for secure authentication |
| **RBAC** | Role-Based Access Control — a security model where access permissions are assigned to roles |
| **API** | Application Programming Interface — the set of endpoints through which the frontend communicates with the backend |
| **REST** | Representational State Transfer — an architectural style for designing web APIs |
| **ASGI** | Asynchronous Server Gateway Interface — the Python standard for async web servers |
| **WSGI** | Web Server Gateway Interface — the traditional Python web server interface |
| **WebSocket** | A communication protocol providing full-duplex communication channels over a TCP connection |
| **CORS** | Cross-Origin Resource Sharing — a mechanism for allowing restricted resources on a web page from another domain |
| **DRF** | Django REST Framework — the REST API framework used in this system |
| **ORM** | Object-Relational Mapping — a technique that maps database tables to Python objects |
| **ERD** | Entity Relationship Diagram — a visual representation of database table relationships |
| **BPMN** | Business Process Model and Notation — a standard for business process modeling |
| **CI/CD** | Continuous Integration / Continuous Deployment — automated build, test, and deployment pipelines |
| **Daphne** | An HTTP, HTTP2, and WebSocket protocol server for ASGI |
| **Argon2** | A password hashing algorithm, winner of the Password Hashing Competition |
| **HIBP** | Have I Been Pwned — a service that checks whether passwords have been compromised in data breaches |
| **Admin/Supervisor** | A user role with privileges to create, assign, and manage tickets and monitor operations |
| **Employee/Technician** | A user role assigned to resolve tickets and perform field service tasks |
| **Superadmin** | The highest-privilege user role with full system administration capabilities |
| **Escalation** | The process of transferring a ticket to a higher-skill technician (internal) or external vendor (external) |
| **Knowledge Hub** | A repository of published resolution documents accessible to all authenticated users |

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

| External Entity | Interaction Type | Description |
|----------------|-----------------|-------------|
| Web Browser | HTTPS / WSS | Users access the system through modern web browsers |
| External Vendors | Manual (via notes) | Escalation information is recorded in-system; direct integration is not yet implemented |
| HIBP API | HTTPS (outbound) | Password breach checking during password changes/resets |

---

## 4.3 Stakeholders

| Stakeholder | Role | Responsibility |
|-------------|------|---------------|
| Maptech Management | Business Owner | Defines business requirements, approves system direction, reviews reports |
| IT Operations Team | System Operations | Deploys, monitors, and maintains the system infrastructure |
| Development Team | System Development | Designs, develops, tests, and maintains the application codebase |
| Supervisors (Admins) | Primary Operations Leads | Manage ticket operations, assign technicians, monitor SLAs, and close tickets |
| Sales Team | Intake and Client Coordination | Create tickets, complete call and priority workflow, maintain client/product master data |
| Technicians (Employees) | Field Service Workers | Receive assignments, perform diagnostics, resolve issues, submit proofs |
| Superadmins | System Administrators | Manage user accounts, configure system settings, review audit logs |
| Clients (External) | Service Recipients | Report issues via phone/email; tracked in system by sales and supervisors |
| QA Team | Quality Assurance | Validates system functionality and performance through testing |

---

## 4.4 User Roles and Responsibilities

The system implements a role-based access control (RBAC) model with the following roles:

| Role | Description | Access Level |
|------|-------------|-------------|
| **Superadmin** | Highest-privilege system administrator. Full access to all features including user management, system configuration, audit logs, and retention policies. | Full system access |
| **Admin (Supervisor)** | Manages day-to-day ticket operations. Handles assignment/reassignment, escalation handling, ticket review, closure, feedback ratings, and catalog/service maintenance. | Full operational ticket control |
| **Sales** | Handles ticket intake and client coordination. Creates tickets, performs call verification and priority confirmation on sales-created tickets, and manages clients/products/categories. | Ticket intake and catalog management |
| **Employee (Technician)** | Assigned technical staff. Starts work, updates work fields, uploads proof, escalates/pass tickets, submits for observation, and requests closure. | Assigned-ticket execution and updates |

### Role Hierarchy

![Diagram 02](./images/diagram-02.png)

### Detailed Role Permissions

| Feature | Superadmin | Admin (Supervisor) | Sales | Employee (Technician) |
|---------|:----------:|:------------------:|:-----:|:---------------------:|
| View Dashboard & Stats | ✅ | ✅ | ✅ | ✅ (own) |
| Create Tickets | ✅ (API) | ✅ | ✅ (own intake) | ❌ |
| Assign Tickets | ❌ (no ticket UI) | ✅ | ❌ | ❌ |
| Start Work on Ticket | ❌ (no ticket UI) | ✅ (escalation handling) | ❌ | ✅ |
| Update Ticket Fields | ❌ (no ticket UI) | ✅ | ✅ (call review scope) | ✅ (assigned scope) |
| Escalate Internally | ❌ | ❌ | ❌ | ✅ |
| Pass Ticket | ❌ | ❌ | ❌ | ✅ |
| Escalate Externally | ❌ (no ticket UI) | ✅ | ❌ | ✅ |
| Request Closure | ❌ | ❌ | ❌ | ✅ |
| Close Ticket | ❌ (no ticket UI) | ✅ | ❌ | ❌ |
| Confirm Ticket | ❌ (no ticket UI) | ✅ | ✅ (own intake flow) | ❌ |
| Review Ticket | ❌ (no ticket UI) | ✅ | ✅ (own intake flow) | ❌ |
| Link Tickets | ❌ (no ticket UI) | ✅ | ❌ | ❌ |
| Manage Knowledge Hub | ❌ | ✅ | ❌ | ❌ |
| View Knowledge Hub | ❌ | ✅ | ❌ | ✅ |
| Manage Products | ❌ | ✅ | ✅ | ❌ |
| Manage Clients | ❌ | ✅ | ✅ | ❌ |
| Manage Categories | ❌ | ✅ | ✅ | ❌ |
| Manage Types of Service | ❌ | ✅ | ❌ | ❌ |
| Manage Call Logs | ✅ | ✅ | ✅ (ticket call workflow) | ✅ (ticket participant scope) |
| Submit Feedback Ratings | ❌ | ✅ | ❌ | ❌ |
| View Audit Logs | ✅ | ✅ (scoped) | ✅ (scoped) | ❌ |
| Export Audit Logs | ✅ | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Manage Announcements | ✅ | ❌ | ❌ | ❌ |
| Manage Retention Policy | ✅ | ❌ | ❌ | ❌ |
| View Announcements | ✅ | ✅ | ✅ | ✅ |
| Chat (Ticket Channel) | ✅ | ✅ | ✅ | ✅ |
| Receive Notifications | ✅ | ✅ | ✅ | ✅ |
| Update Profile | ✅ | ✅ | ✅ | ✅ |
| Change Password | ✅ | ✅ | ✅ | ✅ |

Notes:
Sales ticket visibility is scoped to tickets they created.
Supervisor-only assignment controls are enforced by the `IsSupervisorLevel` permission.

---

## 4.5 Operational Environment

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Server CPU** | 2 cores | 4+ cores |
| **Server RAM** | 2 GB | 4+ GB |
| **Server Storage** | 10 GB (SSD) | 50+ GB (SSD) for media/attachments growth |
| **Client Device** | Any device with a modern web browser | Desktop or laptop for optimal admin experience |

### Software Requirements

| Component | Requirement |
|-----------|-------------|
| **Server OS** | Windows 10+, Linux (Ubuntu 20.04+), macOS |
| **Python** | 3.10 or higher |
| **Node.js** | 18.x or higher (for frontend build) |
| **Database** | SQLite 3 (development); PostgreSQL recommended for production |
| **Web Browser** | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ |

### Network Infrastructure

| Aspect | Details |
|--------|---------|
| **Protocol** | HTTPS (recommended for production), HTTP (development) |
| **WebSocket** | WSS (production) / WS (development) for real-time features |
| **Ports** | Backend: 8000 (default), Frontend: 3000 (development proxy) |
| **CORS** | Configurable allowed origins via environment variables |
| **Bandwidth** | Standard broadband; system is optimized for low bandwidth |

### Security Environment

| Aspect | Details |
|--------|---------|
| **Authentication** | JWT (JSON Web Tokens) with access/refresh token pair |
| **Password Hashing** | Argon2 (primary), PBKDF2, BCrypt, Scrypt (fallback chain) |
| **Token Lifetime** | Access: 1 day, Refresh: 30 days (configurable) |
| **API Security** | Token-based authentication required for all protected endpoints |
| **WebSocket Security** | JWT token passed via query string for WebSocket authentication |
| **Password Breach Check** | Integration with HIBP API for compromised password detection |

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

| Pattern | Application |
|---------|------------|
| **Client-Server** | React frontend (client) communicates with Django backend (server) via HTTP and WebSocket |
| **MVC / MTV** | Django follows the Model-Template-View pattern (analogous to MVC); DRF extends this with Serializers |
| **RESTful API** | Backend exposes a stateless REST API following REST conventions for CRUD operations |
| **Event-Driven** | Django signals trigger side-effects (notifications, audit logging) on model events |
| **Layered Architecture** | Presentation → Application → Business Logic → Data access layers |
| **Repository Pattern** | Django ORM acts as the data access layer, abstracting database queries |
| **Observer Pattern** | WebSocket consumers observe and broadcast real-time events to connected clients |

---

## 5.3 Logical Architecture

The system is organized into the following logical layers:

![Diagram 03](./images/diagram-03.png)

### Layer Descriptions

| Layer | Description |
|-------|-------------|
| **Presentation Layer** | The React SPA handles all user interface rendering, form inputs, navigation, and real-time UI updates. It communicates with the backend exclusively through the service layer (HTTP API calls and WebSocket connections). |
| **Application Layer** | Django REST Framework handles HTTP request routing, input validation via serializers, authentication, and permission enforcement. Django Channels handles WebSocket lifecycle and real-time message routing. |
| **Business Logic Layer** | Core domain logic including ticket lifecycle state management, assignment algorithms, SLA tracking, escalation workflows, audit logging, and notification dispatch. Implemented within ViewSet methods and Django signal handlers. |
| **Data Layer** | Django ORM provides database abstraction. Models define the schema. Migrations handle schema evolution. File storage handles media uploads including ticket attachments and profile pictures. |

---

## 5.4 Physical Architecture

### Development Environment

![Diagram 04](./images/diagram-04.png)

### Production Environment (Recommended)

![Diagram 05](./images/diagram-05.png)

---

## 5.5 Component Architecture

| Component | Description |
|-----------|-------------|
| **React SPA** | Single-page application built with React 18, TypeScript, React Router, and Tailwind CSS. Produces a static build served by the backend or a CDN. |
| **Vite** | Frontend build tool with HMR (Hot Module Replacement) for development and optimized production builds. Proxies API/WebSocket requests to the Django backend in development. |
| **Django REST Framework** | Provides REST API viewsets, serializers for input/output, permission classes for authorization, and browsable API for development. |
| **Django Channels** | Extends Django with ASGI support for WebSocket handling. Provides the channel layer for broadcasting messages to connected clients. |
| **Daphne** | ASGI server that serves both HTTP and WebSocket connections. Runs the Django application with full async support. |
| **SimpleJWT** | Handles JWT token generation, validation, and refresh. Provides access and refresh token management. |
| **drf-yasg** | Auto-generates Swagger/OpenAPI documentation from DRF viewsets and serializers. Provides Swagger UI and ReDoc interfaces. |
| **Django ORM** | Abstracts database operations. Manages 18 models with relationships, indexes, and constraints. |
| **SQLite** | Default development database. File-based, zero-configuration. |
| **Whitenoise** | Serves static files directly from the Django application without requiring a separate web server. Compresses and caches static assets. |
| **Argon2** | Primary password hashing algorithm. Memory-hard, resistant to GPU-based attacks. |
| **Pillow** | Image processing library for handling profile picture uploads, validation, and storage. |

---

## 5.6 Technology Stack

### Backend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Language | Python | 3.10+ | Server-side programming |
| Web Framework | Django | 4.2+ | Application framework |
| API Framework | Django REST Framework | 3.16.1 | REST API development |
| Authentication | djangorestframework-simplejwt | 5.5.1 | JWT token management |
| WebSocket | Django Channels | 4.3.2 | Real-time WebSocket support |
| ASGI Server | Daphne | (bundled with Channels) | HTTP & WebSocket server |
| API Documentation | drf-yasg | 1.21.15 | Swagger/OpenAPI auto-generation |
| CORS | django-cors-headers | 4.9.0 | Cross-origin request handling |
| Password Hashing | argon2-cffi | 25.1.0 | Argon2 password hashing |
| Static Files | Whitenoise | 6.12.0 | Static file serving |
| Image Processing | Pillow | 12.1.1 | Profile picture handling |
| Environment Variables | python-dotenv | 1.2.2 | Environment configuration |
| HTTP Client | Requests | 2.32.5 | External API calls (HIBP) |
| Database | SQLite 3 (dev) / PostgreSQL (prod) | — | Relational data storage |

### Frontend (Primary — Maptech_FrontendUI-main)

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Language | TypeScript | 5.5.4 | Type-safe JavaScript |
| UI Library | React | 18.3.1 | Component-based UI framework |
| Routing | React Router | 7.13.0 | Client-side routing |
| Styling | Tailwind CSS | 3.4.17 | Utility-first CSS framework |
| UI Utilities | Emotion | 11.13.3 | CSS-in-JS for dynamic styles |
| Icons | Lucide React | 0.522.0 | Icon library |
| Notifications/Toast | Sonner | 2.0.1 | Toast notification component |
| Charts | Recharts | 2.12.7 | Dashboard chart visualizations |
| Excel Export | xlsx-js-style | 1.2.0 | Data export to Excel format |
| Build Tool | Vite | 5.2.0 | Frontend build and dev server |
| Linting | ESLint + @typescript-eslint | 8.50.0 | Code quality enforcement |

### Frontend (Legacy — frontend/)

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| UI Library | React | 18.2.0 | Component-based UI framework |
| Routing | React Router | 6.12.0 | Client-side routing |
| Forms | React Hook Form | 7.71.1 | Form state management |
| OAuth | Azure MSAL, Google OAuth | Various | SSO authentication (planned) |
| Toast | React Toastify | 11.0.5 | Toast notifications |
| Build Tool | Vite | 5.0.0 | Frontend build tool |

---

## 5.7 Communication Protocols

| Protocol | Usage | Details |
|----------|-------|---------|
| **HTTP/HTTPS** | REST API calls | Standard request-response for CRUD operations. JSON payloads. |
| **WebSocket (WS/WSS)** | Real-time chat & notifications | Persistent bidirectional connection for live messaging and push notifications. |
| **JSON** | Data format | All API requests and responses use JSON serialization. |
| **JWT** | Authentication token | Bearer tokens passed in HTTP `Authorization` header and WebSocket query strings. |
| **Multipart/Form-Data** | File uploads | Used for ticket attachment and profile picture uploads. |

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

![Diagram 07](./images/diagram-07.png)

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

![Diagram 08](./images/diagram-08.png)

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

| ID | Module | Requirement | Priority |
|----|--------|-------------|----------|
| FR-001 | Authentication | The system shall support JWT-based login with username or email | Critical |
| FR-002 | Authentication | The system shall provide password reset via email token and recovery key | High |
| FR-003 | Authentication | The system shall check passwords against the HIBP breach database | High |
| FR-004 | Authentication | The system shall support token refresh with configurable lifetimes | Critical |
| FR-005 | User Management | Superadmins shall be able to create, update, activate/deactivate, and reset passwords for users | Critical |
| FR-006 | User Management | Users shall be able to update their own profile (name, phone, avatar) | High |
| FR-007 | User Management | The system shall auto-generate unique usernames from name initials | Medium |
| FR-008 | Ticket Management | Admin-level users shall be able to create tickets with client, product, and service information (sales scope: own intake tickets) | Critical |
| FR-009 | Ticket Management | The system shall auto-generate unique STF numbers (STF-MT-YYYYMMDDXXXXXX) | Critical |
| FR-010 | Ticket Management | Supervisors (admin/superadmin permission group) shall be able to assign tickets to technicians | Critical |
| FR-011 | Ticket Management | Supervisors (admin/superadmin permission group) shall be able to reassign tickets to different technicians | High |
| FR-012 | Ticket Management | Technicians shall be able to start work on assigned tickets (recording time_in) | Critical |
| FR-013 | Ticket Management | Technicians shall be able to update action taken, remarks, job status, and other work fields | Critical |
| FR-014 | Ticket Management | Technicians shall be able to upload resolution proof attachments | Critical |
| FR-015 | Ticket Management | Technicians shall be able to request ticket closure (recording time_out) | Critical |
| FR-016 | Ticket Management | Supervisors shall be able to close tickets after submitting technical staff feedback rating | Critical |
| FR-017 | Ticket Management | Admins and sales users shall be able to confirm tickets (sales scope: own call-verified tickets) | High |
| FR-018 | Ticket Management | Admins and sales users shall be able to review tickets and set priority (sales scope: own call workflow) | High |
| FR-019 | Ticket Management | The system shall track ticket progress percentage based on lifecycle milestones | Medium |
| FR-020 | Ticket Management | Admins shall be able to link related tickets | Medium |
| FR-021 | Escalation | Technicians shall be able to escalate tickets internally (back to admin) | High |
| FR-022 | Escalation | Technicians shall be able to pass tickets to other technicians | High |
| FR-023 | Escalation | Admins/Technicians shall be able to escalate tickets to external vendors | High |
| FR-024 | Escalation | All escalations shall create EscalationLog records with full metadata | High |
| FR-025 | Observation | Technicians shall be able to submit tickets for observation without resolution | Medium |
| FR-026 | Chat | Admins and assigned technicians shall be able to communicate via real-time chat per ticket | Critical |
| FR-027 | Chat | Chat shall support message replies, emoji reactions, and read receipts | Medium |
| FR-028 | Chat | The system shall broadcast system messages for key ticket events | High |
| FR-029 | Notifications | The system shall send real-time push notifications for ticket events | Critical |
| FR-030 | Notifications | Users shall be able to mark notifications as read individually or in bulk | High |
| FR-031 | Knowledge Hub | Admins shall be able to publish resolution proofs as knowledge articles | High |
| FR-032 | Knowledge Hub | All authenticated users shall be able to search and view published articles | High |
| FR-033 | Knowledge Hub | Admins shall be able to archive and unarchive knowledge articles | Medium |
| FR-034 | Client Management | Admins shall be able to create, update, and manage client records | High |
| FR-035 | Product Management | Admins shall be able to create, update, and manage product/equipment records | High |
| FR-036 | Category Management | Admins shall be able to create and manage product categories | Medium |
| FR-037 | Type of Service | Admins shall be able to create and manage service types with SLA days | High |
| FR-038 | Call Logs | Admin-level users shall be able to create/manage support call logs with duration tracking (role-scoped visibility) | Medium |
| FR-039 | Feedback Rating | Supervisors shall be able to submit employee feedback ratings (1-5) before closure | High |
| FR-040 | Audit Logging | The system shall log all significant actions with actor, timestamp, IP, and change details | Critical |
| FR-041 | Audit Logging | Superadmin, admin, and sales roles shall be able to search, filter, and export audit logs within role scope | High |
| FR-042 | Dashboard | The system shall provide role-specific dashboards with ticket statistics | High |
| FR-043 | Announcements | Superadmins shall be able to create role-targeted announcements with scheduling | Medium |
| FR-044 | Retention Policy | Superadmins shall be able to configure data retention periods for logs | Low |
| FR-045 | Digital Signatures | The system shall capture and store digital signatures for ticket resolution | Medium |
| FR-046 | PDF Generation | The system shall generate STF documents in PDF format | Medium |
| FR-047 | Excel Export | The system shall support data export to Excel format | Medium |

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

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-001 |
| **Description** | Supervisor or sales user creates a new support ticket on behalf of a client |
| **Actors** | Admin (Supervisor), Sales |
| **Preconditions** | User is authenticated; client information is available |
| **Main Flow** | 1. User navigates to Create Ticket page. 2. User fills client information (new or existing). 3. User enters service/problem details and optional product details. 4. User submits the form. 5. System creates ticket with auto-generated STF number. 6. System creates client and product records if needed. 7. For supervisor-created tickets, assignment may proceed immediately. 8. For sales-created tickets, ticket enters call/priority workflow before supervisor assignment. |
| **Alternate Flow** | A1: Existing client is selected and fields are pre-filled. A2: No employee is assigned at creation and ticket remains open for supervisor assignment. A3: Sales sets priority and confirms ticket through call workflow first. |
| **Postconditions** | Ticket exists with unique STF number; related records are linked; audit logs and notifications are generated according to workflow. |

---

### UC-002: Employee Works on a Ticket

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-002 |
| **Description** | Technician receives assignment, starts work, and resolves the ticket |
| **Actors** | Employee (Technician) |
| **Preconditions** | Employee is authenticated; ticket is assigned to this employee |
| **Main Flow** | 1. Employee receives notification of assignment. 2. Employee views ticket in My Tickets or dashboard. 3. Employee clicks "Start Work" — system records time_in, status changes to IN_PROGRESS. 4. Employee communicates with supervisor via live chat as needed. 5. Employee conducts diagnosis and takes corrective action. 6. Employee updates ticket fields (action_taken, remarks, job_status). 7. Employee uploads resolution proof (photos, documents). 8. Employee captures client digital signature. 9. Employee clicks "Request Closure" — system verifies resolution proof exists, sets status to PENDING_CLOSURE, records time_out. |
| **Alternate Flow** | A1: Employee cannot resolve — escalates internally (UC-003). A2: Employee needs to pass — passes to another employee (UC-004). A3: Issue needs monitoring — submits for observation (UC-006). |
| **Postconditions** | Ticket in PENDING_CLOSURE status; resolution proof uploaded; time_in and time_out recorded; supervisor notified. |

---

### UC-003: Employee Escalates Ticket Internally

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-003 |
| **Description** | Technician escalates a ticket back to the supervisor for reassignment |
| **Actors** | Employee (Technician) |
| **Preconditions** | Employee is authenticated; ticket is assigned to this employee and in IN_PROGRESS status |
| **Main Flow** | 1. Employee clicks "Escalate" on the ticket. 2. System ends current AssignmentSession. 3. System creates EscalationLog (type: internal). 4. System changes status to ESCALATED. 5. System reassigns ticket to the original admin creator. 6. System sends notification to admin. 7. System broadcasts system message in ticket chat. |
| **Postconditions** | Ticket escalated; old session closed; admin notified; escalation logged. |

---

### UC-004: Employee Passes Ticket

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-004 |
| **Description** | Technician passes ticket to another technician |
| **Actors** | Employee (Technician) |
| **Preconditions** | Employee is authenticated; ticket is assigned; target employee is active |
| **Main Flow** | 1. Employee selects target technician and provides optional notes. 2. System ends current AssignmentSession. 3. System creates EscalationLog with from_user and to_user. 4. System creates new AssignmentSession for target employee. 5. System sends force_disconnect to old employee's WebSocket. 6. System sends notification to new employee. 7. System broadcasts system message in chat. |
| **Postconditions** | Ticket reassigned; sessions rotated; both parties notified. |

---

### UC-005: Admin Closes a Ticket

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-005 |
| **Description** | Supervisor reviews resolution and formally closes the ticket |
| **Actors** | Admin (Supervisor) |
| **Preconditions** | Admin is authenticated; ticket is in PENDING_CLOSURE status |
| **Main Flow** | 1. Admin views ticket in PENDING_CLOSURE status. 2. Admin reviews proof, action taken, and remarks. 3. Admin submits feedback rating for the assigned employee. 4. Admin clicks "Close Ticket." 5. System sets status to CLOSED. 6. System ends active AssignmentSession. 7. System sends notification to the assigned employee. 8. System writes audit logs. |
| **Postconditions** | Ticket status is CLOSED; feedback rating recorded; employee notified; session ended. |

---

### UC-006: Submit Ticket for Observation

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-006 |
| **Description** | Technician submits a ticket for monitoring without immediate resolution |
| **Actors** | Employee (Technician) |
| **Preconditions** | Working on the ticket (IN_PROGRESS status) |
| **Main Flow** | 1. Employee records observation notes, action taken, and job status. 2. Employee submits for observation. 3. System sets status to FOR_OBSERVATION. 4. System creates system message in chat with observation details. 5. Admin is notified to monitor the ticket. |
| **Postconditions** | Ticket in FOR_OBSERVATION; admin aware; observation details recorded. |

---

### UC-007: Real-Time Chat Between Admin and Employee

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-007 |
| **Description** | Supervisor and assigned technician communicate about a ticket in real-time |
| **Actors** | Admin, Employee (assigned to ticket) |
| **Preconditions** | Both users authenticated; ticket exists with active assignment |
| **Main Flow** | 1. User opens ticket detail page and enters the chat panel. 2. WebSocket connection established (authenticated via JWT). 3. System sends existing message history. 4. User types message — typing indicator shown to other party. 5. User sends message — appears instantly for both parties. 6. Recipient sees message; read receipt sent automatically. 7. Users can react with emojis and reply to specific messages. |
| **Postconditions** | Messages stored in database; read receipts tracked; typing events transient. |

---

### UC-008: Superadmin Manages Users

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-008 |
| **Description** | Superadmin creates, edits, activates/deactivates, and resets passwords for user accounts |
| **Actors** | Superadmin |
| **Preconditions** | Superadmin is authenticated |
| **Main Flow** | 1. Superadmin navigates to User Management page. 2. Views list of all users with roles and status. 3. Creates new user (system generates username and temporary password). 4. Edits user profile and role as needed. 5. Deactivates/reactivates accounts. 6. Resets passwords for locked-out users. |
| **Postconditions** | User accounts managed; audit log entries created for all actions. |

---

### UC-009: Publish Knowledge Article

| Field | Details |
|-------|---------|
| **Use Case ID** | UC-009 |
| **Description** | Admin publishes a ticket resolution proof as a knowledge base article |
| **Actors** | Admin |
| **Preconditions** | Resolution proof attachment exists on a ticket |
| **Main Flow** | 1. Admin navigates to Knowledge Hub. 2. Admin browses resolution proofs. 3. Admin clicks "Publish" on an attachment. 4. Admin provides title, description, and up to 3 tags. 5. System marks attachment as published with metadata. 6. Article becomes visible to all authenticated users. |
| **Postconditions** | Article published and searchable; metadata recorded. |

---

*End of Section 7*


---


<!-- Source: 08-Non-Functional-Requirements.md -->

# 8. NON-FUNCTIONAL REQUIREMENTS

## 8.1 Performance Requirements

| Requirement | Specification |
|-------------|--------------|
| **API Response Time** | REST API endpoints shall respond within 500ms under normal load for standard CRUD operations |
| **WebSocket Latency** | Real-time messages shall be delivered to connected clients within 200ms of submission |
| **Page Load Time** | Initial SPA load shall complete within 3 seconds on a standard broadband connection |
| **Concurrent Users** | The system shall support a minimum of 50 concurrent authenticated users in the standard deployment |
| **Database Queries** | Complex list views (tickets with nested relations) shall execute within 1 second |
| **File Upload** | Ticket attachment uploads (up to 10MB per file) shall complete within 10 seconds on standard broadband |
| **Dashboard Rendering** | Dashboard statistics and charts shall render within 2 seconds |

---

## 8.2 Scalability

| Aspect | Current Design | Scale Path |
|--------|---------------|------------|
| **Database** | SQLite (single-file, suitable for low-medium workloads) | Migrate to PostgreSQL for concurrent access and larger datasets |
| **Channel Layer** | InMemoryChannelLayer (single-process only) | Migrate to Redis channel layer for multi-process/multi-server WebSocket support |
| **Application Server** | Single Daphne process | Deploy multiple Daphne/Uvicorn workers behind a load balancer |
| **Static Files** | Whitenoise (served from application) | Move to CDN or dedicated static file server |
| **Media Storage** | Local filesystem | Migrate to cloud storage (AWS S3, Azure Blob) |
| **Caching** | No application-level caching | Add Redis or Memcached for query result caching |
| **Search** | Django ORM icontains queries | Add Elasticsearch or PostgreSQL full-text search for large datasets |

---

## 8.3 Security Requirements

### 8.3.1 Authentication

| Requirement | Implementation |
|-------------|---------------|
| **Authentication Method** | JWT (JSON Web Tokens) via djangorestframework-simplejwt |
| **Token Lifetime** | Access token: 1 day; Refresh token: 30 days |
| **Token Rotation** | Refresh tokens are rotated on each refresh (ROTATE_REFRESH_TOKENS=True) |
| **Password Hashing** | Argon2 (primary), with PBKDF2, BCrypt, and Scrypt as fallbacks |
| **Password Strength** | Minimum 8 characters enforced at application level |
| **Password Breach Check** | Passwords checked against HIBP (Have I Been Pwned) API during changes/resets |
| **WebSocket Authentication** | JWT token passed via query string and validated by custom JWTAuthMiddleware |
| **Login Audit** | All login events logged to AuditLog with IP address and timestamp |

### 8.3.2 Authorization

| Requirement | Implementation |
|-------------|---------------|
| **Access Control Model** | Role-Based Access Control (RBAC) with four roles: superadmin, admin, sales, employee |
| **Permission Classes** | Seven custom DRF permission classes enforcing role-based access at the API level |
| **Object-Level Permissions** | ViewSets filter querysets by user role (e.g., employees see only assigned tickets) |
| **WebSocket Access Control** | Chat consumers validate that users are ticket participants before allowing connection |
| **Route Protection** | Frontend ProtectedRoute components verify user role before rendering pages |

### 8.3.3 Data Encryption

| Requirement | Implementation |
|-------------|---------------|
| **Passwords** | Hashed with Argon2 (memory-hard, salted) — never stored in plaintext |
| **Transport** | HTTPS recommended for production; all API calls use token-based authentication |
| **Tokens** | JWT tokens signed with Django SECRET_KEY; short-lived access tokens reduce exposure |
| **Sensitive Data** | Recovery keys stored encrypted; profile pictures served through authenticated endpoints |

### 8.3.4 Audit Logging

| Requirement | Implementation |
|-------------|---------------|
| **Scope** | All significant system actions logged: CRUD, login/logout, assignment, escalation, status changes |
| **Metadata** | Each log entry captures: timestamp, entity, action, activity description, actor, actor email, IP address, field-level changes (JSON diff) |
| **Retention** | Configurable retention policy (default: 365 days for audit and call logs) |
| **Access** | Superadmins see admin + employee logs; admins see employee logs; employees have no audit log access |
| **Export** | CSV export limited to 5,000 records with filtering |

---

## 8.4 Reliability

| Requirement | Specification |
|-------------|--------------|
| **System Uptime** | Target 99.5% uptime during business hours (excluding planned maintenance) |
| **Data Integrity** | Django ORM transactions ensure atomic database operations |
| **WebSocket Recovery** | Frontend clients implement automatic reconnection on WebSocket disconnect |
| **Error Handling** | All API endpoints return structured error responses with appropriate HTTP status codes |
| **Data Persistence** | All ticket data, messages, and audit logs are persisted to database immediately |
| **Graceful Degradation** | Real-time features (chat, notifications) degrade gracefully — system remains functional via REST API if WebSocket connection fails |

---

## 8.5 Availability

| Requirement | Specification |
|-------------|--------------|
| **Operational Hours** | The system is designed for 24/7 availability |
| **Maintenance Windows** | Planned maintenance performed during off-peak hours with advance notification |
| **Recovery Time** | Target RTO (Recovery Time Objective): 2 hours |
| **Recovery Point** | Target RPO (Recovery Point Objective): 24 hours (aligned with backup frequency) |
| **Network Error Handling** | Frontend displays network error modal when backend is unreachable (NetworkErrorModal component) |

---

## 8.6 Maintainability

| Requirement | Specification |
|-------------|--------------|
| **Code Organization** | Backend follows Django app structure with separated models, serializers, views, and permissions |
| **Modularity** | Models split into topical files (ticket.py, messaging.py, lifecycle.py, audit.py, etc.) |
| **API Documentation** | Auto-generated Swagger/OpenAPI docs via drf-yasg, accessible at `/swagger/` and `/redoc/` |
| **Database Migrations** | Django migration system tracks all schema changes with version control |
| **Configuration** | Environment variables via python-dotenv for deployment-specific settings |
| **Frontend Architecture** | Component-based React with TypeScript for type safety; pages organized by role |
| **Dependency Management** | Backend: requirements.txt; Frontend: package.json with locked versions |

---

## 8.7 Usability

| Requirement | Specification |
|-------------|--------------|
| **Responsive Design** | Tailwind CSS responsive utilities ensure usability across desktop and tablet |
| **Dark Mode** | User-selectable dark/light theme (persisted to localStorage) |
| **Role-Based Navigation** | Each role has a dedicated layout with relevant sidebar navigation items |
| **Toast Notifications** | In-app toast messages (via Sonner) for action confirmations and errors |
| **Real-Time Feedback** | Typing indicators, read receipts, and live message delivery provide immediate feedback |
| **Search** | All list views support search/filter functionality |
| **Form Validation** | Client-side validation with user-friendly error messages |
| **Loading States** | Skeleton loaders and spinners indicate pending operations |
| **Accessibility** | UI components follow semantic HTML practices; keyboard navigation supported |

---

*End of Section 8*


---


<!-- Source: 09-Data-Architecture.md -->

# 9. DATA ARCHITECTURE

## 9.1 Data Model Overview

The Maptech Ticketing System uses a relational data model implemented through Django's ORM. The database consists of **18 primary tables** (models) organized into the following logical groups:

| Group | Models | Purpose |
|-------|--------|---------|
| **Identity** | User | User accounts and authentication |
| **Core Ticketing** | Ticket, TicketAttachment, TicketTask | Ticket records, file attachments, and sub-tasks |
| **Assignment & Messaging** | AssignmentSession, Message, MessageReaction, MessageReadReceipt | Ticket assignment tracking and real-time communication |
| **Lifecycle & Escalation** | EscalationLog | Escalation history and tracking |
| **Audit & Compliance** | AuditLog | System-wide action audit trail |
| **Notifications** | Notification | User notifications for ticket events |
| **Support Operations** | CallLog, FeedbackRating | Call tracking and employee feedback ratings |
| **Catalog / Lookup** | TypeOfService, Category, Product, Client | Service types, product categories, equipment, and client records |
| **Configuration** | RetentionPolicy, Announcement | System configuration and announcements |

---

## 9.2 Entity Relationship Diagram (ERD)

![Diagram 12](./images/diagram-12.png)

---

## 9.3 Database Schema

### Table Listing

| Table Name | Description | Key Relationships |
|------------|-------------|-------------------|
| `users_user` | User accounts (extends Django AbstractUser) | Referenced by nearly all other tables |
| `tickets_ticket` | Core ticket records | FK → User (created_by, assigned_to), FK → TypeOfService, FK → Client, FK → Product, FK → AssignmentSession, M2M → self (linked_tickets) |
| `tickets_ticketattachment` | File attachments for tickets | FK → Ticket, FK → User (uploaded_by, published_by) |
| `tickets_tickettask` | Sub-tasks within tickets | FK → Ticket, FK → User (assigned_to) |
| `tickets_assignmentsession` | Employee assignment periods | FK → Ticket, FK → User (employee) |
| `tickets_message` | Chat messages | FK → Ticket, FK → AssignmentSession, FK → User (sender), FK → self (reply_to) |
| `tickets_messagereaction` | Emoji reactions on messages | FK → Message, FK → User |
| `tickets_messagereadreceipt` | Read receipts for messages | FK → Message, FK → User |
| `tickets_escalationlog` | Escalation history records | FK → Ticket, FK → User (from_user, to_user) |
| `tickets_auditlog` | System-wide audit trail | FK → User (actor) |
| `tickets_notification` | User notifications | FK → User (recipient), FK → Ticket |
| `tickets_calllog` | Support call records | FK → Ticket, FK → User (admin) |
| `tickets_feedbackrating` | Employee feedback ratings | OneToOne → Ticket, FK → User (employee, admin) |
| `tickets_typeofservice` | Service type definitions | Referenced by Ticket |
| `tickets_category` | Product categories | Referenced by Product |
| `tickets_product` | Product/equipment records | FK → Category, Referenced by Ticket |
| `tickets_client` | Client organization records | Referenced by Ticket |
| `tickets_retentionpolicy` | Singleton system config | FK → User (updated_by) |
| `tickets_announcement` | System announcements | FK → User (created_by) |

---

## 9.4 Data Dictionary

### User Table (`users_user`)

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| id | BigAutoField | PK, Auto-increment | Unique user identifier |
| username | CharField(150) | Unique, Required | Login username (auto-generated from initials) |
| email | EmailField | Unique, Required | User email address |
| password | CharField(128) | Required | Hashed password (Argon2) |
| role | CharField(12) | Choices: employee/sales/admin/superadmin | User role determining access level |
| first_name | CharField(150) | Optional | User's first name |
| middle_name | CharField(150) | Optional | User's middle name |
| last_name | CharField(150) | Optional | User's last name |
| suffix | CharField(3) | Optional | Name suffix (Jr., Sr., III) |
| phone | CharField(13) | Optional | Phone in +63XXXXXXXXXX format |
| profile_picture | ImageField | Optional, Nullable | Upload path: profile_pictures/ |
| recovery_key | CharField(39) | Unique, Auto-generated | Format: xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx |
| is_active | BooleanField | Default: True | Account activation status |
| is_staff | BooleanField | Default: False | Django admin access |
| is_superuser | BooleanField | Default: False | Django superuser flag |
| date_joined | DateTimeField | Auto | Account creation timestamp |
| last_login | DateTimeField | Nullable | Last successful login |

### Ticket Table (`tickets_ticket`)

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| id | BigAutoField | PK | Unique ticket identifier |
| stf_no | CharField(30) | Unique, Auto-generated | Service Ticket Form number (STF-MT-YYYYMMDDXXXXXX) |
| status | CharField(20) | Choices, Default: 'open' | Current ticket status |
| priority | CharField(10) | Choices, Optional | Ticket priority (low/medium/high/critical) |
| created_by | ForeignKey(User) | CASCADE | Supervisor who created the ticket |
| assigned_to | ForeignKey(User) | SET_NULL, Nullable | Currently assigned technician |
| type_of_service | ForeignKey | SET_NULL, Nullable | Selected service type |
| type_of_service_others | CharField(200) | Optional | Custom service type text |
| client_record | ForeignKey(Client) | SET_NULL, Nullable | Linked client organization |
| product_record | ForeignKey(Product) | SET_NULL, Nullable | Linked product/equipment |
| current_session | ForeignKey(Session) | SET_NULL, Nullable | Current active assignment session |
| date | DateField | Default: today | Ticket creation date |
| time_in | DateTimeField | Nullable | When technician started work |
| time_out | DateTimeField | Nullable | When technician submitted resolution |
| description_of_problem | TextField | Optional | Problem description from supervisor |
| action_taken | TextField | Optional | Technician's resolution actions |
| remarks | TextField | Optional | Additional notes |
| job_status | CharField(20) | Choices, Optional | Job completion status |
| cascade_type | CharField(20) | Choices, Optional | Internal/External cascade type |
| observation | TextField | Optional | Observation notes |
| signature | TextField | Optional | Base64-encoded digital signature |
| signed_by_name | CharField(200) | Optional | Name of person who signed |
| confirmed_by_admin | BooleanField | Default: False | Client verification confirmed |
| preferred_support_type | CharField(20) | Choices, Optional | Remote/Onsite/Chat/Call |
| estimated_resolution_days_override | PositiveIntegerField | Nullable | Manual SLA override |
| external_escalated_to | CharField(300) | Optional | External vendor name |
| external_escalation_notes | TextField | Optional | External escalation details |
| external_escalated_at | DateTimeField | Nullable | External escalation timestamp |
| linked_tickets | ManyToManyField(self) | Optional | Related tickets |
| created_at | DateTimeField | Auto | Record creation timestamp |
| updated_at | DateTimeField | Auto | Last modification timestamp |

### TicketAttachment Table (`tickets_ticketattachment`)

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| id | BigAutoField | PK | Unique attachment identifier |
| ticket | ForeignKey(Ticket) | CASCADE | Parent ticket |
| file | FileField | Required | Upload path: ticket_attachments/YYYY/MM/DD/ |
| uploaded_by | ForeignKey(User) | SET_NULL, Nullable | User who uploaded the file |
| uploaded_at | DateTimeField | Auto | Upload timestamp |
| is_resolution_proof | BooleanField | Default: False | Marks as resolution evidence |
| is_published | BooleanField | Default: False | Published to Knowledge Hub |
| published_title | CharField(300) | Optional | Knowledge article title |
| published_description | TextField | Optional | Knowledge article description |
| published_tags | JSONField | Default: [], Max 3 | Searchable tags |
| published_by | ForeignKey(User) | SET_NULL, Nullable | User who published |
| published_at | DateTimeField | Nullable | Publication timestamp |
| is_archived | BooleanField | Default: False | Archive status |

### Message Table (`tickets_message`)

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| id | BigAutoField | PK | Unique message identifier |
| ticket | ForeignKey(Ticket) | CASCADE | Parent ticket |
| assignment_session | ForeignKey(Session) | SET_NULL, Nullable | Session during which message was sent |
| channel_type | CharField(20) | Choices: 'admin_employee' | Communication channel |
| sender | ForeignKey(User) | CASCADE | Message author |
| content | TextField | Required | Message text content |
| reply_to | ForeignKey(Message) | SET_NULL, Nullable | Referenced message for replies |
| is_system_message | BooleanField | Default: False | Auto-generated system message flag |
| created_at | DateTimeField | Auto | Send timestamp |

### AuditLog Table (`tickets_auditlog`)

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| id | BigAutoField | PK | Unique log entry identifier |
| timestamp | DateTimeField | Auto, Indexed | When the action occurred |
| entity | CharField(30) | Choices, Indexed | Entity type (User/Ticket/etc.) |
| entity_id | PositiveIntegerField | Nullable | Affected entity's ID |
| action | CharField(20) | Choices, Indexed | Action type (CREATE/UPDATE/LOGIN/etc.) |
| activity | TextField | Required | Human-readable description |
| actor | ForeignKey(User) | SET_NULL, Nullable | User who performed the action |
| actor_email | EmailField | Optional | Snapshot of actor's email at time of action |
| ip_address | GenericIPAddressField | Nullable | Client IP address |
| changes | JSONField | Nullable | JSON diff of changed fields |

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

| Attribute | Details |
|-----------|---------|
| **Module Name** | Ticket Management |
| **Description** | Core module managing the complete ticket lifecycle including creation, assignment, work tracking, escalation, resolution, and closure |
| **Responsibilities** | CRUD for tickets; assignment/reassignment; status transitions; SLA tracking; task management; attachment handling; dashboard statistics |
| **Primary ViewSet** | `TicketViewSet` (ModelViewSet) |
| **Serializers** | `TicketSerializer`, `AdminCreateTicketSerializer`, `EmployeeTicketActionSerializer`, `TicketTaskSerializer`, `TicketAttachmentSerializer` |
| **Permissions** | IsAuthenticated, IsAdminLevel, IsAssignedEmployee, IsAdminOrAssignedEmployee, IsTicketParticipant |

### Key Actions

| Action | Method | URL | Permission | Description |
|--------|--------|-----|------------|-------------|
| List/Create | GET/POST | `/api/tickets/` | IsAuthenticated | List tickets (role-scoped) or create new ticket |
| Retrieve/Update | GET/PUT | `/api/tickets/{id}/` | IsAuthenticated | Get or update ticket details |
| Assign | POST | `/api/tickets/{id}/assign/` | IsSupervisorLevel | Assign/reassign ticket to technician |
| Escalate | POST | `/api/tickets/{id}/escalate/` | IsAssignedEmployee | Internal escalation (back to admin) |
| Pass Ticket | POST | `/api/tickets/{id}/pass_ticket/` | IsAssignedEmployee | Transfer to another technician |
| Review | POST | `/api/tickets/{id}/review/` | IsAdminLevel | Admin reviews ticket, sets priority |
| Confirm | POST | `/api/tickets/{id}/confirm_ticket/` | IsAdminLevel | Confirm client verification |
| Escalate External | POST | `/api/tickets/{id}/escalate_external/` | IsAdminOrAssignedEmployee | Escalate to external vendor |
| Close | POST | `/api/tickets/{id}/close_ticket/` | IsAdminLevel | Formally close ticket |
| Start Work | POST | `/api/tickets/{id}/start_work/` | IsAdminOrAssignedEmployee | Technician starts (records time_in) |
| Request Closure | POST | `/api/tickets/{id}/request_closure/` | IsAssignedEmployee | Submit resolution for closure |
| Upload Proof | POST | `/api/tickets/{id}/upload_resolution_proof/` | IsAdminOrAssignedEmployee | Upload resolution proof files |
| Submit Observation | POST | `/api/tickets/{id}/submit_for_observation/` | IsAdminOrAssignedEmployee | Submit for monitoring |
| Save Product | PATCH | `/api/tickets/{id}/save_product_details/` | IsAdminOrAssignedEmployee | Save product/equipment info |
| Update Fields | PATCH | `/api/tickets/{id}/update_employee_fields/` | IsAdminOrAssignedEmployee | Employee updates work fields |
| Link Tickets | POST | `/api/tickets/{id}/link_tickets/` | IsAdminLevel | Link related tickets |
| Update Task | PATCH | `/api/tickets/{id}/update_task/{task_id}/` | IsAdminOrAssignedEmployee | Update sub-task status |
| Delete Attachment | DELETE | `/api/tickets/{id}/delete_attachment/{att_id}/` | IsTicketParticipant | Remove attachment |
| Stats | GET | `/api/tickets/stats/` | IsAuthenticated | Dashboard statistics |
| Messages | GET | `/api/tickets/{id}/messages/` | IsTicketParticipant | Chat message history |
| History | GET | `/api/tickets/{id}/assignment_history/` | IsTicketParticipant | Assignment session history |

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

| Attribute | Details |
|-----------|---------|
| **Module Name** | User Management |
| **Description** | Manages user accounts, authentication, profile updates, and password operations |
| **Responsibilities** | JWT authentication; user CRUD (superadmin); profile management; avatar upload; password change/reset; account activation |
| **Primary ViewSets** | `AuthViewSet`, `UserViewSet`, `CustomTokenObtainPairView` |
| **Serializers** | `UserSerializer`, `AdminUserCreateSerializer` |
| **Permissions** | IsAuthenticated (profile), IsSuperAdmin (user management) |

### Key Actions

| Action | Method | URL | Permission | Description |
|--------|--------|-----|------------|-------------|
| Login | POST | `/api/auth/login/` | Public | JWT token authentication |
| Token Refresh | POST | `/api/auth/token/refresh/` | Public | Refresh access token |
| Current User | GET | `/api/auth/me/` | IsAuthenticated | Get authenticated user profile |
| Upload Avatar | POST | `/api/auth/upload_avatar/` | IsAuthenticated | Upload profile picture (max 5MB) |
| Remove Avatar | DELETE | `/api/auth/remove_avatar/` | IsAuthenticated | Delete profile picture |
| Update Profile | PATCH | `/api/auth/update_profile/` | IsAuthenticated | Edit name, phone, username |
| Change Password | POST | `/api/auth/change_password/` | IsAuthenticated | Change own password |
| Logout | POST | `/api/auth/logout/` | IsAuthenticated | Clear auth cookies and log logout event |
| Password Reset | POST | `/api/auth/password-reset/` | Public | Request email-based reset |
| Reset by Key | POST | `/api/auth/password-reset-by-key/` | Public | Reset via recovery key |
| Reset Confirm | POST | `/api/auth/password-reset-confirm/` | Public | Complete email-based reset |
| List Users | GET | `/api/users/list_users/` | IsSuperAdmin | List all user accounts |
| Create User | POST | `/api/users/create_user/` | IsSuperAdmin | Create new user account |
| Update User | PATCH | `/api/users/{id}/update_user/` | IsSuperAdmin | Edit user profile/role |
| Toggle Active | POST | `/api/users/{id}/toggle_active/` | IsSuperAdmin | Activate/deactivate account |
| Reset Password | POST | `/api/users/{id}/reset_password/` | IsSuperAdmin | Reset user password |

### Dependencies
- Django auth system (AbstractUser, token_generator)
- SimpleJWT (token generation/validation)
- HIBP API (password breach checking)
- AuditLog model (action logging)
- File system (profile picture storage)

---

## Module 3: Real-Time Communication (`tickets.consumers`)

| Attribute | Details |
|-----------|---------|
| **Module Name** | Real-Time Communication |
| **Description** | WebSocket-based live chat and notification delivery |
| **Responsibilities** | Ticket chat (messaging, reactions, read receipts, typing); notification push and management |
| **Primary Consumers** | `TicketChatConsumer`, `NotificationConsumer` |
| **Middleware** | `JWTAuthMiddleware` (WebSocket authentication) |

### WebSocket Endpoints

| Consumer | URL Pattern | Purpose |
|----------|------------|---------|
| NotificationConsumer | `ws/notifications/?token=<jwt>` | Personal notification channel |
| TicketChatConsumer | `ws/chat/{ticket_id}/admin_employee/?token=<jwt>` | Ticket-specific chat |

### Chat Consumer Actions

| Action | Direction | Description |
|--------|-----------|-------------|
| `send_message` | Client → Server | Send chat message (content, optional reply_to) |
| `typing` | Client → Server | Toggle typing indicator |
| `react` | Client → Server | Toggle emoji reaction on message |
| `mark_read` | Client → Server | Mark messages as read |

### Notification Consumer Actions

| Action | Direction | Description |
|--------|-----------|-------------|
| `mark_read` | Client → Server | Mark specific notification IDs as read |
| `mark_all_read` | Client → Server | Mark all notifications as read |

### Dependencies
- Channel layer (InMemory or Redis for production)
- Ticket model (access control)
- AssignmentSession model (session context)
- Message model (persistence)
- Notification model (persistence and dispatch)

---

## Module 4: Audit & Compliance (`tickets.views.audit`)

| Attribute | Details |
|-----------|---------|
| **Module Name** | Audit & Compliance |
| **Description** | System-wide action audit logging with search, filter, and export capabilities |
| **Responsibilities** | Audit log storage; role-scoped access; filtering and search; CSV export; summary statistics |
| **Primary ViewSet** | `AuditLogViewSet` (ReadOnlyModelViewSet) |
| **Serializers** | `AuditLogSerializer` |
| **Permissions** | IsAuthenticated + IsAdminLevel |

### Key Actions

| Action | Method | URL | Description |
|--------|--------|-----|-------------|
| List | GET | `/api/audit-logs/` | Browse audit logs with filters |
| Retrieve | GET | `/api/audit-logs/{id}/` | View single log entry |
| Summary | GET | `/api/audit-logs/summary/` | Dashboard statistics |
| Export | GET | `/api/audit-logs/export/` | CSV download (max 5,000 records) |

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

| Attribute | Details |
|-----------|---------|
| **Module Name** | Catalog Management |
| **Description** | CRUD operations for product categories, products/equipment, and client records |
| **Responsibilities** | Category CRUD; Product CRUD with search; Client CRUD with ticket linking |
| **Primary ViewSets** | `CategoryViewSet`, `ProductViewSet`, `ClientViewSet` |
| **Serializers** | `CategorySerializer`, `ProductSerializer`, `ClientSerializer` |
| **Permissions** | IsAuthenticated (read), IsAdminLevel (write) |

### Data Interactions
- Non-admin users see only active records
- Categories link to Products (FK)
- Clients link to Tickets (FK)
- Products link to Tickets (FK)

---

## Module 6: Knowledge Hub (`tickets.views.knowledge`)

| Attribute | Details |
|-----------|---------|
| **Module Name** | Knowledge Hub |
| **Description** | Publication and consumption of ticket resolution documentation as knowledge articles |
| **Responsibilities** | Browse resolution proofs; publish/unpublish articles; archive management; summary stats; employee-facing article search |
| **Primary ViewSets** | `KnowledgeHubViewSet`, `PublishedArticleViewSet` |
| **Serializers** | `KnowledgeHubAttachmentSerializer`, `PublishedArticleSerializer` |
| **Permissions** | IsAdminLevel (management), IsAuthenticated (published articles) |

---

## Module 7: Support Operations (`tickets.views.support`)

| Attribute | Details |
|-----------|---------|
| **Module Name** | Support Operations |
| **Description** | Call log tracking and employee feedback ratings |
| **Responsibilities** | Call log CRUD with duration tracking; feedback rating submission before closure |
| **Primary ViewSets** | `CallLogViewSet`, `FeedbackRatingViewSet` |
| **Serializers** | `CallLogSerializer`, `FeedbackRatingSerializer` |
| **Permissions** | IsAuthenticated + IsAdminLevel |

---

## Module 8: System Configuration (`tickets.views.config`)

| Attribute | Details |
|-----------|---------|
| **Module Name** | System Configuration |
| **Description** | System-wide configuration including data retention policies and announcements |
| **Responsibilities** | Retention policy management (singleton); announcement CRUD with scheduling and visibility |
| **Primary ViewSets** | `RetentionPolicyViewSet`, `AnnouncementViewSet` |
| **Serializers** | `RetentionPolicySerializer`, `AnnouncementSerializer` |
| **Permissions** | IsSuperAdmin (retention policy), IsAuthenticated (announcements read), IsSuperAdmin (announcements write) |

---

## Module 9: Signal Handlers (`tickets.signals`)

| Attribute | Details |
|-----------|---------|
| **Module Name** | Event-Driven Side Effects |
| **Description** | Django signal handlers that trigger automated actions on model events |
| **Responsibilities** | Login/logout audit logging; user creation logging; ticket creation notifications; assignment change notifications; status change notifications; escalation notifications |

### Signal Map

| Signal | Model/Event | Handler | Effect |
|--------|-------------|---------|--------|
| `post_migrate` | App ready | `create_initial_admin` | Creates default admin account |
| `user_logged_in` | Auth signal | `audit_user_login` | Audit log + IP capture |
| `user_logged_out` | Auth signal | `audit_user_logout` | Audit log + IP capture |
| `post_save` | User created | `audit_user_save` | Audit log for user creation |
| `post_save` | Ticket created | `notify_ticket_changes` | Notification to all admins |
| `pre_save` | Ticket saving | `capture_ticket_old_values` | Store old assignment/status |
| `post_save` | Ticket saved | `notify_ticket_assignment_and_status` | Notifications for assignment/status changes |
| `post_save` | EscalationLog | `notify_escalation_log` | Notification to escalation target |

---

*End of Section 10*


---


<!-- Source: 11-User-Interface-Design.md -->

# 11. USER INTERFACE DESIGN

## 11.1 UI Design Principles

The Maptech Ticketing System frontend follows these design principles:

| Principle | Implementation |
|-----------|---------------|
| **Role-Based Layouts** | Each user role (Superadmin, Admin, Sales, Employee) has a dedicated layout with role-appropriate navigation and features |
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

### Sales Pages

| Screen | Description |
|--------|-------------|
| **Dashboard** | Sales overview of intake metrics, ticket trends, and client/product summaries |
| **Tickets** | List of sales-created tickets with filters and quick navigation to ticket details |
| **Create Ticket** | Multi-step STF creation flow for sales intake, including client call workflow and priority setting |
| **Products** | CRUD table for products with category, brand, model, serial, warranty filters |
| **Clients** | CRUD table for client organizations with contact details. View client ticket history |
| **Categories** | CRUD table for device/equipment categories used in product registration |
| **Settings** | Profile editing and password change |

### Employee (Technician) Pages

| Screen | Description |
|--------|-------------|
| **Dashboard** | Assigned ticket summary, active ticket count, recent notifications, announcements |
| **Assigned Tickets** | List of all tickets assigned to the technician with status/SLA filters |
| **Reports** | Personal operational report view for assigned/in-progress/resolved workload |
| **Ticket Details** | Ticket view with: problem details, action fields (action_taken, remarks, job_status), product detail form, attachment upload, resolution proof upload, digital signature capture, chat panel with supervisor |
| **Knowledge Hub** | Read-only searchable list of published knowledge articles |
| **Escalation** | Escalation history and own ticket escalation tracking |
| **Settings** | Profile editing, password change |

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


---


<!-- Source: 12-API-Design.md -->

# 12. API DESIGN

## 12.1 API Overview

The Maptech Ticketing System exposes a RESTful JSON API built on Django REST Framework. All endpoints follow REST conventions and are auto-documented via Swagger/OpenAPI (drf-yasg).

| Attribute | Details |
|-----------|---------|
| **Base URL** | `http://localhost:8000/api/` (development) |
| **Protocol** | HTTP (development), HTTPS (production recommended) |
| **Data Format** | JSON (application/json) for all request/response bodies |
| **File Uploads** | Multipart form-data (multipart/form-data) |
| **API Documentation** | Swagger UI: `/swagger/` — ReDoc: `/redoc/` — Schema: `/swagger.json` |
| **Versioning** | Not currently versioned (single version) |
| **Pagination** | Default DRF pagination (configurable) |

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

| Parameter | Value |
|-----------|-------|
| Access Token Lifetime | 1 day |
| Refresh Token Lifetime | 30 days |
| Token Rotation | Enabled (new refresh token on each refresh) |
| Blacklist After Rotation | Disabled |

### WebSocket Authentication

WebSocket connections authenticate by passing the JWT token as a query parameter:

```
ws://localhost:8000/ws/notifications/?token=eyJhbGciOiJIUzI1NiIs...
ws://localhost:8000/ws/chat/42/admin_employee/?token=eyJhbGciOiJIUzI1NiIs...
```

---

## 12.3 Endpoint Structure

### Authentication Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/auth/login/` | POST | Obtain JWT access + refresh tokens | Public |
| `/api/auth/token/refresh/` | POST | Refresh access token | Public |
| `/api/auth/me/` | GET | Get current user profile | Required |
| `/api/auth/upload_avatar/` | POST | Upload profile picture (max 5MB, image/*) | Required |
| `/api/auth/remove_avatar/` | DELETE | Remove profile picture | Required |
| `/api/auth/update_profile/` | PATCH | Update name, phone, username | Required |
| `/api/auth/change_password/` | POST | Change own password | Required |
| `/api/auth/logout/` | POST | Logout and clear auth cookies | Required |
| `/api/auth/password-reset/` | POST | Request password reset (email) | Public |
| `/api/auth/password-reset-by-key/` | POST | Reset password via recovery key | Public |
| `/api/auth/password-reset-confirm/` | POST | Confirm email-based password reset | Public |

### User Management Endpoints (Superadmin Only)

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/users/list_users/` | GET | List all users | Superadmin |
| `/api/users/create_user/` | POST | Create new user account | Superadmin |
| `/api/users/{id}/update_user/` | PATCH | Update user profile/role | Superadmin |
| `/api/users/{id}/toggle_active/` | POST | Activate/deactivate account | Superadmin |
| `/api/users/{id}/reset_password/` | POST | Reset user password | Superadmin |

### Ticket Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/tickets/` | GET | List tickets (role-scoped) | Required |
| `/api/tickets/` | POST | Create new ticket | Admin-level |
| `/api/tickets/{id}/` | GET | Retrieve ticket details | Required |
| `/api/tickets/{id}/` | PUT/PATCH | Update ticket (role-scoped fields) | Required |
| `/api/tickets/{id}/` | DELETE | Delete ticket | Admin-level |
| `/api/tickets/{id}/assign/` | POST | Assign/reassign to technician | Supervisor-level |
| `/api/tickets/{id}/escalate/` | POST | Internal escalation | Employee |
| `/api/tickets/{id}/pass_ticket/` | POST | Pass to another technician | Employee |
| `/api/tickets/{id}/review/` | POST | Review ticket, set priority | Admin-level |
| `/api/tickets/{id}/confirm_ticket/` | POST | Confirm client verification | Admin-level |
| `/api/tickets/{id}/escalate_external/` | POST | Escalate to external vendor | Admin/Employee |
| `/api/tickets/{id}/close_ticket/` | POST | Close ticket | Admin-level |
| `/api/tickets/{id}/start_work/` | POST | Start work (record time_in) | Admin/Employee |
| `/api/tickets/{id}/request_closure/` | POST | Submit resolution for closure | Employee |
| `/api/tickets/{id}/upload_resolution_proof/` | POST | Upload resolution proof files | Admin/Employee |
| `/api/tickets/{id}/submit_for_observation/` | POST | Submit for monitoring | Admin/Employee |
| `/api/tickets/{id}/save_product_details/` | PATCH | Save product info | Admin/Employee |
| `/api/tickets/{id}/update_employee_fields/` | PATCH | Update work fields | Admin/Employee |
| `/api/tickets/{id}/link_tickets/` | POST | Link related tickets | Admin-level |
| `/api/tickets/{id}/update_task/{task_id}/` | PATCH | Update sub-task status | Admin/Employee |
| `/api/tickets/{id}/delete_attachment/{att_id}/` | DELETE | Remove attachment | Participant |
| `/api/tickets/next_stf_no/` | GET | Preview next STF number | Required |
| `/api/tickets/stats/` | GET | Dashboard statistics | Required |
| `/api/tickets/{id}/messages/` | GET | Chat message history | Participant |
| `/api/tickets/{id}/assignment_history/` | GET | Assignment session history | Participant |

### Catalog Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/type-of-service/` | GET | List service types | Required |
| `/api/type-of-service/` | POST | Create service type | Admin |
| `/api/type-of-service/{id}/` | GET/PUT/DELETE | Retrieve/Update/Delete service type | Admin (write) |
| `/api/categories/` | GET | List product categories | Required |
| `/api/categories/` | POST | Create category | Admin |
| `/api/categories/{id}/` | GET/PUT/DELETE | Retrieve/Update/Delete category | Admin (write) |
| `/api/products/` | GET | List products | Required |
| `/api/products/` | POST | Create product | Admin |
| `/api/products/{id}/` | GET/PUT/DELETE | Retrieve/Update/Delete product | Admin (write) |
| `/api/clients/` | GET | List clients | Required |
| `/api/clients/` | POST | Create client | Admin |
| `/api/clients/{id}/` | GET/PUT/DELETE | Retrieve/Update/Delete client | Admin (write) |
| `/api/clients/{id}/tickets/` | GET | Get client's tickets | Required |

### Escalation & Audit Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/escalation-logs/` | GET | List escalation logs (role-scoped) | Required |
| `/api/escalation-logs/{id}/` | GET | Retrieve escalation log | Required |
| `/api/audit-logs/` | GET | List audit logs (filterable) | Admin |
| `/api/audit-logs/{id}/` | GET | Retrieve audit log entry | Admin |
| `/api/audit-logs/summary/` | GET | Audit log dashboard stats | Admin |
| `/api/audit-logs/export/` | GET | Export audit logs as CSV | Admin |

### Support Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/call-logs/` | GET/POST | List/Create call logs | Required (role-scoped) |
| `/api/call-logs/{id}/` | GET/PUT/PATCH/DELETE | Retrieve/Update/Delete call log | Required (role-scoped) |
| `/api/call-logs/{id}/end_call/` | POST | End call (set call_end to now) | Required (role-scoped) |
| `/api/feedback-ratings/` | GET/POST | List/Create feedback ratings | Admin-level |
| `/api/feedback-ratings/{id}/` | GET/PUT/PATCH/DELETE | Retrieve/Update/Delete feedback rating | Admin-level |

### Knowledge Hub Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/knowledge-hub/` | GET | List resolution proofs (filterable) | Admin |
| `/api/knowledge-hub/{id}/` | GET | Retrieve proof detail | Admin |
| `/api/knowledge-hub/{id}/publish/` | POST | Publish as knowledge article | Admin |
| `/api/knowledge-hub/{id}/unpublish/` | POST | Unpublish article | Admin |
| `/api/knowledge-hub/{id}/archive/` | POST | Archive article | Admin |
| `/api/knowledge-hub/{id}/unarchive/` | POST | Unarchive article | Admin |
| `/api/knowledge-hub/summary/` | GET | Knowledge Hub statistics | Admin |
| `/api/published-articles/` | GET | List published articles | Required |
| `/api/published-articles/{id}/` | GET | Retrieve published article | Required |

### Notification Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/notifications/` | GET | List user's notifications | Required |
| `/api/notifications/{id}/` | GET | Retrieve notification | Required |
| `/api/notifications/unread_count/` | GET | Get unread notification count | Required |
| `/api/notifications/mark_read/` | POST | Mark specific notifications as read | Required |
| `/api/notifications/mark_all_read/` | POST | Mark all notifications as read | Required |
| `/api/notifications/clear_all/` | POST | Delete all notifications | Required |

### Configuration Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/retention-policy/` | GET | Get current retention policy | Superadmin |
| `/api/retention-policy/` | POST | Update retention policy | Superadmin |
| `/api/announcements/` | GET | List announcements (role-scoped visibility) | Required |
| `/api/announcements/` | POST | Create announcement | Superadmin |
| `/api/announcements/{id}/` | GET/PUT/DELETE | Retrieve/Update/Delete announcement | Superadmin (write) |

### Employee List Endpoint

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/employees/` | GET | List employees with active ticket counts | Required |
| `/api/sales-users/` | GET | List active sales users | Required |
| `/api/supervisors/` | GET | List active supervisors | Required |

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

| HTTP Status | Meaning | Example |
|-------------|---------|---------|
| 400 | Bad Request — Invalid input data | `{"detail": "Resolution proof is required before requesting closure."}` |
| 401 | Unauthorized — No or invalid token | `{"detail": "Authentication credentials were not provided."}` |
| 403 | Forbidden — Insufficient permissions | `{"detail": "Only admins can perform this action."}` |
| 404 | Not Found — Resource doesn't exist | `{"detail": "Not found."}` |
| 405 | Method Not Allowed | `{"detail": "Method \"DELETE\" not allowed."}` |
| 500 | Internal Server Error | `{"detail": "Internal server error."}` |

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

| Policy | Description |
|--------|-------------|
| **Least Privilege** | Users are granted only the permissions necessary for their role. Employees cannot access admin functions; admins cannot access superadmin functions. |
| **Authentication Required** | All API endpoints (except login and password reset) require valid JWT authentication. |
| **Secure Password Storage** | Passwords are never stored in plaintext. Argon2 hashing (memory-hard, GPU-resistant) is used as the primary algorithm. |
| **Password Breach Checking** | New and changed passwords are validated against the HIBP (Have I Been Pwned) database to prevent use of known compromised credentials. |
| **Audit Trail** | All significant system actions are logged with actor identity, timestamp, IP address, and change details. |
| **Input Validation** | All API input is validated through DRF serializers before processing. |
| **CORS Protection** | Cross-origin requests are restricted to explicitly allowed origins. |
| **Session Rotation** | JWT refresh tokens rotate on each use, limiting the window of token reuse. |

---

## 13.2 Access Control Model

### Role-Based Access Control (RBAC)

The system implements RBAC with four hierarchical roles:

![Diagram 16](./images/diagram-16.png)

### Permission Classes

The system uses seven custom DRF permission classes, enforced at the API endpoint level:

| Permission Class | Logic |
|-----------------|-------|
| **IsEmployee** | `user.is_authenticated AND user.role == 'employee'` |
| **IsAdminLevel** | `user.is_authenticated AND user.role IN ('sales', 'admin', 'superadmin')` |
| **IsSupervisorLevel** | `user.is_authenticated AND user.role IN ('admin', 'superadmin')` (excludes sales) |
| **IsSuperAdmin** | `user.is_authenticated AND user.role == 'superadmin'` |
| **IsAssignedEmployee** | `user.is_authenticated AND user.role == 'employee' AND ticket.assigned_to == user` |
| **IsAdminOrAssignedEmployee** | `IsAdminLevel OR IsAssignedEmployee` |
| **IsTicketParticipant** | `IsAdminLevel OR (IsEmployee AND ticket.assigned_to == user)` |

### Object-Level Security

Beyond permission classes, the system implements object-level filtering:

| Context | Filtering Logic |
|---------|----------------|
| **Ticket List** | Admins see all tickets; employees see only assigned tickets |
| **Audit Logs** | Superadmins see admin+employee logs; admins see only employee logs |
| **Escalation Logs** | Admins see all; employees see only logs involving themselves |
| **Notifications** | Each user sees only their own notifications |
| **Knowledge Hub** | Admins manage all articles; employees see only published articles |
| **Service Types/Products/Clients** | Non-admins see only active records |
| **Announcements** | Filtered by visibility (all/admin/employee) and date range |

### WebSocket Access Control

| Consumer | Access Rule |
|----------|------------|
| **NotificationConsumer** | Must be authenticated; joins personal group `notifications_{user_id}` |
| **TicketChatConsumer** | Must be authenticated; must be admin or currently assigned employee for the specific ticket |

---

## 13.3 Data Protection

### Password Security

| Measure | Implementation |
|---------|---------------|
| **Hashing Algorithm** | Argon2 (primary) — memory-hard, resistant to GPU/ASIC attacks |
| **Fallback Hashers** | PBKDF2SHA256, PBKDF2SHA1, BCryptSHA256, Scrypt (for migration compatibility) |
| **Minimum Length** | 8 characters enforced at application level |
| **Breach Detection** | Passwords checked against HIBP API using k-anonymity (only first 5 chars of SHA-1 hash sent) |
| **Recovery Keys** | Auto-generated 32-character keys (xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx format) for account recovery |
| **Default Passwords** | New accounts created with temporary password; password change encouraged |

### Data Sensitivity Classification

| Data Type | Sensitivity | Protection |
|-----------|------------|------------|
| Passwords | Critical | Argon2 hashed, never exposed via API |
| JWT Tokens | High | Short-lived, signed with SECRET_KEY |
| Recovery Keys | High | Stored in database, shown only to account owner |
| User Emails | Medium | Unique constraint, used for authentication |
| Audit Logs | Medium | Immutable, accessible only to admins |
| Client Information | Medium | Accessible only to authenticated users |
| Ticket Attachments | Medium | Stored in media directory, served via Django |
| System Configuration | Low-Medium | Accessible only to superadmins |

### File Upload Security

| Control | Implementation |
|---------|---------------|
| **Profile Pictures** | Must be image/* MIME type; max 5MB; stored in `media/profile_pictures/` |
| **Ticket Attachments** | Stored in `media/ticket_attachments/YYYY/MM/DD/`; uploaded via authenticated endpoint |
| **File Deletion** | Only the uploader or an admin can delete attachments; file removed from storage on delete |

---

## 13.4 Secure Communication

| Layer | Security Mechanism |
|-------|-------------------|
| **HTTP Transport** | HTTPS recommended for production (SSL/TLS encryption) |
| **WebSocket Transport** | WSS (WebSocket Secure) recommended for production |
| **API Authentication** | JWT Bearer tokens in HTTP Authorization header |
| **WebSocket Authentication** | JWT token in query string parameter, validated by custom middleware |
| **CORS** | Cross-Origin Resource Sharing restricted to configured allowed origins |
| **CSRF** | Django CSRF middleware active; DRF uses JWT authentication (CSRF not required for token auth) |
| **Security Headers** | Django SecurityMiddleware provides: X-Content-Type-Options, X-XSS-Protection, Referrer-Policy |
| **Clickjacking Protection** | XFrameOptionsMiddleware prevents embedding in iframes |

---

## 13.5 Audit Logging

### What Is Logged

| Event Category | Actions Logged |
|---------------|---------------|
| **Authentication** | LOGIN, LOGOUT (with IP address and user agent) |
| **User Management** | CREATE (new user), UPDATE (role/profile changes), PASSWORD_RESET, activation toggles |
| **Ticket Lifecycle** | CREATE, UPDATE, STATUS_CHANGE, ASSIGN, ESCALATE, CLOSE, RESOLVE, CONFIRM, OBSERVE, UNRESOLVED |
| **Attachments** | UPLOAD (resolution proofs) |
| **Escalation** | ESCALATE (internal/external), PASS (between employees) |
| **Ticket Links** | LINK (linking related tickets) |

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

| Role | Visibility |
|------|-----------|
| **Superadmin** | Sees logs where actor role is admin or employee (or actor is null) |
| **Admin** | Sees logs where actor role is employee only |
| **Employee** | No access to audit logs |

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

| System | Integration Method | Status | Description |
|--------|-------------------|--------|-------------|
| **HIBP (Have I Been Pwned)** | REST API (HTTPS) | Active | Password breach checking during password changes and resets. Uses k-anonymity model — only first 5 characters of SHA-1 hash are sent to the API. |
| **Email Service** | SMTP (Planned) | Planned | Password reset emails — currently generates reset tokens but does not send emails. The reset URL, UID, and token are returned in the API response for frontend to handle. |
| **Azure Active Directory** | MSAL (OAuth 2.0) | Available (Frontend 1) | Azure AD SSO integration is configured in the legacy frontend (`@azure/msal-browser`). Not actively used in the primary frontend. |
| **Google OAuth** | OAuth 2.0 | Available (Frontend 1) | Google sign-in via `@react-oauth/google` configured in the legacy frontend. Not actively used in the primary frontend. |
| **External Vendors/Distributors** | Manual (In-System Notes) | Active (Manual) | External escalation information is recorded within the ticketing system (vendor name, notes, timestamp) but there is no automated API integration with external vendor systems. |

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

| Format | Usage |
|--------|-------|
| **JSON** | Primary data exchange format for all REST API request/response bodies. Used for WebSocket message payloads as well. |
| **CSV** | Used for audit log export (`/api/audit-logs/export/`). Columns include timestamp, entity, action, activity, actor details, IP address, and changes. |
| **Excel (XLSX)** | Supported via the `xlsx-js-style` frontend library for client-side data export with styled formatting. |
| **Multipart/Form-Data** | Used for file uploads including ticket attachments and profile pictures. |
| **Base64** | Used for digital signature storage. Client signature images are captured on the frontend and stored as Base64-encoded strings in the `signature` field. |
| **JWT (JSON Web Token)** | Used for authentication tokens. Access and refresh tokens are Base64-encoded JSON payloads signed with HMAC-SHA256. |
| **ISO 8601** | All datetime values in API responses use ISO 8601 format (e.g., `2026-03-11T10:30:00.000Z`). |

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

| Aspect | Details |
|--------|---------|
| **Scope** | Individual model methods, serializer validation, utility functions, permission classes |
| **Framework** | Django TestCase / pytest-django (backend), Jest / Vitest (frontend) |
| **Focus Areas** | STF number generation, SLA calculation, progress percentage, password hashing, role-based field filtering, phone number formatting, username generation |
| **Execution** | Automated, run on every code change |

### Integration Testing

| Aspect | Details |
|--------|---------|
| **Scope** | API endpoint behavior including authentication, serialization, database operations, and permission enforcement |
| **Framework** | Django REST Framework APITestCase |
| **Focus Areas** | Ticket CRUD lifecycle, assignment/reassignment flows, escalation workflows, notification dispatch, audit log creation, file upload/delete, WebSocket connection/message flow |
| **Execution** | Automated, run as part of CI pipeline |

### System Testing

| Aspect | Details |
|--------|---------|
| **Scope** | End-to-end workflows spanning frontend and backend |
| **Framework** | Manual testing or Playwright/Cypress for browser automation |
| **Focus Areas** | Complete ticket lifecycle (create → assign → work → resolve → close), chat communication flow, notification delivery, dashboard data accuracy, PDF/Excel export, dark mode rendering |
| **Execution** | Semi-automated or manual, run before releases |

### User Acceptance Testing (UAT)

| Aspect | Details |
|--------|---------|
| **Scope** | Business workflow validation by actual end users |
| **Participants** | Supervisors, technicians, management representatives |
| **Focus Areas** | Usability, workflow correctness, data accuracy, reporting quality, real-world scenarios |
| **Execution** | Manual, conducted during pre-release phase |

---

## 15.3 Test Environment

| Environment | Purpose | Configuration |
|-------------|---------|---------------|
| **Development** | Unit and integration testing during development | SQLite database, InMemory channel layer, Vite dev server with proxy |
| **Staging** | System and UAT testing before production deployment | PostgreSQL database, Redis channel layer, production-like configuration |
| **Production** | Smoke testing after deployment | Live environment with monitoring; read-only verification tests |

### Test Data Management

| Strategy | Details |
|----------|---------|
| **Fixtures** | Predefined test data for service types, categories, and initial admin account |
| **Factory Pattern** | Generate test data dynamically for users, tickets, clients, and products |
| **Database Reset** | Test database is recreated for each test suite run |
| **Mock Data** | Frontend uses `mockTickets.ts` for UI development and testing without backend |

---

## 15.4 Test Cases Structure

### Authentication Test Cases

| Test Case ID | Description | Expected Result |
|-------------|-------------|-----------------|
| TC-AUTH-001 | Login with valid username and password | Returns 200 with JWT access and refresh tokens |
| TC-AUTH-002 | Login with valid email and password | Returns 200 with JWT tokens (email fallback) |
| TC-AUTH-003 | Login with invalid credentials | Returns 401 Unauthorized |
| TC-AUTH-004 | Login with deactivated account | Returns 401 Unauthorized |
| TC-AUTH-005 | Access protected endpoint without token | Returns 401 "Authentication credentials not provided" |
| TC-AUTH-006 | Access protected endpoint with expired token | Returns 401 "Token is invalid or expired" |
| TC-AUTH-007 | Refresh token with valid refresh token | Returns new access token |
| TC-AUTH-008 | Change password with valid current password | Returns 200 with new tokens |
| TC-AUTH-009 | Change password with breached password | Returns 200 with warning (non-blocking) |
| TC-AUTH-010 | Reset password by recovery key | Returns 200. Password changed. |
| TC-AUTH-011 | Reset password with invalid recovery key | Returns 400 "Invalid recovery key" |

### Ticket Lifecycle Test Cases

| Test Case ID | Description | Expected Result |
|-------------|-------------|-----------------|
| TC-TKT-001 | Admin creates ticket with all fields | Ticket created with auto STF number; client/product records created |
| TC-TKT-002 | Admin creates ticket with existing client | Ticket linked to existing client_record |
| TC-TKT-003 | Admin assigns ticket to employee | AssignmentSession created; notification sent; status unchanged |
| TC-TKT-004 | Admin reassigns ticket to different employee | Old session ended; new session created; force_disconnect sent |
| TC-TKT-005 | Employee starts work on assigned ticket | time_in recorded; status → in_progress |
| TC-TKT-006 | Employee updates action_taken, remarks | Fields updated; non-allowed fields ignored |
| TC-TKT-007 | Employee uploads resolution proof | Attachment created with is_resolution_proof=True |
| TC-TKT-008 | Employee requests closure without proof | Returns 400 "Resolution proof required" |
| TC-TKT-009 | Employee requests closure with proof | Status → pending_closure; time_out recorded |
| TC-TKT-010 | Admin closes ticket with feedback rating | Status → closed; session ended; feedback rating recorded |
| TC-TKT-011 | Employee views only assigned tickets | Only assigned tickets returned in list |
| TC-TKT-012 | Admin views all tickets | All tickets returned in list |
| TC-TKT-013 | STF number uniqueness | Concurrent creation produces unique STF numbers |

### Escalation Test Cases

| Test Case ID | Description | Expected Result |
|-------------|-------------|-----------------|
| TC-ESC-001 | Employee escalates internally | Status → escalated; session ended; admin notified |
| TC-ESC-002 | Employee passes to another employee | New session created; new employee notified; old employee disconnected |
| TC-ESC-003 | Admin escalates externally | Status → escalated_external; external vendor info recorded |
| TC-ESC-004 | Non-assigned employee tries to escalate | Returns 403 "Only assigned employee" |

### Permission Test Cases

| Test Case ID | Description | Expected Result |
|-------------|-------------|-----------------|
| TC-PERM-001 | Employee tries to create ticket | Returns 403 or handled by role-based logic |
| TC-PERM-002 | Employee tries to close ticket | Returns 403 "Only admins" |
| TC-PERM-003 | Admin tries to manage users | Returns 403 "Only superadmins" |
| TC-PERM-004 | Admin tries to access retention policy | Returns 403 "Only superadmins" |
| TC-PERM-005 | Employee tries to access audit logs | Returns 403 "Only admins" |
| TC-PERM-006 | Unauthenticated user tries to access tickets | Returns 401 |

### WebSocket Test Cases

| Test Case ID | Description | Expected Result |
|-------------|-------------|-----------------|
| TC-WS-001 | Connect to notifications with valid token | Connection accepted; unread count sent |
| TC-WS-002 | Connect to notifications without token | Connection rejected |
| TC-WS-003 | Connect to chat as assigned employee | Connection accepted; message history sent |
| TC-WS-004 | Connect to chat as non-assigned employee | Connection rejected |
| TC-WS-005 | Send message in chat | Message stored and broadcast to group |
| TC-WS-006 | React to message with emoji | Reaction toggled; update broadcast |
| TC-WS-007 | Mark messages as read | Read receipts created; update broadcast |
| TC-WS-008 | Receive notification after ticket assignment | Notification pushed to assigned employee's WebSocket |

### Knowledge Hub Test Cases

| Test Case ID | Description | Expected Result |
|-------------|-------------|-----------------|
| TC-KH-001 | Admin publishes resolution proof | Article visible to all authenticated users |
| TC-KH-002 | Admin unpublishes article | Article no longer visible in published list |
| TC-KH-003 | Employee searches published articles | Returns matching articles by title/description |
| TC-KH-004 | Admin archives published article | Article moves to archived status |

---

*End of Section 15*


---


<!-- Source: 16-Deployment-Architecture.md -->

# 16. DEPLOYMENT ARCHITECTURE

## 16.1 Deployment Strategy

The Maptech Ticketing System supports two deployment configurations:

| Strategy | Description |
|----------|-------------|
| **Development** | Single-machine deployment with Vite dev server (frontend) + Daphne (backend) + SQLite + InMemory channel layer |
| **Production** | Reverse proxy (Nginx/Caddy) + ASGI server (Daphne/Uvicorn) + PostgreSQL + Redis + static file serving (CDN or Whitenoise) |

### Deployment Approach

- **Frontend:** Build the React SPA to static assets (`npm run build`), then serve via Nginx or the Django backend (Whitenoise).
- **Backend:** Run through Daphne (ASGI server) to support both HTTP and WebSocket connections.
- **Database:** SQLite for development; PostgreSQL for production (concurrent access, better performance).
- **Channel Layer:** InMemory for development; Redis for production (multi-process WebSocket support).

---

## 16.2 Deployment Environment

| Environment | Purpose | Database | Channel Layer | Frontend |
|-------------|---------|----------|---------------|----------|
| **Local Development** | Developer workstation | SQLite | InMemoryChannelLayer | Vite dev server (port 3000) with proxy |
| **Staging** | Pre-production testing | PostgreSQL | Redis | Static build served by Nginx |
| **Production** | Live system | PostgreSQL | Redis | Static build served by Nginx/CDN |

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

| Stage | Backend | Frontend |
|-------|---------|----------|
| **Lint** | `flake8` / `ruff` Python linting | `eslint` TypeScript linting |
| **Type Check** | `mypy` (optional) | `tsc --noEmit` TypeScript checking |
| **Unit Test** | `python manage.py test` / `pytest` | `npm run test` (Vitest/Jest) |
| **Integration Test** | DRF APITestCase | Playwright/Cypress E2E |
| **Build** | `collectstatic` | `npm run build` |
| **Deploy** | Copy to server, restart Daphne | Copy dist/ to Nginx root |

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | Django secret key for cryptographic signing | Yes |
| `DEBUG` | Debug mode (False in production) | Yes |
| `DATABASE_URL` | PostgreSQL connection string (production) | Production |
| `REDIS_URL` | Redis connection string for channel layer | Production |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hostnames | Yes |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins | Yes |
| `CORS_ALLOW_ALL_ORIGINS` | Allow all origins (development only) | Development |

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

| Component | Metric | Recommended Tool |
|-----------|--------|-----------------|
| **Django Backend** | Request latency, error rates (4xx/5xx), active connections | Prometheus + Grafana / New Relic |
| **Daphne ASGI** | WebSocket connection count, memory usage, CPU | Process monitoring (systemd, supervisord) |
| **PostgreSQL** | Query performance, connection pool, disk I/O | pg_stat_statements, pgAdmin |
| **Redis** | Memory usage, connected clients, pub/sub channels | Redis CLI / RedisInsight |
| **Frontend (SPA)** | Page load time, API call latency, JavaScript errors | Sentry / LogRocket |

### Infrastructure Monitoring

| Resource | Threshold | Alert |
|----------|-----------|-------|
| CPU Usage | > 80% sustained | Warning |
| Memory Usage | > 85% | Warning |
| Disk Space | > 90% | Critical |
| WebSocket Connections | > 500 concurrent | Warning |
| API Response Time | > 2 seconds (p95) | Warning |
| Error Rate (5xx) | > 1% | Critical |

### Health Check Endpoints

The system provides the following endpoints for health monitoring:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/` | API root — confirms DRF is running |
| `GET /api/schema/swagger/` | Swagger UI — confirms documentation service |
| `GET /admin/` | Django Admin — confirms template rendering |
| `ws://host/ws/notifications/` | WebSocket connectivity test |

### Uptime Monitoring

- **External Ping:** Use UptimeRobot or Pingdom to monitor the public endpoint every 60 seconds.
- **Internal Check:** Scheduled health checks via cron or systemd timers that hit the API root and verify a 200 response.

---

## 17.3 Logging

### Backend Logging Architecture

Django's built-in logging framework is used with Python's `logging` module.

**Log Levels:**

| Level | Usage |
|-------|-------|
| `DEBUG` | Detailed diagnostic information (development only) |
| `INFO` | General operational events (user login, ticket creation) |
| `WARNING` | Unexpected conditions that don't halt operation |
| `ERROR` | Errors that prevent a specific operation |
| `CRITICAL` | System-wide failures requiring immediate attention |

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

| Field | Description |
|-------|-------------|
| `user` | The user who performed the action |
| `action` | Description of the action taken |
| `model_name` | The model affected (e.g., Ticket, User) |
| `object_id` | The primary key of the affected record |
| `changes` | JSON field containing before/after values |
| `ip_address` | The IP address of the request |
| `created_at` | Timestamp of the action |

**Audit events are automatically captured via Django signals for:**
- Ticket creation, updates, assignments, and status changes
- User creation and profile updates
- Escalation events
- Message sending and reactions

### Log Retention

| Log Type | Retention Period | Storage |
|----------|-----------------|---------|
| Application logs | 90 days | Filesystem / Log aggregator |
| Audit logs (database) | Governed by `RetentionPolicy` model | Database |
| Access logs (Nginx) | 30 days | Filesystem |
| Error logs | 180 days | Filesystem / Error tracker |

---

## 17.4 Backup and Recovery

### Backup Strategy

| Component | Method | Frequency | Retention |
|-----------|--------|-----------|-----------|
| **Database (PostgreSQL)** | `pg_dump` full backup | Daily (2:00 AM) | 30 days |
| **Database (PostgreSQL)** | WAL archiving (point-in-time) | Continuous | 7 days |
| **Media Files** | File-level backup (rsync) | Daily | 30 days |
| **Application Code** | Git repository | On every commit | Indefinite |
| **Configuration** | Encrypted backup of `.env` files | Weekly | 90 days |

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

| Scenario | RTO | RPO |
|----------|-----|-----|
| Database corruption | < 2 hours | < 24 hours |
| Server failure | < 4 hours | < 24 hours |
| Data center failure | < 8 hours | < 24 hours |

---

## 17.5 Incident Management

### Incident Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|--------------|---------|
| **P1 — Critical** | System down, all users affected | < 15 minutes | Database failure, server crash |
| **P2 — High** | Major feature unavailable | < 1 hour | WebSocket failure, authentication down |
| **P3 — Medium** | Feature degraded | < 4 hours | Slow API responses, minor UI bugs |
| **P4 — Low** | Cosmetic or minor issue | Next business day | Typo, style inconsistency |

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

| Type | Frequency | Duration | Window |
|------|-----------|----------|--------|
| **Security Patches** | As required (critical) | 30 min – 1 hour | Within 24 hours of disclosure |
| **Dependency Updates** | Monthly | 1–2 hours | First Saturday of the month, 2:00 AM |
| **Database Maintenance** | Weekly | 15–30 min | Sunday 3:00 AM (VACUUM, REINDEX) |
| **System Updates (OS)** | Monthly | 1–2 hours | Second Saturday of the month, 2:00 AM |
| **Feature Releases** | Sprint-based (bi-weekly) | 30 min – 1 hour | As scheduled |

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

| Branch | Purpose | Lifetime |
|--------|---------|----------|
| `main` | Production-ready code | Permanent |
| `develop` | Integration branch for the next release | Permanent |
| `feature/<name>` | New feature development | Temporary (merged to develop) |
| `bugfix/<name>` | Bug fixes for develop | Temporary (merged to develop) |
| `hotfix/<name>` | Emergency production fixes | Temporary (merged to main + develop) |
| `release/<version>` | Release preparation and QA | Temporary (merged to main + develop) |

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

| Component | Meaning |
|-----------|---------|
| **MAJOR** | Breaking API changes or major architecture shifts |
| **MINOR** | New features, backward-compatible |
| **PATCH** | Bug fixes, security patches |

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

| Tier | Responsibility | Personnel | Response SLA |
|------|---------------|-----------|-------------|
| **Tier 1** | Basic troubleshooting, password resets, user guidance | Help Desk / Admin users | < 1 hour |
| **Tier 2** | Application-level issues, configuration changes, data fixes | System Administrator | < 4 hours |
| **Tier 3** | Code-level bugs, architecture issues, database recovery | Development Team | < 1 business day |

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

| Channel | Purpose |
|---------|---------|
| **In-App Ticketing** | Users create support tickets through the system itself |
| **Admin Dashboard** | Supervisors monitor SLA compliance and ticket status |
| **Direct Escalation** | Critical issues escalated to development team via defined process |

---

## 18.5 Data Retention and Archival

The system includes a `RetentionPolicy` model that defines data lifecycle rules:

| Field | Description |
|-------|-------------|
| `name` | Policy name (e.g., "Standard Ticket Retention") |
| `duration_days` | Number of days to retain data before archival |
| `description` | Description of the policy |
| `is_active` | Whether the policy is currently enforced |

**Retention Recommendations:**

| Data Type | Retention Period | Action After Expiry |
|-----------|-----------------|---------------------|
| Active Tickets | Indefinite | N/A |
| Closed Tickets | Per policy (e.g., 365 days) | Archive to cold storage |
| Audit Logs | Per policy (e.g., 730 days) | Archive or delete |
| Chat Messages | Per policy (e.g., 365 days) | Archive with ticket |
| Notification Records | 90 days | Soft delete |
| User Accounts (inactive) | Per policy (e.g., 365 days inactive) | Deactivate |

---

*End of Section 18*


---


<!-- Source: 19-Risk-Management.md -->

# 19. RISK MANAGEMENT

## 19.1 Risk Assessment Overview

This section identifies known technical, operational, and security risks for the Maptech Ticketing System, evaluates their likelihood and impact, and defines mitigation strategies.

**Risk Rating Matrix:**

| | Low Impact | Medium Impact | High Impact | Critical Impact |
|---|-----------|---------------|-------------|-----------------|
| **High Likelihood** | Medium | High | Critical | Critical |
| **Medium Likelihood** | Low | Medium | High | Critical |
| **Low Likelihood** | Low | Low | Medium | High |

---

## 19.2 Technical Risks

### RISK-T01: SQLite Database Scalability

| Attribute | Detail |
|-----------|--------|
| **Description** | The system currently uses SQLite as its database. SQLite does not support concurrent write operations well and has limitations with large datasets. |
| **Likelihood** | High (in production deployment) |
| **Impact** | High — Data corruption risk under concurrent writes; performance degradation with growth |
| **Current Status** | Active risk in development; configured in `settings.py` |
| **Mitigation** | Migrate to PostgreSQL before production deployment. Django's ORM abstraction makes this a configuration change with minimal code impact. |
| **Contingency** | Apply write-ahead logging (WAL) mode for SQLite as temporary measure. |

### RISK-T02: InMemory Channel Layer Limitation

| Attribute | Detail |
|-----------|--------|
| **Description** | The WebSocket channel layer uses `InMemoryChannelLayer`, which does not persist across process restarts and does not support multi-process deployments. |
| **Likelihood** | High (in production) |
| **Impact** | Medium — WebSocket notifications and chat messages may be lost on server restart; no cross-process communication |
| **Current Status** | Active risk; configured in `settings.py` CHANNEL_LAYERS setting |
| **Mitigation** | Switch to `channels_redis.core.RedisChannelLayer` with a Redis server for production. Configuration is already documented in Django Channels. |
| **Contingency** | Implement HTTP polling fallback for notifications. |

### RISK-T03: Single Server Deployment

| Attribute | Detail |
|-----------|--------|
| **Description** | No horizontal scaling or load balancing strategy is currently implemented. |
| **Likelihood** | Medium |
| **Impact** | High — Single point of failure; limited capacity under peak load |
| **Mitigation** | Deploy behind a load balancer (Nginx/HAProxy) with multiple Daphne workers. Use sticky sessions for WebSocket connections. |
| **Contingency** | Vertical scaling (increase server resources) as short-term measure. |

### RISK-T04: No Automated Test Suite

| Attribute | Detail |
|-----------|--------|
| **Description** | The codebase does not have a comprehensive automated test suite. The `users/tests.py` file exists but may not have extensive coverage. |
| **Likelihood** | High |
| **Impact** | Medium — Regressions may go undetected; higher risk during refactoring or feature additions |
| **Mitigation** | Implement unit tests for critical models and views, integration tests for API endpoints, and E2E tests for key user workflows. |
| **Contingency** | Manual QA testing before each release with a defined test checklist. |

### RISK-T05: Media File Storage on Local Filesystem

| Attribute | Detail |
|-----------|--------|
| **Description** | Uploaded files (profile pictures, ticket attachments, resolution proofs) are stored on the local filesystem under `media/`. |
| **Likelihood** | Medium |
| **Impact** | Medium — Files lost if server disk fails; not accessible in multi-server deployment; disk space exhaustion |
| **Mitigation** | Migrate to cloud object storage (AWS S3, Azure Blob Storage) using `django-storages`. Implement file size limits and cleanup routines. |
| **Contingency** | Regular filesystem backups with rsync to offsite storage. |

---

## 19.3 Security Risks

### RISK-S01: JWT Token Exposure

| Attribute | Detail |
|-----------|--------|
| **Description** | JWT access tokens provide full API access for their lifetime (configured as 1 day). If intercepted, they cannot be individually revoked without a blacklist mechanism. |
| **Likelihood** | Low |
| **Impact** | High — Unauthorized access to the system for the token's remaining lifetime |
| **Mitigation** | Reduce access token lifetime (e.g., 15–30 minutes). Implement token blacklisting via `rest_framework_simplejwt.token_blacklist`. Use HTTPS exclusively. Store tokens securely (httpOnly cookies preferred over localStorage). |
| **Contingency** | Force password reset to invalidate all tokens; rotate SECRET_KEY as last resort (invalidates all tokens system-wide). |

### RISK-S02: Insufficient Input Validation

| Attribute | Detail |
|-----------|--------|
| **Description** | While Django REST Framework serializers provide basic validation, custom validation for business logic may have gaps. |
| **Likelihood** | Low |
| **Impact** | Medium — Potential for XSS via user-generated content, SQL injection (mitigated by ORM), or business logic bypass |
| **Mitigation** | DRF serializers and Django ORM provide strong default protection. Review all custom endpoint actions for proper input validation. Sanitize HTML content in chat messages. |
| **Contingency** | WAF (Web Application Firewall) at the network layer for defense-in-depth. |

### RISK-S03: CORS Misconfiguration

| Attribute | Detail |
|-----------|--------|
| **Description** | The `CORS_ALLOW_ALL_ORIGINS` setting may be enabled in development and accidentally deployed to production. |
| **Likelihood** | Medium |
| **Impact** | Medium — Cross-origin request forgery attacks could exploit API endpoints |
| **Mitigation** | Ensure `CORS_ALLOW_ALL_ORIGINS = False` in production. Use `CORS_ALLOWED_ORIGINS` with explicit origin list. Environment-specific settings files. |
| **Contingency** | Network-level CORS enforcement via Nginx configuration. |

### RISK-S04: Inadequate Rate Limiting

| Attribute | Detail |
|-----------|--------|
| **Description** | The DRF throttle classes are configured but may not cover all attack vectors (brute-force login, API abuse). |
| **Likelihood** | Medium |
| **Impact** | Medium — Brute-force attacks on login, denial-of-service via API abuse |
| **Mitigation** | Implement stricter throttling on authentication endpoints. Add IP-based rate limiting at Nginx level. Consider fail2ban for repeated failed login attempts. |
| **Contingency** | Temporary IP blocking via Nginx or firewall rules. |

---

## 19.4 Operational Risks

### RISK-O01: Key Personnel Dependency

| Attribute | Detail |
|-----------|--------|
| **Description** | System knowledge may be concentrated in a small number of developers. |
| **Likelihood** | Medium |
| **Impact** | High — Loss of key personnel could delay bug fixes, feature development, and incident response |
| **Mitigation** | Comprehensive documentation (this document), code reviews, pair programming, and knowledge sharing sessions. |
| **Contingency** | External consulting engagement for emergency support. |

### RISK-O02: Data Loss

| Attribute | Detail |
|-----------|--------|
| **Description** | Database corruption, accidental deletion, or hardware failure could result in data loss. |
| **Likelihood** | Low |
| **Impact** | Critical — Loss of ticket history, audit trails, and user data |
| **Mitigation** | Automated daily backups with offsite replication. Database transaction logging. Regular backup restoration tests. |
| **Contingency** | Point-in-time recovery from WAL archives (PostgreSQL). |

### RISK-O03: Third-Party Dependency Vulnerabilities

| Attribute | Detail |
|-----------|--------|
| **Description** | The system relies on numerous third-party packages (Django, DRF, SimpleJWT, React, etc.) that may have undiscovered vulnerabilities. |
| **Likelihood** | Medium |
| **Impact** | Variable (Low to Critical depending on vulnerability) |
| **Mitigation** | Regular dependency auditing (`pip-audit`, `npm audit`). Subscribe to security advisories for key dependencies. Automated dependency update tools (Dependabot, Renovate). |
| **Contingency** | Patch or pin vulnerable versions immediately upon disclosure. |

---

## 19.5 Risk Register Summary

| ID | Risk | Likelihood | Impact | Rating | Status |
|----|------|-----------|--------|--------|--------|
| RISK-T01 | SQLite scalability | High | High | **Critical** | Open |
| RISK-T02 | InMemory channel layer | High | Medium | **High** | Open |
| RISK-T03 | Single server deployment | Medium | High | **High** | Open |
| RISK-T04 | No automated test suite | High | Medium | **High** | Open |
| RISK-T05 | Local filesystem storage | Medium | Medium | **Medium** | Open |
| RISK-S01 | JWT token exposure | Low | High | **Medium** | Open |
| RISK-S02 | Input validation gaps | Low | Medium | **Low** | Monitored |
| RISK-S03 | CORS misconfiguration | Medium | Medium | **Medium** | Open |
| RISK-S04 | Inadequate rate limiting | Medium | Medium | **Medium** | Open |
| RISK-O01 | Key personnel dependency | Medium | High | **High** | Mitigated (docs) |
| RISK-O02 | Data loss | Low | Critical | **Medium** | Open |
| RISK-O03 | Third-party vulnerabilities | Medium | Variable | **Medium** | Monitored |

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

| Attribute | Detail |
|-----------|--------|
| **Priority** | Critical |
| **Effort** | Low (1–2 days) |
| **Description** | Migrate from SQLite to PostgreSQL for production readiness. Django's ORM abstraction makes this primarily a configuration change. |
| **Benefits** | Concurrent write support, better performance at scale, point-in-time recovery, full-text search capabilities. |
| **Implementation** | Update `DATABASES` in `settings.py` to use `django.db.backends.postgresql`. Install `psycopg2-binary`. Run `migrate` on the new database. |

### ENH-02: Redis Channel Layer

| Attribute | Detail |
|-----------|--------|
| **Priority** | Critical |
| **Effort** | Low (< 1 day) |
| **Description** | Replace `InMemoryChannelLayer` with `channels_redis.core.RedisChannelLayer` for reliable WebSocket communication in production. |
| **Benefits** | Multi-process/multi-server WebSocket support, message persistence across restarts, pub/sub scalability. |
| **Implementation** | Install Redis server, install `channels-redis`, update `CHANNEL_LAYERS` in `settings.py`. |

### ENH-03: Automated Test Suite

| Attribute | Detail |
|-----------|--------|
| **Priority** | High |
| **Effort** | Medium (2–4 weeks) |
| **Description** | Implement comprehensive automated testing covering models, serializers, views, and WebSocket consumers. |
| **Scope** | Unit tests for models and serializers, integration tests for API endpoints, WebSocket consumer tests, E2E tests for critical user workflows. |
| **Tools** | pytest + pytest-django (backend), Vitest (frontend), Playwright (E2E). |

### ENH-04: Reduce JWT Access Token Lifetime

| Attribute | Detail |
|-----------|--------|
| **Priority** | High |
| **Effort** | Low (< 1 day) |
| **Description** | Reduce access token lifetime from 1 day to 15–30 minutes with automatic silent refresh using the refresh token. |
| **Benefits** | Reduced window of exposure if tokens are compromised. |
| **Implementation** | Update `SIMPLE_JWT` settings in `settings.py`. Implement silent refresh logic in the frontend API interceptor. |

---

## 20.3 Medium-Term Enhancements (3–6 Months)

### ENH-05: Email Integration

| Attribute | Detail |
|-----------|--------|
| **Priority** | High |
| **Effort** | Medium (2–3 weeks) |
| **Description** | Implement email notifications for ticket events and support email-to-ticket creation. |
| **Features** | Email notifications on ticket creation/assignment/escalation/closure, email-based ticket creation (parse incoming emails to create tickets), email reply integration for ticket messages. |
| **Tools** | Django `send_mail`, django-post-office, or third-party email service (SendGrid, AWS SES). |

### ENH-06: Cloud File Storage

| Attribute | Detail |
|-----------|--------|
| **Priority** | Medium |
| **Effort** | Low (1–2 days) |
| **Description** | Migrate file uploads from local filesystem to cloud object storage for scalability and reliability. |
| **Implementation** | Install `django-storages` and `boto3` (AWS S3) or `azure-storage-blob` (Azure). Update `DEFAULT_FILE_STORAGE` in settings. |
| **Benefits** | Automatic redundancy, CDN integration, unlimited storage scaling, multi-server file access. |

### ENH-07: Advanced Reporting and Analytics

| Attribute | Detail |
|-----------|--------|
| **Priority** | Medium |
| **Effort** | Medium (3–4 weeks) |
| **Description** | Enhance the existing Recharts-based dashboards with advanced analytics capabilities. |
| **Features** | SLA compliance trending, technician performance metrics, category/service type analysis, peak hour analysis, first-response time tracking, resolution time trends, feedback rating analytics. |
| **Current Foundation** | Recharts integration exists in SuperAdmin/Admin dashboards, basic statistics endpoints available. |

### ENH-08: Mobile Application

| Attribute | Detail |
|-----------|--------|
| **Priority** | Medium |
| **Effort** | High (8–12 weeks) |
| **Description** | Develop a mobile application for technicians to manage tickets on the go. |
| **Options** | React Native (shares React expertise), Progressive Web App (lower effort, limited native features), Flutter (cross-platform, new technology stack). |
| **Features** | Push notifications, ticket management, real-time chat, photo attachments from camera, offline support. |

---

## 20.4 Long-Term Enhancements (6–12 Months)

### ENH-09: Single Sign-On (SSO) Integration

| Attribute | Detail |
|-----------|--------|
| **Priority** | Medium |
| **Effort** | Medium (2–3 weeks) |
| **Description** | Integrate enterprise SSO providers for streamlined authentication. The legacy frontend already has Azure MSAL and Google OAuth scaffolding. |
| **Providers** | Microsoft Entra ID (Azure AD), Google Workspace, SAML 2.0 generic. |
| **Implementation** | `django-allauth` or `python-social-auth` for backend. Port existing MSAL/Google OAuth code from legacy frontend. |

### ENH-10: Knowledge Base System

| Attribute | Detail |
|-----------|--------|
| **Priority** | Medium |
| **Effort** | Medium (3–4 weeks) |
| **Description** | Expand the existing knowledge base endpoints into a full self-service knowledge management system. |
| **Features** | Article creation and editing (Markdown/rich text), category organization, search functionality, article rating and feedback, automatic suggestion based on ticket content, FAQ section. |
| **Current Foundation** | `knowledge.py` views exist with basic knowledge base endpoints. |

### ENH-11: AI-Powered Ticket Classification

| Attribute | Detail |
|-----------|--------|
| **Priority** | Low |
| **Effort** | High (4–6 weeks) |
| **Description** | Implement machine learning for automatic ticket categorization, priority assignment, and technician recommendation. |
| **Features** | Auto-categorize tickets based on description, suggest priority level, recommend best-suited technician based on expertise and workload, auto-suggest knowledge base articles. |
| **Tools** | scikit-learn (basic), OpenAI API (advanced), or Hugging Face transformers. |

### ENH-12: Multi-Tenant Architecture

| Attribute | Detail |
|-----------|--------|
| **Priority** | Low |
| **Effort** | High (6–10 weeks) |
| **Description** | Support multiple organizations/clients in a single deployment with data isolation. |
| **Implementation** | Schema-based multi-tenancy (`django-tenants`) or row-level multi-tenancy with organization foreign keys. |
| **Benefits** | SaaS deployment model, shared infrastructure cost, centralized management. |

### ENH-13: Webhook and External API Integration

| Attribute | Detail |
|-----------|--------|
| **Priority** | Low |
| **Effort** | Medium (2–3 weeks) |
| **Description** | Allow external systems to subscribe to ticket events via webhooks and provide a public API for third-party integrations. |
| **Features** | Configurable webhook endpoints, event-based triggers (ticket created, status changed, escalated), API key authentication for external consumers, rate-limited public API. |

---

## 20.5 Enhancement Priority Matrix

| Enhancement | Priority | Effort | Business Value | Risk Reduction |
|-------------|----------|--------|---------------|----------------|
| ENH-01: PostgreSQL | Critical | Low | High | High |
| ENH-02: Redis Channel Layer | Critical | Low | Medium | High |
| ENH-03: Test Suite | High | Medium | Medium | High |
| ENH-04: JWT Token Lifetime | High | Low | Low | High |
| ENH-05: Email Integration | High | Medium | High | Low |
| ENH-06: Cloud Storage | Medium | Low | Medium | Medium |
| ENH-07: Advanced Analytics | Medium | Medium | High | Low |
| ENH-08: Mobile App | Medium | High | High | Low |
| ENH-09: SSO Integration | Medium | Medium | Medium | Medium |
| ENH-10: Knowledge Base | Medium | Medium | Medium | Low |
| ENH-11: AI Classification | Low | High | High | Low |
| ENH-12: Multi-Tenant | Low | High | Medium | Low |
| ENH-13: Webhooks | Low | Medium | Medium | Low |

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

| Model | Key Fields |
|-------|------------|
| **User** | email (PK), first_name, last_name, middle_name, role (employee/sales/admin/superadmin), department, phone, profile_picture, is_agreed_privacy_policy |
| **Ticket** | ticket_number, status, priority, category, product, client, created_by, sla_deadline, current_session |
| **AssignmentSession** | ticket, assigned_to, assigned_by, started_at, ended_at, is_active |
| **Message** | ticket, sender, content, message_type, parent_message, is_edited, is_deleted |
| **TicketAttachment** | ticket, file, uploaded_by, file_name, file_size, file_type |
| **TicketTask** | ticket, title, description, is_completed, completed_by, completed_at |
| **EscalationLog** | ticket, escalated_by, escalation_type, reason, previous_assignee, new_assignee |
| **AuditLog** | user, action, model_name, object_id, changes (JSON), ip_address |
| **Notification** | user, title, message, notification_type, is_read, related_ticket |
| **CallLog** | caller, receiver, related_ticket, call_type, duration, notes |
| **FeedbackRating** | ticket, employee, admin, rating, comments |
| **TypeOfService** | name, description, is_active |
| **Category** | name, type_of_service, description, is_active |
| **Product** | name, description, is_active |
| **Client** | name, email, phone, address, is_active |
| **RetentionPolicy** | name, duration_days, description, is_active |
| **Announcement** | title, content, author, priority, is_active, start_date, end_date, target_roles |
| **MessageReaction** | message, user, reaction_type |
| **MessageReadReceipt** | message, user, read_at |

---

## Appendix C: API Endpoint Reference

### Authentication Endpoints (`/api/auth/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | User login (returns JWT pair) |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | User logout |
| GET | `/api/auth/me/` | Get current user profile |
| POST | `/api/auth/upload_avatar/` | Upload profile picture |
| DELETE | `/api/auth/remove_avatar/` | Remove profile picture |
| PATCH | `/api/auth/update_profile/` | Update own profile |
| POST | `/api/auth/change_password/` | Change own password |
| POST | `/api/auth/password-reset/` | Request password reset (email) |
| POST | `/api/auth/password-reset-by-key/` | Reset password via recovery key |
| POST | `/api/auth/password-reset-confirm/` | Confirm password reset token + new password |

### User Endpoints (`/api/users/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/list_users/` | List users (superadmin) |
| POST | `/api/users/create_user/` | Create user |
| PATCH | `/api/users/{id}/update_user/` | Update user |
| POST | `/api/users/{id}/toggle_active/` | Activate/deactivate user |
| POST | `/api/users/{id}/reset_password/` | Admin reset password |
| GET | `/api/auth/me/` | Current user profile |
| PATCH | `/api/auth/update_profile/` | Update own profile |
| POST | `/api/auth/change_password/` | Change own password |
| POST | `/api/auth/upload_avatar/` | Upload profile picture |

### Ticket Endpoints (`/api/tickets/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets/` | List tickets (filtered by role) |
| POST | `/api/tickets/` | Create ticket |
| GET | `/api/tickets/{id}/` | Retrieve ticket detail |
| PUT/PATCH | `/api/tickets/{id}/` | Update ticket |
| POST | `/api/tickets/{id}/assign/` | Assign ticket to technician |
| POST | `/api/tickets/{id}/escalate/` | Escalate ticket |
| POST | `/api/tickets/{id}/pass_ticket/` | Pass ticket to another technician |
| POST | `/api/tickets/{id}/start_work/` | Start working on ticket |
| POST | `/api/tickets/{id}/request_closure/` | Submit ticket for closure |
| POST | `/api/tickets/{id}/review/` | Review pending closure |
| POST | `/api/tickets/{id}/confirm_ticket/` | Confirm ticket |
| POST | `/api/tickets/{id}/close_ticket/` | Close ticket (admin-level) |
| POST | `/api/tickets/{id}/submit_for_observation/` | Set for observation period |
| POST | `/api/tickets/{id}/upload_resolution_proof/` | Upload proof of resolution |
| POST | `/api/tickets/{id}/escalate_external/` | Escalate ticket externally |
| PATCH | `/api/tickets/{id}/save_product_details/` | Save product detail snapshot |
| PATCH | `/api/tickets/{id}/update_employee_fields/` | Update employee ticket fields |
| POST | `/api/tickets/{id}/link_tickets/` | Link related tickets |
| GET | `/api/tickets/{id}/assignment_history/` | Get assignment history |
| GET | `/api/tickets/{id}/messages/` | Get ticket messages |
| GET | `/api/tickets/stats/` | Get ticket statistics |

### Notification Endpoints (`/api/notifications/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/` | List user notifications |
| POST | `/api/notifications/mark_read/` | Mark selected notifications as read |
| POST | `/api/notifications/mark_all_read/` | Mark all notifications as read |
| POST | `/api/notifications/clear_all/` | Delete all notifications |

### Additional Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories/` | List categories |
| GET | `/api/type-of-service/` | List service types |
| GET | `/api/products/` | List products |
| GET | `/api/clients/` | List clients |
| GET | `/api/audit-logs/` | List audit logs (admin+) |
| GET/POST | `/api/announcements/` | Manage announcements |
| GET/POST | `/api/feedback-ratings/` | Manage feedback ratings |
| GET/POST | `/api/call-logs/` | Manage call logs |
| GET/POST | `/api/retention-policy/` | Get/update retention policy |
| GET | `/api/knowledge-hub/` | Knowledge Hub attachments |
| GET | `/api/published-articles/` | Published Knowledge Hub articles |
| GET | `/api/employees/` | Employee list with active ticket counts |
| GET | `/api/sales-users/` | Active sales users |
| GET | `/api/supervisors/` | Active supervisors |

### WebSocket Endpoints

| Endpoint | Description |
|----------|-------------|
| `ws/notifications/` | Real-time notifications (authenticated) |
| `ws/chat/<ticket_id>/admin_employee/` | Real-time ticket chat (admin/employee) |

---

## Appendix D: Technology Stack Summary

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Runtime |
| Django | 4.2+ | Web framework |
| Django REST Framework | 3.16.1 | REST API |
| djangorestframework-simplejwt | 5.5.1 | JWT authentication |
| Django Channels | 4.3.2 | WebSocket support |
| Daphne | 4.1.2 | ASGI server |
| drf-yasg | 1.21.15 | Swagger/OpenAPI documentation |
| django-cors-headers | 4.7.0 | CORS handling |
| Pillow | 11.2.1 | Image processing |
| Whitenoise | 6.9.0 | Static file serving |
| argon2-cffi | 23.1.0 | Password hashing |
| python-dotenv | 1.1.0 | Environment configuration |

### Frontend (Primary — Maptech_FrontendUI-main)

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| TypeScript | 5.5.4 | Type-safe JavaScript |
| React Router | 6.12.0 | Client-side routing |
| Tailwind CSS | 3.4.17 | Utility-first CSS |
| Vite | 5.0.0 | Build tool & dev server |
| Recharts | 2.12.7 | Data visualization |
| Lucide React | 0.503.0 | Icon library |
| Sonner | 2.0.1 | Toast notifications |
| xlsx-js-style | 1.2.0 | Excel export |
| js-cookie | 3.0.5 | Cookie management |

### Frontend (Legacy — frontend/)

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.5.4 | Type-safe JavaScript |
| React Router | 7.13.0 | Client-side routing |
| Tailwind CSS | 4.1.5 | Utility-first CSS |
| Vite | 5.2.0 | Build tool |
| @azure/msal-browser | 4.12.0 | Azure AD auth |
| @react-oauth/google | 0.12.1 | Google auth |
| React Hook Form | 7.56.4 | Form management |

---

## Appendix E: User Role Permissions Matrix

| Feature | SuperAdmin | Admin (Supervisor) | Sales | Employee (Technician) |
|---------|:----------:|:------------------:|:-----:|:---------------------:|
| View tickets | ❌ (no ticket UI) | ✅ | ✅ (own created) | ✅ (assigned only) |
| Create tickets | ❌ (no ticket UI) | ✅ | ✅ | ❌ |
| Assign tickets | ❌ | ✅ | ❌ | ❌ |
| Escalate tickets | ❌ | ✅ (external only) | ❌ | ✅ |
| Pass tickets | ❌ | ❌ | ❌ | ✅ |
| Close tickets (direct) | ❌ (no ticket UI) | ✅ | ❌ | ❌ |
| Request closure | ❌ | ❌ | ❌ | ✅ |
| Review/confirm call status | ❌ | ✅ | ✅ (own intake flow) | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ✅ (scoped) | ❌ |
| Manage categories | ✅ | ✅ | ✅ | ❌ |
| Manage products | ✅ | ✅ | ✅ | ❌ |
| Manage clients | ✅ | ✅ | ✅ | ❌ |
| Send messages | ✅ | ✅ | ✅ | ✅ |
| Upload attachments | ❌ (no ticket UI) | ✅ | ✅ (ticket scope) | ✅ |
| View statistics | ✅ | ✅ | ✅ | ✅ (limited) |
| Manage announcements | ✅ | ❌ | ❌ | ❌ |
| Manage retention policies | ✅ | ❌ | ❌ | ❌ |

---

## Appendix F: Ticket Status Flow

![Diagram 23](./images/diagram-23.png)

**Status Definitions:**

| Status | Description |
|--------|-------------|
| `open` | Newly created, awaiting assignment |
| `in_progress` | Assigned to technician, actively being worked on |
| `escalated` | Escalated to higher-level support within the organization |
| `escalated_external` | Escalated to external/third-party support |
| `pending_closure` | Technician has requested closure, awaiting admin review |
| `for_observation` | Resolution applied, under observation period |
| `closed` | Ticket resolved and closed |
| `unresolved` | Ticket cannot be resolved |

---

## Appendix G: Glossary

| Term | Definition |
|------|------------|
| **ASGI** | Asynchronous Server Gateway Interface — Python standard for async web applications |
| **Assignment Session** | A record linking a technician to a ticket for a specific period |
| **Feedback Rating** | Supervisor/admin 1-5 rating of technical staff performance before ticket closure |
| **DRF** | Django REST Framework — toolkit for building REST APIs in Django |
| **Escalation** | Process of transferring a ticket to higher-level support |
| **JWT** | JSON Web Token — stateless authentication token format |
| **SLA** | Service Level Agreement — defined response/resolution time commitments |
| **SPA** | Single Page Application — client-side rendered web application |
| **WebSocket** | Full-duplex communication protocol over a single TCP connection |
| **Channel Layer** | Django Channels abstraction for message passing between consumers |
| **WAL** | Write-Ahead Logging — database transaction logging mechanism |
| **CORS** | Cross-Origin Resource Sharing — HTTP header mechanism for cross-domain requests |
| **ORM** | Object-Relational Mapping — technique for querying databases using objects |
| **Argon2** | Memory-hard password hashing algorithm (winner of Password Hashing Competition) |
| **HIBP** | Have I Been Pwned — service for checking if passwords appear in known data breaches |

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

