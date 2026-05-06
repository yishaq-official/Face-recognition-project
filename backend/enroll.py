#enroll.py
import os
import face_recognition
from database import AttendanceDB

def run_enrollment():
    db = AttendanceDB()
    face_folder = "faces"
    
    if not os.path.exists(face_folder):
        os.makedirs(face_folder)
        print(f"Created '{face_folder}' folder. Add images and run again.")
        return

    for filename in os.listdir(face_folder):
        if filename.lower().endswith((".png", ".jpg", ".jpeg")):
            name = os.path.splitext(filename)[0].replace("_", " ").title()
            
            # Check if already in DB
            if db.users.find_one({"name": name}):
                print(f"[-] {name} is already enrolled. Skipping.")
                continue

            # Process Image
            path = os.path.join(face_folder, filename)
            image = face_recognition.load_image_file(path)
            encodings = face_recognition.face_encodings(image)

            if encodings:
                user_data = {
                    "name": name,
                    "encoding": encodings[0].tolist(), # Convert numpy array to list
                    "image_path": f"static/uploads/{filename}",
                    "metadata": {"department": "Engineering", "role": "User"}
                }
                db.users.insert_one(user_data)
                print(f"[+] Successfully enrolled: {name}")
                
                # Optional: Move image to frontend static folder for the dashboard
                # os.rename(path, f"../frontend/static/uploads/{filename}")
            else:
                print(f"[!] No face detected in {filename}")

if __name__ == "__main__":
    run_enrollment()