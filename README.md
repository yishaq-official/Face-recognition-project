# FaceGuard

A full-stack government and defense biometric access-control application for the SENTINEL platform. It uses a Python/Flask backend (OpenCV, dlib, MongoDB) and a Vite + React frontend. Supports enrollment, live recognition, member management and history logs. Uses Flask-SocketIO for real-time updates and stores photos in backend/static/uploads.

## Repository structure

- backend/
  - app.py — server entry and route definitions
  - engine.py — face detection/recognition logic
  - database/ — MongoDB connection and models
  - static/uploads/ — stored photos
  - requirements.txt — Python dependencies
- frontend/
  - package.json — Vite + React app (dev, build, preview)
  - src/ — React components, pages (PublicView, Enrollment, MemberList, HistoryLogs)

## Requirements

- Backend: Python 3.8+, dlib, OpenCV, Flask, Flask-SocketIO, pymongo
  (see backend/requirements.txt)
- Frontend: Node.js (16+ recommended), npm

## Environment variables

- MONGO_URI — MongoDB connection string (required)
- DB_NAME — MongoDB database name, defaults to `sentinel_db`
- FLASK_ENV — (optional) e.g., development
- FLASK_APP — (optional) e.g., app.py
- JWT_SECRET_KEY — required outside local development
- ADMIN_USERNAME — defaults to `sentinel_admin`
- ADMIN_PASSWORD_HASH — bcrypt hash for the admin password. Local development defaults to password `Sentinel@123`; replace this before deployment.
- CORS_ORIGINS — comma-separated frontend origins, defaults to `http://localhost:5173`
- API_BASE_URL — backend public URL, defaults to `http://localhost:5000`

## Setup & Run

Backend (development):

1. python3 -m venv venv
2. source venv/bin/activate
3. pip install -r backend/requirements.txt
4. export MONGO_URI="<your-mongo-uri>"
5. export JWT_SECRET_KEY="<your-local-dev-secret>"
6. export FLASK_APP=backend/app.py
7. export FLASK_ENV=development
8. flask run --host=0.0.0.0 --port=5000

Default local admin login:

- Username: `sentinel_admin`
- Password: `Sentinel@123`

To change the admin password, generate a bcrypt hash and export it before starting the backend:

```bash
python -c "import bcrypt; print(bcrypt.hashpw(b'YourPassword', bcrypt.gensalt()).decode())"
export ADMIN_PASSWORD_HASH="<generated-hash>"
```

(If backend/app.py contains an if __name__ == '__main__' runner, you can also run: python backend/app.py)

Frontend (development):

1. cd frontend
2. npm install
3. npm run dev
4. Open the reported dev URL (usually http://localhost:5173)

Building for production (frontend):

1. cd frontend
2. npm run build
3. Serve contents of frontend/dist behind a static host or reverse proxy

## API & Real-time

- The backend exposes REST endpoints for enrollment, members, and history (see backend/app.py for exact routes).
- Real-time recognition updates are pushed via Socket.IO (backend uses flask-socketio; frontend uses socket.io-client).

Suggested endpoints (confirm in code):
- POST /api/enroll — submit a new member/photo
- POST /api/recognize — submit image/frame for recognition
- GET /api/members — list enrolled members
- GET /api/history — recognition event logs

## Development notes

- Camera and face capture helpers: backend/cam_test.py and enroll.py
- Database: backend/database contains connection code and models (MongoDB client singleton pattern)
- Images are saved under backend/static/uploads; ensure this folder is writable by the server user
- dlib and OpenCV often require platform-specific build/installation — use prebuilt wheels when possible

## Troubleshooting

- If dlib or opencv fails to install, use platform wheels or system packages. On Linux, installing build-essential and cmake helps.
- Ensure MongoDB is reachable from MONGO_URI and credentials (if any) are correct.
- If Socket.IO fails to connect, check CORS and matching client/server Socket.IO versions.

## Contributing

- Open an issue describing the change
- Create a branch, implement tests if applicable, and open a pull request

## License

Specify project license here.

---

(For exact route names, config keys, and runtime details, inspect backend/app.py and backend/config.py.)
