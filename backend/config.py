# /backend/config.py
import os

class Config:
    # ── Database ────────────────────────────────────────────────
    MONGO_URI  = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    DB_NAME    = "aegis_pentagon_db"

    # ── File storage ────────────────────────────────────────────
    UPLOAD_FOLDER = os.path.join("static", "uploads")

    # ── Face recognition ────────────────────────────────────────
    TOLERANCE = 0.5

    # ── Authentication ──────────────────────────────────────────
    # JWT secret — change this to a strong random string in production
    JWT_SECRET_KEY     = os.getenv("JWT_SECRET_KEY", "insa-node7-ultra-secret-change-me")
    JWT_EXPIRY_HOURS   = 8          # token valid for 8 hours

    # Admin credentials
    # ADMIN_PASSWORD is stored as a bcrypt hash.
    # Default plain-text password: "Admin@INSA2025"
    # To generate a new hash in Python:
    #   import bcrypt
    #   bcrypt.hashpw(b"your_password", bcrypt.gensalt()).decode()
    ADMIN_USERNAME      = os.getenv("ADMIN_USERNAME", "insa_admin")
    ADMIN_PASSWORD_HASH = os.getenv(
        "ADMIN_PASSWORD_HASH",
        # hash of "Admin@INSA2025"
        "$2b$12$ljLhpL4xehDXdjqLsprbiuWteM0bSn5rFAP5W34kuWHe.ukP7KA.."
    )