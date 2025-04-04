// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title HealthDataVerification
 * @notice Contract to verify health data from wearables and apps for the HealthyWorld platform
 * @dev Uses cryptographic signatures to verify data authenticity from trusted oracles
 */
contract HealthDataVerification is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // Enum representing the status of data verification
    enum VerificationStatus { 
        Pending,
        Verified,
        Rejected 
    }

    // Struct for a health data submission
    struct HealthData {
        address user;
        bytes32 dataHash;
        uint256 timestamp;
        VerificationStatus status;
        uint256 challengeId;
        string dataType;  // e.g., "steps", "sleep", "workout"
        uint256 value;    // Numerical value of the health metric
        string metadata;  // Additional JSON metadata
    }

    // Mapping from data submission ID to health data
    mapping(bytes32 => HealthData) public healthData;
    
    // Mapping of trusted data oracles
    mapping(address => bool) public trustedOracles;
    
    // Mapping of user's verified submissions (user => dataType => submission IDs)
    mapping(address => mapping(string => bytes32[])) public userSubmissions;

    // Mapping for user health statistics (user => dataType => valueSum)
    mapping(address => mapping(string => uint256)) public userStatistics;
    
    // Mapping for user streaks (user => dataType => consecutive days)
    mapping(address => mapping(string => uint256)) public userStreaks;
    
    // Mapping for user's last activity timestamp (user => dataType => timestamp)
    mapping(address => mapping(string => uint256)) public userLastActivity;

    // Events
    event OracleAdded(address indexed oracle);
    event OracleRemoved(address indexed oracle);
    event HealthDataSubmitted(bytes32 indexed submissionId, address indexed user, string dataType, uint256 value);
    event HealthDataVerified(bytes32 indexed submissionId, address indexed user, string dataType, uint256 value);
    event HealthDataRejected(bytes32 indexed submissionId, address indexed user, string reason);
    event StreakUpdated(address indexed user, string dataType, uint256 streakCount);

    constructor() Ownable() {}

    /**
     * @notice Add a trusted oracle that can verify health data
     * @param oracle Address of the oracle to add
     */
    function addOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "Invalid oracle address");
        require(!trustedOracles[oracle], "Oracle already trusted");
        
        trustedOracles[oracle] = true;
        emit OracleAdded(oracle);
    }

    /**
     * @notice Remove a trusted oracle
     * @param oracle Address of the oracle to remove
     */
    function removeOracle(address oracle) external onlyOwner {
        require(trustedOracles[oracle], "Oracle not trusted");
        
        trustedOracles[oracle] = false;
        emit OracleRemoved(oracle);
    }

    /**
     * @notice Submit health data for verification
     * @param user Address of the user the data belongs to
     * @param dataType Type of health data (e.g., "steps")
     * @param value Numerical value of the health metric
     * @param challengeId ID of the challenge this data is for (0 if not for a specific challenge)
     * @param metadata Additional information in JSON format
     * @return submissionId The ID of the submission
     */
    function submitHealthData(
        address user,
        string calldata dataType,
        uint256 value,
        uint256 challengeId,
        string calldata metadata
    ) external returns (bytes32 submissionId) {
        require(msg.sender == user || trustedOracles[msg.sender], "Unauthorized");
        
        // Create a unique submission ID
        submissionId = keccak256(abi.encodePacked(user, dataType, value, block.timestamp, msg.sender));
        
        // Hash the data for verification
        bytes32 dataHash = keccak256(abi.encodePacked(user, dataType, value, metadata));
        
        // Store the submission
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
        
        emit HealthDataSubmitted(submissionId, user, dataType, value);
        return submissionId;
    }

    /**
     * @notice Verify health data with oracle signature
     * @param submissionId ID of the data submission
     * @param signature Cryptographic signature of the oracle
     */
    function verifyHealthData(bytes32 submissionId, bytes calldata signature) external {
        require(trustedOracles[msg.sender], "Not a trusted oracle");
        
        HealthData storage data = healthData[submissionId];
        require(data.timestamp > 0, "Submission does not exist");
        require(data.status == VerificationStatus.Pending, "Already processed");
        
        // Verify the signature
        bytes32 signHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", data.dataHash));
        address signer = signHash.recover(signature);
        require(trustedOracles[signer], "Invalid signature");
        
        // Update status to verified
        data.status = VerificationStatus.Verified;
        
        // Add to user's submissions
        userSubmissions[data.user][data.dataType].push(submissionId);
        
        // Update user statistics
        userStatistics[data.user][data.dataType] += data.value;
        
        // Update streaks
        updateStreak(data.user, data.dataType);
        
        emit HealthDataVerified(submissionId, data.user, data.dataType, data.value);
    }

    /**
     * @notice Reject invalid health data
     * @param submissionId ID of the data submission
     * @param reason Reason for rejection
     */
    function rejectHealthData(bytes32 submissionId, string calldata reason) external {
        require(trustedOracles[msg.sender] || msg.sender == owner(), "Not authorized");
        
        HealthData storage data = healthData[submissionId];
        require(data.timestamp > 0, "Submission does not exist");
        require(data.status == VerificationStatus.Pending, "Already processed");
        
        // Update status to rejected
        data.status = VerificationStatus.Rejected;
        
        emit HealthDataRejected(submissionId, data.user, reason);
    }

    /**
     * @notice Update user streak for consistent activity
     * @param user User address
     * @param dataType Type of health data
     */
    function updateStreak(address user, string memory dataType) internal {
        uint256 lastActivity = userLastActivity[user][dataType];
        uint256 currentDay = block.timestamp / 86400; // Convert to days
        uint256 lastDay = lastActivity / 86400;
        
        if (lastActivity == 0) {
            // First activity
            userStreaks[user][dataType] = 1;
        } else if (currentDay == lastDay) {
            // Already counted today
            return;
        } else if (currentDay == lastDay + 1) {
            // Consecutive day
            userStreaks[user][dataType]++;
        } else {
            // Streak broken
            userStreaks[user][dataType] = 1;
        }
        
        userLastActivity[user][dataType] = block.timestamp;
        emit StreakUpdated(user, dataType, userStreaks[user][dataType]);
    }

    /**
     * @notice Get a user's submission count for a specific data type
     * @param user User address
     * @param dataType Type of health data
     * @return count Number of verified submissions
     */
    function getUserSubmissionCount(address user, string calldata dataType) external view returns (uint256) {
        return userSubmissions[user][dataType].length;
    }

    /**
     * @notice Get user's current streak for a specific data type
     * @param user User address
     * @param dataType Type of health data
     * @return streak Current streak count
     */
    function getUserStreak(address user, string calldata dataType) external view returns (uint256) {
        return userStreaks[user][dataType];
    }

    /**
     * @notice Get user's total value for a specific data type
     * @param user User address
     * @param dataType Type of health data
     * @return value Total accumulated value
     */
    function getUserStatistic(address user, string calldata dataType) external view returns (uint256) {
        return userStatistics[user][dataType];
    }

    /**
     * @notice Get details of a health data submission
     * @param submissionId ID of the submission
     * @return user User address
     * @return dataType Type of health data
     * @return value Numerical value
     * @return timestamp Submission timestamp
     * @return status Verification status
     */
    function getHealthDataDetails(bytes32 submissionId) external view returns (
        address user,
        string memory dataType,
        uint256 value,
        uint256 timestamp,
        VerificationStatus status
    ) {
        HealthData storage data = healthData[submissionId];
        return (
            data.user,
            data.dataType,
            data.value,
            data.timestamp,
            data.status
        );
    }
} 