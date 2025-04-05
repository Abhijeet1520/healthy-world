"use client";

import { useEffect, useRef, useState } from "react";
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

    if (this.lastVideoTime !== videoElement.currentTime) {
      this.lastVideoTime = videoElement.currentTime;
      const results = this.poseLandmarker.detectForVideo(videoElement, timestamp);

      // Draw video
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const [p1, p2, p3] = this.currentExercise.joints;
        const angle = this.calculateAngle(landmarks, p1, p2, p3);

        // Draw pose
        this.drawingUtils.drawLandmarks(landmarks, {
          radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1),
        });
        this.drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS);

        // Reps logic
        this.updateRepCount(angle);
        onRepUpdate(this.repCount);

        // Visual indicator
        const color = this.isGoingUp ? "#00ff00" : "#ff0000";
        canvasCtx.beginPath();
        canvasCtx.arc(landmarks[p1].x * canvasElement.width, landmarks[p1].y * canvasElement.height, 8, 0, 2 * Math.PI);
        canvasCtx.arc(landmarks[p2].x * canvasElement.width, landmarks[p2].y * canvasElement.height, 8, 0, 2 * Math.PI);
        canvasCtx.arc(landmarks[p3].x * canvasElement.width, landmarks[p3].y * canvasElement.height, 8, 0, 2 * Math.PI);
        canvasCtx.fillStyle = color;
        canvasCtx.fill();

        // Angle text
        canvasCtx.font = "24px Arial";
        canvasCtx.fillStyle = "white";
        canvasCtx.fillText(
          `Angle: ${Math.round(angle)}°`,
          landmarks[p2].x * canvasElement.width,
          landmarks[p2].y * canvasElement.height - 20
        );
      }
    }
  }
}

// -----------------------------------------------------------------------
// LiveDetection Component
// -----------------------------------------------------------------------
interface LiveDetectionProps {
  exerciseSubType: string; // e.g. 'bicep-curls', 'squat', 'pushup', etc.
}

export default function LiveDetection({ exerciseSubType }: LiveDetectionProps) {
  // Mode: live or upload
  const [mode, setMode] = useState<"live" | "upload">("live");
  const [recording, setRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionRef = useRef<ExerciseDetectionService | null>(null);
  const animationFrameRef = useRef<number>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  const [isDetecting, setIsDetecting] = useState(false);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  // Automatically select exercise based on subType
  const exercise = EXERCISES.find((ex) => ex.id === exerciseSubType) || EXERCISES[0];

  // Initialize detection service and check camera permission for live mode
  useEffect(() => {
    detectionRef.current = new ExerciseDetectionService();
    if (mode === "live") {
      const checkPermissions = async () => {
        try {
          const result = await navigator.permissions.query({ name: "camera" as PermissionName });
          setHasPermissions(result.state === "granted");
        } catch (error) {
          setHasPermissions(true);
        }
      };
      checkPermissions();
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [mode]);

  // Live mode: start detection and recording when active
  useEffect(() => {
    if (mode === "live") {
      if (!isDetecting) {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (videoRef.current?.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach((track) => track.stop());
        }
        return;
      }
      const startCamera = async () => {
        if (!videoRef.current || !canvasRef.current || !exercise) return;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
          });
          videoRef.current.srcObject = stream;
          await detectionRef.current?.initialize();
          detectionRef.current?.setExercise(exercise);
          setHasPermissions(true);
          detectPose();
        } catch (err) {
          console.error("Error accessing webcam:", err);
          setHasPermissions(false);
          setIsDetecting(false);
        }
      };
      const detectPose = () => {
        if (!isDetecting || !videoRef.current || !canvasRef.current) return;
        detectionRef.current?.processVideoFrame(
          videoRef.current,
          canvasRef.current,
          performance.now(),
          (count) => setRepCount(count)
        );
        animationFrameRef.current = requestAnimationFrame(detectPose);
      };
      startCamera();
    }
  }, [isDetecting, exercise, mode]);

  // Handle file selection in upload mode
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedVideo(file);
      setRecordedVideoUrl(URL.createObjectURL(file));
    }
  };

  // API endpoint from env variable (with fallback)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Submit live recorded video
  const handleLiveSubmit = async () => {
    if (recordedVideoUrl && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const formData = new FormData();
      formData.append("file", blob, "recorded_video.webm");
      formData.append("exercise_id", exercise.id);
      formData.append("highlight_output", "false");

      try {
        const response = await fetch(`${apiUrl}/analyze-video`, {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          alert(`Live recorded video for ${exercise.name} submitted! Reps: ${data.total_completions}`);
          setRecordedVideoUrl(null);
          setRecordedChunks([]);
        } else {
          alert("Failed to submit live video.");
        }
      } catch (error) {
        console.error("Error submitting live video:", error);
        alert("Error submitting live video.");
      }
    }
  };

  // Submit uploaded video
  const handleUploadSubmit = async () => {
    if (uploadedVideo) {
      const formData = new FormData();
      formData.append("file", uploadedVideo, uploadedVideo.name);
      formData.append("exercise_id", exercise.id);
      formData.append("highlight_output", "false");

      try {
        const response = await fetch(`${apiUrl}/analyze-video`, {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          alert(`Uploaded video for ${exercise.name} submitted! Reps: ${data.total_completions}`);
          setRecordedVideoUrl(null);
          setUploadedVideo(null);
        } else {
          alert("Failed to submit uploaded video.");
        }
      } catch (error) {
        console.error("Error submitting uploaded video:", error);
        alert("Error submitting uploaded video.");
      }
    }
  };

  // Setup MediaRecorder when live recording starts
  useEffect(() => {
    if (mode === "live" && recording && videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      try {
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "video/webm" });
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setRecordedChunks((prev) => [...prev, event.data]);
          }
        };
        mediaRecorderRef.current.start();
      } catch (error) {
        console.error("MediaRecorder error:", error);
      }
    }
  }, [recording, mode]);

  // Handlers for live recording start/stop
  const handleStartRecording = () => {
    setIsDetecting(true);
    setRecording(true);
    setRepCount(0);
    setRecordedChunks([]);
    setRecordedVideoUrl(null);
  };

  const handleStopRecording = () => {
    setIsDetecting(false);
    setRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    // Create preview URL after a short delay
    setTimeout(() => {
      if (recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
      }
    }, 500);
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Exercise Trainer</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setMode("live");
              setRecordedVideoUrl(null);
            }}
            className={`px-4 py-2 rounded ${mode === "live" ? "bg-green-600" : "bg-gray-700"}`}
          >
            Live
          </button>
          <button
            onClick={() => {
              setMode("upload");
              setIsDetecting(false);
              setRecordedVideoUrl(null);
            }}
            className={`px-4 py-2 rounded ${mode === "upload" ? "bg-green-600" : "bg-gray-700"}`}
          >
            Upload
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-4">
        <p className="text-lg font-semibold">{exercise.name}</p>
        <div className="text-gray-400 text-sm sm:ml-auto">{exercise.description}</div>
      </div>

      {mode === "live" ? (
        <div className="mt-6 flex flex-col md:flex-row gap-8">
          {/* Live Video & Canvas */}
          <div className="relative w-full md:w-1/2 aspect-video bg-black rounded-lg overflow-hidden">
            {hasPermissions === false && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <p>Camera permission required</p>
              </div>
            )}
            {hasPermissions !== false && (
              <>
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                  width={640}
                  height={480}
                />
              </>
            )}
          </div>

          {/* Stats & Controls */}
          <div className="w-full md:w-1/2 bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Exercise Stats</h3>
            <div className="mb-4">
              <p className="text-gray-400">Repetitions</p>
              <p className="text-4xl font-bold text-blue-400">{repCount}</p>
            </div>
            <div className="flex gap-4">
              {!recording && !recordedVideoUrl && (
                <button
                  onClick={handleStartRecording}
                  className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white flex items-center"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Recording
                </button>
              )}
              {recording && (
                <button
                  onClick={handleStopRecording}
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white flex items-center"
                >
                  <Square className="h-4 w-4 mr-2" />
                  End Recording
                </button>
              )}
              {recordedVideoUrl && (
                <button
                  onClick={handleLiveSubmit}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                >
                  Submit Video
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Upload Mode
        <div className="mt-6">
          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="videoUpload">
              Select a video file to upload:
            </label>
            <input
              type="file"
              id="videoUpload"
              accept="video/*"
              onChange={handleFileChange}
              className="w-full text-gray-700"
            />
          </div>
          {recordedVideoUrl && (
            <div className="mb-4">
              <video src={recordedVideoUrl} controls className="w-full rounded-lg" />
            </div>
          )}
          <button
            onClick={handleUploadSubmit}
            disabled={!recordedVideoUrl}
            className="w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700"
          >
            Submit Video
          </button>
        </div>
      )}
    </div>
  );
}
