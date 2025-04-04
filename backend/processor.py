import math
import cv2
import mediapipe as mp

# EXERCISES dictionary
EXERCISES = {
    "bicep-curl": {
        "name": "Bicep Curl",
        "description": "Curl your arm upward, keeping your upper arm still",
        "targetAngles": {"start": 160, "end": 60},
        "joints": [11, 13, 15]  # Left arm: Shoulder=11, Elbow=13, Wrist=15
    },
    "squat": {
        "name": "Squat",
        "description": "Lower your body by bending your knees, keeping your back straight",
        "targetAngles": {"start": 170, "end": 90},
        "joints": [24, 26, 28]  # Left leg: Hip=24, Knee=26, Ankle=28
    },
    "pushup": {
        "name": "Push-up",
        "description": "Lower your body by bending your elbows, keeping your body straight",
        "targetAngles": {"start": 160, "end": 90},
        "joints": [12, 14, 16]  # Right arm: Shoulder=12, Elbow=14, Wrist=16
    },
}


class PoseProcessor:
    """
    A PoseProcessor that uses MediaPipe to detect poses and count reps for
    bicep curls, squats, pushups, etc., based on the user's choice.
    """

    def __init__(self):
        """
        Initially we have no loaded model and no exercise set.
        We'll initialize them in initialize() and set_exercise().
        """
        self.initialized = False
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils

        # MediaPipe pose instance (initialized in initialize())
        self.pose = None

        # The chosen exercise and its angle data
        self.current_exercise_id = "bicep-curl"
        self.start_angle = 160
        self.end_angle = 60
        self.joints = [11, 13, 15]

        # Rep counting variables
        # is_going_up => if True, we are in the "flexed" or "down" motion,
        # waiting for the user to come back up to start position.
        self.is_going_up = False
        self.rep_count = 0

    def initialize(self):
        """
        Load/initialize Mediapipe Pose solution once.
        """
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.initialized = True

    def set_exercise(self, exercise_id: str):
        """
        Choose which exercise data to use (bicep-curl, squat, pushup, etc.)
        Resets the rep counter and is_going_up state.
        """
        if exercise_id not in EXERCISES:
            raise ValueError(f"Unknown exercise_id '{exercise_id}'. "
                             f"Valid options: {list(EXERCISES.keys())}")

        self.current_exercise_id = exercise_id
        exercise_data = EXERCISES[exercise_id]

        # Extract start/end angles and joints from the dictionary
        self.start_angle = exercise_data["targetAngles"]["start"]
        self.end_angle = exercise_data["targetAngles"]["end"]
        self.joints = exercise_data["joints"]

        # Reset the rep counting variables
        self.is_going_up = False
        self.rep_count = 0

    def process_video(self, video_path: str, highlight_output: bool = False, output_path: str = None) -> dict:
        """
        Process the given video file, detect the chosen joint angle,
        and count reps using the 'start_angle' and 'end_angle' logic from the TS snippet.

        :param video_path: Path to an input .mp4 or other supported file.
        :param highlight_output: If True, draws pose skeleton and angle info on an output video.
        :param output_path: Path to save the annotated video if highlight_output=True.
        :return: A dictionary of results (exercise name, total reps, frames processed, etc.)
        """
        if not self.initialized or not self.pose:
            raise RuntimeError("PoseProcessor not initialized. Call initialize() first.")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Optional VideoWriter for annotated output
        writer = None
        if highlight_output and output_path:
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        frames_processed = 0

        while True:
            success, frame = cap.read()
            if not success:
                break  # End of video

            # Convert BGR to RGB for MediaPipe
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(frame_rgb)

            # Default angle is 0 if we can't compute it
            angle = 0.0

            if results.pose_landmarks:
                # Extract the landmarks we need for the current exercise
                landmarks = results.pose_landmarks.landmark

                # E.g. for bicep curl: p1=11(shoulder), p2=13(elbow), p3=15(wrist)
                p1, p2, p3 = self.joints
                angle = self._compute_angle(landmarks, width, height, p1, p2, p3)

                # Update the rep count logic
                self._update_rep_count(angle)

            # If highlight requested, overlay skeleton & info on the frame
            if writer:
                # Draw the skeleton
                self.mp_drawing.draw_landmarks(
                    frame,
                    results.pose_landmarks,
                    self.mp_pose.POSE_CONNECTIONS
                )

                # Show angle + rep count
                text = (f"Ex: {self.current_exercise_id} | "
                        f"Angle: {int(angle)} | Reps: {self.rep_count}")
                cv2.putText(
                    frame,
                    text,
                    (10, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1.0,
                    (0, 255, 0),
                    2
                )

                writer.write(frame)

            frames_processed += 1

        cap.release()
        if writer:
            writer.release()

        # Build final result dictionary
        exercise_data = EXERCISES[self.current_exercise_id]
        return {
            "exercise_id": self.current_exercise_id,
            "exercise_name": exercise_data["name"],
            "description": exercise_data["description"],
            "total_reps": self.rep_count,
            "frames_processed": frames_processed,
            "angle_start": self.start_angle,
            "angle_end": self.end_angle
        }

    def _compute_angle(self, landmarks, width: int, height: int, p1: int, p2: int, p3: int) -> float:
        """
        Compute the angle (in degrees) formed by the three landmark indices p1->p2->p3.
        This matches the TS code approach:
          angle = abs(atan2(...p3...) - atan2(...p1...)) * (180/pi)
        """
        x1, y1 = landmarks[p1].x * width, landmarks[p1].y * height
        x2, y2 = landmarks[p2].x * width, landmarks[p2].y * height
        x3, y3 = landmarks[p3].x * width, landmarks[p3].y * height

        angle_radians = abs(
            math.atan2(y3 - y2, x3 - x2) -
            math.atan2(y1 - y2, x1 - x2)
        )
        angle_degrees = angle_radians * (180 / math.pi)

        # Some angles might go beyond 180 if we measure the reflex angle,
        # but for typical exercises we usually want 0..180 range.
        # If you want the full range, keep as is.
        # If you prefer a max of 180, do:
        #   if angle_degrees > 180: angle_degrees = 360 - angle_degrees
        return angle_degrees

    def _update_rep_count(self, angle: float):
        """
        Follows the same logic from the TS code snippet:

        - let startAngle = self.start_angle
        - let endAngle   = self.end_angle
        - if not isGoingUp and angle <= endAngle => isGoingUp = True
        - else if isGoingUp and angle >= startAngle => isGoingUp = False, rep_count++
        """
        start_angle = self.start_angle
        end_angle = self.end_angle

        # Going "down" (closing angle)
        if not self.is_going_up and angle <= end_angle:
            self.is_going_up = True

        # Going "up" (opening angle)
        elif self.is_going_up and angle >= start_angle:
            self.is_going_up = False
            self.rep_count += 1
