'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useChallenges } from '@/components/contracts/ChallengeProvider'
import LiveDetection from '@/components/LiveDetection'
import Image from 'next/image'

// Enums for challenge status and categories
enum ChallengeStatus { Active, Judging, Completed, Cancelled }
enum ChallengeCategory { Common, Exercise, Nutrition }

// Challenge type
interface Challenge {
  id: number;
  name: string;
  description: string;
  category: ChallengeCategory;
  subType: string;
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

// Mapping for icons based on category
const categoryIconMapping: Record<ChallengeCategory, string> = {
  [ChallengeCategory.Common]: 'emoji_events',
  [ChallengeCategory.Exercise]: 'fitness_center',
  [ChallengeCategory.Nutrition]: 'local_dining',
}

// Mapping for background gradients based on category
const categoryBgMapping: Record<ChallengeCategory, string> = {
  [ChallengeCategory.Common]: 'from-gray-50 to-gray-100',
  [ChallengeCategory.Exercise]: 'from-indigo-50 to-indigo-100',
  [ChallengeCategory.Nutrition]: 'from-red-50 to-red-100',
}

// Mapping for border colors based on category
const categoryBorderMapping: Record<ChallengeCategory, string> = {
  [ChallengeCategory.Common]: 'border-gray-200',
  [ChallengeCategory.Exercise]: 'border-indigo-200',
  [ChallengeCategory.Nutrition]: 'border-red-200',
}

export default function ChallengesPage() {
  // Using mock data for demonstration (replace with context if needed)
  const [loading, setLoading] = useState(true)
  const [challenges, setChallenges] = useState<Challenge[]>([])

  useEffect(() => {
    // Simulate API call to fetch challenges
    const timer = setTimeout(() => {
      setChallenges([
        {
          id: 0,
          name: '10 Bicep Curls a Day',
          description: 'Complete 10 bicep curls daily for 5 consecutive days. Boost your arm strength!',
          category: ChallengeCategory.Exercise,
          subType: 'bicep-curls',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),    // 7 days from now
          minStake: 50,
          poolSize: 2500,
          status: ChallengeStatus.Active,
          participantCount: 48,
          completedCount: 1,
          isJoined: true,
          myStake: 50,
          myCompletion: false
        },
        {
          id: 1,
          name: 'Hydration Hero',
          description: 'Drink 8 cups of water daily for 7 consecutive days. Stay hydrated for optimal health!',
          category: ChallengeCategory.Nutrition,
          subType: 'water',
          startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),    // 4 days from now
          minStake: 100,
          poolSize: 5000,
          status: ChallengeStatus.Active,
          participantCount: 76,
          completedCount: 0,
          isJoined: true,
          myStake: 150,
          myCompletion: true
        },
        {
          id: 2,
          name: 'Meditation Master',
          description: 'Complete 10 minutes of mindfulness daily for a week. Improve your mental well-being!',
          category: ChallengeCategory.Common,
          subType: 'mindfulness',
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
          category: ChallengeCategory.Exercise,
          subType: 'strength',
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
      ])

      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Filter challenges by status
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'in-progress' | 'not-started'>('all')
  const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null)

  // Filter challenges based on the selected filter
  const filteredChallenges = challenges.filter(challenge => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'active' && (challenge.status === ChallengeStatus.Active || challenge.status === ChallengeStatus.Judging)) return true
    if (activeFilter === 'in-progress' && challenge.status === ChallengeStatus.Active) return challenge.isJoined
    if (activeFilter === 'not-started' && challenge.status === ChallengeStatus.Active) return !challenge.isJoined
    return false
  })

  // Dummy function to calculate progress percentage based on time
  const calculateProgress = (startDate: Date, endDate: Date) => {
    const now = new Date().getTime()
    const start = startDate.getTime()
    const end = endDate.getTime()
    if (now <= start) return 0
    if (now >= end) return 100
    return Math.round(((now - start) / (end - start)) * 100)
  }

  const toggleChallengeDetails = (challengeId: number) => {
    setSelectedChallengeId(prev => (prev === challengeId ? null : challengeId))
  }

  return (
    <main className="min-h-screen p-4 md:p-6 bg-gradient-to-b from-emerald-50 to-teal-100">
      <div className="max-w-5xl mx-auto">
        {/* Navigation */}
        <div className="flex flex-wrap items-center justify-between mb-8">
          <div className="flex items-center mb-4 sm:mb-0">
            <Link href="/dashboard" className="text-emerald-700 hover:underline font-medium mr-4 flex items-center">
              <span className="material-icons mr-1">arrow_back</span>
              Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-emerald-800">Health Challenges</h1>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-1 flex">
            {(['all', 'active', 'in-progress', 'not-started'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Challenge (Static Example) */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-emerald-800 flex items-center">
              <span className="material-icons mr-2 text-emerald-600">stars</span>
              Featured Challenge
            </h2>
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
              Limited Time
            </span>
          </div>
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <span className="material-icons text-9xl">directions_run</span>
            </div>
            <div className="relative z-10">
              <div className="flex flex-wrap items-start">
                <div className="w-full md:w-3/4 mb-4 md:mb-0 md:pr-6">
                  <h3 className="text-2xl font-bold mb-2">30-Day Fitness Challenge</h3>
                  <p className="mb-4 text-emerald-100">
                    Complete a daily mix of activities including walking, strength training, and flexibility exercises for 30 days. Track your progress and see remarkable improvements in your fitness level!
                  </p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="bg-white bg-opacity-20 rounded-full text-xs px-3 py-1">Fitness</span>
                    <span className="bg-white bg-opacity-20 rounded-full text-xs px-3 py-1">All Levels</span>
                    <span className="bg-white bg-opacity-20 rounded-full text-xs px-3 py-1">30 Days</span>
                  </div>
                  <button className="bg-white text-emerald-700 py-2 px-6 rounded-lg font-medium hover:shadow-md transition-all inline-flex items-center">
                    Join Challenge
                    <span className="material-icons ml-1 text-sm">arrow_forward</span>
                  </button>
                </div>
                <div className="w-full md:w-1/4 flex justify-center md:justify-end">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
                      <span className="material-icons text-4xl">emoji_events</span>
                    </div>
                    <div className="text-lg font-bold">500 Points</div>
                    <div className="text-sm text-emerald-100">Premium Badge</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
            <p className="text-emerald-700 font-medium">Loading challenges...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChallenges.map(challenge => {
              // Get icon, background and border based on challenge category
              const icon = categoryIconMapping[challenge.category] || 'emoji_events'
              const bgClass = categoryBgMapping[challenge.category] || 'from-gray-50 to-gray-100'
              const borderClass = categoryBorderMapping[challenge.category] || 'border-gray-200'
              return (
                <div key={challenge.id}>
                  <div
                    onClick={() => toggleChallengeDetails(challenge.id)}
                    className={`bg-gradient-to-br ${bgClass} ${borderClass} rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer p-5 flex justify-between items-center`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                        <span className="material-icons text-2xl">{icon}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{challenge.name}</h3>
                        <p className="text-sm text-gray-600">{challenge.description}</p>
                      </div>
                    </div>
                    <div>
                      {challenge.status === ChallengeStatus.Active && challenge.isJoined && (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium">
                          In Progress
                        </span>
                      )}
                      {challenge.status === ChallengeStatus.Active && !challenge.isJoined && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">
                          Not Started
                        </span>
                      )}
                      {challenge.status === ChallengeStatus.Completed && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedChallengeId === challenge.id && (
                    <div className="mt-4 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                      <h4 className="text-2xl font-bold text-gray-900 mb-4">{challenge.name} Details</h4>
                      <p className="mb-4 text-gray-700">{challenge.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-3">
                          <p className="text-gray-500">
                            <span className="font-semibold">Category:</span> {ChallengeCategory[challenge.category]}
                          </p>
                          <p className="text-gray-500">
                            <span className="font-semibold">Min Stake:</span> {challenge.minStake}
                          </p>
                          <p className="text-gray-500">
                            <span className="font-semibold">Pool Size:</span> {challenge.poolSize}
                          </p>
                        </div>
                        <div className="space-y-3">
                          <p className="text-gray-500">
                            <span className="font-semibold">Days Left:</span> {challenge.daysLeft}
                          </p>
                          <div>
                            <p className="text-gray-500 text-sm mb-1">Time Progress</p>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${calculateProgress(challenge.startDate, challenge.endDate)}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm mb-1">Completion</p>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${challenge.progress}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {challenge.subType === 'strength' && (
                        <div className="mt-6">
                          <h5 className="text-xl font-semibold mb-3">Record Your Exercise</h5>
                          <LiveDetection />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!loading && filteredChallenges.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="material-icons text-gray-400 text-2xl">search_off</span>
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No challenges found</h3>
            <p className="text-gray-500 mb-4">There are no challenges matching your selected filter.</p>
            <button
              onClick={() => setActiveFilter('all')}
              className="py-2 px-4 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 transition-colors"
            >
              View All Challenges
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
