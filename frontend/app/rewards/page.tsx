'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/minikit-provider'
import { MiniKit, PayCommandInput, tokenToDecimals, Tokens } from '@worldcoin/minikit-js'

export default function RewardsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, userData } = useAuth()
  
  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])
  
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Mock rewards data
  const [rewards, setRewards] = useState([
    {
      id: 1,
      title: 'Weekly Steps Challenge',
      description: 'Completed 100,000 steps in a week',
      date: '11/10/2023',
      amount: 25,
    },
    {
      id: 2,
      title: 'Meditation Streak',
      description: 'Completed 7 days of mindfulness practice',
      date: '11/8/2023', 
      amount: 15,
    },
    {
      id: 3,
      title: 'Water Intake Goal',
      description: 'Reached daily water intake goal for 10 days',
      date: '11/5/2023',
      amount: 10,
    }
  ])
  
  // Mock subscription plans
  const [plans, setPlans] = useState([
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 5,
      features: [
        'Basic health tracking',
        'Limited challenges',
        'Standard rewards'
      ],
      recommended: false
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 15,
      features: [
        'Advanced health analytics',
        'Unlimited challenges',
        '2x rewards multiplier',
        'Premium badges',
        'Early access to new features'
      ],
      recommended: true
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 25,
      features: [
        'Advanced health analytics',
        'Unlimited challenges',
        '3x rewards multiplier',
        'Premium badges',
        'Early access to new features',
        'Personal health coach'
      ],
      recommended: false
    }
  ])
  
  if (isLoading || !isAuthenticated) {
    return (
      <main className="min-h-screen p-4 md:p-6 bg-gradient-to-b from-emerald-50 to-teal-100">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading...</p>
        </div>
      </main>
    )
  }
  
  const totalEarned = rewards.reduce((sum, reward) => sum + reward.amount, 0)

  const handleSubscribe = async (planId: string) => {
    try {
      setPaymentStatus('processing')
      setErrorMessage('')

      if (!MiniKit.isInstalled()) {
        setPaymentStatus('error')
        setErrorMessage('MiniKit is not installed. Please open in World App.')
        return
      }

      // Get the selected plan
      const selectedPlan = plans.find(plan => plan.id === planId)
      if (!selectedPlan) {
        setPaymentStatus('error')
        setErrorMessage('Invalid subscription plan')
        return
      }

      // Initialize payment on the backend to get reference ID
      const initRes = await fetch('/api/initiate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          planId: selectedPlan.id,
          amount: selectedPlan.price
        }),
      })

      const { id: referenceId } = await initRes.json()

      // Create the payment payload
      const paymentPayload: PayCommandInput = {
        reference: referenceId,
        to: process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Replace with your actual payment address
        tokens: [
          {
            symbol: Tokens.USDCE,
            token_amount: tokenToDecimals(selectedPlan.price, Tokens.USDCE).toString(),
          },
        ],
        description: `HealthyWorld ${selectedPlan.name} Subscription`,
      }

      // Send the payment command
      const { finalPayload } = await MiniKit.commandsAsync.pay(paymentPayload)

      if (finalPayload.status === 'success') {
        // Verify the payment with backend
        const verifyRes = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payload: finalPayload,
            referenceId,
          }),
        })

        const verifyData = await verifyRes.json()
        if (verifyData.success) {
          setPaymentStatus('success')
        } else {
          setPaymentStatus('error')
          setErrorMessage(verifyData.message || 'Payment verification failed')
        }
      } else {
        setPaymentStatus('error')
        setErrorMessage('Payment was not completed')
      }
    } catch (error) {
      setPaymentStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-6 bg-gradient-to-b from-emerald-50 to-teal-100">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/dashboard" className="text-emerald-700 hover:underline font-medium mr-4 flex items-center">
            <span className="material-icons mr-1">arrow_back</span>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-emerald-800">Rewards & Subscriptions</h1>
        </div>
        
        {/* WLD Balance Card */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl shadow-md p-6 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                <Image 
                  src="/worldcoin-icon.svg" 
                  alt="WLD" 
                  width={32} 
                  height={32}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold">WLD Balance</h2>
                <p className="text-emerald-100">Your health rewards token</p>
              </div>
            </div>
            <div className="text-3xl font-bold">{userData?.points || 1580} WLD</div>
          </div>
          <div className="bg-white bg-opacity-10 p-3 rounded-lg">
            <p className="text-sm text-white">Earn more WLD by completing health challenges and maintaining daily streaks!</p>
          </div>
        </div>
        
        {/* Your Earned Rewards */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-emerald-800 mb-6 flex items-center">
            <span className="material-icons mr-2 text-emerald-600">emoji_events</span>
            Your Earned Rewards
          </h2>
          
          <div className="space-y-5">
            {rewards.map((reward) => (
              <div key={reward.id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{reward.title}</h3>
                    <p className="text-gray-600 text-sm">{reward.description}</p>
                    <p className="text-gray-500 text-xs mt-1">{reward.date}</p>
                  </div>
                  <div className="flex items-center bg-emerald-50 py-1 px-3 rounded-full">
                    <Image 
                      src="/worldcoin-icon.svg" 
                      alt="WLD" 
                      width={16} 
                      height={16}
                      className="mr-1"
                    />
                    <span className="text-emerald-800 font-semibold">+{reward.amount} WLD</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 bg-emerald-50 p-4 rounded-lg border border-emerald-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">Total WLD Earned</h3>
                <p className="text-gray-600 text-sm">Keep tracking your health to earn more!</p>
              </div>
              <div className="text-2xl font-bold text-emerald-700">50 WLD</div>
            </div>
          </div>
        </div>
        
        {/* Premium Subscriptions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-emerald-800 mb-6 flex items-center">
            <span className="material-icons mr-2 text-emerald-600">workspace_premium</span>
            Premium Subscriptions
          </h2>
          
          <p className="text-gray-700 mb-6">
            Upgrade your experience with premium features to enhance your health journey. Pay with USDC for a seamless subscription experience.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`border rounded-xl p-6 ${plan.recommended ? 'border-blue-300 ring-2 ring-blue-500 ring-opacity-50 relative' : 'border-gray-200'}`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-3 py-1 rounded-tr-xl rounded-bl-xl uppercase font-bold">
                    Recommended
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-gray-800 mb-4">
                  ${plan.price}<span className="text-sm font-normal text-gray-500">/month</span>
                </div>
                
                <ul className="mb-6 space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="material-icons text-emerald-500 mr-2 text-sm">check_circle</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={paymentStatus === 'processing'}
                  className={`w-full py-3 px-4 rounded-lg font-medium ${
                    plan.recommended 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  } transition-colors`}
                >
                  {paymentStatus === 'processing' ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Subscribe Now'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
} 