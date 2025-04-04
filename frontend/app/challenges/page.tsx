'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Challenge {
  id: number
  title: string
  description: string
  icon: string
  reward: string
  category: string
  difficulty: string
  daysLeft: number
  progress: number
  status: 'in-progress' | 'new' | 'not-started'
  backgroundColor: string
  iconColor: string
  borderColor: string
}

export default function ChallengesPage() {
  const [loading, setLoading] = useState(true)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  
  useEffect(() => {
    // Simulate API call to fetch challenges
    const timer = setTimeout(() => {
      setChallenges([
        {
          id: 1,
          title: '10K Steps Challenge',
          description: 'Complete 10,000 steps daily for 5 consecutive days. Boost your cardiovascular health!',
          icon: 'directions_walk',
          reward: '150 Points',
          category: 'Activity',
          difficulty: 'Medium',
          daysLeft: 4,
          progress: 60,
          status: 'in-progress',
          backgroundColor: 'from-emerald-50 to-emerald-100',
          iconColor: 'text-emerald-600',
          borderColor: 'border-emerald-200'
        },
        {
          id: 2,
          title: 'Hydration Hero',
          description: 'Drink 8 cups of water daily for 7 consecutive days. Stay hydrated for optimal health!',
          icon: 'water_drop',
          reward: '200 Points',
          category: 'Hydration',
          difficulty: 'Easy',
          daysLeft: 2,
          progress: 70,
          status: 'in-progress',
          backgroundColor: 'from-blue-50 to-blue-100',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-200'
        },
        {
          id: 3,
          title: 'Meditation Master',
          description: 'Complete 10 minutes of mindfulness daily for a week. Improve your mental well-being!',
          icon: 'self_improvement',
          reward: '250 Points',
          category: 'Mindfulness',
          difficulty: 'Medium',
          daysLeft: 7,
          progress: 15,
          status: 'new',
          backgroundColor: 'from-purple-50 to-purple-100',
          iconColor: 'text-purple-600',
          borderColor: 'border-purple-200'
        },
        {
          id: 4,
          title: 'Early Bird',
          description: 'Wake up before 7 AM for 5 consecutive days. Start your day with more energy!',
          icon: 'alarm',
          reward: '180 Points',
          category: 'Sleep',
          difficulty: 'Hard',
          daysLeft: 5,
          progress: 0,
          status: 'not-started',
          backgroundColor: 'from-amber-50 to-amber-100',
          iconColor: 'text-amber-600',
          borderColor: 'border-amber-200'
        },
        {
          id: 5,
          title: 'Sugar Detox',
          description: 'Avoid added sugars for 7 days straight. Reset your taste buds and improve health markers!',
          icon: 'no_food',
          reward: '300 Points',
          category: 'Nutrition',
          difficulty: 'Hard',
          daysLeft: 7,
          progress: 0,
          status: 'not-started',
          backgroundColor: 'from-red-50 to-red-100',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200'
        },
        {
          id: 6,
          title: 'Strength Builder',
          description: 'Complete 3 strength training sessions per week for 2 weeks. Build muscle and boost metabolism!',
          icon: 'fitness_center',
          reward: '350 Points',
          category: 'Fitness',
          difficulty: 'Medium',
          daysLeft: 14,
          progress: 0,
          status: 'not-started',
          backgroundColor: 'from-indigo-50 to-indigo-100',
          iconColor: 'text-indigo-600',
          borderColor: 'border-indigo-200'
        },
      ])
      setLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Filter challenges by status
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'in-progress' | 'not-started'>('all')
  
  const filteredChallenges = challenges.filter(challenge => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'active' && (challenge.status === 'in-progress' || challenge.status === 'new')) return true
    if (activeFilter === 'in-progress' && challenge.status === 'in-progress') return true
    if (activeFilter === 'not-started' && challenge.status === 'not-started') return true
    return false
  })
  
  return (
    <main className="min-h-screen p-4 md:p-6 bg-gradient-to-b from-emerald-50 to-teal-100">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between mb-8">
          <div className="flex items-center mb-4 sm:mb-0">
            <Link href="/dashboard" className="text-emerald-700 hover:underline font-medium mr-4 flex items-center">
              <span className="material-icons mr-1">arrow_back</span>
              Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-emerald-800">Health Challenges</h1>
          </div>
          
          <div className="bg-white shadow-sm rounded-lg p-1 flex">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeFilter === 'all' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeFilter === 'active' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveFilter('in-progress')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeFilter === 'in-progress' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setActiveFilter('not-started')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeFilter === 'not-started' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Not Started
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-emerald-800 flex items-center">
              <span className="material-icons mr-2 text-emerald-600">stars</span>
              Featured Challenge
            </h2>
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">Limited Time</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <div 
                key={challenge.id}
                className={`bg-gradient-to-br ${challenge.backgroundColor} border ${challenge.borderColor} rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all`}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-white flex items-center justify-center ${challenge.iconColor}`}>
                      <span className="material-icons text-2xl">{challenge.icon}</span>
                    </div>
                    <div>
                      {challenge.status === 'in-progress' && (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium">
                          In Progress
                        </span>
                      )}
                      {challenge.status === 'new' && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                          New
                        </span>
                      )}
                      {challenge.status === 'not-started' && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">
                          Not Started
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{challenge.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>
                  
                  <div className="flex justify-between text-xs text-gray-500 mb-3">
                    <span>{challenge.category}</span>
                    <span>Difficulty: {challenge.difficulty}</span>
                  </div>
                  
                  {challenge.status === 'in-progress' && (
                    <>
                      <div className="w-full bg-white bg-opacity-50 rounded-full h-2 mb-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full" 
                          style={{ width: `${challenge.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mb-4">
                        <span className="text-emerald-700 font-medium">{challenge.progress}% Complete</span>
                        <span className="text-amber-700">{challenge.daysLeft} days left</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-1">
                      <span className="material-icons text-yellow-500 text-sm">star</span>
                      <span className="text-sm font-medium">{challenge.reward}</span>
                    </div>
                    
                    <button 
                      className={`py-1.5 px-4 rounded-lg text-sm font-medium ${
                        challenge.status === 'in-progress' 
                          ? 'bg-white text-emerald-700 border border-emerald-200'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {challenge.status === 'in-progress' ? 'Continue' : 'Start'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
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