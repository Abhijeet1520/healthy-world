import math
import cv2
import mediapipe as mp

# EXERCISES dictionary
EXERCISES = {
    "bicep-curl": {
        "name": "Bicep Curl (Both Arms)",
        "description": "Curl both arms upward, keeping your upper arms still",
        "targetAngles": {"start": 160, "end": 60},
        "joints": [        # Two sets: left arm and right arm
            [11, 13, 15],  # Left arm:  shoulder=11, elbow=13, wrist=15
            [12, 14, 16]   # Right arm: shoulder=12, elbow=14, wrist=16
        ]
    },
    "squat": {
        "name": "Squat",
        "description": "Lower your body by bending your knees, keeping your back straight",
        "targetAngles": {"start": 170, "end": 90},
        "joints": [
            [24, 26, 28]  # Left leg: hip=24, knee=26, ankle=28
        ]
    },
    "pushup": {
        "name": "Push-up",
        "description": "Lower your body by bending your elbows, keeping your body straight",
        "targetAngles": {"start": 160, "end": 90},
        "joints": [
            [12, 14, 16]  # Right arm: shoulder=12, elbow=14, wrist=16
        ]
    },
}


class PoseProcessor:
    """
    PoseProcessor that uses MediaPipe to detect poses and count reps.
    - Bicep curl tracks both arms, storing separate left/right attempts and completions.
    - By default, 80% partial range-of-motion is required to record an attempt.
    """

    def __init__(self, threshold_fraction: float = 0.8):
        """
        :param threshold_fraction: fraction of the range (start_angle - end_angle)
                                   that must be reached for an attempt to count.
                                   e.g. 0.8 => must reach 80% of the way down.
        """
        self.initialized = False
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.pose = None

        self.current_exercise_id = "bicep-curl"
        self.start_angle = 160
        self.end_angle = 60
        self.joint_sets = [[11, 13, 15], [12, 14, 16]]

        # We define a partial range threshold fraction for attempts
        self.threshold_fraction = threshold_fraction

        # We'll keep a small "state" for each set of joints
        # Each item tracks: is_going_up, attempt_count, completion_count
        # Example for left arm, right arm
        self.arm_states = []

        # We'll keep an event log for frames where attempts/completions occur
        self.rep_log = []
        # Each entry: { "frame": X, "arm_index": 0 or 1, "type": "attempt"|"complete" }

    def initialize(self):
        """Load/initialize MediaPipe Pose once."""
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
        Choose which exercise data to use (e.g. "bicep-curl", "squat", "pushup").
        Resets rep counters and states.
        """
        if exercise_id not in EXERCISES:
            raise ValueError(f"Unknown exercise_id '{exercise_id}'. "
                             f"Valid options: {list(EXERCISES.keys())}")

        self.current_exercise_id = exercise_id
        exercise_data = EXERCISES[exercise_id]

        self.start_angle = exercise_data["targetAngles"]["start"]
        self.end_angle = exercise_data["targetAngles"]["end"]
        self.joint_sets = exercise_data["joints"]

        # For each set of joints, define an arm_state
        self.arm_states = []
        for _ in self.joint_sets:
            self.arm_states.append({
                "is_going_up": False,   # whether we've gone below thresholdAngle
                "attempt_count": 0,
                "completion_count": 0
            })

        # Clear the log
        self.rep_log = []

    def process_video(self, video_path: str,
                      highlight_output: bool = False,
                      output_path: str = None) -> dict:
        """
        Process the given video file, compute angles for each set of joints,
        track partial-threshold attempts and completions for each arm set.

        :param video_path: Path to an input .mp4 or other file.
        :param highlight_output: If True, draws the skeleton + angle info on each frame, saved to output_path.
        :param output_path: If highlight_output=True, path to write the annotated .mp4 file.
        :return: Dictionary with final counts, logs, etc.
        """
        if not self.initialized or not self.pose:
            raise RuntimeError("PoseProcessor not initialized. Call initialize() first.")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        writer = None
        if highlight_output and output_path:
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        frame_index = 0

        while True:
            success, frame = cap.read()
            if not success:
                break  # End of video

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(rgb_frame)

            angles = []
            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark
                # For each set of joints, compute angle
                for idx, (p1, p2, p3) in enumerate(self.joint_sets):
                    angle = self._compute_angle(landmarks, width, height, p1, p2, p3)
                    angles.append(angle)
                    self._update_rep_count(angle, idx, frame_index)

            # If highlight requested, overlay skeleton & info on the frame
            if writer:
                self.mp_drawing.draw_landmarks(
                    frame,
                    results.pose_landmarks,
                    self.mp_pose.POSE_CONNECTIONS
                )
                # Build a text string with angles for each arm, e.g. "120,110"
                angle_str = ",".join(f"{int(a)}" for a in angles)
                # Build total completions so far
                left_comp = self.arm_states[0]["completion_count"] if len(self.arm_states) > 0 else 0
                right_comp = self.arm_states[1]["completion_count"] if len(self.arm_states) > 1 else 0
                text = f"{self.current_exercise_id} | Angles: {angle_str} | L:{left_comp} R:{right_comp}"
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

            frame_index += 1

        cap.release()
        if writer:
            writer.release()

        exercise_data = EXERCISES[self.current_exercise_id]

        # Summaries: left, right, total
        left_attempts = self.arm_states[0]["attempt_count"] if len(self.arm_states) > 0 else 0
        left_completions = self.arm_states[0]["completion_count"] if len(self.arm_states) > 0 else 0
        right_attempts = self.arm_states[1]["attempt_count"] if len(self.arm_states) > 1 else 0
        right_completions = self.arm_states[1]["completion_count"] if len(self.arm_states) > 1 else 0

        return {
            "exercise_id": self.current_exercise_id,
            "exercise_name": exercise_data["name"],
            "description": exercise_data["description"],

            # separate attempts & completions
            "left_attempts": left_attempts,
            "left_completions": left_completions,
            "right_attempts": right_attempts,
            "right_completions": right_completions,

            # total attempts & completions
            "total_attempts": left_attempts + right_attempts,
            "total_completions": left_completions + right_completions,

            # frames processed + angles
            "frames_processed": frame_index,
            "angle_start": self.start_angle,
            "angle_end": self.end_angle,
            "threshold_fraction": self.threshold_fraction,

            # event log of attempts/completions
            "rep_log": self.rep_log
        }

    def _compute_angle(self, landmarks, width: int, height: int, p1: int, p2: int, p3: int) -> float:
        """
        Compute angle (in degrees) formed by p1->p2->p3,
        using the approach from your TS code snippet.
        """
        x1, y1 = landmarks[p1].x * width, landmarks[p1].y * height
        x2, y2 = landmarks[p2].x * width, landmarks[p2].y * height
        x3, y3 = landmarks[p3].x * width, landmarks[p3].y * height

        angle_radians = abs(
            math.atan2(y3 - y2, x3 - x2) -
            math.atan2(y1 - y2, x1 - x2)
        )
        angle_degrees = angle_radians * (180 / math.pi)
        return angle_degrees

    def _update_rep_count(self, angle: float, arm_index: int, frame_index: int):
        """
        For each arm, we see if:
          - We pass below the 'thresholdAngle' => 'attempt'
          - Then we pass back above start_angle => 'complete'

        thresholdAngle = start_angle - threshold_fraction * (start_angle - end_angle)
        e.g. if start=160, end=60 => range=100 => thresholdFraction=0.8 => thresholdAngle=160 - 0.8*100=80
        So if angle <= 80 => attempt,
        if angle >= 160 => complete.
        """
        arm_state = self.arm_states[arm_index]

        start_angle = self.start_angle
        end_angle = self.end_angle
        fraction = self.threshold_fraction

        # The angle needed for an attempt
        full_range = start_angle - end_angle
        threshold_angle = start_angle - fraction * full_range  # e.g. 160 - 0.8*(100)=80

        if not arm_state["is_going_up"] and angle <= threshold_angle:
            # user has gone below threshold => attempt
            arm_state["is_going_up"] = True
            arm_state["attempt_count"] += 1
            self.rep_log.append({
                "frame": frame_index,
                "arm_index": arm_index,
                "type": "attempt",
                "angle": angle
            })

        elif arm_state["is_going_up"] and angle >= start_angle:
            # user returned above start => complete
            arm_state["is_going_up"] = False
            arm_state["completion_count"] += 1
            self.rep_log.append({
                "frame": frame_index,
                "arm_index": arm_index,
                "type": "complete",
                "angle": angle
            })
