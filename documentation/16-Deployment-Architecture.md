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

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Commit   │───►│  Lint &   │───►│  Test    │───►│  Build   │───►│  Deploy  │
│  (Push)   │    │  Format   │    │  (Unit + │    │  (Static │    │  (Staging│
│           │    │           │    │   Integ) │    │   + Dist)│    │   /Prod) │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

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
