"use client"; // Required for Next.js

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { MiniKit, VerifyCommandInput, VerificationLevel } from '@worldcoin/minikit-js'
import { ethers } from 'ethers'

interface UserData {
  verified: boolean
  address?: string
  streakDays: number
  lastActive?: Date
  points: number
  badges: number
  completedChallenges: number
  upcomingRewards: number
  steps: number
  waterCups: number
  sleepHours: number
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  userData: UserData | null
  login: () => Promise<void>
  logout: () => void
  checkStreak: () => void
  connectWallet: () => Promise<string | null>
  verifyIdentity: () => Promise<boolean>
  walletAddress: string | null
  isVerified: boolean
  isWalletConnected: boolean
  isVerifying: boolean
  isConnecting: boolean
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userData: null,
  login: async () => {},
  logout: () => {},
  checkStreak: () => {},
  connectWallet: async () => null,
  verifyIdentity: async () => false,
  walletAddress: null,
  isVerified: false,
  isWalletConnected: false,
  isVerifying: false,
  isConnecting: false,
})

export const useAuth = () => useContext(AuthContext)

export function MinikitProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    // Initialize MiniKit
    try {
      MiniKit.install();
      console.log("MiniKit installed:", MiniKit.isInstalled());
    } catch (error) {
      console.error("Error installing MiniKit:", error);
    }
    
    // Check if user is already authenticated (e.g., from localStorage)
    const checkAuth = async () => {
      try {
        const storedAuth = localStorage.getItem('healthyworld_auth')
        if (storedAuth) {
          const parsedAuth = JSON.parse(storedAuth)
          setIsAuthenticated(true)
          setUserData(parsedAuth)
          
          // If wallet address was stored, restore it
          if (parsedAuth.address) {
            setWalletAddress(parsedAuth.address)
          }
          
          // If verification status was stored, restore it
          if (parsedAuth.verified) {
            setIsVerified(true)
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Connect wallet using MiniKit
  const connectWallet = async (): Promise<string | null> => {
    if (!MiniKit.isInstalled()) {
      console.error("World App not installed")
      return null
    }
    
    try {
      setIsConnecting(true)
      
      const generateNonce = () => {
        // Generate a random string for nonce
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      };
      
      // Use MiniKit to connect wallet
      const result = await MiniKit.commandsAsync.walletAuth({
        nonce: generateNonce(),
      });
      
      const { finalPayload } = result;
      
      if (finalPayload.status === "error") {
        console.error("Wallet connection error:", "Failed to connect wallet");
        return null;
      }
      
      const address = finalPayload.address;
      console.log("Wallet connected:", address);
      
      setWalletAddress(address);
      
      // Update user data with wallet address
      if (userData) {
        const updatedUserData = {
          ...userData,
          address: address
        }
        setUserData(updatedUserData)
        localStorage.setItem('healthyworld_auth', JSON.stringify(updatedUserData))
      }
      
      return address;
    } catch (error) {
      console.error("Error connecting wallet:", error)
      return null
    } finally {
      setIsConnecting(false)
    }
  }
  
  // Verify identity using MiniKit
  const verifyIdentity = async (): Promise<boolean> => {
    if (!MiniKit.isInstalled()) {
      console.error("World App not installed")
      return false
    }
    
    try {
      setIsVerifying(true)
      
      const verifyInput: VerifyCommandInput = {
        action: process.env.NEXT_PUBLIC_WLD_ACTION_ID || "healthyworld-login",
        signal: walletAddress || "",
        verification_level: VerificationLevel.Orb
      }
      
      const result = await MiniKit.commandsAsync.verify(verifyInput);
      const { finalPayload } = result;
      
      if (finalPayload.status === "error") {
        console.error("Verification error:", "Failed to verify identity");
        return false;
      }
      
      setIsVerified(true)
      
      // Update user data with verification status
      if (userData) {
        const updatedUserData = {
          ...userData,
          verified: true
        }
        setUserData(updatedUserData)
        localStorage.setItem('healthyworld_auth', JSON.stringify(updatedUserData))
      }
      
      return true
    } catch (error) {
      console.error("Error verifying identity:", error)
      return false
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle streak logic
  const checkStreak = () => {
    if (!userData) return
    
    const today = new Date()
    const lastActive = userData.lastActive ? new Date(userData.lastActive) : null
    
    // Check if this is the first login or if the user was active yesterday
    if (!lastActive) {
      // First login, set streak to 1
      const updatedUserData = {
        ...userData,
        streakDays: 1,
        lastActive: today,
      }
      setUserData(updatedUserData)
      localStorage.setItem('healthyworld_auth', JSON.stringify(updatedUserData))
    } else {
      const timeDiff = today.getTime() - lastActive.getTime()
      const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24))
      
      if (dayDiff === 1) {
        // User was active yesterday, increment streak
        const updatedUserData = {
          ...userData,
          streakDays: userData.streakDays + 1,
          lastActive: today,
        }
        setUserData(updatedUserData)
        localStorage.setItem('healthyworld_auth', JSON.stringify(updatedUserData))
      } else if (dayDiff > 1) {
        // User missed a day, reset streak
        const updatedUserData = {
          ...userData,
          streakDays: 1,
          lastActive: today,
        }
        setUserData(updatedUserData)
        localStorage.setItem('healthyworld_auth', JSON.stringify(updatedUserData))
      } else if (dayDiff === 0) {
        // User already logged in today, update last active time
        const updatedUserData = {
          ...userData,
          lastActive: today,
        }
        setUserData(updatedUserData)
        localStorage.setItem('healthyworld_auth', JSON.stringify(updatedUserData))
      }
    }
  }

  const login = async () => {
    setIsLoading(true)
    try {
      if (!MiniKit.isInstalled()) {
        window.open("https://worldcoin.org/download", "_blank");
        throw new Error("Please install World App to continue");
      }
      
      // First connect the wallet
      const address = await connectWallet()
      
      if (!address) {
        throw new Error("Failed to connect wallet")
      }
      
      // Then verify identity
      const verified = await verifyIdentity()
      
      if (!verified) {
        throw new Error("Failed to verify identity")
      }
      
      // If both steps succeed, complete the login
      const mockUserData: UserData = {
        verified: true,
        address: address,
        streakDays: 3,
        lastActive: new Date(),
        points: 1580,
        badges: 7,
        completedChallenges: 3,
        upcomingRewards: 2,
        steps: 7854,
        waterCups: 6,
        sleepHours: 7.5,
      }
      
      setUserData(mockUserData)
      setIsAuthenticated(true)
      
      // Store auth data in localStorage
      localStorage.setItem('healthyworld_auth', JSON.stringify(mockUserData))
      
      // Check streak on login
      checkStreak()
    } catch (error) {
      console.error('Login failed:', error)
      
      // If the error is about installing World App, don't show a generic error
      if (error instanceof Error && error.message.includes("install World App")) {
        alert(error.message);
      } else {
        alert('Login failed. Please try again.')
      }
      throw error; // Re-throw the error so the login page can handle it
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUserData(null)
    setWalletAddress(null)
    setIsVerified(false)
    localStorage.removeItem('healthyworld_auth')
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      userData, 
      login, 
      logout, 
      checkStreak,
      connectWallet,
      verifyIdentity,
      walletAddress,
      isVerified,
      isWalletConnected: !!walletAddress,
      isVerifying,
      isConnecting
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export default MinikitProvider
