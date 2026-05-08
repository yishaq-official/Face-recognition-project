# /backend/app.py
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
from database.models import UserModel, AttendanceModel
from auth import auth_bp, require_auth          # ← NEW

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Register the auth blueprint
app.register_blueprint(auth_bp)                 # ← NEW

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

print("[SYSTEM] Initializing Hardware and AI Models...")
engine = FaceRecognitionEngine()
camera = cv2.VideoCapture(0)

latest_live_frame = None

# =========================================================================
# VIDEO STREAMING  (public — no auth required)
# =========================================================================
def gen_frames():
    global latest_live_frame
    print("[SYSTEM] Video stream active.")

    while True:
        socketio.sleep(0.01)
        success, frame = camera.read()
        if not success:
            continue

        latest_live_frame = frame.copy()

        try:
            processed_frame, events = engine.process_frame(frame)

            for event in events:
                socketio.emit('new_attendance', event)

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
# ADMIN API — ALL ROUTES BELOW ARE PROTECTED WITH @require_auth
# =========================================================================

@app.route('/api/verify_and_enroll', methods=['POST'])
@require_auth                                   # ← PROTECTED
def verify_and_enroll():
    if 'id_photo' not in request.files:
        return jsonify({"success": False, "message": "No ID photo uploaded"}), 400

    file               = request.files['id_photo']
    personnel_data_raw = request.form.get('personnel_data')

    if file.filename == '' or not personnel_data_raw:
        return jsonify({"success": False, "message": "Missing file or personnel data"}), 400

    try:
        personnel_data = json.loads(personnel_data_raw)

        filename  = secure_filename(f"{personnel_data['employee_id']}_{file.filename}")
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{filename}")
        file.save(temp_path)

        uploaded_image          = face_recognition.load_image_file(temp_path)
        uploaded_face_locations = face_recognition.face_locations(uploaded_image)

        if len(uploaded_face_locations) != 1:
            os.remove(temp_path)
            return jsonify({"success": False, "message": "Uploaded ID photo must contain exactly ONE face."}), 400

        uploaded_encoding = face_recognition.face_encodings(uploaded_image, uploaded_face_locations)[0]

        global latest_live_frame
        if latest_live_frame is None:
            os.remove(temp_path)
            return jsonify({"success": False, "message": "Live feed not initialized. Ensure the camera is active."}), 500

        live_frame = latest_live_frame.copy()

        is_match, result_or_error = engine.verify_live_match(uploaded_encoding, live_frame)

        if not is_match:
            os.remove(temp_path)
            return jsonify({"success": False, "message": result_or_error}), 403

        perm_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        os.rename(temp_path, perm_path)

        personnel_data["image_path"] = perm_path
        personnel_data["encoding"]   = result_or_error

        UserModel.create_user(personnel_data)

        print("[API] User saved. Reloading AI matrices...")
        engine.load_known_faces()

        return jsonify({
            "success": True,
            "message": f"Agent {personnel_data['name']['last']} successfully enrolled and verified."
        }), 201

    except Exception as e:
        print(f"[ENROLLMENT ERROR]: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/members', methods=['GET'])
@require_auth                                   # ← PROTECTED
def get_members():
    try:
        users_cursor = UserModel.collection.find({}, {"encoding": 0})
        users_list   = []

        for user in users_cursor:
            user["_id"] = str(user["_id"])
            if "image_path" in user:
                filename          = os.path.basename(user["image_path"])
                user["image_url"] = f"http://localhost:5000/static/uploads/{filename}"
            users_list.append(user)

        return jsonify(users_list), 200

    except Exception as e:
        print(f"[API ERROR]: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/members/<employee_id>', methods=['DELETE'])
@require_auth                                   # ← PROTECTED
def revoke_access(employee_id):
    try:
        user = UserModel.collection.find_one({"employee_id": employee_id})
        if not user:
            return jsonify({"success": False, "message": "Agent not found."}), 404

        if "image_path" in user and os.path.exists(user["image_path"]):
            os.remove(user["image_path"])

        UserModel.collection.delete_one({"employee_id": employee_id})
        engine.load_known_faces()

        return jsonify({"success": True, "message": f"Access revoked for Agent {employee_id}."}), 200

    except Exception as e:
        print(f"[API ERROR]: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================================================
# ADMIN API — SYSTEM LOGS
# =========================================================================

@app.route('/api/logs', methods=['GET'])
@require_auth
def get_logs():
    """Returns recent attendance logs sorted newest-first. ?limit=100 (max 500)"""
    try:
        limit = min(int(request.args.get('limit', 100)), 500)
        logs  = AttendanceModel.get_recent_logs(limit=limit)
        for log in logs:
            if 'timestamp' in log and hasattr(log['timestamp'], 'isoformat'):
                log['timestamp'] = log['timestamp'].isoformat() + 'Z'
        return jsonify(logs), 200
    except Exception as e:
        print(f"[API ERROR]: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

# =========================================================================
# SERVER
# =========================================================================
if __name__ == '__main__':
    print("[SYSTEM] Boot Sequence Complete. Awaiting Connections.")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, use_reloader=False)
