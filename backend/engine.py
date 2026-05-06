# /backend/engine.py
import cv2
import face_recognition
import numpy as np
from database.models import UserModel, AttendanceModel

class FaceRecognitionEngine:
    def __init__(self):
        self.known_face_encodings = []
        self.known_face_metadata = []   # stores rich personnel data for socket emit
        self.load_known_faces()

    def load_known_faces(self):
        """Loads all Active personnel from MongoDB into RAM."""
        print("[ENGINE] Booting Security Matrices... Loading personnel data.")
        users = UserModel.get_all_encodings()

        self.known_face_encodings.clear()
        self.known_face_metadata.clear()

        for user in users:
            self.known_face_encodings.append(np.array(user["encoding"]))
            self.known_face_metadata.append({
                "employee_id":      user["employee_id"],
                "name":             user["name"],

                # Service block — used by the public view sidebar
                "rank":             user.get("service", {}).get("rank", "—"),
                "job_title":        user.get("service", {}).get("job_title", "—"),
                "department":       user.get("service", {}).get("department", "—"),
                "unit":             user.get("service", {}).get("unit", "—"),
                "posting_location": user.get("service", {}).get("posting_location", "—"),
                "access_zones":     user.get("service", {}).get("access_zones", []),

                # Clearance
                "clearance":        user.get("position", {}).get("clearance_level", "UNCLASSIFIED"),

                # Photo URL — served as static file
                "image_url":        f"http://localhost:5000/static/uploads/{user.get('image_path', '').split('/')[-1]}",
            })

        print(f"[ENGINE] Loaded {len(self.known_face_encodings)} classified profiles.")

    # Reload must also pull full user docs, so override get_all_encodings to return all needed fields
    def _get_full_users(self):
        from database.connection import db
        return list(db['users'].find(
            {"status": "Active"},
            {
                "name": 1, "encoding": 1, "employee_id": 1,
                "service": 1, "position": 1, "image_path": 1
            }
        ))

    def load_known_faces(self):
        print("[ENGINE] Booting Security Matrices... Loading personnel data.")
        self.known_face_encodings.clear()
        self.known_face_metadata.clear()

        for user in self._get_full_users():
            self.known_face_encodings.append(np.array(user["encoding"]))
            self.known_face_metadata.append({
                "employee_id":      user["employee_id"],
                "name":             user["name"],
                "rank":             user.get("service", {}).get("rank", "—"),
                "job_title":        user.get("service", {}).get("job_title", "—"),
                "department":       user.get("service", {}).get("department", "—"),
                "unit":             user.get("service", {}).get("unit", "—"),
                "posting_location": user.get("service", {}).get("posting_location", "—"),
                "access_zones":     user.get("service", {}).get("access_zones", []),
                "clearance":        user.get("position", {}).get("clearance_level", "UNCLASSIFIED"),
                "image_url":        f"http://localhost:5000/static/uploads/{user.get('image_path','').split('/')[-1]}",
            })

        print(f"[ENGINE] Loaded {len(self.known_face_encodings)} classified profiles.")

    def process_frame(self, frame, tolerance=0.5):
        """Processes the live video feed. Emits rich personnel events via WebSocket."""
        small_frame      = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        rgb_small_frame  = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

        face_locations   = face_recognition.face_locations(rgb_small_frame)
        face_encodings   = face_recognition.face_encodings(rgb_small_frame, face_locations)

        display_labels   = []
        new_events       = []

        for face_encoding in face_encodings:
            matches        = face_recognition.compare_faces(self.known_face_encodings, face_encoding, tolerance=tolerance)
            label_text     = "UNKNOWN ENTITY"
            status         = "DENIED"
            face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)

            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)

                if matches[best_match_index]:
                    meta        = self.known_face_metadata[best_match_index]
                    full_name   = f"{meta['name']['first']} {meta['name']['last']}"
                    employee_id = meta['employee_id']
                    clearance   = meta['clearance']

                    is_on_cooldown = AttendanceModel.check_cooldown(employee_id, interval_minutes=1)

                    if is_on_cooldown:
                        status     = "COOLDOWN_ACTIVE"
                        label_text = f"{full_name} [WAIT]"
                    else:
                        AttendanceModel.log_entry(employee_id, meta['name'], clearance)
                        status     = "AUTHORIZED"
                        label_text = f"{full_name} [{clearance}]"

                        # ── Full payload sent to React public view sidebar ──
                        new_events.append({
                            "name":             full_name,
                            "id":               employee_id,
                            "clearance":        clearance,
                            "rank":             meta["rank"],
                            "job_title":        meta["job_title"],
                            "department":       meta["department"],
                            "unit":             meta["unit"],
                            "posting_location": meta["posting_location"],
                            "access_zones":     meta["access_zones"],
                            "image_url":        meta["image_url"],
                            "status":           status,
                        })

            display_labels.append((label_text, status))

        # Draw cyber-style bounding boxes
        for (top, right, bottom, left), (text, status) in zip(face_locations, display_labels):
            top, right, bottom, left = top * 4, right * 4, bottom * 4, left * 4

            if status == "AUTHORIZED":
                color = (255, 255, 0)
            elif status == "COOLDOWN_ACTIVE":
                color = (0, 165, 255)
            else:
                color = (0, 0, 255)

            length, thickness = 20, 2
            cv2.line(frame, (left, top),    (left + length, top),    color, thickness)
            cv2.line(frame, (left, top),    (left, top + length),    color, thickness)
            cv2.line(frame, (right, top),   (right - length, top),   color, thickness)
            cv2.line(frame, (right, top),   (right, top + length),   color, thickness)
            cv2.line(frame, (left, bottom), (left + length, bottom), color, thickness)
            cv2.line(frame, (left, bottom), (left, bottom - length), color, thickness)
            cv2.line(frame, (right, bottom),(right - length, bottom),color, thickness)
            cv2.line(frame, (right, bottom),(right, bottom - length),color, thickness)

            cv2.putText(frame, text, (left, bottom + 20),
                        cv2.FONT_HERSHEY_PLAIN, 1.2, color, 2)

        return frame, new_events

    def verify_live_match(self, uploaded_encoding, live_frame, strict_tolerance=0.45):
        """Used exclusively during Admin Enrollment. Compares uploaded ID vs live webcam."""
        rgb_frame          = cv2.cvtColor(live_frame, cv2.COLOR_BGR2RGB)
        live_face_locations = face_recognition.face_locations(rgb_frame)

        if len(live_face_locations) == 0:
            return False, "Verification Failed: No face detected in live camera feed."
        if len(live_face_locations) > 1:
            return False, "Verification Failed: Multiple faces detected. Area must be secure."

        live_encoding = face_recognition.face_encodings(rgb_frame, live_face_locations)[0]
        matches       = face_recognition.compare_faces([uploaded_encoding], live_encoding, tolerance=strict_tolerance)

        if matches[0]:
            return True, live_encoding.tolist()
        else:
            return False, "Verification Failed: Live person does not match the uploaded ID photo."