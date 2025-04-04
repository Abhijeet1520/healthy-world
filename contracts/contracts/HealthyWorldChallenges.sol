// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title HealthyWorldChallenges
 * @dev This contract manages a system of health/fitness challenges. Users can stake tokens to participate,
 *      judges can verify completion, and participants can claim rewards if they successfully complete.
 *
 * New in this version:
 * - Added an enum `ChallengeCategory` for the challenge's category (Common, Exercise, etc.)
 * - Added a `subType` string to further classify the challenge within that category
 */
contract HealthyWorldChallenges is Ownable, ReentrancyGuard {
    // Reference to the WLD token (ERC20) used for staking and rewards
    IERC20 public wldToken;

    /**
     * @dev Category of the challenge:
     * - Common   = 0
     * - Exercise = 1
     * - Nutrition = 2
     * - (Feel free to add more as needed)
     */
    enum ChallengeCategory { Common, Exercise, Nutrition }

    /**
     * @dev ChallengeStatus:
     *  Active    - Challenge is ongoing, participants can join, submit data, etc.
     *  Judging   - Challenge can be moved to this state if needed for special logic (optional).
     *  Completed - Challenge is finished, participants can claim rewards.
     *  Cancelled - Challenge was cancelled, and stakes are refunded.
     */
    enum ChallengeStatus { Active, Judging, Completed, Cancelled }

    /**
     * @dev JudgeStatus:
     *  Inactive  - Judge is in the system but not active for new challenges.
     *  Active    - Judge is active and can verify completions.
     *  Suspended - Judge is temporarily suspended from verifying.
     */
    enum JudgeStatus { Inactive, Active, Suspended }

    /**
     * @dev Data structure representing a challenge in the system.
     *
     * The new fields are:
     * - category  (enum ChallengeCategory) - a fixed set of categories for the challenge
     * - subType   (string)                - a user-specified subtype or variation
     */
    struct Challenge {
        uint256 id;                         // Unique challenge ID
        string name;                        // Short name/title of the challenge
        string description;                 // Description/purpose of the challenge
        ChallengeCategory category;         // Which category this challenge belongs to
        string subType;                     // Subtype for more specific classification
        uint256 startDate;                  // Unix timestamp when challenge starts
        uint256 endDate;                    // Unix timestamp when challenge ends
        uint256 minStake;                   // Minimum required stake in WLD tokens
        uint256 poolSize;                   // Total amount of WLD tokens staked by participants
        address[] participants;             // Array of all participants
        mapping(address => uint256) participantStakes;      // How much each participant staked
        mapping(address => bool) participantCompletions;    // True if participant is verified as completed
        address[] judges;                   // Addresses of judges assigned to this challenge
        ChallengeStatus status;             // Current status of the challenge
        uint256 completedParticipants;      // Number of participants verified as completed
    }

    /**
     * @dev Data structure representing a judge in the system.
     */
    struct Judge {
        address addr;            // Address of the judge
        string name;             // Name or nickname of the judge
        uint256 reputation;      // Arbitrary reputation score
        JudgeStatus status;      // Current status of the judge (Active, Inactive, Suspended)
    }

    /**
     * @dev Data structure for a participant's health data submission.
     * Example: steps, water intake, or even a pointer to off-chain data like a video IPFS hash.
     */
    struct HealthData {
        uint256 challengeId;      // Which challenge this data is for
        address participant;      // Who submitted the data
        uint256 timestamp;        // When it was submitted
        uint256 steps;            // Example: step count
        uint256 waterCups;        // Example: water intake in cups
        uint256 sleepHours;       // Example: hours of sleep
        uint256 mindfulMinutes;   // Example: minutes of mindfulness
        string dataSourceType;    // e.g., "AppleWatch", "Fitbit", "manual", "video"
        string dataSourceId;      // Device identifier, or IPFS hash for a video, etc.
        bytes proofData;          // Arbitrary proof/signed data for verification
    }

    // A sequential ID assigned to each new challenge
    uint256 public challengeCount;

    // Maps challenge ID => Challenge struct
    mapping(uint256 => Challenge) public challenges;

    // Maps address => Judge struct
    mapping(address => Judge) public judges;
    address[] public judgeAddresses;

    // Health data submissions: challengeId => participant => array of HealthData
    mapping(uint256 => mapping(address => HealthData[])) public healthDataSubmissions;

    /**
     * @dev verifications[chId][participant][judge] = bool (did judge approve participant)
     */
    mapping(uint256 => mapping(address => mapping(address => bool))) public verifications;

    /**
     * @dev approvalCount[chId][participant] = how many judges approved the participant
     */
    mapping(uint256 => mapping(address => uint256)) public approvalCount;

    // -----------------------
    //         EVENTS
    // -----------------------

    event ChallengeCreated(
        uint256 indexed challengeId,
        string name,
        uint256 startDate,
        uint256 endDate,
        ChallengeCategory category,
        string subType
    );

    event ChallengeJoined(uint256 indexed challengeId, address indexed participant, uint256 stakeAmount);
    event HealthDataSubmitted(uint256 indexed challengeId, address indexed participant, uint256 timestamp);
    event JudgeAdded(address indexed judge, string name);
    event JudgeStatusChanged(address indexed judge, JudgeStatus status);
    event ChallengeVerified(uint256 indexed challengeId, address indexed participant, address indexed judge, bool approved);
    event ChallengeCompleted(uint256 indexed challengeId, uint256 totalRewards);
    event RewardsClaimed(uint256 indexed challengeId, address indexed participant, uint256 amount);

    /**
     * @dev Constructor sets the address of the WLD token contract used for staking/rewards.
     * @param _wldToken Address of the WLD token (ERC20) contract
     */
    constructor(address _wldToken) {
        wldToken = IERC20(_wldToken);
        challengeCount = 0;
    }

    /**
     * @dev Create a new challenge with parameters such as name, category, start/end date, min stake, and assigned judges.
     *
     * New parameters vs. previous version:
     * - `_category`  (enum ChallengeCategory): A fixed set of categories (Common, Exercise, etc.)
     * - `_subType`   (string): Arbitrary user-defined subtype or variation within that category.
     *
     * Requirements:
     * - `_startDate` > current block time
     * - `_endDate` > `_startDate`
     * - `_minStake` > 0
     * - Each address in `_judges` must already exist and have status == JudgeStatus.Active
     */
    function createChallenge(
        string memory _name,
        string memory _description,
        ChallengeCategory _category,
        string memory _subType,
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
        newChallenge.category = _category;
        newChallenge.subType = _subType;
        newChallenge.startDate = _startDate;
        newChallenge.endDate = _endDate;
        newChallenge.minStake = _minStake;
        newChallenge.status = ChallengeStatus.Active;

        // Add judges
        for (uint256 i = 0; i < _judges.length; i++) {
            require(judges[_judges[i]].status == JudgeStatus.Active, "Invalid judge");
            newChallenge.judges.push(_judges[i]);
        }

        emit ChallengeCreated(challengeId, _name, _startDate, _endDate, _category, _subType);
    }

    /**
     * @dev Join a challenge by staking WLD tokens.
     *
     * Requirements:
     * - Challenge must be Active
     * - Current block time < challenge.endDate
     * - `_stakeAmount` >= challenge.minStake
     * - Participant hasn't already joined
     */
    function joinChallenge(uint256 _challengeId, uint256 _stakeAmount) external nonReentrant {
        Challenge storage challenge = challenges[_challengeId];

        require(challenge.status == ChallengeStatus.Active, "Challenge is not active");
        require(block.timestamp < challenge.endDate, "Challenge has ended");
        require(_stakeAmount >= challenge.minStake, "Stake amount too low");
        require(challenge.participantStakes[msg.sender] == 0, "Already joined");

        // Transfer the staking tokens from the participant to this contract
        require(wldToken.transferFrom(msg.sender, address(this), _stakeAmount), "Token transfer failed");

        // Record the participant
        challenge.participants.push(msg.sender);
        challenge.participantStakes[msg.sender] = _stakeAmount;
        challenge.poolSize += _stakeAmount;

        emit ChallengeJoined(_challengeId, msg.sender, _stakeAmount);
    }

    /**
     * @dev Submit health data for a challenge. (E.g., steps, water, or even a pointer to a video.)
     *
     * Requirements:
     * - Challenge must be Active
     * - Current block time between [challenge.startDate, challenge.endDate]
     * - Caller must be a participant in the challenge
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

        // Build the HealthData record
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

        // Store the data submission
        healthDataSubmissions[_challengeId][msg.sender].push(data);

        emit HealthDataSubmitted(_challengeId, msg.sender, block.timestamp);
    }

    /**
     * @dev Add a new judge to the system. The judge can be assigned to future challenges.
     * @param _judge Address of the judge
     * @param _name Human-readable judge name
     */
    function addJudge(address _judge, string memory _name) external onlyOwner {
        require(_judge != address(0), "Invalid address");
        require(judges[_judge].addr == address(0), "Judge already exists");

        Judge memory newJudge = Judge({
            addr: _judge,
            name: _name,
            reputation: 100, // Default starting reputation
            status: JudgeStatus.Active
        });

        judges[_judge] = newJudge;
        judgeAddresses.push(_judge);

        emit JudgeAdded(_judge, _name);
    }

    /**
     * @dev Change the status of an existing judge (e.g., Active, Suspended, etc.).
     * @param _judge Address of the judge
     * @param _status New status for that judge
     */
    function changeJudgeStatus(address _judge, JudgeStatus _status) external onlyOwner {
        require(judges[_judge].addr != address(0), "Judge does not exist");
        judges[_judge].status = _status;
        emit JudgeStatusChanged(_judge, _status);
    }

    /**
     * @dev Verify a participant's completion of a challenge. Judges call this after reviewing data.
     * @param _challengeId ID of the challenge
     * @param _participant Address of the participant
     * @param _approved Whether the participant completed the challenge successfully
     *
     * Requirements:
     * - Caller must be one of the challenge's judges
     * - Judge must be active
     * - Challenge must be in Active or Judging status
     * - The participant must be in this challenge
     */
    function verifyCompletion(uint256 _challengeId, address _participant, bool _approved) external {
        Challenge storage challenge = challenges[_challengeId];

        // Check if caller is a judge for this challenge
        bool isJudge = false;
        for (uint256 i = 0; i < challenge.judges.length; i++) {
            if (challenge.judges[i] == msg.sender) {
                isJudge = true;
                break;
            }
        }
        require(isJudge, "Not a judge for this challenge");
        require(judges[msg.sender].status == JudgeStatus.Active, "Judge is not active");

        // Challenge must be active or in judging state
        require(challenge.status == ChallengeStatus.Active || challenge.status == ChallengeStatus.Judging, "Challenge not in judging phase");

        // Ensure participant is valid
        require(challenge.participantStakes[_participant] > 0, "Not a participant");

        // Record the judge's verification
        verifications[_challengeId][_participant][msg.sender] = _approved;

        if (_approved) {
            approvalCount[_challengeId][_participant]++;

            // If more than half of the judges have approved, mark as completed
            if (approvalCount[_challengeId][_participant] > challenge.judges.length / 2) {
                challenge.participantCompletions[_participant] = true;
                challenge.completedParticipants++;
            }
        }

        emit ChallengeVerified(_challengeId, _participant, msg.sender, _approved);
    }

    /**
     * @dev Complete a challenge and mark it as no longer active. Rewards can then be claimed.
     * @param _challengeId ID of the challenge
     *
     * Requirements:
     * - Only the owner can do this
     * - Challenge must be Active or Judging
     * - block.timestamp > challenge.endDate
     */
    function completeChallenge(uint256 _challengeId) external onlyOwner {
        Challenge storage challenge = challenges[_challengeId];

        require(challenge.status == ChallengeStatus.Active || challenge.status == ChallengeStatus.Judging, "Challenge cannot be completed");
        require(block.timestamp > challenge.endDate, "Challenge has not ended");

        challenge.status = ChallengeStatus.Completed;

        emit ChallengeCompleted(_challengeId, challenge.poolSize);
    }

    /**
     * @dev Participants who have completed a challenge (verified) can claim their share of the pool.
     * @param _challengeId ID of the challenge
     *
     * Requirements:
     * - Challenge must be Completed
     * - Caller must be verified as completed
     */
    function claimRewards(uint256 _challengeId) external nonReentrant {
        Challenge storage challenge = challenges[_challengeId];

        require(challenge.status == ChallengeStatus.Completed, "Challenge not completed");
        require(challenge.participantCompletions[msg.sender], "Did not complete challenge");
        require(challenge.participantStakes[msg.sender] > 0, "No stake found");

        // Basic logic: the participant’s reward is their original stake plus
        // a share of the unclaimed pool from participants who did not complete.

        uint256 stake = challenge.participantStakes[msg.sender];
        uint256 reward = stake;

        // If not all participants completed, distribute the unclaimed portion among the successful participants
        if (challenge.completedParticipants < challenge.participants.length) {
            uint256 unclaimedPool = challenge.poolSize;
            // Subtract the stake for each successful participant from the total
            unclaimedPool -= challenge.completedParticipants * stake;
            // Divide the leftover among the completed participants
            reward += (unclaimedPool / challenge.completedParticipants);
        }

        // Zero out their stake so they can’t claim again
        challenge.participantStakes[msg.sender] = 0;

        // Transfer the tokens to the participant
        require(wldToken.transfer(msg.sender, reward), "Token transfer failed");

        emit RewardsClaimed(_challengeId, msg.sender, reward);
    }

    /**
     * @dev Cancel a challenge prematurely, refunding all stakes.
     * @param _challengeId ID of the challenge
     *
     * Requirements:
     * - Challenge must not be already completed or cancelled
     */
    function cancelChallenge(uint256 _challengeId) external onlyOwner {
        Challenge storage challenge = challenges[_challengeId];

        require(
            challenge.status != ChallengeStatus.Completed && challenge.status != ChallengeStatus.Cancelled,
            "Challenge already completed or cancelled"
        );

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

    // ---------------------------------------------------
    //                GETTER FUNCTIONS
    // ---------------------------------------------------

    /**
     * @dev Returns a variety of challenge details by ID, including the new `category` and `subType`.
     */
    function getChallengeDetails(uint256 _challengeId)
        external
        view
        returns (
            string memory name,
            string memory description,
            ChallengeCategory category,
            string memory subType,
            uint256 startDate,
            uint256 endDate,
            uint256 minStake,
            uint256 poolSize,
            ChallengeStatus status,
            uint256 participantCount,
            uint256 completedCount
        )
    {
        Challenge storage challenge = challenges[_challengeId];
        return (
            challenge.name,
            challenge.description,
            challenge.category,
            challenge.subType,
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
     * @dev Returns the array of participant addresses for a challenge.
     */
    function getChallengeParticipants(uint256 _challengeId) external view returns (address[] memory) {
        return challenges[_challengeId].participants;
    }

    /**
     * @dev Returns the array of judge addresses for a challenge.
     */
    function getChallengeJudges(uint256 _challengeId) external view returns (address[] memory) {
        return challenges[_challengeId].judges;
    }

    /**
     * @dev Returns the number of health data submissions for a participant in a challenge.
     */
    function getHealthDataCount(uint256 _challengeId, address _participant) external view returns (uint256) {
        return healthDataSubmissions[_challengeId][_participant].length;
    }

    /**
     * @dev Returns a specific HealthData entry for a participant in a challenge.
     */
    function getHealthData(
        uint256 _challengeId,
        address _participant,
        uint256 _index
    )
        external
        view
        returns (
            uint256 timestamp,
            uint256 steps,
            uint256 waterCups,
            uint256 sleepHours,
            uint256 mindfulMinutes,
            string memory dataSourceType
        )
    {
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
}
