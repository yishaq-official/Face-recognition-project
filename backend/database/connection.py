from pymongo import MongoClient
from config import Config

class DatabaseManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            cls._instance.client = MongoClient(Config.MONGO_URI)
            cls._instance.db = cls._instance.client[Config.DB_NAME]
            print(f"[DB] Connected to MongoDB: {Config.DB_NAME}")
        return cls._instance

# Export a single instance to be used across the app
db_manager = DatabaseManager()
db = db_manager.db