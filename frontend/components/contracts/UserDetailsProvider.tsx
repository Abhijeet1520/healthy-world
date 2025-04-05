'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ethers } from 'ethers'
import { useAuth } from '@/components/minikit-provider'
import RegistrarAbi from '@/abis/RegistrarAbi.json'

// Registrar contract address from environment or default deployment
const REGISTRAR_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_REGISTRAR_CONTRACT_ADDRESS || '0x8A9679F84A26532a7136c7f0Ab7721e243E4dd7A'

interface UserDetails {
  username: string | null;
}

interface UserDetailsContextType extends UserDetails {
  refreshUserDetails: () => Promise<void>;
}

const UserDetailsContext = createContext<UserDetailsContextType | undefined>(undefined)

export function UserDetailsProvider({ children }: { children: ReactNode }) {
  const { walletAddress, isAuthenticated } = useAuth()
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const refreshUserDetails = async () => {
    if (!walletAddress || !isAuthenticated) return
    try {
      setLoading(true)
      const provider = new ethers.providers.Web3Provider((window as any).ethereum)
      const contract = new ethers.Contract(
        REGISTRAR_CONTRACT_ADDRESS,
        RegistrarAbi.abi,
        provider
      )

      // Filter for NameRegistered events where owner equals walletAddress
      const filter = contract.filters.NameRegistered(null, walletAddress)
      const events = await contract.queryFilter(filter)
      if (events.length > 0) {
        // Use the most recent event's label as the username
        const latestEvent = events[events.length - 1]
        if (latestEvent.args) {
          setUsername(latestEvent.args.label)
        } else {
          setUsername(null)
        }
      } else {
        setUsername(null)
      }
    } catch (error) {
      console.error("Error fetching user details:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && walletAddress) {
      refreshUserDetails()
    }
  }, [isAuthenticated, walletAddress])

  return (
    <UserDetailsContext.Provider value={{ username, refreshUserDetails }}>
      {children}
    </UserDetailsContext.Provider>
  )
}

export function useUserDetails() {
  const context = useContext(UserDetailsContext)
  if (!context) {
    throw new Error("useUserDetails must be used within a UserDetailsProvider")
  }
  return context
}
