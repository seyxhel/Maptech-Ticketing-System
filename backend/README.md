# Tickets Backend (Django)

Quick API backend for ticketing system.

Setup

1. Create a virtualenv and install requirements:

```bash
python -m venv .venv
.venv\Scripts\activate  # on Windows
pip install -r requirements.txt
```

2. Apply migrations and run server:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

3. Seed default users (optional — creates client, admin, and employee accounts):

```bash
python manage.py seed_users
```

API

- List/create: `GET/POST /api/tickets/`
- Retrieve/update/delete: `/api/tickets/{id}/`
