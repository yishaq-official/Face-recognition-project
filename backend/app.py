import eventlet
eventlet.monkey_patch()

from flask import Flask, Response
from flask_socketio import SocketIO
from flask_cors import CORS  # Add this
from engine import FaceRecognitionEngine
import cv2

app = Flask(__name__)
# Enable CORS for the React development server
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

engine = FaceRecognitionEngine()
camera = cv2.VideoCapture(0)

def gen_frames():
    """Video streaming generator function."""
    while True:
        success, frame = camera.read()  # read the camera frame
        if not success:
            break
        else:
            # 1. Process frame through the AI Engine
            # This is where the face detection and 1-minute logic happen
            processed_frame, events = engine.process_frame(frame)

            # 2. If the engine detected a new attendance event, push it to React via Socket.io
            for event in events:
                print(f"[*] Pushing event to UI: {event['name']}")
                socketio.emit('new_attendance', event)

            # 3. Encode the frame as JPEG for the browser to display
            ret, buffer = cv2.imencode('.jpg', processed_frame)
            frame_bytes = buffer.tobytes()

            # Yield the output frame in byte format for the multipart response
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
# ... (keep your gen_frames logic the same) ...

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)