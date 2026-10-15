"""
Django settings for the plant shop API.

Everything environment-specific comes from env vars (see .env.example).
Targets: local dev, and Vercel (serverless) with Supabase Postgres + Cloudflare R2.
"""
import os
from pathlib import Path
from urllib.parse import urlparse
from dotenv import load_dotenv
import dj_database_url
import urllib.parse

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")  # no-op on Vercel, where real env vars are set

# --- Core -------------------------------------------------------------------
DEBUG = os.environ.get("DEBUG", "False") == "True"
SECRET_KEY = os.environ.get("SECRET_KEY")
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
CSRF_TRUSTED_ORIGINS = os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if os.environ.get("CSRF_TRUSTED_ORIGINS") else []
CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if os.environ.get("CORS_ALLOWED_ORIGINS") else []

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third party
    "rest_framework",
    "django_filters",
    "corsheaders",
    "storages",
    # project apps (models arrive at checkpoint 1)
    "catalog",
    "shop",
    "inquiries",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",   # serves admin static files
    "corsheaders.middleware.CorsMiddleware",        # must sit above CommonMiddleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# --- Database: Supabase Postgres --------------------------------------------
# Runtime uses the TRANSACTION pooler (port 6543). Serverless functions cannot
# hold persistent connections, and the pooler does not support server-side
# cursors or prepared statements, so those are switched off below.
# Migrations: override DATABASE_URL with the SESSION pooler string (port 5432).
# Supabase PostgreSQL Database for development
pas = os.getenv("DB_PASSWORD")
user = os.getenv("DB_USER")
password = urllib.parse.quote_plus(os.getenv("DB_PASSWORD"))
DATABASE_URL = f"postgresql://postgres.{user}:{password}@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"
DATABASES = {
    'default': dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=60,
        ssl_require=True
    )
}

# Disable server-side cursors for PgBouncer compatibility (Supabase pooler port 6543)
DATABASES['default']['DISABLE_SERVER_SIDE_CURSORS'] = True

# --- Auth / i18n ------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
LANGUAGE_CODE = "en"
TIME_ZONE = "Africa/Addis_Ababa"
USE_I18N = True
USE_TZ = True

# --- Static files (admin) and media (R2) --------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"  # run `collectstatic` in the build step

R2_PUBLIC_BASE_URL = os.environ.get("R2_PUBLIC_BASE_URL", "")

STORAGES = {
    # Media (ImageField) lives in Cloudflare R2 via the S3 API.
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "bucket_name": os.environ.get("R2_BUCKET", default=""),
            "endpoint_url": f"https://{os.environ.get('R2_ACCOUNT_ID', default='')}.r2.cloudflarestorage.com",
            "access_key": os.environ.get("R2_ACCESS_KEY_ID", default=""),
            "secret_key": os.environ.get("R2_SECRET_ACCESS_KEY", default=""),
            "region_name": "auto",
            "signature_version": "s3v4",
            "default_acl": None,        # R2 has no ACLs
            "querystring_auth": False,  # public bucket, plain URLs
            "file_overwrite": False,
            # Public host (custom domain or r2.dev), without the scheme.
            "custom_domain": urlparse(R2_PUBLIC_BASE_URL).netloc or None,
        },
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# --- Django REST framework ----------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 100,  # large on purpose: the frontend filters the full list client-side
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    # Deny by default: every endpoint requires a staff user unless the view
    # explicitly sets AllowAny / a read-only permission. Public catalog, shop,
    # inquiry and contact views opt in one by one.
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAdminUser"],
    # The dashboard login mechanism (token or session) arrives at checkpoint 4.
    # Throttle classes/rates arrive at checkpoint 3 (see note below).
}

# NOTE (throttling on serverless): DRF throttles count requests in the Django
# cache. The default per-process local-memory cache is NOT shared between
# serverless instances, so limits would be unreliable. At checkpoint 3, switch
# to a shared cache, e.g.:
#   CACHES = {"default": {"BACKEND": "django.core.cache.backends.db.DatabaseCache",
#                         "LOCATION": "django_cache"}}
# then run `python manage.py createcachetable`.

# --- Production security ------------------------------------------------------
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")  # behind Vercel's proxy
    SECURE_SSL_REDIRECT = False  # Vercel already terminates TLS and redirects
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True