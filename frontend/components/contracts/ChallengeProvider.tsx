'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ethers } from 'ethers'
import { useAuth } from '@/components/minikit-provider'

// ABI imports
import HealthyWorldChallengesABI from '@/abis/HealthyWorldChallenges.json'
import WorldHealthTokenABI from '@/abis/WorldHealthToken.json'

// Contract addresses
const CHALLENGES_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CHALLENGES_CONTRACT_ADDRESS || '0x123456789';
const WLD_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_WLD_TOKEN_ADDRESS || '0x987654321';

// Enums for challenge status and judge status
enum ChallengeStatus { Active, Judging, Completed, Cancelled }
enum JudgeStatus { Inactive, Active, Suspended }

// Challenge type
interface Challenge {
  id: number;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  minStake: number;
  poolSize: number;
  status: ChallengeStatus;
  participantCount: number;
  completedCount: number;
  isJoined: boolean;
  myStake: number;
  myCompletion: boolean;
}

// Judge type
interface Judge {
  address: string;
  name: string;
  reputation: number;
  status: JudgeStatus;
}

// Health data submission type
interface HealthDataSubmission {
  challengeId: number;
  timestamp: Date;
  steps: number;
  waterCups: number;
  sleepHours: number;
  mindfulMinutes: number;
  dataSourceType: string;
}

// Context type
interface ChallengeContextType {
  challenges: Challenge[];
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  loadingChallenges: boolean;
  tokenBalance: string;
  loadingBalance: boolean;
  refreshChallenges: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  joinChallenge: (challengeId: number, stakeAmount: string) => Promise<boolean>;
  submitHealthData: (
    challengeId: number, 
    steps: number, 
    waterCups: number, 
    sleepHours: number, 
    mindfulMinutes: number
  ) => Promise<boolean>;
  claimRewards: (challengeId: number) => Promise<boolean>;
  getHealthDataSubmissions: (challengeId: number) => Promise<HealthDataSubmission[]>;
}

// Create context
const ChallengeContext = createContext<ChallengeContextType>({
  challenges: [],
  activeChallenges: [],
  completedChallenges: [],
  loadingChallenges: true,
  tokenBalance: '0',
  loadingBalance: true,
  refreshChallenges: async () => {},
  refreshBalance: async () => {},
  joinChallenge: async () => false,
  submitHealthData: async () => false,
  claimRewards: async () => false,
  getHealthDataSubmissions: async () => [],
});

// Hook to use the challenge context
export const useChallenges = () => useContext(ChallengeContext);

// Provider component
export function ChallengeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, userData } = useAuth();
  
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [challengesContract, setChallengesContract] = useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  
  const [tokenBalance, setTokenBalance] = useState('0');
  const [loadingBalance, setLoadingBalance] = useState(true);
  
  // Initialize provider, signer, and contracts
  useEffect(() => {
    const initializeProvider = async () => {
      try {
        // Check if ethereum is available (MetaMask or other wallet)
        if (typeof window !== 'undefined' && window.ethereum) {
          // Create Web3Provider from ethereum
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(web3Provider);
          
          // Get signer
          const web3Signer = web3Provider.getSigner();
          setSigner(web3Signer);
          
          // Initialize contracts
          const challengesContractInstance = new ethers.Contract(
            CHALLENGES_CONTRACT_ADDRESS,
            HealthyWorldChallengesABI.abi,
            web3Signer
          );
          setChallengesContract(challengesContractInstance);
          
          const tokenContractInstance = new ethers.Contract(
            WLD_TOKEN_ADDRESS,
            WorldHealthTokenABI.abi,
            web3Signer
          );
          setTokenContract(tokenContractInstance);
        } else {
          console.log('Please install MetaMask or another Web3 wallet');
        }
      } catch (error) {
        console.error('Error initializing provider:', error);
      }
    };
    
    if (isAuthenticated) {
      initializeProvider();
    }
  }, [isAuthenticated]);
  
  // Function to load all challenges
  const loadChallenges = async () => {
    if (!challengesContract || !signer) return;
    
    try {
      setLoadingChallenges(true);
      
      // Get total number of challenges
      const count = await challengesContract.challengeCount();
      
      // Load each challenge
      const loadedChallenges: Challenge[] = [];
      
      for (let i = 0; i < count; i++) {
        const details = await challengesContract.getChallengeDetails(i);
        
        // Check if current user is a participant
        const signerAddress = await signer.getAddress();
        const participants = await challengesContract.getChallengeParticipants(i);
        const isJoined = participants.includes(signerAddress);
        
        // Get user's stake and completion status if they joined
        let myStake = 0;
        let myCompletion = false;
        
        if (isJoined) {
          // These would be actual contract calls in a real implementation
          // For demo purposes, we're using mock data
          myStake = 50; // 50 WLD tokens
          myCompletion = Math.random() > 0.5; // Random completion status
        }
        
        loadedChallenges.push({
          id: i,
          name: details.name,
          description: details.description,
          startDate: new Date(details.startDate.toNumber() * 1000),
          endDate: new Date(details.endDate.toNumber() * 1000),
          minStake: parseFloat(ethers.utils.formatEther(details.minStake)),
          poolSize: parseFloat(ethers.utils.formatEther(details.poolSize)),
          status: details.status,
          participantCount: details.participantCount.toNumber(),
          completedCount: details.completedCount.toNumber(),
          isJoined,
          myStake,
          myCompletion
        });
      }
      
      setChallenges(loadedChallenges);
      
      // Filter active and completed challenges
      setActiveChallenges(loadedChallenges.filter(c => 
        c.status === ChallengeStatus.Active || c.status === ChallengeStatus.Judging
      ));
      setCompletedChallenges(loadedChallenges.filter(c => 
        c.status === ChallengeStatus.Completed
      ));
      
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoadingChallenges(false);
    }
  };
  
  // Load token balance
  const loadTokenBalance = async () => {
    if (!tokenContract || !signer) return;
    
    try {
      setLoadingBalance(true);
      
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      
      setTokenBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error('Error loading token balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };
  
  // Load data when contracts are initialized
  useEffect(() => {
    if (challengesContract && tokenContract && signer) {
      loadChallenges();
      loadTokenBalance();
    }
  }, [challengesContract, tokenContract, signer]);
  
  // Function to refresh challenges
  const refreshChallenges = async () => {
    await loadChallenges();
  };
  
  // Function to refresh balance
  const refreshBalance = async () => {
    await loadTokenBalance();
  };
  
  // Function to join a challenge
  const joinChallenge = async (challengeId: number, stakeAmount: string) => {
    if (!challengesContract || !tokenContract || !signer) return false;
    
    try {
      const signerAddress = await signer.getAddress();
      
      // First approve the token transfer
      const amountWei = ethers.utils.parseEther(stakeAmount);
      const approvalTx = await tokenContract.approve(CHALLENGES_CONTRACT_ADDRESS, amountWei);
      await approvalTx.wait();
      
      // Then join the challenge
      const joinTx = await challengesContract.joinChallenge(challengeId, amountWei);
      await joinTx.wait();
      
      // Refresh data
      await refreshChallenges();
      await refreshBalance();
      
      return true;
    } catch (error) {
      console.error('Error joining challenge:', error);
      return false;
    }
  };
  
  // Function to submit health data
  const submitHealthData = async (
    challengeId: number, 
    steps: number, 
    waterCups: number, 
    sleepHours: number, 
    mindfulMinutes: number
  ) => {
    if (!challengesContract) return false;
    
    try {
      // Prepare data for submission
      const dataSourceType = "manual"; // or could be from wearable
      const dataSourceId = "app"; // app identifier
      const proofData = "0x"; // no proof for manual entry, would be a signature for wearable data
      
      // Convert sleep hours to integer representation (e.g. 7.5 -> 750)
      const sleepHoursInt = Math.floor(sleepHours * 100);
      
      // Submit data to contract
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
      
      return true;
    } catch (error) {
      console.error('Error submitting health data:', error);
      return false;
    }
  };
  
  // Function to claim rewards
  const claimRewards = async (challengeId: number) => {
    if (!challengesContract) return false;
    
    try {
      const tx = await challengesContract.claimRewards(challengeId);
      await tx.wait();
      
      // Refresh balance
      await refreshBalance();
      
      return true;
    } catch (error) {
      console.error('Error claiming rewards:', error);
      return false;
    }
  };
  
  // Function to get health data submissions for a challenge
  const getHealthDataSubmissions = async (challengeId: number): Promise<HealthDataSubmission[]> => {
    if (!challengesContract || !signer) return [];
    
    try {
      const signerAddress = await signer.getAddress();
      
      // Get count of health data submissions
      const count = await challengesContract.getHealthDataCount(challengeId, signerAddress);
      
      // Load each submission
      const submissions: HealthDataSubmission[] = [];
      
      for (let i = 0; i < count; i++) {
        const data = await challengesContract.getHealthData(challengeId, signerAddress, i);
        
        submissions.push({
          challengeId,
          timestamp: new Date(data.timestamp.toNumber() * 1000),
          steps: data.steps.toNumber(),
          waterCups: data.waterCups.toNumber(),
          sleepHours: data.sleepHours.toNumber() / 100, // Convert from integer representation
          mindfulMinutes: data.mindfulMinutes.toNumber(),
          dataSourceType: data.dataSourceType
        });
      }
      
      return submissions;
    } catch (error) {
      console.error('Error getting health data submissions:', error);
      return [];
    }
  };
  
  // Create mocked challenges for development
  useEffect(() => {
    // Only create mocked challenges if we're in development mode and we don't have a real provider
    if (process.env.NODE_ENV === 'development' && !provider) {
      const mockChallenges: Challenge[] = [
        {
          id: 0,
          name: '10K Steps Challenge',
          description: 'Complete 10,000 steps daily for 5 consecutive days. Boost your cardiovascular health!',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),    // 7 days from now
          minStake: 50,
          poolSize: 2500,
          status: ChallengeStatus.Active,
          participantCount: 48,
          completedCount: 0,
          isJoined: true,
          myStake: 50,
          myCompletion: false
        },
        {
          id: 1,
          name: 'Hydration Hero',
          description: 'Drink 8 cups of water daily for 7 consecutive days. Stay hydrated for optimal health!',
          startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),    // 4 days from now
          minStake: 100,
          poolSize: 5000,
          status: ChallengeStatus.Active,
          participantCount: 76,
          completedCount: 0,
          isJoined: true,
          myStake: 150,
          myCompletion: false
        },
        {
          id: 2,
          name: 'Meditation Master',
          description: 'Complete 10 minutes of mindfulness daily for a week. Improve your mental well-being!',
          startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),    // 9 days from now
          minStake: 75,
          poolSize: 3750,
          status: ChallengeStatus.Active,
          participantCount: 32,
          completedCount: 0,
          isJoined: false,
          myStake: 0,
          myCompletion: false
        },
        {
          id: 3,
          name: 'Weekly Weight Training',
          description: 'Complete 3 strength training sessions this week and track your results.',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          endDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),   // 23 days ago (completed)
          minStake: 200,
          poolSize: 8000,
          status: ChallengeStatus.Completed,
          participantCount: 64,
          completedCount: 42,
          isJoined: true,
          myStake: 200,
          myCompletion: true
        }
      ];
      
      setChallenges(mockChallenges);
      setActiveChallenges(mockChallenges.filter(c => c.status === ChallengeStatus.Active));
      setCompletedChallenges(mockChallenges.filter(c => c.status === ChallengeStatus.Completed));
      setLoadingChallenges(false);
      
      // Set mock token balance
      setTokenBalance('1250');
      setLoadingBalance(false);
    }
  }, [provider]);
  
  return (
    <ChallengeContext.Provider value={{
      challenges,
      activeChallenges,
      completedChallenges,
      loadingChallenges,
      tokenBalance,
      loadingBalance,
      refreshChallenges,
      refreshBalance,
      joinChallenge,
      submitHealthData,
      claimRewards,
      getHealthDataSubmissions,
    }}>
      {children}
    </ChallengeContext.Provider>
  );
} 