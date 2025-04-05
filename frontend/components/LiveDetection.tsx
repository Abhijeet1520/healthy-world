"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Play, Square } from "lucide-react";
import { PoseLandmarker, DrawingUtils, FilesetResolver } from "@mediapipe/tasks-vision";

// -----------------------------------------------------------------------
// Type Definitions and Exercises
// -----------------------------------------------------------------------
export type Exercise = {
  id: string;
  name: string;
  description: string;
  targetAngles: {
    start: number;
    end: number;
  };
  joints: [number, number, number];
};

export const EXERCISES: Exercise[] = [
  {
    id: "bicep-curl",
    name: "Bicep Curl",
    description: "Curl your arm upward, keeping your upper arm still.",
    targetAngles: {
      start: 160,
      end: 60,
    },
    joints: [11, 13, 15],
  },
  {
    id: "squat",
    name: "Squat",
    description: "Lower your body by bending your knees, keeping your back straight.",
    targetAngles: {
      start: 170,
      end: 90,
    },
    joints: [24, 26, 28],
  },
  {
    id: "pushup",
    name: "Push-up",
    description: "Lower your body by bending your elbows, keeping your body straight.",
    targetAngles: {
      start: 160,
      end: 90,
    },
    joints: [12, 14, 16],
  },
];

// -----------------------------------------------------------------------
// Exercise Detection Service
// -----------------------------------------------------------------------
export class ExerciseDetectionService {
  private poseLandmarker: PoseLandmarker | null = null;
  private drawingUtils: DrawingUtils | null = null;
  private lastVideoTime = -1;
  private repCount = 0;
  private isGoingUp = false;
  private currentExercise: Exercise | null = null;

  constructor() {
    this.repCount = 0;
  }

  setExercise(exercise: Exercise) {
    this.currentExercise = exercise;
    this.repCount = 0;
    this.isGoingUp = false;
  }

  getRepCount() {
    return this.repCount;
  }

  async initialize() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
    });
  }

  private calculateAngle(landmarks: any[], p1: number, p2: number, p3: number): number {
    const [x1, y1] = [landmarks[p1].x, landmarks[p1].y];
    const [x2, y2] = [landmarks[p2].x, landmarks[p2].y];
    const [x3, y3] = [landmarks[p3].x, landmarks[p3].y];
    const angle = Math.abs(
      Math.atan2(y3 - y2, x3 - x2) - Math.atan2(y1 - y2, x1 - x2)
    ) * (180 / Math.PI);
    return angle;
  }

  private updateRepCount(angle: number) {
    if (!this.currentExercise) return;
    const { start, end } = this.currentExercise.targetAngles;

    // Going "down"
    if (!this.isGoingUp && angle <= end) {
      this.isGoingUp = true;
    }
    // Coming "up"
    else if (this.isGoingUp && angle >= start) {
      this.isGoingUp = false;
      this.repCount += 1;
    }
  }

  async processVideoFrame(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    timestamp: number,
    onRepUpdate: (count: number) => void
  ) {
    if (!this.poseLandmarker || !this.currentExercise) return;
    const canvasCtx = canvasElement.getContext("2d");
    if (!canvasCtx) return;

    if (!this.drawingUtils) {
      this.drawingUtils = new DrawingUtils(canvasCtx);
    }

    // Only do detection if the frame changed
    if (this.lastVideoTime !== videoElement.currentTime) {
      this.lastVideoTime = videoElement.currentTime;
      const results = this.poseLandmarker.detectForVideo(videoElement, timestamp);

      // Clear and draw the base image
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const [p1, p2, p3] = this.currentExercise.joints;
        const angle = this.calculateAngle(landmarks, p1, p2, p3);

        // Draw skeleton
        this.drawingUtils.drawLandmarks(landmarks, {
          radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1),
        });
        this.drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS);

        // Reps logic
        this.updateRepCount(angle);
        onRepUpdate(this.repCount);

        // Visual indicators (angles/joints)
        const color = this.isGoingUp ? "#00ff00" : "#ff0000";
        canvasCtx.beginPath();
        canvasCtx.arc(landmarks[p1].x * canvasElement.width, landmarks[p1].y * canvasElement.height, 8, 0, 2 * Math.PI);
        canvasCtx.arc(landmarks[p2].x * canvasElement.width, landmarks[p2].y * canvasElement.height, 8, 0, 2 * Math.PI);
        canvasCtx.arc(landmarks[p3].x * canvasElement.width, landmarks[p3].y * canvasElement.height, 8, 0, 2 * Math.PI);
        canvasCtx.fillStyle = color;
        canvasCtx.fill();

        // Show angle text
        canvasCtx.font = "24px Arial";
        canvasCtx.fillStyle = "white";
        canvasCtx.fillText(`Angle: ${Math.round(angle)}°`,
          landmarks[p2].x * canvasElement.width,
          landmarks[p2].y * canvasElement.height - 20
        );
      }
    }
  }
}

/** -----------------------------------------------------------------------
 * 3) LiveDetection: The main React component using react-webcam
 * ----------------------------------------------------------------------- */
interface LiveDetectionProps {
  exerciseSubType: string; // e.g. "bicep-curl" or "squat" or "pushup"
}

export default function LiveDetection({ exerciseSubType }: LiveDetectionProps) {
  // Display modes: "live" or "upload"
  const [mode, setMode] = useState<"live" | "upload">("live");

  // Are we actively detecting skeleton in the live feed?
  const [isDetecting, setIsDetecting] = useState(false);

  // Are we currently recording from the live feed?
  const [recording, setRecording] = useState(false);

  // Camera permission status
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);

  // Real-time rep count
  const [repCount, setRepCount] = useState(0);

  // For building a recorded video
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  // For user-uploaded videos
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);

  // For analyzing a recorded or uploaded video offline
  const [analyzedVideoUrl, setAnalyzedVideoUrl] = useState<string | null>(null);
  const [analyzedRepCount, setAnalyzedRepCount] = useState<number>(0);

  // Mediapipe detection instance
  const detectionRef = useRef<ExerciseDetectionService | null>(null);

  // Refs to react-webcam, overlay canvas, and hidden “processed” canvas
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number>();
  const processedAnimationFrameRef = useRef<number>();

  // Find the matching exercise from EXERCISES
  const exercise = EXERCISES.find((ex) => ex.id === exerciseSubType) || EXERCISES[0];

  // Called by react-webcam when it first gets user media
  const handleUserMedia = useCallback((stream: MediaStream) => {
    setHasPermissions(true);
  }, []);

  /** Initialize the detection service on mount / whenever we change “mode” */
  useEffect(() => {
    detectionRef.current = new ExerciseDetectionService();
  }, [mode]);

  /** If we're in "live" mode and detection is on, run the detection loop each frame. */
  useEffect(() => {
    if (mode === "live" && isDetecting) {
      const videoEl = webcamRef.current?.video;
      if (!videoEl || !canvasRef.current || !detectionRef.current) return;

      // Initialize detection once
      detectionRef.current.initialize().catch((err) => {
        console.error("Error init detection:", err);
        setIsDetecting(false);
      });
      detectionRef.current.setExercise(exercise);

      const detectFrame = () => {
        if (!isDetecting) return; // stop if user toggled off

        detectionRef.current?.processVideoFrame(
          videoEl,
          canvasRef.current!,
          performance.now(),
          (count) => setRepCount(count)
        );

        animationFrameRef.current = requestAnimationFrame(detectFrame);
      };
      detectFrame();
    }
    // Cleanup if user stops detection
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isDetecting, exercise, mode]);

  /** Called if user picks a file in "upload" mode. */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedVideo(file);
      setRecordedVideoUrl(URL.createObjectURL(file));
    }
  }

  /** Switch between live vs. upload. Reset state. */
  function switchMode(newMode: "live" | "upload") {
    setMode(newMode);
    setIsDetecting(false);
    setRecording(false);
    setRepCount(0);
    setRecordedChunks([]);
    setRecordedVideoUrl(null);
    setAnalyzedVideoUrl(null);
  }

  /** Start the detection + recording in live mode */
  function handleStartRecording() {
    setIsDetecting(true);
    setRecording(true);
    setRepCount(0);
    setRecordedChunks([]);
    setRecordedVideoUrl(null);
    setAnalyzedVideoUrl(null);
  }

  /** Stop detection + finalize the recording. */
  function handleStopRecording() {
    setIsDetecting(false);
    setRecording(false);

    // Stop the media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    // Build a preview URL
    setTimeout(() => {
      if (recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        setRecordedVideoUrl(URL.createObjectURL(blob));
      }
    }, 400);
  }

  /** Once we have a recorded or uploaded video, we can re-run detection offline. */
  function processRecordedVideo() {
    if (!recordedVideoUrl || !processedCanvasRef.current) return;

    setAnalyzedRepCount(0);

    const tempVideo = document.createElement("video");
    tempVideo.src = recordedVideoUrl;
    tempVideo.crossOrigin = "anonymous";
    tempVideo.muted = true;
    tempVideo.playsInline = true;
    tempVideo.play();

    let analysisRepCount = 0;
    detectionRef.current?.setExercise(exercise);

    const offlineCanvas = processedCanvasRef.current;
    const canvasCtx = offlineCanvas.getContext("2d");
    if (!canvasCtx) return;

    const offlineDetect = () => {
      if (tempVideo.paused || tempVideo.ended) {
        cancelAnimationFrame(processedAnimationFrameRef.current!);
        setAnalyzedRepCount(analysisRepCount);

        // Optionally create a new processed video from that canvas:
        offlineCanvas.toBlob((blob) => {
          if (blob) {
            setAnalyzedVideoUrl(URL.createObjectURL(blob));
          }
        }, "video/webm");
        return;
      }
      detectionRef.current?.processVideoFrame(tempVideo, offlineCanvas, performance.now(), (count) => {
        analysisRepCount = count;
      });
      processedAnimationFrameRef.current = requestAnimationFrame(offlineDetect);
    };
    requestAnimationFrame(offlineDetect);
  }

  /** In real usage, you might submit the final chunk blob to a backend. */
  async function handleLiveSubmit() {
    if (!recordedVideoUrl || recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const formData = new FormData();
    formData.append("file", blob, "recorded_video.webm");
    formData.append("exercise_id", exercise.id);

    // Example: post to your backend
    try {
      const resp = await fetch("/api/submit-live-video", { method: "POST", body: formData });
      if (!resp.ok) throw new Error("Server error submitting video");
      const data = await resp.json();
      alert(`Submitted live video! Reps: ${data.total_completions}`);
    } catch (err) {
      console.error("Error uploading live video:", err);
    }
  }

  /** If user wants to submit an uploaded file. */
  async function handleUploadSubmit() {
    if (!uploadedVideo) return;

    const formData = new FormData();
    formData.append("file", uploadedVideo, uploadedVideo.name);
    formData.append("exercise_id", exercise.id);

    try {
      const resp = await fetch("/api/submit-uploaded-video", { method: "POST", body: formData });
      if (!resp.ok) throw new Error("Server error");
      const data = await resp.json();
      alert(`Uploaded video reps: ${data.total_completions}`);
    } catch (err) {
      console.error("Error uploading file:", err);
    }
  }

  /** Once we enable "recording", start the MediaRecorder from react-webcam's stream. */
  useEffect(() => {
    if (mode === "live" && recording && webcamRef.current?.stream) {
      const stream = webcamRef.current.stream;
      try {
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "video/webm" });
        mediaRecorderRef.current.ondataavailable = (evt) => {
          if (evt.data.size > 0) {
            setRecordedChunks((prev) => [...prev, evt.data]);
          }
        };
        mediaRecorderRef.current.start();
      } catch (err) {
        console.error("MediaRecorder error:", err);
      }
    }
  }, [recording, mode]);

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg">
      {/* Toggles for live vs. upload */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Exercise Trainer</h2>
        <div className="flex gap-4">
          <button
            onClick={() => switchMode("live")}
            className={`px-4 py-2 rounded ${mode === "live" ? "bg-green-600" : "bg-gray-700"}`}
          >
            Live
          </button>
          <button
            onClick={() => switchMode("upload")}
            className={`px-4 py-2 rounded ${mode === "upload" ? "bg-green-600" : "bg-gray-700"}`}
          >
            Upload
          </button>
        </div>
      </div>

      {/* Show the chosen exercise */}
      <p className="text-lg font-semibold">{exercise.name}</p>
      <p className="text-gray-400 text-sm mb-4">{exercise.description}</p>

      {mode === "live" ? (
        <>
          {/* LIVE MODE */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative w-full md:w-1/2 aspect-video bg-black rounded-lg overflow-hidden">
              {hasPermissions === false ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <p>Camera permission required</p>
                </div>
              ) : isDetecting ? (
                <>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    videoConstraints={{ width: 640, height: 480 }}
                    onUserMedia={handleUserMedia}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    width={640}
                    height={480}
                  />
                  <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded">
                    Reps: {repCount}
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <p className="text-white">Click "Start Recording" to begin detection</p>
                </div>
              )}
            </div>

            {/* Stats + controls */}
            <div className="w-full md:w-1/2 space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold mb-2">Stats</h3>
                <p className="text-gray-400 text-sm">Current Reps</p>
                <p className="text-4xl font-bold text-blue-400">{repCount}</p>
              </div>

              <div className="flex gap-2">
                {/* Start or stop */}
                {!recording && !recordedVideoUrl && (
                  <button
                    onClick={handleStartRecording}
                    className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 flex items-center text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Recording
                  </button>
                )}
                {recording && (
                  <button
                    onClick={handleStopRecording}
                    className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 flex items-center text-white"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </button>
                )}
                {/* If we have a recorded video, user can submit or analyze offline */}
                {recordedVideoUrl && (
                  <button
                    onClick={handleLiveSubmit}
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Submit Live Video
                  </button>
                )}
              </div>

              {/* Recorded video preview + analyze button */}
              {recordedVideoUrl && (
                <div>
                  <video src={recordedVideoUrl} controls className="mt-3 w-full rounded-lg" />
                  <button
                    onClick={processRecordedVideo}
                    className="mt-3 px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Analyze Recorded Video
                  </button>
                </div>
              )}

              {/* Processed/Analyzed video + final rep count */}
              {analyzedVideoUrl && (
                <div className="mt-4">
                  <p className="text-sm text-gray-300">Analyzed Rep Count: {analyzedRepCount}</p>
                  <video src={analyzedVideoUrl} controls className="w-full mt-2 rounded-lg" />
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // UPLOAD MODE
        <div className="mt-4">
          <label className="block mb-2 text-gray-300" htmlFor="videoUpload">
            Pick a video file:
          </label>
          <input
            type="file"
            id="videoUpload"
            accept="video/*"
            onChange={handleFileChange}
            className="text-gray-700"
          />
          {recordedVideoUrl && (
            <div className="mt-4">
              <video src={recordedVideoUrl} controls className="w-full rounded-lg" />
            </div>
          )}
          <button
            disabled={!recordedVideoUrl}
            onClick={handleUploadSubmit}
            className="mt-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
          >
            Submit Uploaded Video
          </button>
        </div>
      )}

      {/* Hidden canvas for offline re-analysis of recorded videos */}
      <canvas
        ref={processedCanvasRef}
        width={640}
        height={480}
        // className="hidden"
      />
    </div>
  );
}
