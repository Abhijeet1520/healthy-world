// Script to create and manage challenges on the HealthyWorldChallenges contract
const { ethers } = require("hardhat");

// The deployed contract address
const CHALLENGES_CONTRACT_ADDRESS = "0x609b3BbC1fb62F5c6612aB7FA63458d4f572c24e";

// Enums for challenge status and categories (matching the contract's enums)
const ChallengeCategory = {
  Common: 0,
  Exercise: 1,
  Nutrition: 2
};

// Predefined challenges based on the frontend
const challengesToCreate = [
  {
    name: "10 Bicep Curls a Day",
    description: "Complete 10 bicep curls daily for 5 consecutive days. Boost your arm strength!",
    category: ChallengeCategory.Exercise,
    subType: "bicep-curl",
    startDate: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60, // 7 days ago
    endDate: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,   // 7 days from now
    minStake: ethers.utils.parseEther("50"), // 50 WLD tokens
    judges: [] // To be filled with judge addresses
  },
  {
    name: "Hydration Hero",
    description: "Drink 8 cups of water daily for 7 consecutive days. Stay hydrated for optimal health!",
    category: ChallengeCategory.Nutrition,
    subType: "water",
    startDate: Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60, // 10 days ago
    endDate: Math.floor(Date.now() / 1000) + 4 * 24 * 60 * 60,    // 4 days from now
    minStake: ethers.utils.parseEther("100"), // 100 WLD tokens
    judges: [] // To be filled with judge addresses
  }
];

async function main() {
  // Get the deployer account
  const [deployer, ...judges] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  
  // Add judges to the challenges
  challengesToCreate.forEach(challenge => {
    // Assign first two judges from our accounts
    challenge.judges = judges.slice(0, 2).map(judge => judge.address);
  });
  
  // Connect to the deployed contract
  const challengesContract = await ethers.getContractAt(
    "HealthyWorldChallenges", 
    CHALLENGES_CONTRACT_ADDRESS,
    deployer
  );
  
  // Get the WLD token address from the contract
  const wldTokenAddress = await challengesContract.wldToken();
  console.log(`WLD Token address: ${wldTokenAddress}`);
  
  // Connect to the WLD token contract
  const wldToken = await ethers.getContractAt(
    "WorldHealthToken", 
    wldTokenAddress,
    deployer
  );
  
  // Add judges to the contract if they don't exist yet
  for (let i = 0; i < judges.length && i < 2; i++) {
    const judge = judges[i];
    try {
      // Check if judge already exists by checking their status
      const judgeInfo = await challengesContract.judges(judge.address);
      if (judgeInfo.addr === ethers.constants.AddressZero) {
        console.log(`Adding judge ${i+1}: ${judge.address}`);
        await challengesContract.addJudge(judge.address, `Judge ${i+1}`);
        console.log(`Judge ${i+1} added successfully`);
      } else {
        console.log(`Judge ${i+1} already exists`);
      }
    } catch (error) {
      console.error(`Error adding judge ${i+1}:`, error);
    }
  }
  
  // Create the challenges
  for (let i = 0; i < challengesToCreate.length; i++) {
    const challenge = challengesToCreate[i];
    try {
      console.log(`Creating challenge: ${challenge.name}`);
      const tx = await challengesContract.createChallenge(
        challenge.name,
        challenge.description,
        challenge.category,
        challenge.subType,
        challenge.startDate,
        challenge.endDate,
        challenge.minStake,
        challenge.judges
      );
      await tx.wait();
      console.log(`Challenge "${challenge.name}" created successfully!`);
    } catch (error) {
      console.error(`Error creating challenge ${challenge.name}:`, error);
    }
  }
  
  console.log("All challenges created successfully!");
}

// Function to join a challenge - can be called separately or integrated into UI
async function joinChallenge(challengeId, stakeAmount, signer) {
  try {
    // Connect to the deployed contract with the user's signer
    const challengesContract = await ethers.getContractAt(
      "HealthyWorldChallenges", 
      CHALLENGES_CONTRACT_ADDRESS,
      signer
    );
    
    // Get the WLD token address from the contract
    const wldTokenAddress = await challengesContract.wldToken();
    
    // Connect to the WLD token contract
    const wldToken = await ethers.getContractAt(
      "WorldHealthToken", 
      wldTokenAddress,
      signer
    );
    
    // Convert stake amount to wei
    const stakeAmountWei = ethers.utils.parseEther(stakeAmount.toString());
    
    // Approve the tokens first
    console.log(`Approving ${stakeAmount} WLD tokens for challenge contract...`);
    const approvalTx = await wldToken.approve(CHALLENGES_CONTRACT_ADDRESS, stakeAmountWei);
    await approvalTx.wait();
    console.log("Approval successful");
    
    // Join the challenge
    console.log(`Joining challenge ${challengeId} with ${stakeAmount} WLD tokens...`);
    const joinTx = await challengesContract.joinChallenge(challengeId, stakeAmountWei);
    await joinTx.wait();
    console.log(`Successfully joined challenge ${challengeId}`);
    
    return true;
  } catch (error) {
    console.error("Error joining challenge:", error);
    return false;
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
  createChallenges: main,
  joinChallenge
}; 