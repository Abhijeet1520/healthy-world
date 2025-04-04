import os
import uuid
import shutil

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from processor import PoseProcessor

app = FastAPI(title="Pose Detection API", version="1.0.0")

# Create a global PoseProcessor instance
pose_processor = PoseProcessor()

@app.on_event("startup")
def on_startup():
    # Initialize the processor once
    pose_processor.initialize()

@app.post("/analyze-video")
def analyze_video(
    exercise_name: str = Form(...),
    min_angle: float = Form(...),
    max_angle: float = Form(...),
    file: UploadFile = File(...),
):
    """
    Upload a video for pose detection.
    Pass exercise_name, min_angle, and max_angle as form data.

    Returns JSON with the exercise name and reps counted.
    """
    if not file.filename.endswith((".mp4", ".mov", ".avi", ".mkv")):
        raise HTTPException(status_code=400, detail="Invalid file type.")

    # Save the uploaded file to a temporary path
    file_id = str(uuid.uuid4())
    temp_video_path = f"/tmp/{file_id}_{file.filename}"
    with open(temp_video_path, "wb") as out_file:
        shutil.copyfileobj(file.file, out_file)

    # Set the exercise parameters
    pose_processor.set_exercise_params({
        "exercise_name": exercise_name,
        "min_angle": min_angle,
        "max_angle": max_angle,
    })

    try:
        # Process the video
        results = pose_processor.process_video(temp_video_path)
    finally:
        # Remove the temp file after processing
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)

    return JSONResponse(content=results)
