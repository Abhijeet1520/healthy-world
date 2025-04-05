// Script that demonstrates how to integrate World Mini App with HealthyWorld challenges
const { ethers } = require("hardhat");

// The deployed contract address
const CHALLENGES_CONTRACT_ADDRESS = "0x609b3BbC1fb62F5c6612aB7FA63458d4f572c24e";

// This script can be used as a reference for how to use the MiniKit.commandsAsync.sendTransaction
// method to interact with the HealthyWorldChallenges contract from the frontend

/**
 * Example function showing how to join a challenge using World Mini App
 * 
 * This is the format that should be used in frontend code with MiniKit
 * instead of direct contract calls
 */
async function joinChallengeWithMiniKit(challengeId, stakeAmount) {
  // Code snippet for frontend - this is not meant to be executed in this script
  // but serves as a reference for frontend developers
  
  /* 
  import { MiniKit } from '@worldcoin/minikit-js';
  
  // Check if MiniKit is installed
  if (!MiniKit.isInstalled()) {
    console.error("World App not installed");
    return false;
  }
  
  try {
    // Convert the stake amount to Wei string
    const amountWei = ethers.utils.parseEther(stakeAmount).toString();
    
    // Create deadline 30 minutes in the future
    const deadline = Math.floor((Date.now() + 30 * 60 * 1000) / 1000).toString();
    
    // Create permit2 transfer data for the token approval
    const permitTransfer = {
      permitted: {
        token: "WLD_TOKEN_ADDRESS", // Replace with actual address
        amount: amountWei,
      },
      spender: CHALLENGES_CONTRACT_ADDRESS,
      nonce: Date.now().toString(),
      deadline,
    };
    
    // Format arguments for the joinChallenge function
    const joinChallengeArgs = [
      challengeId.toString(), 
      amountWei
    ];
    
    // ABI for just the joinChallenge function
    const functionABI = [
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_challengeId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_stakeAmount",
            "type": "uint256"
          }
        ],
        "name": "joinChallenge",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    // Send transaction using MiniKit
    const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
      transaction: [
        {
          address: CHALLENGES_CONTRACT_ADDRESS,
          abi: functionABI,
          functionName: 'joinChallenge',
          args: joinChallengeArgs,
        },
      ],
      permit2: [permitTransfer],
    });
    
    // Check result
    if (finalPayload.status === 'success') {
      console.log('Successfully joined challenge:', finalPayload.transaction_id);
      
      // Wait for transaction receipt using MiniKit hooks
      // Using @worldcoin/minikit-react package:
      // const { isLoading, isSuccess } = useWaitForTransactionReceipt({
      //   client: client,
      //   appConfig: {
      //     app_id: 'YOUR_APP_ID',
      //   },
      //   transactionId: finalPayload.transaction_id,
      // });
      
      // Alternatively, you can check status through the API:
      // const response = await fetch(
      //   `https://developer.worldcoin.org/api/v2/minikit/transaction/${finalPayload.transaction_id}?app_id=${process.env.APP_ID}&type=transaction`,
      //   { method: 'GET' }
      // );
      // const transaction = await response.json();
      
      return true;
    } else {
      console.error('Error joining challenge:', finalPayload);
      return false;
    }
  } catch (error) {
    console.error('Error joining challenge:', error);
    return false;
  }
  */
  
  console.log("This is a reference implementation for frontend integration with World Mini App");
  console.log("See the code comments for how to implement this in your frontend");
  
  return "Reference implementation";
}

/**
 * Example function showing how to submit health data using World Mini App
 */
async function submitHealthDataWithMiniKit(challengeId, steps, waterCups, sleepHours, mindfulMinutes) {
  // Code snippet for frontend - this is not meant to be executed in this script
  // but serves as a reference for frontend developers
  
  /*
  import { MiniKit } from '@worldcoin/minikit-js';
  
  // Check if MiniKit is installed
  if (!MiniKit.isInstalled()) {
    console.error("World App not installed");
    return false;
  }
  
  try {
    // Convert sleep hours to integer representation (e.g. 7.5 -> 750)
    const sleepHoursInt = Math.floor(sleepHours * 100);
    
    // Empty proof data (would be signature for wearable data)
    const proofData = "0x";
    
    // Default values if not provided
    const dataSourceType = "manual";
    const dataSourceId = "app";
    
    // Format arguments for the submitHealthData function
    const submitHealthDataArgs = [
      challengeId.toString(),
      steps.toString(),
      waterCups.toString(),
      sleepHoursInt.toString(),
      mindfulMinutes.toString(),
      dataSourceType,
      dataSourceId,
      proofData
    ];
    
    // ABI for just the submitHealthData function
    const functionABI = [
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_challengeId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_steps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_waterCups",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_sleepHours",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_mindfulMinutes",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "_dataSourceType",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_dataSourceId",
            "type": "string"
          },
          {
            "internalType": "bytes",
            "name": "_proofData",
            "type": "bytes"
          }
        ],
        "name": "submitHealthData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    // Send transaction using MiniKit
    const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
      transaction: [
        {
          address: CHALLENGES_CONTRACT_ADDRESS,
          abi: functionABI,
          functionName: 'submitHealthData',
          args: submitHealthDataArgs,
        },
      ],
    });
    
    // Check result
    if (finalPayload.status === 'success') {
      console.log('Successfully submitted health data:', finalPayload.transaction_id);
      return true;
    } else {
      console.error('Error submitting health data:', finalPayload);
      return false;
    }
  } catch (error) {
    console.error('Error submitting health data:', error);
    return false;
  }
  */
  
  console.log("This is a reference implementation for frontend integration with World Mini App");
  console.log("See the code comments for how to implement this in your frontend");
  
  return "Reference implementation";
}

/**
 * Example function showing how to claim rewards using World Mini App
 */
async function claimRewardsWithMiniKit(challengeId) {
  // Code snippet for frontend - this is not meant to be executed in this script
  // but serves as a reference for frontend developers
  
  /*
  import { MiniKit } from '@worldcoin/minikit-js';
  
  // Check if MiniKit is installed
  if (!MiniKit.isInstalled()) {
    console.error("World App not installed");
    return false;
  }
  
  try {
    // Format arguments for the claimRewards function
    const claimRewardsArgs = [
      challengeId.toString()
    ];
    
    // ABI for just the claimRewards function
    const functionABI = [
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_challengeId",
            "type": "uint256"
          }
        ],
        "name": "claimRewards",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    // Send transaction using MiniKit
    const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
      transaction: [
        {
          address: CHALLENGES_CONTRACT_ADDRESS,
          abi: functionABI,
          functionName: 'claimRewards',
          args: claimRewardsArgs,
        },
      ],
    });
    
    // Check result
    if (finalPayload.status === 'success') {
      console.log('Successfully claimed rewards:', finalPayload.transaction_id);
      return true;
    } else {
      console.error('Error claiming rewards:', finalPayload);
      return false;
    }
  } catch (error) {
    console.error('Error claiming rewards:', error);
    return false;
  }
  */
  
  console.log("This is a reference implementation for frontend integration with World Mini App");
  console.log("See the code comments for how to implement this in your frontend");
  
  return "Reference implementation";
}

// For educational purposes, show how to run in hardhat
async function main() {
  console.log("This script contains reference implementations for using MiniKit.commandsAsync.sendTransaction");
  console.log("in a frontend environment to interact with HealthyWorldChallenges contract.");
  console.log("\nThese functions are meant to be copied into your frontend code, not run directly.");
  console.log("See the comments in each function for example usage in your frontend.\n");
  
  console.log("Contract address: " + CHALLENGES_CONTRACT_ADDRESS);
  
  // Show example calls (these won't actually execute the commented code)
  console.log("\nExample function templates:");
  console.log("1. joinChallengeWithMiniKit(0, '50')");
  console.log("2. submitHealthDataWithMiniKit(0, 10000, 8, 7.5, 15)");
  console.log("3. claimRewardsWithMiniKit(0)");
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
  joinChallengeWithMiniKit,
  submitHealthDataWithMiniKit,
  claimRewardsWithMiniKit
}; 