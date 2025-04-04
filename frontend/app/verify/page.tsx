'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MiniKit, VerifyCommandInput, VerificationLevel, MiniAppVerifyActionErrorPayload } from '@worldcoin/minikit-js'

export default function VerifyPage() {
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleVerify = async () => {
    try {
      setVerificationStatus('loading')
      setErrorMessage('')

      if (!MiniKit.isInstalled()) {
        setVerificationStatus('error')
        setErrorMessage('MiniKit not installed. Please open this app in World App.')
        return
      }

      const verifyPayload: VerifyCommandInput = {
        action: 'healthyworld-verification',
        signal: '0x' + Math.floor(Math.random() * 1000000).toString(16),
        verification_level: VerificationLevel.Orb,
      }

      const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload)

      if (finalPayload.status === 'error') {
        setVerificationStatus('error')
        setErrorMessage('Verification failed')
        return
      }

      // Verify the proof in the backend
      const verifyResponse = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: finalPayload,
          action: 'healthyworld-verification',
        }),
      })

      const verifyResponseJson = await verifyResponse.json()
      
      if (verifyResponseJson.status === 200) {
        setVerificationStatus('success')
      } else {
        setVerificationStatus('error')
        setErrorMessage(verifyResponseJson.message || 'Verification failed on server')
      }
    } catch (error) {
      setVerificationStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
    }
  }

  return (
    <main className="min-h-screen p-4 bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-emerald-700 hover:underline">
            &larr; Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-emerald-700">Verify Identity</h1>
          <div className="w-8"></div> {/* Empty div for spacing */}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4 text-emerald-700">World ID Verification</h2>
          <p className="text-gray-600 mb-6">
            Verify your identity to unlock premium features, participate in challenges, and earn rewards.
            Your verification ensures that you're a unique human without revealing your personal information.
          </p>
          
          <div className="space-y-6">
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h3 className="font-semibold text-emerald-700 mb-2">Benefits of Verification:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Participate in exclusive wellness challenges</li>
                <li>Earn WLD tokens for achieving health goals</li>
                <li>Join community events and competitions</li>
                <li>Connect with verified users for group activities</li>
              </ul>
            </div>
            
            {verificationStatus === 'success' ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-2">
                    <span className="material-icons text-green-600">check_circle</span>
                  </div>
                  <h3 className="font-semibold text-green-700">Verification Successful!</h3>
                </div>
                <p className="text-green-700 mb-4">Your identity has been verified.</p>
                <Link href="/dashboard" className="block w-full py-2 px-4 bg-emerald-600 text-white rounded-lg font-medium text-center shadow-md hover:bg-emerald-700 transition-colors">
                  Continue to Dashboard
                </Link>
              </div>
            ) : verificationStatus === 'error' ? (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-2">
                    <span className="material-icons text-red-600">error</span>
                  </div>
                  <h3 className="font-semibold text-red-700">Verification Failed</h3>
                </div>
                <p className="text-red-700 mb-4">{errorMessage || "An error occurred during verification. Please try again."}</p>
                <button
                  onClick={handleVerify}
                  className="block w-full py-2 px-4 bg-emerald-600 text-white rounded-lg font-medium text-center shadow-md hover:bg-emerald-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <button
                onClick={handleVerify}
                disabled={verificationStatus === 'loading'}
                className={`block w-full py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium text-center shadow-md transition-colors ${
                  verificationStatus === 'loading' ? 'opacity-70 cursor-not-allowed' : 'hover:bg-emerald-700'
                }`}
              >
                {verificationStatus === 'loading' ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Verify with World ID'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
} 