#!/bin/sh
set -e

# Ensure the data directory exists (used for the SQLite file when DB_PATH is set)
mkdir -p /app/data

echo "==> Running database migrations..."
python manage.py migrate --noinput

echo "==> Starting Daphne (ASGI server)..."
exec daphne \
    -b 0.0.0.0 \
    -p 8000 \
    tickets_backend.asgi:application
