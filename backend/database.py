from pymongo import MongoClient
from datetime import datetime, timedelta

class AttendanceDB:
    def __init__(self, uri="mongodb://localhost:27017/", db_name="face_attendance"):
        self.client = MongoClient(uri)
        self.db = self.client[db_name]
        self.users = self.db.users
        self.logs = self.db.attendance_logs

    def get_all_encodings(self):
        """Retrieves all user encodings and names for the recognition engine."""
        users = list(self.users.find({}, {"name": 1, "encoding": 1}))
        return users

    def check_cooldown(self, user_id, interval_minutes=1):
        """
        Checks if the user has been logged within the last X minutes.
        Returns True if the user is 'on cooldown' (already marked).
        """
        last_log = self.logs.find_one(
            {"user_id": user_id},
            sort=[("timestamp", -1)]
        )
        
        if last_log:
            time_diff = datetime.utcnow() - last_log["timestamp"]
            if time_diff < timedelta(minutes=interval_minutes):
                return True
        return False

    def log_attendance(self, user_id, name):
        """Creates a new attendance entry."""
        log_entry = {
            "user_id": user_id,
            "name": name,
            "timestamp": datetime.utcnow()
        }
        self.logs.insert_one(log_entry)
        return log_entry