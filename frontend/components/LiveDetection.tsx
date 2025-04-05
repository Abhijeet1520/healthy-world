"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Play, Square } from "lucide-react";
import { PoseLandmarker, DrawingUtils, FilesetResolver } from "@mediapipe/tasks-vision";

/** -----------------------------------------------------------------------
 * 1) Data definitions: Exercise, etc.
 * ----------------------------------------------------------------------- */
export type Exercise = {
  id: string;
  name: string;
  description: string;
  targetAngles: { start: number; end: number };
  joints: [number, number, number]; // Indices of the 3 landmarks used for angle calculation
};

export const EXERCISES: Exercise[] = [
  {
    id: "bicep-curl",
    name: "Bicep Curl",
    description: "Curl your arm upward, keeping your upper arm still.",
    targetAngles: { start: 160, end: 60 },
    joints: [11, 13, 15], // left shoulder, elbow, wrist
  },
  {
    id: "squat",
    name: "Squat",
    description: "Lower your body by bending your knees, keeping your back straight.",
    targetAngles: { start: 170, end: 90 },
    joints: [24, 26, 28], // left hip, knee, ankle
  },
  {
    id: "pushup",
    name: "Push-up",
    description: "Lower your body by bending your elbows, keeping your body straight.",
    targetAngles: { start: 160, end: 90 },
    joints: [12, 14, 16], // right shoulder, elbow, wrist
  },
];

/** -----------------------------------------------------------------------
 * 2) The detection service, with cooldown logic
 * ----------------------------------------------------------------------- */
class ExerciseDetectionService {
  private poseLandmarker: PoseLandmarker | null = null;
  private drawingUtils: DrawingUtils | null = null;

  private lastVideoTime = -1;
  private currentExercise: Exercise | null = null;

  // “Going up” state logic
  private isGoingUp = false;

  // Overall rep count
  private repCount = 0;

  // A cooldown to prevent counting reps too quickly (in ms)
  private repCooldownMs = 2000;
  private lastRepTime = 0; // timestamp of the last completed rep

  // For posture smoothing or ignoring small angle changes, you can do more advanced logic here
  constructor() {
    this.repCount = 0;
  }

  setExercise(exercise: Exercise) {
    this.currentExercise = exercise;
    this.repCount = 0;
    this.isGoingUp = false;
    this.lastRepTime = 0;
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

  private calculateAngle(landmarks: any[], p1: number, p2: number, p3: number) {
    const [x1, y1] = [landmarks[p1].x, landmarks[p1].y];
    const [x2, y2] = [landmarks[p2].x, landmarks[p2].y];
    const [x3, y3] = [landmarks[p3].x, landmarks[p3].y];

    const angleRad =
      Math.abs(Math.atan2(y3 - y2, x3 - x2) - Math.atan2(y1 - y2, x1 - x2));
    const angleDeg = angleRad * (180 / Math.PI);

    return angleDeg;
  }

  private maybeCountRep(angle: number) {
    if (!this.currentExercise) return;

    const { start, end } = this.currentExercise.targetAngles;
    const now = Date.now();

    // “Going down” logic => if not going up yet, and angle < end => user at low position
    if (!this.isGoingUp && angle <= end) {
      this.isGoingUp = true;
    }
    // “Coming up” logic => if going up, angle >= start => user returned to high position => count rep
    else if (this.isGoingUp && angle >= start) {
      this.isGoingUp = false;

      // Check the cooldown
      if (now - this.lastRepTime >= this.repCooldownMs) {
        this.lastRepTime = now;
        this.repCount += 1;
      }
    }
  }

  processVideoFrame(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    timestamp: number,
    onRepUpdate: (count: number) => void
  ) {
    if (!this.poseLandmarker || !this.currentExercise) return;

    const ctx = canvasElement.getContext("2d");
    if (!ctx) return;

    if (!this.drawingUtils) {
      this.drawingUtils = new DrawingUtils(ctx);
    }

    // Only run detection if the currentTime changed
    if (videoElement.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = videoElement.currentTime;

      const results = this.poseLandmarker.detectForVideo(videoElement, timestamp);

      // Clear + draw base video
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        // Check that required primary joints are present; if not, overlay message
        const [p1, p2, p3] = this.currentExercise.joints;
        if(landmarks[p1] === undefined || landmarks[p2] === undefined || landmarks[p3] === undefined){
          ctx.fillStyle = "rgba(0,0,0,0.7)";
          ctx.fillRect(0,0,canvasElement.width,canvasElement.height);
          ctx.font = "24px Arial";
          ctx.fillStyle = "white";
          ctx.fillText("Ensure your full body is in frame",20,40);
          return;
        }
        const angle = this.calculateAngle(landmarks, p1, p2, p3);

        // Possibly count a rep with cooldown logic
        this.maybeCountRep(angle);
        onRepUpdate(this.repCount);

        // Draw skeleton (for current exercise joints)
        this.drawingUtils.drawLandmarks(landmarks, {
          radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1),
        });
        this.drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS);

        // Color for the main angle’s joint circles
        const color = this.isGoingUp ? "#00ff00" : "#ff0000";
        ctx.beginPath();
        ctx.arc(landmarks[p1].x * canvasElement.width, landmarks[p1].y * canvasElement.height, 8, 0, 2 * Math.PI);
        ctx.arc(landmarks[p2].x * canvasElement.width, landmarks[p2].y * canvasElement.height, 8, 0, 2 * Math.PI);
        ctx.arc(landmarks[p3].x * canvasElement.width, landmarks[p3].y * canvasElement.height, 8, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        // Draw angle text
        ctx.font = "24px Arial";
        ctx.fillStyle = "white";
        const angleText = `Angle: ${Math.round(angle)}°`;
        ctx.fillText(angleText, landmarks[p2].x * canvasElement.width, landmarks[p2].y * canvasElement.height - 20);

        // Draw endpoints for both hands and feet only (indices 15, 16, 27, 28)
        const endpoints = [15, 16, 27, 28];
        let sumX = 0, sumY = 0, count = 0;
        endpoints.forEach(idx => {
          if (results.landmarks[idx] !== undefined) {
            sumX += results.landmarks[idx].x;
            sumY += results.landmarks[idx].y;
            count++;
          }
        });
        if (count === endpoints.length) {
          const cx = sumX / count;
          const cy = sumY / count;
          const scale = 0.1;
          const scaledPoints = endpoints.map(idx => ({
            x: cx + scale * (results.landmarks[idx].x - cx),
            y: cy + scale * (results.landmarks[idx].y - cy)
          }));
          ctx.beginPath();
          ctx.moveTo(scaledPoints[0].x * canvasElement.width, scaledPoints[0].y * canvasElement.height);
          scaledPoints.slice(1).forEach(pt => {
            ctx.lineTo(pt.x * canvasElement.width, pt.y * canvasElement.height);
          });
          ctx.closePath();
          ctx.fillStyle = "rgba(255, 255, 0, 0.5)";
          ctx.fill();
          endpoints.forEach(idx => {
            ctx.beginPath();
            ctx.arc(results.landmarks[idx].x * canvasElement.width, results.landmarks[idx].y * canvasElement.height, 6, 0, 2 * Math.PI);
            ctx.fillStyle = "yellow";
            ctx.fill();
          });
          let area = 0;
          for (let i = 0; i < scaledPoints.length; i++) {
            const j = (i + 1) % scaledPoints.length;
            area += scaledPoints[i].x * scaledPoints[j].y - scaledPoints[j].x * scaledPoints[i].y;
          }
          area = Math.abs(area) / 2;
          if (area < 0.001) {
            ctx.font = "24px Arial";
            ctx.fillStyle = "white";
            ctx.fillText("Move more", 20, canvasElement.height - 40);
          }
        }
      }
    }
  }
}

/** -----------------------------------------------------------------------
 * 3) LiveDetection: The main React component
 *    Live vs. Upload. In both cases, analysis is done offline in JS.
 * ----------------------------------------------------------------------- */
interface LiveDetectionProps {
  exerciseSubType: string; // e.g. "bicep-curl", "squat", "pushup"
}

export default function LiveDetection({ exerciseSubType }: LiveDetectionProps) {
  // Mode: "live" or "upload"
  const [mode, setMode] = useState<"live" | "upload">("live");

  // Real-time detection state
  const [isDetecting, setIsDetecting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);

  // For storing recorded chunks in live mode
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  // For user-uploaded file + local preview
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);

  // For final processed videos (live or uploaded) with overlays
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const [processedRepCount, setProcessedRepCount] = useState<number>(0);
  const [targetReps, setTargetReps] = useState<number>(10);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  // Refs for react-webcam, canvas overlays, and MediaRecorder
  const webcamRef = useRef<Webcam>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const detectionRef = useRef<ExerciseDetectionService | null>(null);

  const animationFrameRef = useRef<number>();
  const processedAnimationFrameRef = useRef<number>();

  // Select exercise based on subType
  const exercise = EXERCISES.find((ex) => ex.id === exerciseSubType) || EXERCISES[0];

  /** Switch between live vs upload */
  function switchMode(newMode: "live" | "upload") {
    setMode(newMode);
    setIsDetecting(false);
    setRecording(false);
    setRecordedChunks([]);
    setRecordedVideoUrl(null);
    setProcessedVideoUrl(null);
    setProcessedRepCount(0);
    setRepCount(0);
  }

  /** Called by react-webcam when user media is accessible */
  const handleUserMedia = useCallback(() => {
    setHasPermissions(true);
  }, []);

  /** Initialize detection service once on mount (or mode change) */
  useEffect(() => {
    const service = new ExerciseDetectionService();
    detectionRef.current = service;
  }, [mode]);

  // Live mode detection loop using react-webcam's video element
  useEffect(() => {
    if (mode === "live" && isDetecting) {
      const videoEl = webcamRef.current?.video;
      if (!videoEl || !liveCanvasRef.current || !detectionRef.current) return;
      detectionRef.current.initialize().then(() => {
        detectionRef.current?.setExercise(exercise);
        const detectFrame = () => {
          if (!isDetecting) return;
          detectionRef.current?.processVideoFrame(
            videoEl,
            liveCanvasRef.current!,
            performance.now(),
            (cnt) => setRepCount(cnt)
          );
          animationFrameRef.current = requestAnimationFrame(detectFrame);
        };
        detectFrame();
      });
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isDetecting, exercise, mode]);

  // Live mode: Start recording and detection
  const handleStartLive = () => {
    setIsDetecting(true);
    setRecording(true);
    setRepCount(0);
    setRecordedChunks([]);
    setRecordedVideoUrl(null);
    setProcessedVideoUrl(null);
    setIsAnalyzing(false);
  }

  // Live mode: Stop recording and finalize video
  const handleStopLive = () => {
    setIsDetecting(false);
    setRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    setTimeout(() => {
      if (recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        setRecordedVideoUrl(URL.createObjectURL(blob));
      }
    }, 400);
  };

  // Attach MediaRecorder to react-webcam's stream when recording starts
  useEffect(() => {
    if (mode === "live" && recording && webcamRef.current?.stream) {
      try {
        const stream = webcamRef.current.stream as MediaStream;
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "video/webm" });
        mediaRecorderRef.current.ondataavailable = (evt) => {
          if (evt.data.size > 0) setRecordedChunks((prev) => [...prev, evt.data]);
        };
        mediaRecorderRef.current.start();
      } catch (err) {
        console.error("MediaRecorder error:", err);
      }
    }
  }, [recording, mode]);

  // Handle file selection in upload mode
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedVideo(file);
    setRecordedVideoUrl(URL.createObjectURL(file));
    setProcessedVideoUrl(null);
    setProcessedRepCount(0);
  };

  // Process recorded/uploaded video offline to generate an overlay video and rep count
  async function analyzeLocalVideo() {
    if (!recordedVideoUrl || !processedCanvasRef.current) return;
    setIsAnalyzing(true);
    setProcessedRepCount(0);

    // Re-init the detection
    const service = new ExerciseDetectionService();
    detectionRef.current = service;
    await service.initialize();
    service.setExercise(exercise);

    const tempVideo = document.createElement("video");
    tempVideo.src = recordedVideoUrl;
    tempVideo.crossOrigin = "anonymous";
    tempVideo.muted = true;
    tempVideo.playsInline = true;
    await tempVideo.play().catch(() => {});

    let localRepCount = 0;
    const ctx = processedCanvasRef.current.getContext("2d");
    if (!ctx) return;

    const processFrame = () => {
      if (tempVideo.paused || tempVideo.ended) {
        cancelAnimationFrame(processedAnimationFrameRef.current!);
        setProcessedRepCount(localRepCount);

        // Optionally convert final overlay to a new webm
        processedCanvasRef.current?.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setProcessedVideoUrl(url);
          }
        }, "video/webm");
        setIsAnalyzing(false);
        return;
      }

      detectionRef.current?.processVideoFrame(
        tempVideo,
        processedCanvasRef.current!,
        performance.now(),
        (cnt) => {
          localRepCount = cnt;
        }
      );
      processedAnimationFrameRef.current = requestAnimationFrame(processFrame);
    };
    processedAnimationFrameRef.current = requestAnimationFrame(processFrame);
  }

  // Submit functions for live and upload videos (placeholder implementations)
  async function handleLiveSubmit() {
    if (!recordedVideoUrl || recordedChunks.length === 0) return;
    alert(`Live video submitted! Reps: ${repCount}`);
    // Reset state after submission if needed
  }

  async function handleUploadSubmit() {
    if (!uploadedVideo) return;
    alert("Uploaded video submitted!");
    // Reset state after submission if needed
  }

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg">
      {/* Mode Toggle */}
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

      {/* Display selected exercise */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{exercise.name}</h3>
        <p className="text-sm text-gray-400">{exercise.description}</p>
      </div>

      {mode === "live" ? (
        <>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Live webcam feed with overlay canvas */}
            <div className="relative w-full md:w-1/2 aspect-video bg-black rounded-md overflow-hidden">
              {hasPermissions === false ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <p>No camera permissions</p>
                </div>
              ) : (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    videoConstraints={{ width: 640, height: 480 }}
                    onUserMedia={handleUserMedia}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Overlay canvas for real-time detection */}
                  <canvas
                    ref={liveCanvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    width={640}
                    height={480}
                  />
                  {/* Overlay to prompt user to be fully in frame */}
                  <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-sm">
                    Please ensure your full body is in frame
                  </div>
                  {/* Show live rep count */}
                  {isDetecting && (
                    <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded-md text-white">
                      Reps: {repCount}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Live mode controls */}
            <div className="w-full md:w-1/2 space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold mb-2">Live Stats</h3>
                <p className="text-gray-400">
                  Repetitions: <span className="text-4xl font-bold text-blue-400">{repCount}</span>
                </p>
              </div>
              <div className="flex gap-3">
                {!recording && !recordedVideoUrl && (
                  <button
                    onClick={handleStartLive}
                    className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white flex items-center"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Recording
                  </button>
                )}
                {recording && (
                  <button
                    onClick={handleStopLive}
                    className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white flex items-center"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </button>
                )}
                {recordedVideoUrl && (
                  <button
                    onClick={handleLiveSubmit}
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                  >
                    Submit Live Video
                  </button>
                )}
              </div>

              {/* If we have a final recorded video, user can do local analysis */}
              {recordedVideoUrl && (
                <div>
                  <video src={recordedVideoUrl} controls className="w-full rounded" />
                  <button
                    onClick={analyzeLocalVideo}
                    className="mt-3 px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isAnalyzing ? "Processing..." : "Analyze Recorded Video"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // UPLOAD MODE
        <div className="space-y-4">
          <label className="block text-sm" htmlFor="fileUpload">
            Upload a video to analyze
          </label>
          <input
            id="fileUpload"
            type="file"
            accept="video/*"
            className="text-gray-200"
            onChange={handleFileChange}
          />
          {recordedVideoUrl && (
            <div>
              <video src={recordedVideoUrl} controls className="w-full rounded mb-3" />
              <button
                onClick={analyzeLocalVideo}
                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isAnalyzing ? "Processing..." : "Analyze Uploaded Video"}
              </button>
            </div>
          )}
          {processedVideoUrl && (
            <div>
              <p>Processed Reps: {processedRepCount}</p>
              <video src={processedVideoUrl} controls className="w-full rounded" />
            </div>
          )}
        </div>
      )}

      {/* Common Progress Bar for Both Modes */}
      <div className="mt-6">
        <p className="text-sm">Progress: {Math.min(repCount, targetReps)} / {targetReps} reps</p>
        <div className="w-full bg-gray-200 h-3 rounded-full">
          <div
            className="bg-blue-500 h-3 rounded-full"
            style={{ width: `${Math.min((repCount / targetReps) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Hidden canvas for offline re-analysis */}
      <canvas
        ref={processedCanvasRef}
        width={640}
        height={480}
        className="hidden"
      />
    </div>
  );
}
