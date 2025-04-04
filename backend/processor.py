import math
import cv2
import mediapipe as mp

class PoseProcessor:
    """
    Handles pose detection (via Mediapipe) and counting reps for a squat-like motion
    based on a single leg's knee angle.
    """

    def __init__(self):
        """
        By default, we set not-initialized. We'll load Mediapipe on initialize().
        """
        self.initialized = False

        # These are exercise parameters you can set via set_exercise_params().
        # We'll handle them in process_video().
        self.exercise_name = "unknown"
        self.min_angle = 70.0
        self.max_angle = 160.0
        self.rep_threshold = 0.8

        # We'll use Mediapipe's Pose solution.
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_pose = mp.solutions.pose
        self.pose = None

    def initialize(self):
        """
        Load/initialize Mediapipe Pose. This is done once at startup.
        """
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.initialized = True

    def set_exercise_params(self, params: dict):
        """
        Update angle thresholds and exercise name (if provided).
        Example:
          {
            "exercise_name": "squat",
            "min_angle": 70.0,
            "max_angle": 160.0,
            "rep_threshold": 0.8
          }
        """
        if "exercise_name" in params:
            self.exercise_name = params["exercise_name"]
        if "min_angle" in params:
            self.min_angle = float(params["min_angle"])
        if "max_angle" in params:
            self.max_angle = float(params["max_angle"])
        if "rep_threshold" in params:
            self.rep_threshold = float(params["rep_threshold"])

    def process_video(self, video_path: str, highlight_output: bool = False, output_path: str = None) -> dict:
        """
        Given a video_path, run pose detection and count reps for a squat motion using the knee angle
        (left leg, for example). If highlight_output=True, writes annotated frames to output_path.

        :param video_path: Path to the input video file (e.g. .mp4).
        :param highlight_output: If True, draws overlays on the frames and writes them to output_path.
        :param output_path: Where to save the annotated .mp4 (used only if highlight_output=True).
        :return: Dictionary with stats, e.g. total_reps, average_angle, etc.
        """
        if not self.initialized or not self.pose:
            raise RuntimeError("PoseProcessor not initialized. Call initialize() first.")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Set up optional VideoWriter for annotated video
        out_writer = None
        if highlight_output and output_path:
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            out_writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        total_reps = 0
        frame_index = 0

        # We'll track whether the user is "down" or "up" using a direction variable:
        #   0 => moving upwards; 1 => moving downwards
        # The logic: if we pass from up->down->up and we meet threshold, we count +1 rep.
        direction = 0

        angles_list = []  # store knee angle to compute an average at the end

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Convert BGR frame to RGB for Mediapipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(rgb_frame)
            angle = 0.0

            # If pose landmarks exist, compute knee angle for left leg (hip–knee–ankle)
            if results.pose_landmarks:
                # Mediapipe's PoseLandmark enumerations:
                #   LEFT_HIP = 23, LEFT_KNEE = 25, LEFT_ANKLE = 27
                landmarks = results.pose_landmarks.landmark

                # Gather the relevant x,y coords (we can ignore z for 2D angle)
                # We'll do left hip, left knee, left ankle
                hip = (landmarks[self.mp_pose.PoseLandmark.LEFT_HIP].x,
                       landmarks[self.mp_pose.PoseLandmark.LEFT_HIP].y)
                knee = (landmarks[self.mp_pose.PoseLandmark.LEFT_KNEE].x,
                        landmarks[self.mp_pose.PoseLandmark.LEFT_KNEE].y)
                ankle = (landmarks[self.mp_pose.PoseLandmark.LEFT_ANKLE].x,
                         landmarks[self.mp_pose.PoseLandmark.LEFT_ANKLE].y)

                angle = self._compute_angle(hip, knee, ankle)

            # Rep logic: up->down->up cycle => 1 repetition
            # "Up" means angle > max_angle, "Down" means angle < min_angle
            if direction == 0 and angle > self.max_angle:
                # user is in "up" position, switch direction to going "down"
                direction = 1
            if direction == 1 and angle < self.min_angle:
                # user is in "down" position, let's see if we traveled enough
                traveled_range = self.max_angle - angle
                full_range = self.max_angle - self.min_angle
                needed = self.rep_threshold * full_range
                if traveled_range >= needed:
                    total_reps += 1
                direction = 0

            angles_list.append(angle)

            # If we want to highlight output, overlay text on the frame
            if out_writer is not None:
                text = f"Frame: {frame_index} | Reps: {total_reps} | Angle: {angle:.1f}"
                cv2.putText(
                    frame, text, (10, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2
                )
                # Optionally, draw pose landmarks
                self.mp_drawing.draw_landmarks(
                    frame,
                    results.pose_landmarks,
                    self.mp_pose.POSE_CONNECTIONS
                )
                out_writer.write(frame)

            frame_index += 1

        cap.release()
        if out_writer is not None:
            out_writer.release()

        # Compute average angle
        average_angle = 0.0
        if angles_list:
            average_angle = sum(angles_list) / len(angles_list)

        return {
            "exercise_name": self.exercise_name,
            "total_reps": total_reps,
            "average_angle": round(average_angle, 2),
            "min_angle_used": self.min_angle,
            "max_angle_used": self.max_angle,
            "rep_threshold_used": self.rep_threshold,
            "frames_processed": frame_index
        }

    @staticmethod
    def _compute_angle(p1, p2, p3):
        """
        Compute angle (in degrees) at p2 formed by points p1->p2->p3 using basic 2D geometry.
        Each p is (x, y).
        """
        # Convert each point to a vector
        p1x, p1y = p1
        p2x, p2y = p2
        p3x, p3y = p3

        # Vectors p2->p1 and p2->p3
        v1 = (p1x - p2x, p1y - p2y)
        v2 = (p3x - p2x, p3y - p2y)

        # Dot product and magnitude
        dot = v1[0]*v2[0] + v1[1]*v2[1]
        mag1 = math.sqrt(v1[0]**2 + v1[1]**2)
        mag2 = math.sqrt(v2[0]**2 + v2[1]**2)

        if mag1 == 0 or mag2 == 0:
            return 0.0

        # Angle in radians
        angle_radians = math.acos(dot / (mag1 * mag2))
        angle_degrees = math.degrees(angle_radians)
        return angle_degrees
