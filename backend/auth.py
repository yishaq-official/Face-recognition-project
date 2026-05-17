# /backend/auth.py
"""
Authentication module for the FaceGuard admin panel.
Provides:
  - /api/auth/login  POST  — verify credentials, return JWT
  - /api/auth/verify GET   — validate a token (used by React on page load)
  - require_auth           — decorator to protect admin API routes
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import Blueprint, request, jsonify
from config import Config

auth_bp = Blueprint('auth', __name__)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _generate_token() -> str:
    payload = {
        "sub":  Config.ADMIN_USERNAME,
        "role": "admin",
        "iat":  datetime.utcnow(),
        "exp":  datetime.utcnow() + timedelta(hours=Config.JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")


def _decode_token(token: str) -> dict | None:
    """Returns decoded payload or None if invalid / expired."""
    try:
        return jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ── Decorator ─────────────────────────────────────────────────────────────────

def require_auth(f):
    """
    Attach this decorator to any Flask route that must be admin-only.
    Expects:  Authorization: Bearer <token>
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "message": "Missing token."}), 401

        token   = auth_header.split(" ", 1)[1]
        payload = _decode_token(token)

        if payload is None:
            return jsonify({"success": False, "message": "Token expired or invalid."}), 401

        return f(*args, **kwargs)
    return decorated


# ── Routes ───────────────────────────────────────────────────────────────────

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    """
    Body (JSON):  { "username": "...", "password": "..." }
    Returns:      { "success": true, "token": "...", "expires_in": 28800 }
    """
    data     = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password required."}), 400

    # 1. Check username
    if username != Config.ADMIN_USERNAME:
        # Uniform delay-like message to prevent username enumeration
        return jsonify({"success": False, "message": "Invalid credentials."}), 401

    # 2. Check password against bcrypt hash
    try:
        password_matches = bcrypt.checkpw(
            password.encode("utf-8"),
            Config.ADMIN_PASSWORD_HASH.encode("utf-8")
        )
    except Exception:
        password_matches = False

    if not password_matches:
        return jsonify({"success": False, "message": "Invalid credentials."}), 401

    # 3. Issue token
    token = _generate_token()
    print(f"[AUTH] Admin login successful. Token issued.")
    return jsonify({
        "success":    True,
        "token":      token,
        "expires_in": Config.JWT_EXPIRY_HOURS * 3600,
        "username":   Config.ADMIN_USERNAME,
    }), 200


@auth_bp.route('/api/auth/verify', methods=['GET'])
def verify():
    """
    Called by React on app load to check if the stored token is still valid.
    Returns 200 if valid, 401 if not.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"success": False, "message": "No token provided."}), 401

    token   = auth_header.split(" ", 1)[1]
    payload = _decode_token(token)

    if payload is None:
        return jsonify({"success": False, "message": "Token expired or invalid."}), 401

    return jsonify({
        "success":  True,
        "username": payload.get("sub"),
        "expires":  payload.get("exp"),
    }), 200
