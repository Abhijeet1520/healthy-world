# server.py

import os
import uuid
import shutil

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse, FileResponse
import uvicorn

from processor import PoseProcessor

app = FastAPI(
    title="Exercise Pose Detection & Rep Counting API",
    description="Upload a video, choose an exercise (bicep-curl, squat, pushup), receive rep counts. Optionally get an annotated MP4.",
    version="1.0.0"
)

# Create a single PoseProcessor instance, then initialize at startup
pose_processor = PoseProcessor()

@app.on_event("startup")
def on_startup():
    """
    Initialize the MediaPipe Pose model once at server start.
    """
    pose_processor.initialize()

@app.post("/analyze-video")
def analyze_video(
    file: UploadFile = File(...),
    exercise_id: str = Form("bicep-curl"),
    highlight_output: bool = Form(False)
):
    """
    POST a video to /analyze-video with form fields:
      - file: the .mp4 / .mov, etc. (required)
      - exercise_id: one of ["bicep-curl", "squat", "pushup"] (default = "bicep-curl")
      - highlight_output: boolean, if True => returns an annotated .mp4 file
        rather than JSON
    Returns either JSON stats or the annotated .mp4 file.
    """
    # Validate file extension
    allowed_exts = (".mp4", ".mov", ".avi", ".mkv")
    fname_lower = file.filename.lower()
    if not any(fname_lower.endswith(ext) for ext in allowed_exts):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Must be one of {allowed_exts}."
        )

    # Save the file to a temporary path
    file_id = uuid.uuid4().hex
    tmp_input_path = f"/tmp/input_{file_id}.mp4"
    with open(tmp_input_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Set the chosen exercise
    try:
        pose_processor.set_exercise(exercise_id)
    except ValueError as e:
        # If the user provided an invalid exercise_id, remove file and throw 400
        os.remove(tmp_input_path)
        raise HTTPException(status_code=400, detail=str(e))

    # If highlight is requested, define an output path
    tmp_output_path = None
    if highlight_output:
        tmp_output_path = f"/tmp/output_{file_id}.mp4"

    try:
        results = pose_processor.process_video(
            video_path=tmp_input_path,
            highlight_output=highlight_output,
            output_path=tmp_output_path
        )
    except Exception as e:
        # On any processing error, clean up input file
        if os.path.exists(tmp_input_path):
            os.remove(tmp_input_path)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Remove the input file
        if os.path.exists(tmp_input_path):
            os.remove(tmp_input_path)

    if highlight_output:
        # If we have an annotated video, return it as a file
        if not os.path.exists(tmp_output_path):
            raise HTTPException(status_code=500, detail="Annotation output not found.")
        # Return the annotated MP4
        return FileResponse(
            path=tmp_output_path,
            media_type="video/mp4",
            filename="annotated_output.mp4"
        )
    else:
        # Return JSON with the stats
        return JSONResponse(content=results)

if __name__ == "__main__":
    # For local testing:
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
