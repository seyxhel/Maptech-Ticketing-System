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
| **STF** | Service Ticket Form — the unique identifier format for support tickets (e.g., STF-MP-20260311000001) |
| **SLA** | Service Level Agreement — the agreed-upon timeframe for ticket resolution |
| **CSAT** | Customer Satisfaction — a measurement of client satisfaction with service delivery |
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
