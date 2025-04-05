'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ethers } from 'ethers'
import { useAuth } from '@/components/minikit-provider'
import HealthDataVerificationABI from '@/abis/HealthDataVerification.json'
import { MiniKit } from '@worldcoin/minikit-js'

// Contract addresses - would need to be updated based on deployment
const HEALTH_DATA_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HEALTH_DATA_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'

// Enum for verification status
enum VerificationStatus {
  Pending = 0,
  Verified = 1,
  Rejected = 2
}

// Data types for health metrics
export const HEALTH_DATA_TYPES = {
  STEPS: 'steps',
  CALORIES: 'calories',
  SLEEP: 'sleep',
  HEART_RATE: 'heartRate',
  WORKOUT: 'workout',
  WATER: 'water',
  MEDITATION: 'meditation'
}

// Interface for health data
export interface HealthDataSubmission {
  id: string;
  user: string;
  dataType: string;
  value: number;
  timestamp: number;
  status: 'Pending' | 'Verified' | 'Rejected';
  challengeId: number;
  metadata: string;
}

// Interface for user statistics
export interface UserStatistics {
  [dataType: string]: {
    total: number;
    streak: number;
    lastActivity: number;
  }
}

// Interface for the context
interface HealthDataContextType {
  isInitialized: boolean;
  statistics: UserStatistics;
  submissions: HealthDataSubmission[];
  submitHealthData: (dataType: string, value: number, metadata?: string, challengeId?: number) => Promise<string>;
  refreshData: () => Promise<void>;
  getUserStreak: (dataType: string) => number;
  getUserTotal: (dataType: string) => number;
  getSubmissionsByType: (dataType: string) => HealthDataSubmission[];
  getTodaySteps: () => number;
  getTodayWater: () => number;
  getTodaySleep: () => number;
}

// Create the context
const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined)

// Provider component
export function HealthDataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, userData, walletAddress } = useAuth()
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [statistics, setStatistics] = useState<UserStatistics>({})
  const [submissions, setSubmissions] = useState<HealthDataSubmission[]>([])
  const [todaySubmissions, setTodaySubmissions] = useState<{
    steps: number;
    water: number;
    sleep: number;
  }>({ steps: 0, water: 0, sleep: 0 })

  // Initialize the provider and contract
  useEffect(() => {
    const initProvider = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const web3Provider = new ethers.providers.Web3Provider((window as any).ethereum)
          setProvider(web3Provider)
          
          const healthDataContract = new ethers.Contract(
            HEALTH_DATA_CONTRACT_ADDRESS,
            HealthDataVerificationABI.abi,
            web3Provider.getSigner()
          )
          
          setContract(healthDataContract)
          setIsInitialized(true)
        } else {
          console.log('Ethereum object not found, health data features will be limited')
          setIsInitialized(true) // Still mark as initialized for UI to render
        }
      } catch (error) {
        console.error('Failed to initialize health data provider:', error)
        setIsInitialized(true) // Mark as initialized to avoid infinite loading
      }
    }

    if (isAuthenticated && !isInitialized) {
      initProvider()
    }
  }, [isAuthenticated, isInitialized])

  // Refresh user health data and statistics
  const refreshData = async () => {
    if (!contract || !walletAddress) return
    
    try {
      const userAddress = walletAddress
      const newStatistics: UserStatistics = {}
      const newSubmissions: HealthDataSubmission[] = []
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 1000
      let todaySteps = 0
      let todayWater = 0
      let todaySleep = 0
      
      // Get statistics for each data type
      for (const dataType of Object.values(HEALTH_DATA_TYPES)) {
        try {
          // Get total value from HealthDataVerification contract
          const total = await contract.getUserStatistic(userAddress, dataType)
          
          // Get current streak
          const streak = await contract.getUserStreak(userAddress, dataType)
          
          // Get last activity timestamp (not directly exposed in interface, using mock)
          // In a real implementation, this should be available from the contract
          const lastActivity = await contract.userLastActivity(userAddress, dataType)
          
          newStatistics[dataType] = {
            total: total.toNumber(),
            streak: streak.toNumber(),
            lastActivity: lastActivity.toNumber()
          }
          
          // Get submission count
          const submissionCount = await contract.getUserSubmissionCount(userAddress, dataType)
          
          if (submissionCount.toNumber() > 0) {
            // In a real implementation, you would need to loop through all submissions or provide
            // a way to get a batch of submissions from the contract
            
            // Get the last 10 submissions IDs for this data type
            // This is assuming we have a way to get submission IDs, which our contract does have
            // (via the userSubmissions mapping)
            
            // This part is mocked since we can't directly access array elements without dedicated methods
            // In a real implementation, the contract would provide methods to get a range of submissions
            for (let i = Math.max(0, submissionCount.toNumber() - 10); i < submissionCount.toNumber(); i++) {
              try {
                // This is assuming we have a way to get a submission ID at a specific index
                // In the real contract, you might need to implement this method
                const submissionId = await contract.userSubmissions(userAddress, dataType, i)
                
                // Get the health data details
                const data = await contract.getHealthDataDetails(submissionId)
                
                const submission: HealthDataSubmission = {
                  id: submissionId,
                  user: data.user,
                  dataType: data.dataType,
                  value: data.value.toNumber(),
                  timestamp: data.timestamp.toNumber(),
                  status: VerificationStatus[data.status] as 'Pending' | 'Verified' | 'Rejected',
                  challengeId: 0, // Not directly available in the return value
                  metadata: '' // Not directly available in the return value
                }
                
                newSubmissions.push(submission)
                
                // Track today's values for steps, water, and sleep
                if (data.timestamp.toNumber() >= startOfToday) {
                  if (data.dataType === HEALTH_DATA_TYPES.STEPS) {
                    todaySteps += data.value.toNumber()
                  } else if (data.dataType === HEALTH_DATA_TYPES.WATER) {
                    todayWater += data.value.toNumber()
                  } else if (data.dataType === HEALTH_DATA_TYPES.SLEEP) {
                    todaySleep += data.value.toNumber()
                  }
                }
              } catch (error) {
                console.error(`Error getting submission at index ${i}:`, error)
              }
            }
          }
        } catch (error) {
          console.error(`Error getting data for ${dataType}:`, error)
        }
      }
      
      setStatistics(newStatistics)
      setSubmissions(newSubmissions)
      setTodaySubmissions({
        steps: todaySteps,
        water: todayWater,
        sleep: todaySleep
      })
    } catch (error) {
      console.error('Error refreshing health data:', error)
    }
  }
  
  // Fetch initial data when contract is ready
  useEffect(() => {
    if (contract && isAuthenticated && walletAddress) {
      refreshData()
    }
  }, [contract, isAuthenticated, walletAddress])
  
  // Submit health data
  const submitHealthData = async (
    dataType: string, 
    value: number, 
    metadata: string = '{}',
    challengeId: number = 0
  ): Promise<string> => {
    if (!MiniKit.isInstalled() || !walletAddress) {
      throw new Error('MiniKit not installed or user not authenticated')
    }
    
    try {
      // Format arguments for the submitHealthData function
      const submitHealthDataArgs = [
        walletAddress,
        dataType,
        value.toString(),
        challengeId.toString(),
        metadata
      ];
      
      // Send transaction using MiniKit
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: HEALTH_DATA_CONTRACT_ADDRESS,
            abi: HealthDataVerificationABI.abi,
            functionName: 'submitHealthData',
            args: submitHealthDataArgs,
          },
        ],
      });
      
      if (finalPayload.status === 'success') {
        console.log('Successfully submitted health data:', finalPayload.transaction_id);
        
        // Since we can't access the event directly, we'll use a placeholder ID until refresh
        const tempSubmissionId = `temp-${Date.now()}`;
        
        // Add to local state
        const newSubmission: HealthDataSubmission = {
          id: tempSubmissionId,
          user: walletAddress,
          dataType,
          value,
          timestamp: Math.floor(Date.now() / 1000),
          status: 'Pending',
          challengeId,
          metadata
        };
        
        setSubmissions(prev => [...prev, newSubmission]);
        
        // Update today's totals
        if (dataType === HEALTH_DATA_TYPES.STEPS) {
          setTodaySubmissions(prev => ({ ...prev, steps: prev.steps + value }));
        } else if (dataType === HEALTH_DATA_TYPES.WATER) {
          setTodaySubmissions(prev => ({ ...prev, water: prev.water + value }));
        } else if (dataType === HEALTH_DATA_TYPES.SLEEP) {
          setTodaySubmissions(prev => ({ ...prev, sleep: prev.sleep + value }));
        }
        
        // Refresh data after submission to get the real submission ID
        await refreshData();
        
        return tempSubmissionId;
      } else {
        console.error('Error submitting health data:', finalPayload);
        throw new Error('Failed to submit health data');
      }
    } catch (error) {
      console.error('Error submitting health data:', error);
      throw error;
    }
  }
  
  // Helper functions
  const getUserStreak = (dataType: string): number => {
    return statistics[dataType]?.streak || 0
  }
  
  const getUserTotal = (dataType: string): number => {
    return statistics[dataType]?.total || 0
  }
  
  const getSubmissionsByType = (dataType: string): HealthDataSubmission[] => {
    return submissions.filter(s => s.dataType === dataType)
  }
  
  const getTodaySteps = () => todaySubmissions.steps
  const getTodayWater = () => todaySubmissions.water
  const getTodaySleep = () => todaySubmissions.sleep
  
  // Create mock data for development if no provider is available
  useEffect(() => {
    if (isInitialized && !contract && isAuthenticated) {
      // No real provider, create mock data
      const mockStatistics: UserStatistics = {}
      const mockSubmissions: HealthDataSubmission[] = []
      let mockTodaySteps = 0
      let mockTodayWater = 0
      let mockTodaySleep = 0
      
      // Create realistic mock data for each type
      Object.values(HEALTH_DATA_TYPES).forEach(dataType => {
        let total = 0
        let streak = Math.floor(Math.random() * 10) + 1
        
        // Create 5 mock submissions for each type
        for (let i = 0; i < 5; i++) {
          const daysAgo = i
          const date = new Date()
          date.setDate(date.getDate() - daysAgo)
          
          let value = 0
          switch (dataType) {
            case HEALTH_DATA_TYPES.STEPS:
              value = Math.floor(Math.random() * 5000) + 5000 // 5000-10000 steps
              if (daysAgo === 0) mockTodaySteps += value
              break
            case HEALTH_DATA_TYPES.CALORIES:
              value = Math.floor(Math.random() * 500) + 1500 // 1500-2000 calories
              break
            case HEALTH_DATA_TYPES.SLEEP:
              value = Math.floor(Math.random() * 2) + 6 // 6-8 hours
              if (daysAgo === 0) mockTodaySleep += value
              break
            case HEALTH_DATA_TYPES.HEART_RATE:
              value = Math.floor(Math.random() * 20) + 60 // 60-80 bpm
              break
            case HEALTH_DATA_TYPES.WATER:
              value = Math.floor(Math.random() * 4) + 4 // 4-8 glasses
              if (daysAgo === 0) mockTodayWater += value
              break
            default:
              value = Math.floor(Math.random() * 100)
          }
          
          total += value
          
          mockSubmissions.push({
            id: `mock-${dataType}-${i}`,
            user: walletAddress || '0x',
            dataType,
            value,
            timestamp: Math.floor(date.getTime() / 1000),
            status: 'Verified',
            challengeId: 0,
            metadata: '{}'
          })
        }
        
        mockStatistics[dataType] = {
          total,
          streak,
          lastActivity: Math.floor(Date.now() / 1000) - (Math.random() * 86400)
        }
      })
      
      setStatistics(mockStatistics)
      setSubmissions(mockSubmissions)
      setTodaySubmissions({
        steps: mockTodaySteps,
        water: mockTodayWater,
        sleep: mockTodaySleep
      })
    }
  }, [isInitialized, contract, isAuthenticated, walletAddress])
  
  const value = {
    isInitialized,
    statistics,
    submissions,
    submitHealthData,
    refreshData,
    getUserStreak,
    getUserTotal,
    getSubmissionsByType,
    getTodaySteps,
    getTodayWater,
    getTodaySleep
  }
  
  return (
    <HealthDataContext.Provider value={value}>
      {children}
    </HealthDataContext.Provider>
  )
}

// Custom hook to use the health data context
export function useHealthData() {
  const context = useContext(HealthDataContext)
  if (context === undefined) {
    throw new Error('useHealthData must be used within a HealthDataProvider')
  }
  
  // For backward compatibility with existing components
  return {
    ...context,
    todaySteps: context.getTodaySteps(),
    todayWater: context.getTodayWater(),
    todaySleep: context.getTodaySleep()
  }
} 