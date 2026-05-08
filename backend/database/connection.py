# /backend/database/connection.py
from pymongo import MongoClient, ASCENDING
from pymongo.errors import OperationFailure
from config import Config

class DatabaseManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            cls._instance.client = MongoClient(Config.MONGO_URI)
            cls._instance.db     = cls._instance.client[Config.DB_NAME]
            print(f"[DB] Connected to MongoDB: {Config.DB_NAME}")
            cls._instance._ensure_indexes()
        return cls._instance

    def _ensure_indexes(self):
        """Creates required indexes if they don't already exist."""
        try:
            # Unique index prevents duplicate employee_id even if frontend
            # generates a collision (extremely rare but possible with random IDs).
            self.db['users'].create_index(
                [("employee_id", ASCENDING)],
                unique=True,
                name="employee_id_unique"
            )
            # Speed up attendance log queries by employee and timestamp
            self.db['attendance_logs'].create_index(
                [("employee_id", ASCENDING), ("timestamp", ASCENDING)],
                name="attendance_employee_time"
            )
            print("[DB] Indexes verified.")
        except OperationFailure as e:
            print(f"[DB WARNING] Index creation failed: {e}")


# Singleton — import `db` anywhere in the app
db_manager = DatabaseManager()
db         = db_manager.db