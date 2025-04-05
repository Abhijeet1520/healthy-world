// Script to claim rewards for completed challenges
const { ethers } = require("hardhat");

// The deployed contract address
const CHALLENGES_CONTRACT_ADDRESS = "0x609b3BbC1fb62F5c6612aB7FA63458d4f572c24e";

/**
 * Claim rewards for a completed challenge
 * @param {number} challengeId - ID of the challenge
 * @param {ethers.Signer} signer - Signer to use for transaction
 */
async function claimRewards(challengeId, signer) {
  try {
    // Connect to the deployed contract with the user's signer
    const challengesContract = await ethers.getContractAt(
      "HealthyWorldChallenges", 
      CHALLENGES_CONTRACT_ADDRESS,
      signer
    );
    
    console.log(`Claiming rewards for challenge ${challengeId}...`);
    
    // Get the WLD token address from the contract
    const wldTokenAddress = await challengesContract.wldToken();
    
    // Connect to the WLD token contract
    const wldToken = await ethers.getContractAt(
      "WorldHealthToken", 
      wldTokenAddress,
      signer
    );
    
    // Get initial balance
    const initialBalance = await wldToken.balanceOf(signer.address);
    console.log(`Initial WLD balance: ${ethers.utils.formatEther(initialBalance)}`);
    
    // Claim the rewards
    const tx = await challengesContract.claimRewards(challengeId);
    await tx.wait();
    
    // Get new balance
    const newBalance = await wldToken.balanceOf(signer.address);
    console.log(`New WLD balance: ${ethers.utils.formatEther(newBalance)}`);
    console.log(`Claimed ${ethers.utils.formatEther(newBalance.sub(initialBalance))} WLD tokens`);
    
    console.log("Rewards claimed successfully!");
    return true;
  } catch (error) {
    console.error("Error claiming rewards:", error);
    return false;
  }
}

/**
 * Check if a participant has completed a challenge
 * @param {number} challengeId - ID of the challenge
 * @param {string} participantAddress - Address of the participant to check
 * @param {ethers.Signer} signer - Signer to use for transaction
 */
async function checkChallengeCompletion(challengeId, participantAddress, signer) {
  try {
    // Connect to the deployed contract with the signer
    const challengesContract = await ethers.getContractAt(
      "HealthyWorldChallenges", 
      CHALLENGES_CONTRACT_ADDRESS,
      signer
    );
    
    // Get completion status directly from the contract
    const isCompleted = await challengesContract.participantCompletions(challengeId, participantAddress);
    
    console.log(`Challenge ${challengeId} completion status for ${participantAddress}: ${isCompleted ? 'Completed' : 'Not completed'}`);
    
    return isCompleted;
  } catch (error) {
    console.error("Error checking challenge completion:", error);
    return false;
  }
}

/**
 * Get challenge details
 * @param {number} challengeId - ID of the challenge
 * @param {ethers.Signer} signer - Signer to use for transaction
 */
async function getChallengeDetails(challengeId, signer) {
  try {
    // Connect to the deployed contract with the signer
    const challengesContract = await ethers.getContractAt(
      "HealthyWorldChallenges", 
      CHALLENGES_CONTRACT_ADDRESS,
      signer
    );
    
    // Get challenge details
    const details = await challengesContract.getChallengeDetails(challengeId);
    
    const challengeStatus = ["Active", "Judging", "Completed", "Cancelled"];
    const challengeCategory = ["Common", "Exercise", "Nutrition"];
    
    // Format and log the details
    console.log(`\nDetails for Challenge ID ${challengeId}:`);
    console.log(`Name: ${details.name}`);
    console.log(`Description: ${details.description}`);
    console.log(`Category: ${challengeCategory[details.category]}`);
    console.log(`SubType: ${details.subType}`);
    console.log(`Start Date: ${new Date(details.startDate * 1000).toLocaleString()}`);
    console.log(`End Date: ${new Date(details.endDate * 1000).toLocaleString()}`);
    console.log(`Min Stake: ${ethers.utils.formatEther(details.minStake)} WLD`);
    console.log(`Pool Size: ${ethers.utils.formatEther(details.poolSize)} WLD`);
    console.log(`Status: ${challengeStatus[details.status]}`);
    console.log(`Participant Count: ${details.participantCount}`);
    console.log(`Completed Count: ${details.completedCount}`);
    
    return details;
  } catch (error) {
    console.error("Error getting challenge details:", error);
    return null;
  }
}

// Example usage as main script
async function main() {
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  // Example: Get details of challenge 0
  await getChallengeDetails(0, signer);
  
  // Example: Check if the signer has completed challenge 0
  const isCompleted = await checkChallengeCompletion(0, signer.address, signer);
  
  if (isCompleted) {
    // Example: Claim rewards for challenge 0
    await claimRewards(0, signer);
  } else {
    console.log("Cannot claim rewards as challenge is not completed. Submit required data first.");
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
  claimRewards,
  checkChallengeCompletion,
  getChallengeDetails
}; 