#app.py

import eventlet
eventlet.monkey_patch()

import os
import cv2
import json
import numpy as np
import face_recognition
from werkzeug.utils import secure_filename
from flask import Flask, Response, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS

from config import Config
from engine import FaceRecognitionEngine
from database.models import UserModel

app = Flask(__name__)
app.config.from_object(Config)
CORS(app) # Allow React frontend to communicate with Flask
socketio = SocketIO(app, cors_allowed_origins="*")

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize the AI Engine and Camera
print("[SYSTEM] Initializing Hardware and AI Models...")
engine = FaceRecognitionEngine()
camera = cv2.VideoCapture(0)

# Global variable to store the latest frame to prevent hardware locks
latest_live_frame = None

# =========================================================================
# VIDEO STREAMING (Public Interface)
# =========================================================================
def gen_frames():
    """Generates the live video feed and pushes attendance events to React."""
    global latest_live_frame 
    print("[SYSTEM] Video stream active.")
    
    while True:
        # -------------------------------------------------------------
        # THE CRITICAL FIX: Yield control so the server can breathe!
        # This allows WebSockets and Enrollment HTTP requests to process.
        # -------------------------------------------------------------
        socketio.sleep(0.01) 
        
        success, frame = camera.read()
        if not success:
            continue
            
        # Save a copy of the frame for the API to use instantly
        latest_live_frame = frame.copy()
        
        try:
            # Process frame using the enterprise engine
            processed_frame, events = engine.process_frame(frame)

            # Push events to React via WebSockets
            for event in events:
                socketio.emit('new_attendance', event)

            # Encode for browser display
            ret, buffer = cv2.imencode('.jpg', processed_frame)
            if not ret:
                continue
                
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                   
        except Exception as e:
            print(f"[STREAM ERROR]: {e}")
            break
@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# =========================================================================
# ADMIN API: THE STRICT VERIFICATION ENROLLMENT
# =========================================================================
@app.route('/api/verify_and_enroll', methods=['POST'])
def verify_and_enroll():
    """
    1. Receives an ID photo and personnel data from React Admin.
    2. Takes a LIVE photo from memory (not the camera directly).
    3. Compares the two.
    4. If they match, registers the user in MongoDB.
    """
    if 'id_photo' not in request.files:
        return jsonify({"success": False, "message": "No ID photo uploaded"}), 400
        
    file = request.files['id_photo']
    personnel_data_raw = request.form.get('personnel_data')

    if file.filename == '' or not personnel_data_raw:
        return jsonify({"success": False, "message": "Missing file or personnel data"}), 400

    try:
        # 1. Parse the incoming JSON data from the React form
        personnel_data = json.loads(personnel_data_raw)
        
        # 2. Save the uploaded ID photo temporarily
        filename = secure_filename(f"{personnel_data['employee_id']}_{file.filename}")
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{filename}")
        file.save(temp_path)

        # 3. Generate encoding for the UPLOADED photo
        uploaded_image = face_recognition.load_image_file(temp_path)
        uploaded_face_locations = face_recognition.face_locations(uploaded_image)
        
        if len(uploaded_face_locations) != 1:
            os.remove(temp_path)
            return jsonify({"success": False, "message": "Uploaded ID photo must contain exactly ONE face."}), 400
            
        uploaded_encoding = face_recognition.face_encodings(uploaded_image, uploaded_face_locations)[0]

        # 4. Grab the LIVE frame from the video stream's memory (Fix for the deadlock)
        global latest_live_frame
        if latest_live_frame is None:
            os.remove(temp_path)
            return jsonify({"success": False, "message": "Live feed not initialized. Please ensure the camera is active."}), 500
            
        live_frame = latest_live_frame.copy()

        # 5. THE PENTAGON PROTOCOL: Verify Live Frame vs Uploaded ID
        is_match, result_or_error = engine.verify_live_match(uploaded_encoding, live_frame)

        if not is_match:
            os.remove(temp_path) # Destroy temp file on failure
            return jsonify({"success": False, "message": result_or_error}), 403

        # 6. Success! Move photo to permanent storage
        perm_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        os.rename(temp_path, perm_path)

        # 7. Save to MongoDB
        personnel_data["image_path"] = perm_path
        personnel_data["encoding"] = result_or_error # Contains the live encoding list
        
        UserModel.create_user(personnel_data)

        # 8. Tell the AI Engine to reload its memory to include the new person immediately
        print("[API] User saved to DB. Reloading AI matrices...")
        engine.load_known_faces()

        print("[API] Enrollment complete. Sending 201 Success back to React.")
        return jsonify({
            "success": True, 
            "message": f"Agent {personnel_data['name']['last']} successfully enrolled and verified."
        }), 201

    except Exception as e:
        print(f"[ENROLLMENT ERROR]: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
# =========================================================================
# ADMIN API: PERSONNEL MANAGEMENT (CRUD)
# =========================================================================

@app.route('/api/members', methods=['GET'])
def get_members():
    """Fetches all classified personnel records from MongoDB."""
    try:
        # Fetch all users, excluding the raw encoding array to keep response light
        users_cursor = UserModel.collection.find({}, {"encoding": 0})
        users_list = []
        
        for user in users_cursor:
            # Convert ObjectId to string for JSON serialization
            user["_id"] = str(user["_id"])
            
            # Formulate the correct static URL for the image
            if "image_path" in user:
                # Assuming image_path is like 'static/uploads/filename.jpg'
                filename = os.path.basename(user["image_path"])
                user["image_url"] = f"http://localhost:5000/static/uploads/{filename}"
                
            users_list.append(user)
            
        return jsonify(users_list), 200
    except Exception as e:
        print(f"[API ERROR]: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/members/<employee_id>', methods=['DELETE'])
def revoke_access(employee_id):
    """Permanently deletes an agent record and their ID photo."""
    try:
        # 1. Find user to get image path before deletion
        user = UserModel.collection.find_one({"employee_id": employee_id})
        if not user:
            return jsonify({"success": False, "message": "Agent not found."}), 404

        # 2. Delete the physical image file
        if "image_path" in user and os.path.exists(user["image_path"]):
            os.remove(user["image_path"])
            print(f"[API] Deleted photo: {user['image_path']}")

        # 3. Delete record from MongoDB
        UserModel.collection.delete_one({"employee_id": employee_id})
        print(f"[API] Revoked access for Agent ID: {employee_id}")

        # 4. CRITICAL: Hot-reload AI Engine memory so they are no longer recognized
        engine.load_known_faces()

        return jsonify({"success": True, "message": f"Access revoked for Agent {employee_id}. matrices purged."}), 200
        
    except Exception as e:
        print(f"[API ERROR]: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
# =========================================================================
# SERVER EXECUTION
# =========================================================================
if __name__ == '__main__':
    print("[SYSTEM] Boot Sequence Complete. Awaiting Connections.")
    # use_reloader=False prevents the camera from crashing on Linux during dev
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, use_reloader=False)