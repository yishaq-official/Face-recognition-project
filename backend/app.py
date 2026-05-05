import eventlet
# Move monkey_patch down or remove it if errors persist with the camera
eventlet.monkey_patch()

import cv2
from flask import Flask, Response
from flask_socketio import SocketIO
from flask_cors import CORS
from engine import FaceRecognitionEngine

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize Engine
engine = FaceRecognitionEngine()

# Use index 0 (verified by your test)
camera = cv2.VideoCapture(0)

def gen_frames():
    print("[*] Video stream started...")
    while True:
        success, frame = camera.read()
        if not success:
            print("[!] Failed to capture frame from camera.")
            break
        
        try:
            # 1. Run the AI Engine
            processed_frame, events = engine.process_frame(frame)

            # 2. Emit events to React
            for event in events:
                print(f"[*] Attendance Event: {event['name']}")
                socketio.emit('new_attendance', event)

            # 3. Safety check: ensure frame is not empty
            if processed_frame is None:
                processed_frame = frame

            # 4. Encode and yield
            ret, buffer = cv2.imencode('.jpg', processed_frame)
            if not ret:
                continue
                
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        
        except Exception as e:
            print(f"[ERROR in gen_frames]: {e}")
            break

@app.route('/video_feed')
def video_feed():
    # This route serves the MJPEG stream to the <img> tag
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("[*] Starting Flask-SocketIO server on http://localhost:5000")
    # Set use_reloader=False to prevent the double-start issue with webcams
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, use_reloader=False)