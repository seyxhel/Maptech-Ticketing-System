#!/bin/sh
set -e

# Ensure the data directory exists (used for the SQLite file when DB_PATH is set)
mkdir -p /app/data

# If DATABASE_URL is provided, try to wait for the DB host/port to be reachable
if [ -n "${DATABASE_URL}" ]; then
    echo "==> DATABASE_URL provided — waiting for DB to be reachable"
    # Extract host and port from DATABASE_URL using Python
    DB_HOST_PORT=$(python - <<PY
import os
from urllib.parse import urlparse
u = urlparse(os.environ.get('DATABASE_URL'))
host = u.hostname or ''
port = u.port or ''
print(f"{host}:{port}" if host and port else f"{host}:0")
PY
)
    DB_HOST=$(echo "$DB_HOST_PORT" | cut -d: -f1)
    DB_PORT=$(echo "$DB_HOST_PORT" | cut -d: -f2)
    # default timeout
    WAIT=${WAIT_FOR_DB_SECONDS:-30}
    i=0
    until [ "$i" -ge "$WAIT" ]; do
        if [ "$DB_PORT" = "0" ] || [ -z "$DB_HOST" ]; then
            break
        fi
        nc -z "$DB_HOST" "$DB_PORT" >/dev/null 2>&1 && break
        echo "waiting for ${DB_HOST}:${DB_PORT}... ($i)"
        i=$((i+1))
        sleep 1
    done
fi

echo "==> Running database migrations..."
python manage.py migrate --noinput

# Optional: run project seeders when AUTO_SEED is enabled (set AUTO_SEED=1 in env)
if [ "${AUTO_SEED}" = "1" ] || [ "${AUTO_SEED}" = "true" ] || [ "${AUTO_SEED}" = "True" ] || [ "${AUTO_SEED}" = "TRUE" ]; then
    echo "==> AUTO_SEED enabled — running seed management commands"
    # run seeders; commands are idempotent — log errors but do not stop the container
    python manage.py seed_users   2>&1 || echo "[WARN] seed_users failed"
    python manage.py seed_services  2>&1 || echo "[WARN] seed_services failed"
    python manage.py seed_categories 2>&1 || echo "[WARN] seed_categories failed"
    echo "==> Seeder tasks finished"
fi

echo "==> Starting Daphne (ASGI server)..."
# Allow the platform to override the listen port via the PORT env var (Railway uses this).
# Fall back to 8000 for local/docker-compose runs.
LISTEN_PORT=${PORT:-8000}

# Daphne can optionally serve TLS/HTTP2 if certificate paths are provided.
if [ -n "${SSL_CERT_FILE}" ] && [ -n "${SSL_KEY_FILE}" ]; then
    echo "==> Starting Daphne with TLS support on port ${LISTEN_PORT}"
    if [ "${ENABLE_HTTP2}" = "1" ] || [ "${ENABLE_HTTP2}" = "true" ] || [ "${ENABLE_HTTP2}" = "TRUE" ] || [ "${ENABLE_HTTP2}" = "True" ]; then
        exec daphne -b 0.0.0.0 -p "${LISTEN_PORT}" tickets_backend.asgi:application \
            --ssl-certfile "${SSL_CERT_FILE}" --ssl-keyfile "${SSL_KEY_FILE}" --http2
    else
        exec daphne -b 0.0.0.0 -p "${LISTEN_PORT}" tickets_backend.asgi:application \
            --ssl-certfile "${SSL_CERT_FILE}" --ssl-keyfile "${SSL_KEY_FILE}"
    fi
else
    exec daphne -b 0.0.0.0 -p "${LISTEN_PORT}" tickets_backend.asgi:application
fi
