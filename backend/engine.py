import cv2
import face_recognition
import numpy as np
from database.models import UserModel, AttendanceModel

class FaceRecognitionEngine:
    def __init__(self):
        self.known_face_encodings = []
        self.known_face_metadata = [] # Stores name, ID, and clearance
        
        # Load the database into memory on startup
        self.load_known_faces()

    def load_known_faces(self):
        """Loads all Active personnel from the MongoDB into RAM."""
        print("[ENGINE] Booting Security Matrices... Loading personnel data.")
        users = UserModel.get_all_encodings()
        
        # Clear existing data in case we are reloading after a new enrollment
        self.known_face_encodings.clear()
        self.known_face_metadata.clear()

        for user in users:
            # Convert the list back into a numpy array for the math functions
            self.known_face_encodings.append(np.array(user["encoding"]))
            self.known_face_metadata.append({
                "employee_id": user["employee_id"],
                "name": user["name"],
                "clearance": user.get("position", {}).get("clearance_level", "UNCLASSIFIED")
            })
            
        print(f"[ENGINE] Loaded {len(self.known_face_encodings)} classified profiles.")

    def process_frame(self, frame, tolerance=0.5):
        """
        Processes the live video feed for the Cyber Public Interface.
        Tolerance lowered to 0.5 for enterprise-grade strictness.
        """
        # Shrink frame for real-time processing speed
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        
        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

        display_labels = []
        new_events = []

        for face_encoding in face_encodings:
            matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding, tolerance=tolerance)
            
            label_text = "UNKNOWN ENTITY"
            status = "DENIED"

            face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
            
            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)
                
                if matches[best_match_index]:
                    meta = self.known_face_metadata[best_match_index]
                    full_name = f"{meta['name']['first']} {meta['name']['last']}"
                    employee_id = meta['employee_id']
                    clearance = meta['clearance']
                    
                    # --- Enterprise Cooldown Logic ---
                    is_on_cooldown = AttendanceModel.check_cooldown(employee_id, interval_minutes=1)
                    
                    if is_on_cooldown:
                        status = "COOLDOWN_ACTIVE"
                        label_text = f"{full_name} [WAIT]"
                    else:
                        # Log them into the secure database
                        AttendanceModel.log_entry(employee_id, meta['name'], clearance)
                        status = "AUTHORIZED"
                        label_text = f"{full_name} [{clearance}]"
                        
                        # Send this rich data to the React UI
                        new_events.append({
                            "name": full_name, 
                            "id": employee_id,
                            "clearance": clearance,
                            "status": status
                        })
            
            display_labels.append((label_text, status))

        # Draw the Cyber-Style bounding boxes
        for (top, right, bottom, left), (text, status) in zip(face_locations, display_labels):
            top, right, bottom, left = top * 4, right * 4, bottom * 4, left * 4

            # Cyber-aesthetic colors
            if status == "AUTHORIZED":
                color = (255, 255, 0) # Cyan (BGR in OpenCV)
            elif status == "COOLDOWN_ACTIVE":
                color = (0, 165, 255) # Warning Orange
            else:
                color = (0, 0, 255) # Alert Red

            # Geometric Corner Brackets (Cyber UI feel) instead of full boxes
            length = 20
            thickness = 2
            # Top Left
            cv2.line(frame, (left, top), (left + length, top), color, thickness)
            cv2.line(frame, (left, top), (left, top + length), color, thickness)
            # Top Right
            cv2.line(frame, (right, top), (right - length, top), color, thickness)
            cv2.line(frame, (right, top), (right, top + length), color, thickness)
            # Bottom Left
            cv2.line(frame, (left, bottom), (left + length, bottom), color, thickness)
            cv2.line(frame, (left, bottom), (left, bottom - length), color, thickness)
            # Bottom Right
            cv2.line(frame, (right, bottom), (right - length, bottom), color, thickness)
            cv2.line(frame, (right, bottom), (right, bottom - length), color, thickness)

            # Label text
            cv2.putText(frame, text, (left, bottom + 20), cv2.FONT_HERSHEY_PLAIN, 1.2, color, 2)

        return frame, new_events

    # =========================================================================
    # PHASE 2 FEATURE: THE LIVE VERIFICATION LOGIC
    # =========================================================================
    def verify_live_match(self, uploaded_encoding, live_frame, strict_tolerance=0.45):
        """
        Used exclusively during the Admin Enrollment process.
        Compares an uploaded ID photo encoding against the LIVE webcam feed.
        """
        rgb_frame = cv2.cvtColor(live_frame, cv2.COLOR_BGR2RGB)
        live_face_locations = face_recognition.face_locations(rgb_frame)
        
        if len(live_face_locations) == 0:
            return False, "Verification Failed: No face detected in live camera feed."
            
        if len(live_face_locations) > 1:
            return False, "Verification Failed: Multiple faces detected. Area must be secure."

        live_encoding = face_recognition.face_encodings(rgb_frame, live_face_locations)[0]

        # Strict comparison against the uploaded photo
        matches = face_recognition.compare_faces([uploaded_encoding], live_encoding, tolerance=strict_tolerance)
        
        if matches[0]:
            return True, live_encoding.tolist() # Return the live encoding to save to DB
        else:
            return False, "Verification Failed: Live person does not match the uploaded ID photo."