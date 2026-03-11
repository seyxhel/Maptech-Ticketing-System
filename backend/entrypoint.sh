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

echo "==> Starting Daphne (ASGI server)..."
# Daphne can optionally serve TLS/HTTP2 if certificate paths are provided.
if [ -n "${SSL_CERT_FILE}" ] && [ -n "${SSL_KEY_FILE}" ]; then
    echo "==> Starting Daphne with TLS support"
    DAPHNE_CMD=(daphne -b 0.0.0.0 -p 8000 tickets_backend.asgi:application \
        --ssl-certfile "${SSL_CERT_FILE}" --ssl-keyfile "${SSL_KEY_FILE}")
    if [ "${ENABLE_HTTP2}" = "1" ] || [ "${ENABLE_HTTP2^^}" = "TRUE" ]; then
        DAPHNE_CMD+=(--http2)
    fi
    exec "${DAPHNE_CMD[@]}"
else
    exec daphne -b 0.0.0.0 -p 8000 tickets_backend.asgi:application
fi
