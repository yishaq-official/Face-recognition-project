# /backend/app.py
import eventlet
eventlet.monkey_patch()

import os
import cv2
import json
import time
import numpy as np
import face_recognition
from werkzeug.utils import secure_filename
from flask import Flask, Response, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS

from config import Config
from engine import FaceRecognitionEngine
from database.models import UserModel, AttendanceModel
from auth import auth_bp, require_auth

app = Flask(__name__)
app.config.from_object(Config)
Config.validate()
CORS(app, resources={r"/*": {"origins": Config.CORS_ORIGINS}})
socketio = SocketIO(app, cors_allowed_origins=Config.CORS_ORIGINS)
app.register_blueprint(auth_bp)

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

print("[SYSTEM] Initializing Hardware and AI Models...")
engine = FaceRecognitionEngine()

# ── Camera manager ────────────────────────────────────────────────────────────
# Wrapped in a class so the rest of the code never touches cv2 directly,
# making it easy to mock in tests and retry on failure.

class CameraManager:
    """Owns the cv2.VideoCapture instance and handles open/retry/release."""

    RETRY_INTERVAL = 5   # seconds between reconnect attempts
    PLACEHOLDER_W  = 640
    PLACEHOLDER_H  = 480

    def __init__(self, index: int = 0):
        self.index      = index
        self._cap       = None
        self._available = False
        self._last_try  = 0.0
        self._open()

    # ── Internal ──────────────────────────────────────────────────────────
    def _open(self):
        self._last_try = time.time()
        cap = cv2.VideoCapture(self.index)
        if cap.isOpened():
            self._cap       = cap
            self._available = True
            print(f"[CAMERA] Opened device {self.index}.")
        else:
            cap.release()
            self._cap       = None
            self._available = False
            print(f"[CAMERA WARNING] Device {self.index} not available. "
                  f"Will retry every {self.RETRY_INTERVAL}s.")

    def _maybe_retry(self):
        """Try to reconnect if the camera disappeared."""
        if time.time() - self._last_try >= self.RETRY_INTERVAL:
            print("[CAMERA] Attempting to reconnect...")
            self._open()

    # ── Public ────────────────────────────────────────────────────────────
    @property
    def available(self) -> bool:
        return self._available

    def read(self):
        """
        Returns (success: bool, frame: np.ndarray).
        On failure returns a styled placeholder frame so the stream
        never goes dark — the browser always gets valid MJPEG data.
        """
        if self._available and self._cap is not None:
            ok, frame = self._cap.read()
            if ok:
                return True, frame
            # Hardware dropped mid-session
            print("[CAMERA] Read failed — device may have disconnected.")
            self._cap.release()
            self._cap       = None
            self._available = False

        # Not available — try reconnect on interval then return placeholder
        self._maybe_retry()
        return False, self._placeholder_frame()

    def release(self):
        if self._cap is not None:
            self._cap.release()
            self._cap = None

    def _placeholder_frame(self) -> np.ndarray:
        """
        Generates a styled 'CAMERA OFFLINE' frame so the MJPEG stream
        keeps flowing even when the hardware is unavailable.
        """
        frame = np.zeros((self.PLACEHOLDER_H, self.PLACEHOLDER_W, 3), dtype=np.uint8)
        frame[:] = (6, 14, 8)   # SENTINEL dark-green background (BGR)

        # Grid overlay
        for x in range(0, self.PLACEHOLDER_W, 40):
            cv2.line(frame, (x, 0), (x, self.PLACEHOLDER_H), (0, 30, 10), 1)
        for y in range(0, self.PLACEHOLDER_H, 40):
            cv2.line(frame, (0, y), (self.PLACEHOLDER_W, y), (0, 30, 10), 1)

        # Corner brackets
        ln, lc = 30, (0, 80, 30)
        cv2.line(frame, (20, 20),  (20 + ln, 20),  lc, 2)
        cv2.line(frame, (20, 20),  (20, 20 + ln),  lc, 2)
        cv2.line(frame, (self.PLACEHOLDER_W - 20, 20),
                        (self.PLACEHOLDER_W - 20 - ln, 20), lc, 2)
        cv2.line(frame, (self.PLACEHOLDER_W - 20, 20),
                        (self.PLACEHOLDER_W - 20, 20 + ln), lc, 2)
        cv2.line(frame, (20, self.PLACEHOLDER_H - 20),
                        (20 + ln, self.PLACEHOLDER_H - 20), lc, 2)
        cv2.line(frame, (20, self.PLACEHOLDER_H - 20),
                        (20, self.PLACEHOLDER_H - 20 - ln), lc, 2)
        cv2.line(frame, (self.PLACEHOLDER_W - 20, self.PLACEHOLDER_H - 20),
                        (self.PLACEHOLDER_W - 20 - ln, self.PLACEHOLDER_H - 20), lc, 2)
        cv2.line(frame, (self.PLACEHOLDER_W - 20, self.PLACEHOLDER_H - 20),
                        (self.PLACEHOLDER_W - 20, self.PLACEHOLDER_H - 20 - ln), lc, 2)

        # Status text
        font = cv2.FONT_HERSHEY_PLAIN
        cv2.putText(frame, "CAMERA OFFLINE",
                    (self.PLACEHOLDER_W // 2 - 95, self.PLACEHOLDER_H // 2 - 18),
                    font, 1.6, (0, 120, 50), 2)
        cv2.putText(frame, "Attempting reconnect...",
                    (self.PLACEHOLDER_W // 2 - 110, self.PLACEHOLDER_H // 2 + 14),
                    font, 1.1, (0, 70, 30), 1)
        cv2.putText(frame, "CAM-01",
                    (self.PLACEHOLDER_W - 70, self.PLACEHOLDER_H - 14),
                    font, 0.9, (0, 50, 20), 1)

        return frame


camera = CameraManager(index=0)
latest_live_frame = None   # last *real* frame (None if camera never opened)


# ── Camera status API ────────────────────────────────────────────────────────
@app.route('/api/camera_status', methods=['GET'])
def camera_status():
    """Public endpoint — React polls this to show the offline banner."""
    return jsonify({"available": camera.available}), 200


# =========================================================================
# VIDEO STREAMING  (public — no auth required)
# =========================================================================
def gen_frames():
    global latest_live_frame
    print("[SYSTEM] Video stream active.")

    while True:
        socketio.sleep(0.01)
        success, frame = camera.read()

        if success:
            # Only update the live frame cache when we have real camera data
            latest_live_frame = frame.copy()

        try:
            if success:
                processed_frame, events = engine.process_frame(frame)
                for event in events:
                    socketio.emit('new_attendance', event)
            else:
                # Camera offline — stream the placeholder as-is, no recognition
                processed_frame = frame

            ret, buffer = cv2.imencode('.jpg', processed_frame)
            if not ret:
                continue

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n'
                   + buffer.tobytes() + b'\r\n')

        except Exception as e:
            print(f"[STREAM ERROR]: {e}")
            # Don't break — keep the stream alive and try next frame
            continue


@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


# =========================================================================
# ADMIN API — ALL ROUTES BELOW ARE PROTECTED WITH @require_auth
# =========================================================================

@app.route('/api/verify_and_enroll', methods=['POST'])
@require_auth
def verify_and_enroll():
    if 'id_photo' not in request.files:
        return jsonify({"success": False, "message": "No ID photo uploaded"}), 400

    file               = request.files['id_photo']
    personnel_data_raw = request.form.get('personnel_data')

    if file.filename == '' or not personnel_data_raw:
        return jsonify({"success": False, "message": "Missing file or personnel data"}), 400

    temp_path = None   # track temp file for guaranteed cleanup

    try:
        personnel_data = json.loads(personnel_data_raw)

        # ── Validate required fields before touching the filesystem ──────
        name = personnel_data.get('name', {})
        if not name.get('first') or not name.get('last'):
            return jsonify({"success": False, "message": "First and last name are required."}), 400
        if not personnel_data.get('employee_id'):
            return jsonify({"success": False, "message": "Employee ID is required."}), 400

        # ── Validate file type by extension ─────────────────────────────
        allowed_exts = {'.jpg', '.jpeg', '.png'}
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed_exts:
            return jsonify({"success": False,
                            "message": f"Invalid file type '{ext}'. Only JPEG and PNG are accepted."}), 400

        # ── Save temp file ───────────────────────────────────────────────
        filename  = secure_filename(f"{personnel_data['employee_id']}_{file.filename}")
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{filename}")
        file.save(temp_path)

        # ── Guard: load and validate the uploaded image ──────────────────
        try:
            uploaded_image = face_recognition.load_image_file(temp_path)
        except Exception:
            return jsonify({"success": False,
                            "message": "Uploaded file could not be read as an image. "
                                       "Ensure it is a valid, uncorrupted JPEG or PNG."}), 400

        # Guard: image must be RGB (3 channels) — not RGBA, greyscale, etc.
        if uploaded_image.ndim != 3 or uploaded_image.shape[2] != 3:
            return jsonify({"success": False,
                            "message": "Uploaded image must be a standard RGB photo (not RGBA or greyscale)."}), 400

        # ── Guard: detect faces in uploaded photo ────────────────────────
        try:
            uploaded_face_locations = face_recognition.face_locations(uploaded_image)
        except Exception:
            return jsonify({"success": False,
                            "message": "Face detection failed on the uploaded photo. "
                                       "Please try a clearer, well-lit image."}), 400

        if len(uploaded_face_locations) == 0:
            return jsonify({"success": False,
                            "message": "No face detected in the uploaded photo. "
                                       "Please use a clear, front-facing ID photo."}), 400

        if len(uploaded_face_locations) > 1:
            return jsonify({"success": False,
                            "message": f"{len(uploaded_face_locations)} faces detected in the uploaded photo. "
                                       "The ID photo must contain exactly ONE face."}), 400

        # ── Guard: generate encoding for uploaded photo ──────────────────
        try:
            encodings = face_recognition.face_encodings(uploaded_image, uploaded_face_locations)
            if not encodings:
                raise ValueError("face_encodings returned empty list")
            uploaded_encoding = encodings[0]
        except Exception:
            return jsonify({"success": False,
                            "message": "Could not generate biometric encoding from the uploaded photo. "
                                       "Please use a higher-quality, front-facing image."}), 400

        # ── Guard: camera must be live ────────────────────────────────────
        if not camera.available or latest_live_frame is None:
            return jsonify({"success": False,
                            "message": "Camera is offline. A live feed is required for enrollment verification. "
                                       "Please ensure the camera is connected and active."}), 503

        live_frame = latest_live_frame.copy()

        # ── Verify live face against uploaded photo ───────────────────────
        is_match, result_or_error = engine.verify_live_match(uploaded_encoding, live_frame)

        if not is_match:
            return jsonify({"success": False, "message": result_or_error}), 403

        # ── Success: promote temp file to permanent storage ───────────────
        perm_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        os.rename(temp_path, perm_path)
        temp_path = None   # no longer needs cleanup

        personnel_data["image_path"] = perm_path
        personnel_data["encoding"]   = result_or_error

        UserModel.create_user(personnel_data)
        engine.load_known_faces()

        print(f"[API] Enrollment complete for {personnel_data['name']['last']}.")
        return jsonify({
            "success": True,
            "message": f"Agent {personnel_data['name']['last']} successfully enrolled and verified."
        }), 201

    except Exception as e:
        if "duplicate key" in str(e).lower() or "E11000" in str(e):
            return jsonify({"success": False,
                            "message": f"Agent ID {personnel_data.get('employee_id')} already exists. "
                                       "Reload the form to generate a new ID."}), 409
        print(f"[ENROLLMENT ERROR]: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        # Guaranteed cleanup — temp file is removed on ANY failure path
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError as e:
                print(f"[CLEANUP WARNING] Could not remove temp file {temp_path}: {e}")


@app.route('/api/members', methods=['GET'])
@require_auth
def get_members():
    try:
        users_cursor = UserModel.collection.find({}, {"encoding": 0})
        users_list   = []

        for user in users_cursor:
            user["_id"] = str(user["_id"])
            if "image_path" in user:
                filename          = os.path.basename(user["image_path"])
                user["image_url"] = f"{Config.API_BASE_URL}/static/uploads/{filename}"
            users_list.append(user)

        return jsonify(users_list), 200

    except Exception as e:
        print(f"[API ERROR]: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/members/<employee_id>', methods=['DELETE'])
@require_auth
def revoke_access(employee_id):
    try:
        user = UserModel.collection.find_one({"employee_id": employee_id})
        if not user:
            return jsonify({"success": False, "message": "Agent not found."}), 404

        if "image_path" in user and os.path.exists(user["image_path"]):
            os.remove(user["image_path"])

        UserModel.collection.delete_one({"employee_id": employee_id})
        engine.load_known_faces()

        return jsonify({"success": True,
                        "message": f"Access revoked for Agent {employee_id}."}), 200

    except Exception as e:
        print(f"[API ERROR]: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================================================
# ADMIN API — SYSTEM LOGS
# =========================================================================

@app.route('/api/logs', methods=['GET'])
@require_auth
def get_logs():
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
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    socketio.run(app, debug=debug_mode, host='0.0.0.0', port=5000, use_reloader=False)
