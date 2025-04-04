"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/components/minikit-provider'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, login, isConnecting, isVerifying } = useAuth()
  const [errorMessage, setErrorMessage] = useState('')

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogin = async () => {
    try {
      setErrorMessage('')
      await login()
      // After login, the useEffect above will handle redirection
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Login failed. Please try again.')
      }
    }
  }

  // Get the current login state text
  const getLoginButtonText = () => {
    if (isConnecting) return 'Connecting wallet...'
    if (isVerifying) return 'Verifying identity...'
    if (isLoading) return 'Loading...'
    return 'Sign in with World ID'
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-500 to-teal-700 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-500 to-teal-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6">
          <div className="flex justify-center">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 bg-white opacity-10 rounded-full animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-center h-full">
                <Image
                  src="/logo.svg"
                  alt="HealthyWorld Logo"
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              </div>
            </div>
          </div>
          <h1 className="text-center text-white text-2xl font-bold mt-4">HealthyWorld</h1>
          <p className="text-center text-white text-opacity-90 mt-1">
            Track, Challenge, and Earn with World ID
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h2 className="text-blue-800 font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.1 14.8,9.5V11C15.4,11 16,11.6 16,12.3V15.8C16,16.4 15.4,17 14.7,17H9.2C8.6,17 8,16.4 8,15.7V12.2C8,11.6 8.6,11 9.2,11V9.5C9.2,8.1 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,9.5V11H13.5V9.5C13.5,8.7 12.8,8.2 12,8.2Z" />
                </svg>
                Privacy-First Verification
              </h2>
              <p className="text-blue-700 text-sm mt-1">
                HealthyWorld uses World ID to verify your identity without compromising your privacy.
                No personal data is stored.
              </p>
            </div>

            {errorMessage && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
                {errorMessage}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isLoading || isConnecting || isVerifying}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow transition flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" />
              </svg>
              <span>{getLoginButtonText()}</span>
            </button>

            <div className="text-center text-sm text-gray-500">
              <p>Don't have World ID yet?</p>
              <a
                href="https://worldcoin.org/download"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Download World App →
              </a>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Link href="/" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
