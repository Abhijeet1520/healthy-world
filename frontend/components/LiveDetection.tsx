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
        const [p1, p2, p3] = this.currentExercise.joints;
        const angle = this.calculateAngle(landmarks, p1, p2, p3);

        // Possibly count a rep with cooldown logic
        this.maybeCountRep(angle);
        onRepUpdate(this.repCount);

        // Draw skeleton
        this.drawingUtils.drawLandmarks(landmarks, {
          radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1),
        });
        this.drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS);

        // Color for the main angle’s joint circles
        const color = this.isGoingUp ? "#00ff00" : "#ff0000";
        ctx.beginPath();
        ctx.arc(
          landmarks[p1].x * canvasElement.width,
          landmarks[p1].y * canvasElement.height,
          8,
          0,
          2 * Math.PI
        );
        ctx.arc(
          landmarks[p2].x * canvasElement.width,
          landmarks[p2].y * canvasElement.height,
          8,
          0,
          2 * Math.PI
        );
        ctx.arc(
          landmarks[p3].x * canvasElement.width,
          landmarks[p3].y * canvasElement.height,
          8,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = color;
        ctx.fill();

        // Angle text
        ctx.font = "24px Arial";
        ctx.fillStyle = "white";
        const angleText = `Angle: ${Math.round(angle)}°`;
        ctx.fillText(
          angleText,
          landmarks[p2].x * canvasElement.width,
          landmarks[p2].y * canvasElement.height - 20
        );
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
  // Are we in "live" or "upload" mode
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

  // Refs
  const webcamRef = useRef<Webcam>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const detectionRef = useRef<ExerciseDetectionService | null>(null);

  const animationFrameRef = useRef<number>();
  const processedAnimationFrameRef = useRef<number>();

  // Which exercise from EXERCISES
  const exercise = EXERCISES.find((ex) => ex.id === exerciseSubType) || EXERCISES[0];

  /** Switch between live vs upload */
  function switchMode(nextMode: "live" | "upload") {
    setMode(nextMode);
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

  /** If we are in "live" mode and isDetecting is on => detection loop */
  useEffect(() => {
    if (mode !== "live" || !isDetecting) return;

    const runDetection = async () => {
      const service = detectionRef.current;
      if (!service) return;
      await service.initialize();
      service.setExercise(exercise);

      const detectFrame = () => {
        if (!isDetecting) return;
        const videoEl = webcamRef.current?.video;
        const canvasEl = liveCanvasRef.current;
        if (!videoEl || !canvasEl) return;

        service.processVideoFrame(videoEl, canvasEl, performance.now(), (cnt) => {
          setRepCount(cnt);
        });
        animationFrameRef.current = requestAnimationFrame(detectFrame);
      };
      detectFrame();
    };

    runDetection();

    // Cleanup
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mode, isDetecting, exercise]);

  /** Start detection + recording in live mode */
  function handleStartLive() {
    setIsDetecting(true);
    setRecording(true);
    setRepCount(0);
    setRecordedChunks([]);
    setRecordedVideoUrl(null);
    setProcessedVideoUrl(null);
  }

  /** Stop detection + finalize the recording in live mode */
  function handleStopLive() {
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
  }

  /** Once we are recording, attach a MediaRecorder to the react-webcam stream. */
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

  /** If user picks a file in upload mode */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedVideo(file);
    setRecordedVideoUrl(URL.createObjectURL(file));
    setProcessedVideoUrl(null);
    setProcessedRepCount(0);
  }

  /** Process (analyze) a local video (recorded or uploaded) => show skeleton overlay */
  async function analyzeLocalVideo() {
    if (!recordedVideoUrl) return;
    if (!processedCanvasRef.current) return;
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
    await tempVideo.play().catch(() => { /* ignore */ });

    let localRepCount = 0;
    const ctx = processedCanvasRef.current.getContext("2d");
    if (!ctx) return;

    const detectFrame = () => {
      if (tempVideo.ended || tempVideo.paused) {
        cancelAnimationFrame(processedAnimationFrameRef.current!);
        setProcessedRepCount(localRepCount);

        // Optionally convert final overlay to a new webm
        processedCanvasRef.current?.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setProcessedVideoUrl(url);
          }
        }, "video/webm");
        return;
      }

      detectionRef.current?.processVideoFrame(tempVideo, processedCanvasRef.current!, performance.now(), (cnt) => {
        localRepCount = cnt;
      });
      processedAnimationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    processedAnimationFrameRef.current = requestAnimationFrame(detectFrame);
  }

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Exercise Trainer</h2>
        <div className="flex space-x-4">
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

      <div className="mb-4">
        <h3 className="text-lg font-semibold">{exercise.name}</h3>
        <p className="text-sm text-gray-400">{exercise.description}</p>
      </div>

      {mode === "live" ? (
        <div className="space-y-4">
          <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
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
                {/* Show live rep count */}
                {isDetecting && (
                  <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded-md text-white">
                    Reps: {repCount}
                  </div>
                )}
              </>
            )}
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
          </div>

          {/* If we have a final recorded video, user can do local analysis */}
          {recordedVideoUrl && (
            <div className="mt-4">
              <video src={recordedVideoUrl} controls className="w-full rounded" />
              <div className="mt-2 flex gap-3">
                <button
                  onClick={analyzeLocalVideo}
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Analyze Recorded Video
                </button>
              </div>
            </div>
          )}

          {/* Show the final processed overlay as a video */}
          {processedVideoUrl && (
            <div className="mt-4">
              <p>Processed Reps: {processedRepCount}</p>
              {/* <video src={processedVideoUrl} controls className="w-full rounded" /> */}
            </div>
          )}
        </div>
      ) : (
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
            <div className="mt-3">
              <video src={recordedVideoUrl} controls className="w-full rounded mb-3" />
              <button
                onClick={analyzeLocalVideo}
                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Analyze Uploaded Video
              </button>
            </div>
          )}
          {processedVideoUrl && (
            <div className="mt-3">
              <p>Processed Reps: {processedRepCount}</p>
              {/* <video src={processedVideoUrl} controls className="w-full rounded" /> */}
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for offline re-analysis of local videos */}
      <canvas
        ref={processedCanvasRef}
        width={640}
        height={480}
        className="hidden"
      />
    </div>
  );
}
