import cv2

cap = cv2.VideoCapture(0) # Try 0 first, then 1, then 2
if not cap.isOpened():
    print("❌ ERROR: Could not open webcam.")
else:
    print("✅ SUCCESS: Camera is detected!")
    ret, frame = cap.read()
    if ret:
        print(f"Frame captured! Size: {frame.shape}")
    cap.release()