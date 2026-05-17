# /backend/database/models.py
from datetime import datetime, timedelta
from database.connection import db

class UserModel:
    collection = db['users']

    @classmethod
    def get_all_encodings(cls):
        """Returns all active user encodings for the AI engine."""
        return list(cls.collection.find(
            {"status": "Active"},
            {"name": 1, "encoding": 1, "employee_id": 1}
        ))

    @classmethod
    def create_user(cls, user_data):
        """
        Inserts a new SENTINEL personnel record.

        Expected user_data shape (all keys except encoding & image_path
        come from the React enrollment form as JSON):

        {
          "employee_id":  "SGT-XXXXX",          # auto-generated on frontend

          "name": {
            "first":  str,
            "last":   str,
          },

          "personal": {
            "sex":                  "Male" | "Female" | "Other",
            "date_of_birth":        "YYYY-MM-DD",
            "blood_type":           "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-",
            "height_cm":            int,
            "weight_kg":            int,
            "eye_color":            str,          # e.g. "Brown"
            "distinguishing_marks": str,          # free text, e.g. "Scar on left cheek"
          },

          "service": {
            "rank":             str,              # e.g. "Senior Officer"
            "job_title":        str,              # e.g. "Cyber Intelligence Analyst"
            "department":       str,              # e.g. "Cyber Operations"
            "unit":             str,              # e.g. "Unit 8200-ET"
            "posting_location": str,              # e.g. "Addis Ababa HQ"
            "date_joined_service": "YYYY-MM-DD",
            "access_zones":     [str],            # e.g. ["ZONE-A", "ZONE-B"]
          },

          "position": {
            "clearance_level": "UNCLASSIFIED" | "SECRET" | "TOP SECRET" | "TOP SECRET // SCI"
          },

          # Added automatically below — NOT sent from the form:
          "image_path": str,    # set by app.py before calling create_user
          "encoding":   list,   # 128-d float list, set by app.py
        }
        """
        user_data["registered_on"] = datetime.utcnow()   # auto timestamp, hidden from UI
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
        """Records a successful scan with enriched personnel data."""
        log = {
            "employee_id": employee_id,
            "first_name":  name_dict.get("first"),
            "last_name":   name_dict.get("last"),
            "clearance":   clearance,
            "timestamp":   datetime.utcnow(),
        }
        cls.collection.insert_one(log)
        return log

    @classmethod
    def get_recent_logs(cls, limit=50):
        """Returns the most recent attendance logs for the history page."""
        logs = cls.collection.find(
            {},
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit)
        return list(logs)
