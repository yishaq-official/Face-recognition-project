import cv2
import face_recognition
import numpy as np
from database import AttendanceDB

class FaceRecognitionEngine:
    def __init__(self):
        self.db = AttendanceDB()
        self.known_face_encodings = []
        self.known_face_names = []
        self.known_face_ids = []
        self.load_known_faces()

    def load_known_faces(self):
        """Loads all encodings from MongoDB into memory for fast comparison."""
        print("[*] Loading known faces from database...")
        users = self.db.get_all_encodings()
        for user in users:
            self.known_face_encodings.append(np.array(user["encoding"]))
            self.known_face_names.append(user["name"])
            self.known_face_ids.append(user["_id"])
        print(f"[+] Loaded {len(self.known_face_names)} faces into memory.")

    def process_frame(self, frame):
        """
        Takes a raw video frame, detects faces, checks the database, 
        and applies the 1-minute cooldown logic.
        Returns: The drawn frame and any new attendance events.
        """
        # Resize frame to 1/4 size for faster face recognition processing
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        
        # Convert BGR (OpenCV) to RGB (face_recognition)
        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        
        # Find all faces and encodings in the current frame
        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

        face_names = []
        new_events = [] # To send to the frontend via Socket.IO later

        for face_encoding in face_encodings:
            # See if the face is a match for the known face(s)
            matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding, tolerance=0.6)
            name = "Unknown"
            status = ""

            # Use the known face with the smallest distance to the new face
            face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)
                
                if matches[best_match_index]:
                    name = self.known_face_names[best_match_index]
                    user_id = self.known_face_ids[best_match_index]
                    
                    # --- The 1-Minute Cooldown Logic ---
                    is_on_cooldown = self.db.check_cooldown(user_id, interval_minutes=1)
                    
                    if is_on_cooldown:
                        status = "Already Marked"
                    else:
                        # Log them in the DB!
                        self.db.log_attendance(user_id, name)
                        status = "Attendance Marked!"
                        new_events.append({"name": name, "status": "Success"})
            
            # Combine name and status for the bounding box label
            display_label = f"{name} ({status})" if status else name
            face_names.append(display_label)

        # Draw the boxes and names back onto the ORIGINAL size frame
        for (top, right, bottom, left), name in zip(face_locations, face_names):
            # Scale back up since we scaled down by 1/4
            top, right, bottom, left = top * 4, right * 4, bottom * 4, left * 4

            # Change color based on status
            color = (0, 255, 0) # Green by default
            if "Already Marked" in name:
                color = (0, 165, 255) # Orange/Yellow for cooldown

            # Draw Box
            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
            
            # Draw Label
            cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
            cv2.putText(frame, name, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)

        return frame, new_events