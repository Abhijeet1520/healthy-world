// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title HealthyWorldChallenges
 * @dev Contract for managing fitness challenges, staking, and rewards
 */
contract HealthyWorldChallenges is Ownable, ReentrancyGuard {
    // Token used for staking and rewards
    IERC20 public wldToken;
    
    // Challenge status enum
    enum ChallengeStatus { Active, Judging, Completed, Cancelled }
    
    // Judge status enum
    enum JudgeStatus { Inactive, Active, Suspended }
    
    // Challenge struct
    struct Challenge {
        uint256 id;
        string name;
        string description;
        uint256 startDate;
        uint256 endDate;
        uint256 minStake;
        uint256 poolSize;
        address[] participants;
        mapping(address => uint256) participantStakes;
        mapping(address => bool) participantCompletions;
        address[] judges;
        ChallengeStatus status;
        uint256 completedParticipants;
    }
    
    // Judge struct
    struct Judge {
        address addr;
        string name;
        uint256 reputation;
        JudgeStatus status;
    }
    
    // Participant health data struct
    struct HealthData {
        uint256 challengeId;
        address participant;
        uint256 timestamp;
        uint256 steps;
        uint256 waterCups;
        uint256 sleepHours;
        uint256 mindfulMinutes;
        string dataSourceType; // e.g., "AppleWatch", "Fitbit", "manual"
        string dataSourceId;   // Device ID or identifier
        bytes proofData;       // Could be a hash or signature from the device
    }
    
    // Array of challenges
    uint256 public challengeCount;
    mapping(uint256 => Challenge) public challenges;
    
    // Array of judges
    mapping(address => Judge) public judges;
    address[] public judgeAddresses;
    
    // Health data submissions
    mapping(uint256 => mapping(address => HealthData[])) public healthDataSubmissions;
    
    // Challenge verification results
    mapping(uint256 => mapping(address => mapping(address => bool))) public verifications; // challengeId => participant => judge => approved
    mapping(uint256 => mapping(address => uint256)) public approvalCount; // challengeId => participant => count of approvals
    
    // Events
    event ChallengeCreated(uint256 indexed challengeId, string name, uint256 startDate, uint256 endDate);
    event ChallengeJoined(uint256 indexed challengeId, address indexed participant, uint256 stakeAmount);
    event HealthDataSubmitted(uint256 indexed challengeId, address indexed participant, uint256 timestamp);
    event JudgeAdded(address indexed judge, string name);
    event JudgeStatusChanged(address indexed judge, JudgeStatus status);
    event ChallengeVerified(uint256 indexed challengeId, address indexed participant, address indexed judge, bool approved);
    event ChallengeCompleted(uint256 indexed challengeId, uint256 totalRewards);
    event RewardsClaimed(uint256 indexed challengeId, address indexed participant, uint256 amount);
    
    /**
     * @dev Constructor to set the WLD token address
     * @param _wldToken Address of the WLD token contract
     */
    constructor(address _wldToken) {
        wldToken = IERC20(_wldToken);
        challengeCount = 0;
    }
    
    /**
     * @dev Create a new challenge
     * @param _name Challenge name
     * @param _description Challenge description
     * @param _startDate Challenge start date (Unix timestamp)
     * @param _endDate Challenge end date (Unix timestamp)
     * @param _minStake Minimum stake amount in WLD tokens
     * @param _judges Array of judge addresses for this challenge
     */
    function createChallenge(
        string memory _name,
        string memory _description,
        uint256 _startDate,
        uint256 _endDate,
        uint256 _minStake,
        address[] memory _judges
    ) external onlyOwner {
        require(_startDate > block.timestamp, "Start date must be in the future");
        require(_endDate > _startDate, "End date must be after start date");
        require(_minStake > 0, "Minimum stake must be greater than 0");
        
        uint256 challengeId = challengeCount++;
        Challenge storage newChallenge = challenges[challengeId];
        newChallenge.id = challengeId;
        newChallenge.name = _name;
        newChallenge.description = _description;
        newChallenge.startDate = _startDate;
        newChallenge.endDate = _endDate;
        newChallenge.minStake = _minStake;
        newChallenge.status = ChallengeStatus.Active;
        
        // Add judges
        for (uint256 i = 0; i < _judges.length; i++) {
            require(judges[_judges[i]].status == JudgeStatus.Active, "Invalid judge");
            newChallenge.judges.push(_judges[i]);
        }
        
        emit ChallengeCreated(challengeId, _name, _startDate, _endDate);
    }
    
    /**
     * @dev Join a challenge by staking WLD tokens
     * @param _challengeId ID of the challenge to join
     * @param _stakeAmount Amount of WLD tokens to stake
     */
    function joinChallenge(uint256 _challengeId, uint256 _stakeAmount) external nonReentrant {
        Challenge storage challenge = challenges[_challengeId];
        
        require(challenge.status == ChallengeStatus.Active, "Challenge is not active");
        require(block.timestamp < challenge.endDate, "Challenge has ended");
        require(_stakeAmount >= challenge.minStake, "Stake amount too low");
        require(challenge.participantStakes[msg.sender] == 0, "Already joined");
        
        // Transfer tokens from participant to contract
        require(wldToken.transferFrom(msg.sender, address(this), _stakeAmount), "Token transfer failed");
        
        // Add participant to challenge
        challenge.participants.push(msg.sender);
        challenge.participantStakes[msg.sender] = _stakeAmount;
        challenge.poolSize += _stakeAmount;
        
        emit ChallengeJoined(_challengeId, msg.sender, _stakeAmount);
    }
    
    /**
     * @dev Submit health data for a challenge
     * @param _challengeId ID of the challenge
     * @param _steps Step count
     * @param _waterCups Water intake in cups
     * @param _sleepHours Sleep duration in hours (can be fractional)
     * @param _mindfulMinutes Mindfulness minutes
     * @param _dataSourceType Type of data source (e.g., "AppleWatch", "Fitbit")
     * @param _dataSourceId Device ID or identifier
     * @param _proofData Proof data or signature from the device
     */
    function submitHealthData(
        uint256 _challengeId,
        uint256 _steps,
        uint256 _waterCups,
        uint256 _sleepHours,
        uint256 _mindfulMinutes,
        string memory _dataSourceType,
        string memory _dataSourceId,
        bytes memory _proofData
    ) external {
        Challenge storage challenge = challenges[_challengeId];
        
        require(challenge.status == ChallengeStatus.Active, "Challenge is not active");
        require(block.timestamp >= challenge.startDate, "Challenge has not started");
        require(block.timestamp <= challenge.endDate, "Challenge has ended");
        require(challenge.participantStakes[msg.sender] > 0, "Not a participant");
        
        // Create health data record
        HealthData memory data = HealthData({
            challengeId: _challengeId,
            participant: msg.sender,
            timestamp: block.timestamp,
            steps: _steps,
            waterCups: _waterCups,
            sleepHours: _sleepHours,
            mindfulMinutes: _mindfulMinutes,
            dataSourceType: _dataSourceType,
            dataSourceId: _dataSourceId,
            proofData: _proofData
        });
        
        // Store the data
        healthDataSubmissions[_challengeId][msg.sender].push(data);
        
        emit HealthDataSubmitted(_challengeId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Add a new judge
     * @param _judge Address of the judge
     * @param _name Name of the judge
     */
    function addJudge(address _judge, string memory _name) external onlyOwner {
        require(_judge != address(0), "Invalid address");
        require(judges[_judge].addr == address(0), "Judge already exists");
        
        Judge memory newJudge = Judge({
            addr: _judge,
            name: _name,
            reputation: 100, // Default reputation
            status: JudgeStatus.Active
        });
        
        judges[_judge] = newJudge;
        judgeAddresses.push(_judge);
        
        emit JudgeAdded(_judge, _name);
    }
    
    /**
     * @dev Change judge status
     * @param _judge Address of the judge
     * @param _status New status
     */
    function changeJudgeStatus(address _judge, JudgeStatus _status) external onlyOwner {
        require(judges[_judge].addr != address(0), "Judge does not exist");
        
        judges[_judge].status = _status;
        
        emit JudgeStatusChanged(_judge, _status);
    }
    
    /**
     * @dev Verify a participant's completion of a challenge
     * @param _challengeId ID of the challenge
     * @param _participant Address of the participant
     * @param _approved Whether the participant completed the challenge
     */
    function verifyCompletion(uint256 _challengeId, address _participant, bool _approved) external {
        Challenge storage challenge = challenges[_challengeId];
        
        // Ensure sender is a judge for this challenge
        bool isJudge = false;
        for (uint256 i = 0; i < challenge.judges.length; i++) {
            if (challenge.judges[i] == msg.sender) {
                isJudge = true;
                break;
            }
        }
        require(isJudge, "Not a judge for this challenge");
        require(judges[msg.sender].status == JudgeStatus.Active, "Judge is not active");
        
        // Ensure challenge status
        require(challenge.status == ChallengeStatus.Active || challenge.status == ChallengeStatus.Judging, "Challenge not in judging phase");
        
        // Ensure participant is in the challenge
        require(challenge.participantStakes[_participant] > 0, "Not a participant");
        
        // Record verification
        verifications[_challengeId][_participant][msg.sender] = _approved;
        
        if (_approved) {
            approvalCount[_challengeId][_participant]++;
            
            // Check if this participant has enough approvals to be considered completed
            // Requirement: More than 50% of judges approve
            if (approvalCount[_challengeId][_participant] > challenge.judges.length / 2) {
                challenge.participantCompletions[_participant] = true;
                challenge.completedParticipants++;
            }
        }
        
        emit ChallengeVerified(_challengeId, _participant, msg.sender, _approved);
    }
    
    /**
     * @dev Complete a challenge and distribute rewards
     * @param _challengeId ID of the challenge to complete
     */
    function completeChallenge(uint256 _challengeId) external onlyOwner {
        Challenge storage challenge = challenges[_challengeId];
        
        require(challenge.status == ChallengeStatus.Active || challenge.status == ChallengeStatus.Judging, "Challenge cannot be completed");
        require(block.timestamp > challenge.endDate, "Challenge has not ended");
        
        // Set challenge as completed
        challenge.status = ChallengeStatus.Completed;
        
        emit ChallengeCompleted(_challengeId, challenge.poolSize);
    }
    
    /**
     * @dev Claim rewards for completing a challenge
     * @param _challengeId ID of the challenge
     */
    function claimRewards(uint256 _challengeId) external nonReentrant {
        Challenge storage challenge = challenges[_challengeId];
        
        require(challenge.status == ChallengeStatus.Completed, "Challenge not completed");
        require(challenge.participantCompletions[msg.sender], "Did not complete challenge");
        require(challenge.participantStakes[msg.sender] > 0, "No stake found");
        
        // Calculate reward amount
        // Formula: Your stake + (proportional share of non-completing participants' stakes)
        uint256 stake = challenge.participantStakes[msg.sender];
        uint256 reward = stake;
        
        if (challenge.completedParticipants < challenge.participants.length) {
            uint256 unclaimedPool = challenge.poolSize;
            unclaimedPool -= challenge.completedParticipants * stake;
            reward += (unclaimedPool / challenge.completedParticipants);
        }
        
        // Reset stake to prevent double claims
        challenge.participantStakes[msg.sender] = 0;
        
        // Transfer reward to participant
        require(wldToken.transfer(msg.sender, reward), "Token transfer failed");
        
        emit RewardsClaimed(_challengeId, msg.sender, reward);
    }
    
    /**
     * @dev Get challenge details
     * @param _challengeId ID of the challenge
     * @return name Challenge name
     * @return description Challenge description
     * @return startDate Challenge start date
     * @return endDate Challenge end date
     * @return minStake Minimum stake amount
     * @return poolSize Challenge pool size
     * @return status Challenge status
     * @return participantCount Number of participants
     * @return completedCount Number of completed participants
     */
    function getChallengeDetails(uint256 _challengeId) external view returns (
        string memory name,
        string memory description,
        uint256 startDate,
        uint256 endDate,
        uint256 minStake,
        uint256 poolSize,
        ChallengeStatus status,
        uint256 participantCount,
        uint256 completedCount
    ) {
        Challenge storage challenge = challenges[_challengeId];
        
        return (
            challenge.name,
            challenge.description,
            challenge.startDate,
            challenge.endDate,
            challenge.minStake,
            challenge.poolSize,
            challenge.status,
            challenge.participants.length,
            challenge.completedParticipants
        );
    }
    
    /**
     * @dev Get challenge participants
     * @param _challengeId ID of the challenge
     * @return participants Array of participant addresses
     */
    function getChallengeParticipants(uint256 _challengeId) external view returns (address[] memory) {
        return challenges[_challengeId].participants;
    }
    
    /**
     * @dev Get challenge judges
     * @param _challengeId ID of the challenge
     * @return judges Array of judge addresses
     */
    function getChallengeJudges(uint256 _challengeId) external view returns (address[] memory) {
        return challenges[_challengeId].judges;
    }
    
    /**
     * @dev Get participant health data for a challenge
     * @param _challengeId ID of the challenge
     * @param _participant Address of the participant
     * @return count Number of health data submissions
     */
    function getHealthDataCount(uint256 _challengeId, address _participant) external view returns (uint256) {
        return healthDataSubmissions[_challengeId][_participant].length;
    }
    
    /**
     * @dev Get specific health data entry
     * @param _challengeId ID of the challenge
     * @param _participant Address of the participant
     * @param _index Index of the health data entry
     * @return timestamp Timestamp of data submission
     * @return steps Step count
     * @return waterCups Water intake in cups
     * @return sleepHours Sleep hours
     * @return mindfulMinutes Mindfulness minutes
     * @return dataSourceType Type of data source
     */
    function getHealthData(uint256 _challengeId, address _participant, uint256 _index) external view returns (
        uint256 timestamp,
        uint256 steps,
        uint256 waterCups,
        uint256 sleepHours,
        uint256 mindfulMinutes,
        string memory dataSourceType
    ) {
        HealthData memory data = healthDataSubmissions[_challengeId][_participant][_index];
        
        return (
            data.timestamp,
            data.steps,
            data.waterCups,
            data.sleepHours,
            data.mindfulMinutes,
            data.dataSourceType
        );
    }
    
    /**
     * @dev Emergency function to cancel a challenge and return all stakes
     * @param _challengeId ID of the challenge to cancel
     */
    function cancelChallenge(uint256 _challengeId) external onlyOwner {
        Challenge storage challenge = challenges[_challengeId];
        
        require(challenge.status != ChallengeStatus.Completed && challenge.status != ChallengeStatus.Cancelled, "Challenge already completed or cancelled");
        
        challenge.status = ChallengeStatus.Cancelled;
        
        // Return stakes to all participants
        for (uint256 i = 0; i < challenge.participants.length; i++) {
            address participant = challenge.participants[i];
            uint256 stake = challenge.participantStakes[participant];
            
            if (stake > 0) {
                challenge.participantStakes[participant] = 0;
                wldToken.transfer(participant, stake);
            }
        }
    }
} 