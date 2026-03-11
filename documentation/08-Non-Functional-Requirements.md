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
| **Access Control Model** | Role-Based Access Control (RBAC) with four roles: superadmin, admin, employee, client |
| **Permission Classes** | Six custom DRF permission classes enforcing role-based access at the API level |
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
