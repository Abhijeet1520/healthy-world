// Script to submit health data for challenges
const { ethers } = require("hardhat");

// The deployed contract address
const CHALLENGES_CONTRACT_ADDRESS = "0x609b3BbC1fb62F5c6612aB7FA63458d4f572c24e";

/**
 * Submit health data for a challenge
 * @param {number} challengeId - ID of the challenge
 * @param {number} steps - Number of steps 
 * @param {number} waterCups - Number of water cups
 * @param {number} sleepHours - Hours of sleep (can be decimal, e.g. 7.5)
 * @param {number} mindfulMinutes - Minutes of mindfulness
 * @param {string} dataSourceType - Source of data (e.g. 'manual', 'AppleWatch')
 * @param {string} dataSourceId - ID of data source
 * @param {ethers.Signer} signer - Signer to use for transaction
 */
async function submitHealthData(
  challengeId,
  steps,
  waterCups,
  sleepHours,
  mindfulMinutes,
  dataSourceType = "manual",
  dataSourceId = "app",
  signer
) {
  try {
    // Connect to the deployed contract with the user's signer
    const challengesContract = await ethers.getContractAt(
      "HealthyWorldChallenges", 
      CHALLENGES_CONTRACT_ADDRESS,
      signer
    );
    
    // Convert sleep hours to integer representation (e.g. 7.5 -> 750)
    const sleepHoursInt = Math.floor(sleepHours * 100);
    
    // Empty proof data (would be signature for wearable data)
    const proofData = "0x";
    
    console.log(`Submitting health data for challenge ${challengeId}...`);
    console.log(`Steps: ${steps}, Water cups: ${waterCups}, Sleep hours: ${sleepHours}, Mindful minutes: ${mindfulMinutes}`);
    
    const tx = await challengesContract.submitHealthData(
      challengeId,
      steps,
      waterCups,
      sleepHoursInt,
      mindfulMinutes,
      dataSourceType,
      dataSourceId,
      proofData
    );
    
    await tx.wait();
    console.log("Health data submitted successfully!");
    return true;
  } catch (error) {
    console.error("Error submitting health data:", error);
    return false;
  }
}

/**
 * Submit exercise data for a challenge
 * @param {number} challengeId - ID of the challenge
 * @param {string} exerciseName - Name of the exercise (e.g. 'pushup', 'bicep-curl')
 * @param {number} reps - Number of repetitions
 * @param {number} sets - Number of sets
 * @param {ethers.Signer} signer - Signer to use for transaction
 */
async function submitExerciseData(
  challengeId,
  exerciseName,
  reps,
  sets,
  signer
) {
  try {
    // Connect to the deployed contract with the user's signer
    const challengesContract = await ethers.getContractAt(
      "HealthyWorldChallenges", 
      CHALLENGES_CONTRACT_ADDRESS,
      signer
    );
    
    // Empty proof data
    const proofData = "0x";
    
    console.log(`Submitting exercise data for challenge ${challengeId}...`);
    console.log(`Exercise: ${exerciseName}, Reps: ${reps}, Sets: ${sets}`);
    
    const tx = await challengesContract.submitExerciseData(
      challengeId,
      exerciseName,
      reps,
      sets,
      proofData
    );
    
    await tx.wait();
    console.log("Exercise data submitted successfully!");
    return true;
  } catch (error) {
    console.error("Error submitting exercise data:", error);
    return false;
  }
}

// Example usage as main script
async function main() {
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  // Example: Submit health data for challenge 0
  const healthResult = await submitHealthData(
    0,
    10000,  // steps
    8,      // water cups
    7.5,    // sleep hours
    15,     // mindful minutes
    "manual",
    "console-app",
    signer
  );
  
  if (healthResult) {
    console.log("Health data submission successful!");
  }
  
  // Example: Submit exercise data for challenge 0
  const exerciseResult = await submitExerciseData(
    0,
    "bicep-curl",
    12,     // reps
    3,      // sets
    signer
  );
  
  if (exerciseResult) {
    console.log("Exercise data submission successful!");
  }
}

// Execute the script if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

// Export functions to be used by other scripts or the frontend
module.exports = {
  submitHealthData,
  submitExerciseData
}; 