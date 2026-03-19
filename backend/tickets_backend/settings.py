import os
from pathlib import Path
from urllib.parse import urlparse
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ.get('SECRET_KEY', 'change-me')

DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes')

_allowed_hosts_raw = os.environ.get('ALLOWED_HOSTS', '*')
ALLOWED_HOSTS = [h.strip() for h in _allowed_hosts_raw.split(',') if h.strip()]
if not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ['*']

# Include frontend domains from CORS_ALLOWED_ORIGINS so WebSocket origin
# checks (AllowedHostsOriginValidator) accept deployed frontend hosts.
_cors_origins_for_hosts = os.environ.get('CORS_ALLOWED_ORIGINS', '')
for _origin in _cors_origins_for_hosts.split(','):
    _host = urlparse(_origin.strip()).hostname
    if _host and _host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(_host)

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'channels',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'drf_yasg',
    'tickets',
    'users',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'tickets_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'tickets_backend.wsgi.application'
ASGI_APPLICATION = 'tickets_backend.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    from urllib.parse import urlparse, parse_qs

    _parsed = urlparse(DATABASE_URL)
    _qs = parse_qs(_parsed.query)

    scheme = _parsed.scheme or ''
    if scheme.startswith('postgres') or scheme in ('psql', 'postgres'):
        engine = 'django.db.backends.postgresql'
    elif scheme.startswith('mysql'):
        engine = 'django.db.backends.mysql'
    else:
        engine = 'django.db.backends.postgresql'

    DATABASES = {
        'default': {
            'ENGINE': engine,
            'NAME': _parsed.path.lstrip('/'),
            'USER': _parsed.username,
            'PASSWORD': _parsed.password,
            'HOST': _parsed.hostname,
            'PORT': _parsed.port,
        }
    }

    # support sslmode in query string (e.g. ?sslmode=require)
    sslmodes = _qs.get('sslmode')
    if sslmodes:
        DATABASES['default'].setdefault('OPTIONS', {})['sslmode'] = sslmodes[0]
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            # DB_PATH can be overridden via environment variable (e.g. inside Docker)
            'NAME': os.environ.get('DB_PATH', str(BASE_DIR / 'db.sqlite3')),
        }
    }

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

_media_url = os.environ.get('MEDIA_URL', '/media/')
if not _media_url.startswith('/'):
    _media_url = f'/{_media_url}'
if not _media_url.endswith('/'):
    _media_url = f'{_media_url}/'
MEDIA_URL = _media_url

MEDIA_ROOT = Path(os.environ.get('MEDIA_ROOT', str(BASE_DIR / 'media')))
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)

FILE_UPLOAD_TEMP_DIR = os.environ.get('FILE_UPLOAD_TEMP_DIR', str(BASE_DIR / 'tmp_uploads'))
Path(FILE_UPLOAD_TEMP_DIR).mkdir(parents=True, exist_ok=True)

# Support larger multipart uploads for screenshots and video proof.
FILE_UPLOAD_MAX_MEMORY_SIZE = int(os.environ.get('FILE_UPLOAD_MAX_MEMORY_SIZE', str(25 * 1024 * 1024)))
DATA_UPLOAD_MAX_MEMORY_SIZE = int(os.environ.get('DATA_UPLOAD_MAX_MEMORY_SIZE', str(250 * 1024 * 1024)))

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Railway terminates TLS at the edge and forwards protocol headers.
# Trust this header so build_absolute_uri() emits https URLs.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# CORS
CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL_ORIGINS', 'False').lower() in ('true', '1', 'yes')
_cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if _cors_origins:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(',')]
CORS_ALLOW_CREDENTIALS = os.environ.get('CORS_ALLOW_CREDENTIALS', 'True').lower() in ('true', '1', 'yes')

_csrf_trusted_origins = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
if _csrf_trusted_origins:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_trusted_origins.split(',')]

# Prefer Argon2 for password hashing (stronger than PBKDF2), keep fallbacks for existing hashes
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.ScryptPasswordHasher',
]

# Use custom user model
AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'users.authentication.CookieJWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
}

# drf-yasg Swagger settings
SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': 'JWT token. Enter: Bearer <your_access_token>',
            'bearerFormat': 'JWT',
        },
    },
    'PERSIST_AUTH': True,
    'REFETCH_SCHEMA_WITH_AUTH': True,
    'USE_SESSION_AUTH': False,
    'DEFAULT_API_URL': 'http://127.0.0.1:8000',
    'TAGS_SORTER': 'alpha',
    'OPERATIONS_SORTER': 'alpha',
    'DEFAULT_AUTO_SCHEMA_CLASS': 'tickets.swagger.TaggedAutoSchema',
}


from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
}

# JWT cookie settings (HttpOnly auth cookies)
JWT_ACCESS_COOKIE_NAME = os.environ.get('JWT_ACCESS_COOKIE_NAME', 'maptech_access')
JWT_REFRESH_COOKIE_NAME = os.environ.get('JWT_REFRESH_COOKIE_NAME', 'maptech_refresh')
JWT_COOKIE_SECURE = os.environ.get('JWT_COOKIE_SECURE', 'True').lower() in ('true', '1', 'yes')
JWT_COOKIE_HTTPONLY = os.environ.get('JWT_COOKIE_HTTPONLY', 'True').lower() in ('true', '1', 'yes')
JWT_COOKIE_SAMESITE = os.environ.get('JWT_COOKIE_SAMESITE', 'Lax')
JWT_COOKIE_DOMAIN = os.environ.get('JWT_COOKIE_DOMAIN', None)
JWT_COOKIE_PATH = os.environ.get('JWT_COOKIE_PATH', '/')
