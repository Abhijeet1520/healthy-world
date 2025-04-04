// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title HealthDataVerification
 * @notice Contract to verify health data from wearables and apps for the HealthyWorld platform.
 * @dev Uses cryptographic signatures to verify data authenticity from trusted oracles.
 *      This can be used in combination with the challenges system to provide an extra layer of verification.
 *
 * Example Usage:
 * - A user or a trusted oracle calls submitHealthData with details of some metric (e.g., steps).
 * - A trusted oracle can then verify it with an ECDSA signature.
 * - The data is stored on-chain with a status (Pending, Verified, Rejected).
 */
contract HealthDataVerification is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // Status values for each submitted piece of data
    enum VerificationStatus {
        Pending,
        Verified,
        Rejected
    }

    // Struct representing a single health data submission
    struct HealthData {
        address user;              // Address of the user who performed the activity
        bytes32 dataHash;          // Keccak256 hash of the relevant data
        uint256 timestamp;         // When it was submitted
        VerificationStatus status; // Current verification status
        uint256 challengeId;       // Challenge ID, if this data is for a specific challenge
        string dataType;           // e.g., "steps", "sleep", "workout", "reps"
        uint256 value;             // Numerical value of the metric
        string metadata;           // Arbitrary JSON metadata
    }

    // Maps a submission ID to its HealthData record
    mapping(bytes32 => HealthData) public healthData;

    // Trusted oracles who can sign or verify data
    mapping(address => bool) public trustedOracles;

    // Keep track of user submissions: user => dataType => array of submission IDs
    mapping(address => mapping(string => bytes32[])) public userSubmissions;

    // Summaries for convenience: user => dataType => total sum of verified values
    mapping(address => mapping(string => uint256)) public userStatistics;

    // Example: track streaks for daily activities
    mapping(address => mapping(string => uint256)) public userStreaks;
    mapping(address => mapping(string => uint256)) public userLastActivity;

    // -----------------------
    //         EVENTS
    // -----------------------
    event OracleAdded(address indexed oracle);
    event OracleRemoved(address indexed oracle);
    event HealthDataSubmitted(bytes32 indexed submissionId, address indexed user, string dataType, uint256 value);
    event HealthDataVerified(bytes32 indexed submissionId, address indexed user, string dataType, uint256 value);
    event HealthDataRejected(bytes32 indexed submissionId, address indexed user, string reason);
    event StreakUpdated(address indexed user, string dataType, uint256 streakCount);

    /**
     * @dev Constructor
     */
    constructor() Ownable() {}

    /**
     * @notice Add a trusted oracle who can verify health data.
     * @param oracle Address of the oracle to add.
     */
    function addOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "Invalid oracle address");
        require(!trustedOracles[oracle], "Oracle already trusted");
        trustedOracles[oracle] = true;
        emit OracleAdded(oracle);
    }

    /**
     * @notice Remove a trusted oracle.
     * @param oracle Address of the oracle to remove.
     */
    function removeOracle(address oracle) external onlyOwner {
        require(trustedOracles[oracle], "Oracle not trusted");
        trustedOracles[oracle] = false;
        emit OracleRemoved(oracle);
    }

    /**
     * @notice Submit health data for verification.
     * @param user The address of the user the data belongs to.
     * @param dataType Type of health data, e.g. "steps", "workout", "reps".
     * @param value Numerical value (e.g., step count, or rep count).
     * @param challengeId ID of the relevant challenge, or 0 if none.
     * @param metadata Arbitrary JSON data for additional details (e.g. device ID, angle analysis, etc.).
     * @return submissionId A unique ID for this submission.
     */
    function submitHealthData(
        address user,
        string calldata dataType,
        uint256 value,
        uint256 challengeId,
        string calldata metadata
    )
        external
        returns (bytes32 submissionId)
    {
        // If you prefer a different rule, adjust as needed:
        require(msg.sender == user || trustedOracles[msg.sender], "Unauthorized submitter");

        // Create a unique submission ID
        submissionId = keccak256(abi.encodePacked(user, dataType, value, block.timestamp, msg.sender));

        // Create a data hash for reference or future signature checks
        bytes32 dataHash = keccak256(abi.encodePacked(user, dataType, value, metadata));

        // Store
        healthData[submissionId] = HealthData({
            user: user,
            dataHash: dataHash,
            timestamp: block.timestamp,
            status: VerificationStatus.Pending,
            challengeId: challengeId,
            dataType: dataType,
            value: value,
            metadata: metadata
        });

        userSubmissions[user][dataType].push(submissionId);

        emit HealthDataSubmitted(submissionId, user, dataType, value);
        return submissionId;
    }

    /**
     * @notice Verify previously submitted health data with a signature from a trusted oracle.
     * @param submissionId The ID of the submission to verify.
     * @param signature The ECDSA signature from a trusted oracle.
     */
    function verifyHealthData(bytes32 submissionId, bytes calldata signature) external {
        require(trustedOracles[msg.sender], "Caller is not a trusted oracle");

        HealthData storage data = healthData[submissionId];
        require(data.timestamp > 0, "Submission not found");
        require(data.status == VerificationStatus.Pending, "Already processed");

        // Recreate the hash used for the signature
        bytes32 signHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", data.dataHash)
        );

        // Recover the address that signed this data
        address signer = signHash.recover(signature);
        require(trustedOracles[signer], "Invalid signature");

        // Mark as verified
        data.status = VerificationStatus.Verified;

        // Update user statistics
        userStatistics[data.user][data.dataType] += data.value;

        // Update user streak if this data counts as a daily activity
        updateStreak(data.user, data.dataType);

        emit HealthDataVerified(submissionId, data.user, data.dataType, data.value);
    }

    /**
     * @notice Reject an invalid or fraudulent submission.
     * @param submissionId The ID of the submission to reject.
     * @param reason Reason for rejecting, e.g., "Data not consistent".
     */
    function rejectHealthData(bytes32 submissionId, string calldata reason) external {
        // Both trusted oracles and the contract owner can reject data
        require(trustedOracles[msg.sender] || msg.sender == owner(), "Not authorized to reject");

        HealthData storage data = healthData[submissionId];
        require(data.timestamp > 0, "Submission does not exist");
        require(data.status == VerificationStatus.Pending, "Already processed");

        data.status = VerificationStatus.Rejected;
        emit HealthDataRejected(submissionId, data.user, reason);
    }

    /**
     * @notice Internal function to track daily streaks for any data type.
     * @param user The user address.
     * @param dataType The type of data (e.g., "steps").
     */
    function updateStreak(address user, string memory dataType) internal {
        uint256 lastActivity = userLastActivity[user][dataType];
        uint256 currentDay = block.timestamp / 86400; // # of days since epoch
        uint256 lastDay = lastActivity / 86400;

        if (lastActivity == 0) {
            // First time submission
            userStreaks[user][dataType] = 1;
        } else if (currentDay == lastDay) {
            // Already counted today, do nothing
            return;
        } else if (currentDay == lastDay + 1) {
            // Next consecutive day
            userStreaks[user][dataType]++;
        } else {
            // Gap in days => streak resets
            userStreaks[user][dataType] = 1;
        }

        userLastActivity[user][dataType] = block.timestamp;
        emit StreakUpdated(user, dataType, userStreaks[user][dataType]);
    }

    // -----------------------
    //       VIEW FUNCTIONS
    // -----------------------

    /**
     * @notice Returns how many verified submissions a user has for a particular data type.
     */
    function getUserSubmissionCount(address user, string calldata dataType)
        external
        view
        returns (uint256)
    {
        return userSubmissions[user][dataType].length;
    }

    /**
     * @notice Returns the user's current streak for a given data type.
     */
    function getUserStreak(address user, string calldata dataType)
        external
        view
        returns (uint256)
    {
        return userStreaks[user][dataType];
    }

    /**
     * @notice Returns the user's total verified value for a data type (e.g., total steps).
     */
    function getUserStatistic(address user, string calldata dataType)
        external
        view
        returns (uint256)
    {
        return userStatistics[user][dataType];
    }

    /**
     * @notice Returns a subset of the HealthData struct for an existing submission.
     */
    function getHealthDataDetails(bytes32 submissionId)
        external
        view
        returns (
            address user,
            string memory dataType,
            uint256 value,
            uint256 timestamp,
            VerificationStatus status
        )
    {
        HealthData storage d = healthData[submissionId];
        return (
            d.user,
            d.dataType,
            d.value,
            d.timestamp,
            d.status
        );
    }
}
