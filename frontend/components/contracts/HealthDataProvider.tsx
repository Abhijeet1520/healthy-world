'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ethers } from 'ethers'
import { useAuth } from '@/components/minikit-provider'
import HealthDataVerificationABI from '@/abis/HealthDataVerification.json'

// Contract addresses - would need to be updated based on deployment
const HEALTH_DATA_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HEALTH_DATA_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'

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
  id: string
  user: string
  dataType: string
  value: number
  timestamp: number
  status: 'Pending' | 'Verified' | 'Rejected'
  challengeId: number
  metadata: string
}

// Interface for user statistics
export interface UserStatistics {
  [dataType: string]: {
    total: number
    streak: number
    submissions: number
  }
}

// Interface for the context
interface HealthDataContextType {
  isInitialized: boolean
  statistics: UserStatistics
  submissions: HealthDataSubmission[]
  submitHealthData: (dataType: string, value: number, metadata?: string, challengeId?: number) => Promise<string>
  refreshData: () => Promise<void>
  getUserStreak: (dataType: string) => number
  getUserTotal: (dataType: string) => number
  getSubmissionsByType: (dataType: string) => HealthDataSubmission[]
}

// Create the context
const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined)

// Provider component
export function HealthDataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, userData } = useAuth()
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [statistics, setStatistics] = useState<UserStatistics>({})
  const [submissions, setSubmissions] = useState<HealthDataSubmission[]>([])

  // Initialize the provider and contract
  useEffect(() => {
    const initProvider = async () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum)
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
    if (!contract || !userData?.id) return
    
    try {
      const userAddress = userData.id
      const newStatistics: UserStatistics = {}
      const newSubmissions: HealthDataSubmission[] = []
      
      // Get statistics for each data type
      for (const dataType of Object.values(HEALTH_DATA_TYPES)) {
        // Get total value
        const total = await contract.getUserStatistic(userAddress, dataType)
        
        // Get current streak
        const streak = await contract.getUserStreak(userAddress, dataType)
        
        // Get submission count
        const submissions = await contract.getUserSubmissionCount(userAddress, dataType)
        
        newStatistics[dataType] = {
          total: total.toNumber(),
          streak: streak.toNumber(),
          submissions: submissions.toNumber()
        }
        
        // For simplicity, we'll just get the last 10 submissions
        // In a real application, you might want to paginate or filter by date
        if (submissions.toNumber() > 0) {
          const submissionIds = await contract.userSubmissions(userAddress, dataType)
          const recentIds = submissionIds.slice(-10) // get last 10
          
          for (const id of recentIds) {
            const data = await contract.getHealthDataDetails(id)
            
            newSubmissions.push({
              id: id,
              user: data.user,
              dataType: data.dataType,
              value: data.value.toNumber(),
              timestamp: data.timestamp.toNumber(),
              status: ['Pending', 'Verified', 'Rejected'][data.status],
              challengeId: 0, // This would come from the full data
              metadata: '' // This would come from the full data
            })
          }
        }
      }
      
      setStatistics(newStatistics)
      setSubmissions(newSubmissions)
    } catch (error) {
      console.error('Error refreshing health data:', error)
    }
  }
  
  // Fetch initial data when contract is ready
  useEffect(() => {
    if (contract && isAuthenticated && userData?.id) {
      refreshData()
    }
  }, [contract, isAuthenticated, userData?.id])
  
  // Submit health data
  const submitHealthData = async (
    dataType: string, 
    value: number, 
    metadata: string = '{}',
    challengeId: number = 0
  ): Promise<string> => {
    if (!contract || !userData?.id) {
      throw new Error('Contract not initialized or user not authenticated')
    }
    
    try {
      const transaction = await contract.submitHealthData(
        userData.id,
        dataType,
        value,
        challengeId,
        metadata
      )
      
      const receipt = await transaction.wait()
      
      // Find the HealthDataSubmitted event in the receipt
      const event = receipt.events?.find((e: any) => e.event === 'HealthDataSubmitted')
      
      if (event && event.args) {
        const submissionId = event.args.submissionId
        
        // Add to local state
        const newSubmission: HealthDataSubmission = {
          id: submissionId,
          user: userData.id,
          dataType,
          value,
          timestamp: Math.floor(Date.now() / 1000),
          status: 'Pending',
          challengeId,
          metadata
        }
        
        setSubmissions(prev => [...prev, newSubmission])
        
        // Refresh data after submission
        await refreshData()
        
        return submissionId
      }
      
      throw new Error('Failed to submit health data, no event emitted')
    } catch (error) {
      console.error('Error submitting health data:', error)
      throw error
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
  
  // Create mock data for development if no provider is available
  useEffect(() => {
    if (isInitialized && !contract && isAuthenticated) {
      // No real provider, create mock data
      const mockStatistics: UserStatistics = {}
      const mockSubmissions: HealthDataSubmission[] = []
      
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
              break
            case HEALTH_DATA_TYPES.CALORIES:
              value = Math.floor(Math.random() * 500) + 1500 // 1500-2000 calories
              break
            case HEALTH_DATA_TYPES.SLEEP:
              value = Math.floor(Math.random() * 2) + 6 // 6-8 hours
              break
            case HEALTH_DATA_TYPES.HEART_RATE:
              value = Math.floor(Math.random() * 20) + 60 // 60-80 bpm
              break
            case HEALTH_DATA_TYPES.WATER:
              value = Math.floor(Math.random() * 4) + 4 // 4-8 glasses
              break
            default:
              value = Math.floor(Math.random() * 100)
          }
          
          total += value
          
          mockSubmissions.push({
            id: `mock-${dataType}-${i}`,
            user: userData?.id || '0x',
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
          submissions: 5
        }
      })
      
      setStatistics(mockStatistics)
      setSubmissions(mockSubmissions)
    }
  }, [isInitialized, contract, isAuthenticated, userData?.id])
  
  const value = {
    isInitialized,
    statistics,
    submissions,
    submitHealthData,
    refreshData,
    getUserStreak,
    getUserTotal,
    getSubmissionsByType
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
  return context
} 