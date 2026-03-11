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

```
┌──────────────────────┐          ┌──────────────────────┐
│     React Frontend    │          │    Django Backend     │
│                      │          │                      │
│  Service Layer       │─── HTTP ─►│  DRF ViewSets        │
│  (api.ts,            │◄── JSON ──│  Serializers         │
│   ticketService.ts,  │          │  Permissions          │
│   etc.)              │          │                      │
│                      │          │                      │
│  TicketChatSocket    │── WS ───►│  TicketChatConsumer   │
│  NotificationSocket  │◄── JSON ──│  NotificationConsumer │
│                      │          │                      │
└──────────────────────┘          └──────────────────────┘
```

### Development Proxy Configuration

```
Vite Dev Server (port 3000)
  ├── /api/*    → proxy to http://localhost:8000/api/*
  ├── /media/*  → proxy to http://localhost:8000/media/*
  └── /ws/*     → proxy to ws://localhost:8000/ws/*
```

### Signal-Based Internal Integration

Django signals provide event-driven integration between system modules:

```
Model Event ──► Signal Handler ──► Side Effect
                                      │
                                      ├── AuditLog creation
                                      ├── Notification dispatch
                                      ├── WebSocket broadcast
                                      └── Session management
```

---

*End of Section 14*
