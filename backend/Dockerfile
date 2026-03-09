# ── Backend Dockerfile (Django + Daphne ASGI) ──
FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required by argon2-cffi and Pillow
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libc-dev libjpeg-dev zlib1g-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy project files
COPY . .

# Collect static files (uses whitenoise)
RUN python manage.py collectstatic --noinput

# Railway injects PORT env var; default to 8000
ENV PORT=8000
EXPOSE ${PORT}

# Run migrations then start Daphne (ASGI) for WebSocket support
CMD sh -c "python manage.py migrate --noinput && daphne -b 0.0.0.0 -p $PORT tickets_backend.asgi:application"
