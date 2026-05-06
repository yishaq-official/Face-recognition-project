#/backend/database/models.py
from datetime import datetime, timedelta
from database.connection import db

class UserModel:
    collection = db['users']

    @classmethod
    def get_all_encodings(cls):
        """Returns all active user encodings for the AI engine."""
        return list(cls.collection.find({"status": "Active"}, {"name": 1, "encoding": 1, "employee_id": 1}))

    @classmethod
    def create_user(cls, user_data):
        """Inserts a new highly-classified user record."""
        user_data["registered_on"] = datetime.utcnow()
        user_data["status"] = "Active"
        return cls.collection.insert_one(user_data)

class AttendanceModel:
    collection = db['attendance_logs']

    @classmethod
    def check_cooldown(cls, employee_id, interval_minutes=1):
        """Prevents log spamming within the defined interval."""
        last_log = cls.collection.find_one(
            {"employee_id": employee_id},
            sort=[("timestamp", -1)]
        )
        if last_log:
            time_diff = datetime.utcnow() - last_log["timestamp"]
            if time_diff < timedelta(minutes=interval_minutes):
                return True
        return False

    @classmethod
    def log_entry(cls, employee_id, name_dict, clearance):
        """Records a successful scan."""
        log = {
            "employee_id": employee_id,
            "first_name": name_dict.get("first"),
            "last_name": name_dict.get("last"),
            "clearance": clearance,
            "timestamp": datetime.utcnow()
        }
        cls.collection.insert_one(log)
        return log