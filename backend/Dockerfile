# ─── Build / dependency stage ────────────────────────────────────────────────
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System libraries needed to compile some Python packages (argon2-cffi, Pillow)
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libffi-dev \
        libjpeg-dev \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=tickets_backend.settings

WORKDIR /app

# Runtime-only system libs
RUN apt-get update && apt-get install -y --no-install-recommends \
        libjpeg62-turbo \
        zlib1g \
        netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy project source into a temporary location so this Dockerfile works when the
# build context is either the repo root or the `backend/` folder.
COPY . /src_tmp

# Move the correct project subtree into /app depending on build context.
RUN if [ -f /src_tmp/manage.py ]; then \
            cp -a /src_tmp/. /app; \
        elif [ -f /src_tmp/backend/manage.py ]; then \
            cp -a /src_tmp/backend/. /app; \
        else \
            echo "Error: manage.py not found in build context" >&2; exit 1; \
        fi

# Create directories that need to persist
RUN mkdir -p /app/media /app/staticfiles

# Collect static files at build time using a dummy secret key
# (WhiteNoise will serve them; no DB access needed for collectstatic)
RUN SECRET_KEY=build-time-dummy-key python manage.py collectstatic --noinput

# Expose entrypoint from the copied app directory to a predictable location
RUN if [ -f /app/entrypoint.sh ]; then \
            cp /app/entrypoint.sh /entrypoint.sh && chmod +x /entrypoint.sh; \
        elif [ -f /app/backend/entrypoint.sh ]; then \
            cp /app/backend/entrypoint.sh /entrypoint.sh && chmod +x /entrypoint.sh; \
        else \
            echo "Warning: entrypoint.sh not found in app, continuing"; \
        fi

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
