# Healthy-World Backend

This folder contains the backend code for the Healthy-World project, handling pose detection, exercise tracking, and rep counting via a simple API.

## Overview

1. **processor.py**
   - Contains the `PoseProcessor` class, which initializes pose detection and processes video frames to compute exercise repetitions.
   - Supports specifying different exercise parameters (e.g. which angles or joints to watch).

2. **server.py**
   - A [FastAPI](https://fastapi.tiangolo.com/) server exposing a single endpoint (`/analyze-video`) that:
     - Accepts a video file (`.mp4`, `.mov`, `.avi`, `.mkv`, etc.) along with exercise details (like `min_angle`, `max_angle`).
     - Uses `PoseProcessor` to process the video.
     - Returns a JSON response containing the `exercise` name and `reps` counted.

3. **\_\_init\_\_.py**
   - Marks this folder as a Python package.

4. **Existing Files in the Project**
   - **AiTrainerProject.py**
     - Possibly a script or an older version of your project that handles more advanced or integrated logic for pose estimation.
   - **PoseEstimationMin.py** and **PoseEstimationModule.py**
     - Minimal or modular code for pose estimation with methods that might feed into `PoseProcessor`.
   - **pose_api.py**
     - Another script that may already provide partial web API functionality or endpoints.
   - **Front-end** (e.g., `exercise-detection.ts`, `pose-detection.ts`, Next.js files like `page.tsx`)
     - Shows how the front-end UI interacts with the backend.
     - Allows users to capture or upload videos, then send them to the server.

## Getting Started

1. **Installation**
   - Python 3.10+ recommended.
   - From within the `healthy-world/backend` directory (or the project root):
     ```bash
     pip install fastapi uvicorn opencv-python
     ```
   - Include any additional libraries you need (e.g., numpy, mediapipe, etc.).

2. **Run the Server**
   ```bash
   uvicorn server:app --reload --host 0.0.0.0 --port 8000
