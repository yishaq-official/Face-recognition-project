# /backend/config.py
import os

class Config:
    _DEFAULT_JWT_SECRET = "CHANGE_ME_use_a_long_random_secret"
    _DEFAULT_ADMIN_PASSWORD_HASH = (
        "$2b$12$ufLcjZ4DeJugwh27WFsxi.feEh0thqnDgChKBApDYUwvQGT9NV0O2"
    )

    # ── Database ────────────────────────────────────────────────
    MONGO_URI  = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    DB_NAME    = "aegis_pentagon_db"

    # ── File storage ────────────────────────────────────────────
    UPLOAD_FOLDER = os.path.join("static", "uploads")

    # ── Face recognition ────────────────────────────────────────
    TOLERANCE = 0.5

    # ── Server / URL ────────────────────────────────────────────
    # Used by engine.py to build image_url in socket events.
    # Override with the real public hostname in production.
    API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5000")

    # ── CORS ────────────────────────────────────────────────────
    # Comma-separated list of allowed frontend origins.
    # Default allows the Vite dev server; override in production.
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    # ── Authentication ──────────────────────────────────────────
    # SECURITY: All three values below MUST be set via environment
    # variables in production. The defaults here are for local dev only.
    JWT_SECRET_KEY   = os.getenv("JWT_SECRET_KEY", _DEFAULT_JWT_SECRET)
    JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "8"))

    ADMIN_USERNAME      = os.getenv("ADMIN_USERNAME", "insa_admin")
    # Generate hash: python -c "import bcrypt; print(bcrypt.hashpw(b'YourPassword', bcrypt.gensalt()).decode())"
    # Local development fallback password: admin123
    ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", _DEFAULT_ADMIN_PASSWORD_HASH)

    @classmethod
    def validate(cls):
        """Call on startup to catch insecure defaults early."""
        warnings = []
        if cls.JWT_SECRET_KEY == cls._DEFAULT_JWT_SECRET:
            warnings.append("JWT_SECRET_KEY is using the insecure default. Set it via environment variable.")
        if cls.ADMIN_PASSWORD_HASH == cls._DEFAULT_ADMIN_PASSWORD_HASH:
            warnings.append("ADMIN_PASSWORD_HASH is using the local dev default password. Set it via environment variable.")
        for w in warnings:
            print(f"[CONFIG WARNING] {w}")
