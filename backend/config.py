#config.py
import os

class Config:
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    DB_NAME = "aegis_pentagon_db"
    UPLOAD_FOLDER = os.path.join("static", "uploads")
    # Strict matching threshold (lower is stricter)
    TOLERANCE = 0.5