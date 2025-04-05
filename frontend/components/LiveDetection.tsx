"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, Square, Home } from "lucide-react";
import { PoseLandmarker, DrawingUtils, FilesetResolver } from "@mediapipe/tasks-vision";

// -----------------------------------------------------------------------
// Type Definitions and Mock Data
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
    if (!this.isGoingUp && angle <= end) {
      this.isGoingUp = true;
    } else if (this.isGoingUp && angle >= start) {
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
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const [p1, p2, p3] = this.currentExercise.joints;
        const angle = this.calculateAngle(landmarks, p1, p2, p3);
        this.drawingUtils.drawLandmarks(landmarks, {
          radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1),
        });
        this.drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS);
        this.updateRepCount(angle);
        onRepUpdate(this.repCount);
        const color = this.isGoingUp ? "#00ff00" : "#ff0000";
        canvasCtx.beginPath();
        canvasCtx.arc(landmarks[p1].x * canvasElement.width, landmarks[p1].y * canvasElement.height, 8, 0, 2 * Math.PI);
        canvasCtx.arc(landmarks[p2].x * canvasElement.width, landmarks[p2].y * canvasElement.height, 8, 0, 2 * Math.PI);
        canvasCtx.arc(landmarks[p3].x * canvasElement.width, landmarks[p3].y * canvasElement.height, 8, 0, 2 * Math.PI);
        canvasCtx.fillStyle = color;
        canvasCtx.fill();
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
// LiveDetection Component (Using Tailwind CSS)
// -----------------------------------------------------------------------
export default function LiveDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionRef = useRef<ExerciseDetectionService>();
  const animationFrameRef = useRef<number>();

  const [isDetecting, setIsDetecting] = useState(false);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [repCount, setRepCount] = useState(0);

  useEffect(() => {
    detectionRef.current = new ExerciseDetectionService();
    const checkPermissions = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setHasPermissions(result.state === 'granted');
      } catch (error) {
        setHasPermissions(true);
      }
    };
    checkPermissions();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!isDetecting || !selectedExercise) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      return;
    }
    const startCamera = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        videoRef.current.srcObject = stream;
        await detectionRef.current?.initialize();
        detectionRef.current?.setExercise(selectedExercise);
        setHasPermissions(true);
        detectPose();
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setHasPermissions(false);
        setIsDetecting(false);
      }
    };
    const detectPose = () => {
      if (!isDetecting || !selectedExercise || !videoRef.current || !canvasRef.current) return;
      detectionRef.current?.processVideoFrame(
        videoRef.current,
        canvasRef.current,
        performance.now(),
        (count) => setRepCount(count)
      );
      animationFrameRef.current = requestAnimationFrame(detectPose);
    };
    startCamera();
  }, [isDetecting, selectedExercise]);

  const handleExerciseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const exerciseId = e.target.value;
    const exercise = EXERCISES.find((ex) => ex.id === exerciseId);
    if (exercise) {
      setSelectedExercise(exercise);
      setRepCount(0);
      detectionRef.current?.setExercise(exercise);
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Exercise Trainer</h2>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <select
            value={selectedExercise?.id || ""}
            onChange={handleExerciseChange}
            disabled={isDetecting}
            className="bg-gray-800 text-white p-2 rounded border border-gray-600"
          >
            <option value="">Select Exercise</option>
            {EXERCISES.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsDetecting(!isDetecting)}
            disabled={!selectedExercise || hasPermissions === false}
            className={`px-4 py-2 rounded flex items-center ${
              isDetecting ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
            } text-white`}
          >
            {isDetecting ? <Square className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isDetecting ? "Stop" : "Start"}
          </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative w-full md:w-1/2 aspect-video bg-black rounded-lg overflow-hidden">
          {hasPermissions === false && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <p>Camera permission denied</p>
            </div>
          )}
          {!selectedExercise && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <p>Select an exercise to begin</p>
            </div>
          )}
          {hasPermissions !== false && selectedExercise && (
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
        <div className="w-full md:w-1/2 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4">Exercise Stats</h3>
          <div className="mb-4">
            <p className="text-gray-400">Current Exercise</p>
            <p className="text-white text-xl">{selectedExercise?.name || "None"}</p>
          </div>
          <div className="mb-4">
            <p className="text-gray-400">Repetitions</p>
            <p className="text-4xl font-bold text-blue-400">{repCount}</p>
          </div>
          {selectedExercise && (
            <>
              <h4 className="text-lg font-semibold mt-6 mb-2">Instructions</h4>
              <p className="text-gray-300 mb-2">{selectedExercise.description}</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Stand in a well-lit area</li>
                <li>Ensure your full body is visible to the camera</li>
                <li>Perform the exercise at a controlled pace</li>
                <li>Maintain proper form throughout each rep</li>
              </ul>
            </>
          )}
        </div>
      </div>
      <div className="mt-6">
        <Link href="/">
          <div className="flex items-center text-white hover:underline">
            <Home className="h-6 w-6 mr-2" />
            Back to Home
          </div>
        </Link>
      </div>
    </div>
  );
}
