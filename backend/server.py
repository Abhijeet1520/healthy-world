import os
import uuid
import shutil

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse, FileResponse
import uvicorn

from processor import PoseProcessor

app = FastAPI(
    title="Pose Detection & Rep Counting API",
    description="Upload a video, receive rep counts, optionally get an annotated .mp4.",
    version="1.0.0"
)

# We create one global PoseProcessor, then initialize it on startup
pose_processor = PoseProcessor()

@app.on_event("startup")
def on_startup():
    """
    Initialize the Mediapipe Pose model once at server start.
    """
    pose_processor.initialize()

@app.post("/analyze-video")
def analyze_video(
    file: UploadFile = File(...),
    exercise_name: str = Form("squat"),
    min_angle: float = Form(70.0),
    max_angle: float = Form(160.0),
    rep_threshold: float = Form(0.8),
    highlight_output: bool = Form(False)
):
    """
    POST an exercise video to /analyze-video with fields:
      - file: (required) The video file (e.g. .mp4, .mov, etc.)
      - exercise_name: (default="squat")
      - min_angle: (default=70.0)
      - max_angle: (default=160.0)
      - rep_threshold: fraction of range-of-motion needed for rep (default=0.8)
      - highlight_output: if True, returns an annotated .mp4 file; otherwise returns JSON stats.
    """
    # Validate the file extension
    allowed_ext = (".mp4", ".mov", ".avi", ".mkv")
    fname_lower = file.filename.lower()
    if not any(fname_lower.endswith(ext) for ext in allowed_ext):
        raise HTTPException(status_code=400, detail="Unsupported video format.")

    # Save the file to a temporary location
    file_id = uuid.uuid4().hex
    input_path = f"/tmp/input_{file_id}.mp4"
    with open(input_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Set the exercise parameters into the PoseProcessor
    params = {
        "exercise_name": exercise_name,
        "min_angle": min_angle,
        "max_angle": max_angle,
        "rep_threshold": rep_threshold
    }
    pose_processor.set_exercise_params(params)

    # If highlight_output is requested, define where we'll save it
    output_path = f"/tmp/output_{file_id}.mp4" if highlight_output else None

    try:
        results = pose_processor.process_video(
            video_path=input_path,
            highlight_output=highlight_output,
            output_path=output_path
        )
    except Exception as e:
        # Clean up temp input file if something fails
        if os.path.exists(input_path):
            os.remove(input_path)
        raise HTTPException(status_code=500, detail=str(e))

    # Remove the input file
    if os.path.exists(input_path):
        os.remove(input_path)

    # If we produced an annotated output, return that as a file
    if highlight_output:
        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Video processing failed.")
        return FileResponse(
            path=output_path,
            media_type="video/mp4",
            filename="annotated_output.mp4"
        )

    # Otherwise, return JSON with the stats
    return JSONResponse(content=results)

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
