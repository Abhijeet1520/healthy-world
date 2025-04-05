'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import LiveDetection from "@/components/LiveDetection"
import { EXERCISES, Exercise } from "@/components/LiveDetection"

// Enums for challenge status and categories
enum ChallengeStatus {
  Active = 0,
  Judging = 1,
  Completed = 2,
  Cancelled = 3,
}
enum ChallengeCategory {
  Common = 0,
  Exercise = 1,
  Nutrition = 2,
}

// Challenge type
interface Challenge {
  id: number
  name: string
  description: string
  category: ChallengeCategory
  subType: string
  startDate: Date
  endDate: Date
  minStake: number
  poolSize: number
  status: ChallengeStatus
  participantCount: number
  completedCount: number
  isJoined: boolean
  myStake: number
  myCompletion: boolean
  daysLeft?: number
  progress?: number
}

// Mapping for icons based on category
const categoryIconMapping: Record<ChallengeCategory, string> = {
  [ChallengeCategory.Common]: "emoji_events",
  [ChallengeCategory.Exercise]: "fitness_center",
  [ChallengeCategory.Nutrition]: "local_dining",
}

// Mapping for subType icons
const subTypeIconMapping: Record<string, string> = {
  "bicep-curl": "fitness_center",
  water: "water_drop",
  mindfulness: "self_improvement",
  strength: "fitness_center",
}

// Mapping for background gradients based on category
const categoryBgMapping: Record<ChallengeCategory, string> = {
  [ChallengeCategory.Common]: "from-purple-50 to-purple-100",
  [ChallengeCategory.Exercise]: "from-blue-50 to-blue-100",
  [ChallengeCategory.Nutrition]: "from-emerald-50 to-emerald-100",
}

// Mapping for border colors based on category
const categoryBorderMapping: Record<ChallengeCategory, string> = {
  [ChallengeCategory.Common]: "border-purple-200",
  [ChallengeCategory.Exercise]: "border-blue-200",
  [ChallengeCategory.Nutrition]: "border-emerald-200",
}

// Mapping for text colors based on category
const categoryTextMapping: Record<ChallengeCategory, string> = {
  [ChallengeCategory.Common]: "text-purple-600",
  [ChallengeCategory.Exercise]: "text-blue-600",
  [ChallengeCategory.Nutrition]: "text-emerald-600",
}

// Mapping for button colors based on category
const categoryButtonMapping: Record<ChallengeCategory, string> = {
  [ChallengeCategory.Common]: "bg-purple-600 hover:bg-purple-700",
  [ChallengeCategory.Exercise]: "bg-blue-600 hover:bg-blue-700",
  [ChallengeCategory.Nutrition]: "bg-emerald-600 hover:bg-emerald-700",
}

// Mapping for progress bar colors based on category
const categoryProgressMapping: Record<ChallengeCategory, string> = {
  [ChallengeCategory.Common]: "bg-purple-500",
  [ChallengeCategory.Exercise]: "bg-blue-500",
  [ChallengeCategory.Nutrition]: "bg-emerald-500",
}

// Helper: Get icon for a challenge – prefer subType icon if available
const getIcon = (challenge: Challenge): string => {
  return challenge.subType && subTypeIconMapping[challenge.subType]
    ? subTypeIconMapping[challenge.subType]
    : categoryIconMapping[challenge.category] || "emoji_events"
}

// Helper: Get category name as string
const getCategoryName = (category: ChallengeCategory): string => {
  return ChallengeCategory[category]
}

export default function ChallengesPage() {
  const [loading, setLoading] = useState(true)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "in-progress" | "not-started">("all")

  // Load mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setChallenges([
        {
          id: 0,
          name: "10 Bicep Curls a Day",
          description:
            "Complete 10 bicep curls daily for 5 consecutive days. Boost your arm strength!",
          category: ChallengeCategory.Exercise,
          subType: "bicep-curl",
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          minStake: 50,
          poolSize: 2500,
          status: ChallengeStatus.Active,
          participantCount: 48,
          completedCount: 1,
          isJoined: true,
          myStake: 50,
          myCompletion: false,
          daysLeft: 7,
          progress: 60,
        },
        {
          id: 1,
          name: "Hydration Hero",
          description:
            "Drink 8 cups of water daily for 7 consecutive days. Stay hydrated for optimal health!",
          category: ChallengeCategory.Nutrition,
          subType: "water",
          startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          minStake: 100,
          poolSize: 5000,
          status: ChallengeStatus.Active,
          participantCount: 76,
          completedCount: 0,
          isJoined: true,
          myStake: 150,
          myCompletion: true,
          daysLeft: 4,
          progress: 80,
        },
        {
          id: 2,
          name: "Meditation Master",
          description:
            "Complete 10 minutes of mindfulness daily for a week. Improve your mental well-being!",
          category: ChallengeCategory.Common,
          subType: "mindfulness",
          startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
          minStake: 75,
          poolSize: 3750,
          status: ChallengeStatus.Active,
          participantCount: 32,
          completedCount: 0,
          isJoined: false,
          myStake: 0,
          myCompletion: false,
          daysLeft: 9,
          progress: 25,
        },
        {
          id: 3,
          name: "Weekly Weight Training",
          description:
            "Complete 3 strength training sessions this week and track your results.",
          category: ChallengeCategory.Exercise,
          subType: "strength",
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
          minStake: 200,
          poolSize: 8000,
          status: ChallengeStatus.Completed,
          participantCount: 64,
          completedCount: 42,
          isJoined: true,
          myStake: 200,
          myCompletion: true,
          daysLeft: 0,
          progress: 100,
        },
      ])
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Filter challenges based on selected filter
  const filteredChallenges = challenges.filter((challenge) => {
    if (activeFilter === "all") return true
    if (
      activeFilter === "active" &&
      (challenge.status === ChallengeStatus.Active || challenge.status === ChallengeStatus.Judging)
    )
      return true
    if (activeFilter === "in-progress" && challenge.status === ChallengeStatus.Active)
      return challenge.isJoined
    if (activeFilter === "not-started" && challenge.status === ChallengeStatus.Active)
      return !challenge.isJoined
    return false
  })

  const calculateProgress = (startDate: Date, endDate: Date) => {
    const now = new Date().getTime()
    const start = startDate.getTime()
    const end = endDate.getTime()
    if (now <= start) return 0
    if (now >= end) return 100
    return Math.round(((now - start) / (end - start)) * 100)
  }

  const toggleChallengeDetails = (challengeId: number) => {
    setSelectedChallengeId((prev) => (prev === challengeId ? null : challengeId))
  }

  // Simulated submit function for video recording
  const handleSubmitVideo = (challengeId: number) => {
    alert(`Video for challenge ${challengeId} submitted!`)
  }

  return (
    <main className="min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-emerald-50 to-emerald-50/90 backdrop-blur-sm pt-4 pb-2 -mx-4 px-4 sm:static sm:bg-transparent sm:backdrop-blur-none sm:pt-0 sm:pb-0 sm:mx-0 sm:px-0">
          <div className="flex flex-wrap items-center justify-between mb-4 sm:mb-8">
            <div className="flex items-center mb-3 sm:mb-0">
              <Link
                href="/dashboard"
                className="text-emerald-700 hover:underline font-medium mr-4 flex items-center"
              >
                <span className="material-icons mr-1">arrow_back</span>
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-emerald-800">
                Health Challenges
              </h1>
            </div>
            {/* Desktop Filter Tabs */}
            <div className="hidden sm:flex bg-white shadow-sm rounded-lg p-1">
              {(["all", "active", "in-progress", "not-started"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeFilter === filter ? "bg-emerald-100 text-emerald-800" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Challenge */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-emerald-800 flex items-center">
              <span className="material-icons mr-2 text-emerald-600">stars</span>
              Featured Challenge
            </h2>
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
              Limited Time
            </span>
          </div>
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-4 sm:p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <span className="material-icons text-9xl">directions_run</span>
            </div>
            <div className="relative z-10">
              <div className="flex flex-wrap items-start">
                <div className="w-full md:w-3/4 mb-4 md:mb-0 md:pr-6">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">
                    30-Day Fitness Challenge
                  </h3>
                  <p className="mb-4 text-emerald-100 text-sm sm:text-base">
                    Complete a daily mix of activities including walking, strength training,
                    and flexibility exercises for 30 days. Track your progress and see remarkable
                    improvements in your fitness level!
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-white bg-opacity-20 rounded-full text-xs px-3 py-1">
                      Fitness
                    </span>
                    <span className="bg-white bg-opacity-20 rounded-full text-xs px-3 py-1">
                      All Levels
                    </span>
                    <span className="bg-white bg-opacity-20 rounded-full text-xs px-3 py-1">
                      30 Days
                    </span>
                  </div>
                  <button className="bg-white text-emerald-700 py-2 px-4 sm:px-6 rounded-lg font-medium hover:shadow-md transition-all inline-flex items-center text-sm sm:text-base">
                    Join Challenge
                    <span className="material-icons ml-1 text-sm">arrow_forward</span>
                  </button>
                </div>
                <div className="w-full md:w-1/4 flex justify-center md:justify-end">
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
                      <span className="material-icons text-3xl sm:text-4xl">emoji_events</span>
                    </div>
                    <div className="text-base sm:text-lg font-bold">500 Points</div>
                    <div className="text-xs sm:text-sm text-emerald-100">Premium Badge</div>
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
            {filteredChallenges.map((challenge) => {
              const icon = getIcon(challenge)
              const bgClass = categoryBgMapping[challenge.category] || "from-gray-50 to-gray-100"
              const borderClass = categoryBorderMapping[challenge.category] || "border-gray-200"
              const textClass = categoryTextMapping[challenge.category] || "text-gray-600"
              const buttonClass = categoryButtonMapping[challenge.category] || "bg-gray-600 hover:bg-gray-700"
              const progressClass = categoryProgressMapping[challenge.category] || "bg-gray-500"

              return (
                <div key={challenge.id}>
                  <motion.div
                    onClick={() => toggleChallengeDetails(challenge.id)}
                    className={`bg-gradient-to-br ${bgClass} ${borderClass} rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer p-4 sm:p-5`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white flex items-center justify-center ${textClass}`}>
                          <span className="material-icons text-xl sm:text-2xl">{icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                            {challenge.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 sm:line-clamp-2">
                            {challenge.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center ml-2">
                        {challenge.status === ChallengeStatus.Active && challenge.isJoined && (
                          <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                            In Progress
                          </span>
                        )}
                        {challenge.status === ChallengeStatus.Active && !challenge.isJoined && (
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                            Not Started
                          </span>
                        )}
                        {challenge.status === ChallengeStatus.Completed && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                            Completed
                          </span>
                        )}
                        <span className="material-icons text-gray-400 ml-1 sm:ml-2">
                          {selectedChallengeId === challenge.id ? "expand_less" : "expand_more"}
                        </span>
                      </div>
                    </div>
                    {/* Mobile-only mini progress bar */}
                    <div className="mt-3 sm:hidden">
                      <div className="w-full bg-white bg-opacity-50 rounded-full h-1.5">
                        <div
                          className={`${progressClass} h-1.5 rounded-full`}
                          style={{ width: `${challenge.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {selectedChallengeId === challenge.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 sm:mt-4 p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                          <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className={`material-icons mr-2 ${textClass}`}>{icon}</span>
                            {challenge.name} Details
                          </h4>
                          <p className="mb-4 sm:mb-6 text-gray-700 text-sm sm:text-base">
                            {challenge.description}
                          </p>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                            <div className={`p-3 rounded-lg bg-opacity-10 ${bgClass}`}>
                              <p className="text-xs text-gray-500 mb-1">Category</p>
                              <p className={`font-medium ${textClass} text-sm sm:text-base flex items-center`}>
                                <span className="material-icons mr-1 text-sm">category</span>
                                {getCategoryName(challenge.category)}
                              </p>
                            </div>
                            <div className={`p-3 rounded-lg bg-opacity-10 ${bgClass}`}>
                              <p className="text-xs text-gray-500 mb-1">Min Stake</p>
                              <p className={`font-medium ${textClass} text-sm sm:text-base flex items-center`}>
                                <span className="material-icons mr-1 text-sm">toll</span>
                                {challenge.minStake} Points
                              </p>
                            </div>
                            <div className={`p-3 rounded-lg bg-opacity-10 ${bgClass}`}>
                              <p className="text-xs text-gray-500 mb-1">Pool Size</p>
                              <p className={`font-medium ${textClass} text-sm sm:text-base flex items-center`}>
                                <span className="material-icons mr-1 text-sm">savings</span>
                                {challenge.poolSize} Points
                              </p>
                            </div>
                            <div className={`p-3 rounded-lg bg-opacity-10 ${bgClass}`}>
                              <p className="text-xs text-gray-500 mb-1">Days Left</p>
                              <p className={`font-medium ${textClass} text-sm sm:text-base flex items-center`}>
                                <span className="material-icons mr-1 text-sm">schedule</span>
                                {challenge.daysLeft !== undefined ? challenge.daysLeft : 0}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4 mb-6">
                            <div>
                              <div className="flex justify-between mb-1">
                                <p className="text-xs sm:text-sm text-gray-500">Time Progress</p>
                                <span className="text-xs sm:text-sm font-medium text-gray-700">
                                  {calculateProgress(challenge.startDate, challenge.endDate)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${calculateProgress(challenge.startDate, challenge.endDate)}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className={`${progressClass} h-2 sm:h-3 rounded-full`}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between mb-1">
                                <p className="text-xs sm:text-sm text-gray-500">Your Completion</p>
                                <span className="text-xs sm:text-sm font-medium text-gray-700">
                                  {challenge.progress || 0}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${challenge.progress || 0}%` }}
                                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                                  className={`${progressClass} h-2 sm:h-3 rounded-full`}
                                />
                              </div>
                            </div>
                          </div>

                          {/* For Exercise challenges, show LiveDetection (pass subType directly) */}
                          {challenge.category === ChallengeCategory.Exercise && challenge.status !== ChallengeStatus.Completed && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="mt-4 border-t pt-4 border-gray-100"
                            >
                              <h5 className="text-xl font-semibold mb-2 text-gray-800 flex items-center">
                                <span className="material-icons mr-2 text-emerald-600">videocam</span>
                                Record Your Exercise
                              </h5>
                              <LiveDetection exerciseSubType={challenge.subType} />
                              <button
                                onClick={() => handleSubmitVideo(challenge.id)}
                                className="mt-4 w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700"
                              >
                                Submit Video
                              </button>
                            </motion.div>
                          )}

                          <div className="mt-6 flex flex-wrap gap-3 justify-end">
                            {challenge.status === ChallengeStatus.Active && !challenge.isJoined && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`${categoryButtonMapping[challenge.category]} text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center shadow-sm text-sm sm:text-base`}
                              >
                                <span className="material-icons mr-1 text-sm">
                                  {challenge.category === ChallengeCategory.Nutrition ? "local_drink" : "add_circle"}
                                </span>
                                {challenge.category === ChallengeCategory.Nutrition ? "Join & Log Water" : "Join Challenge"}
                              </motion.button>
                            )}

                            {challenge.status === ChallengeStatus.Active &&
                              challenge.isJoined &&
                              !challenge.myCompletion && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`${categoryButtonMapping[challenge.category]} text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center shadow-sm text-sm sm:text-base`}
                                >
                                  <span className="material-icons mr-1 text-sm">
                                    {challenge.category === ChallengeCategory.Nutrition ? "edit" : "check_circle"}
                                  </span>
                                  {challenge.category === ChallengeCategory.Nutrition ? "Log Nutrition" : "Mark as Complete"}
                                </motion.button>
                              )}

                            {challenge.status === ChallengeStatus.Active &&
                              challenge.isJoined &&
                              challenge.myCompletion && (
                                <button className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium flex items-center text-sm sm:text-base">
                                  <span className="material-icons mr-1 text-sm text-emerald-500">check_circle</span>
                                  Completed
                                </button>
                              )}

                            {challenge.status === ChallengeStatus.Completed && challenge.myCompletion && (
                              <button className="bg-amber-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center shadow-sm text-sm sm:text-base">
                                <span className="material-icons mr-1 text-sm">emoji_events</span>
                                Claim Rewards
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}

        {!loading && filteredChallenges.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="material-icons text-gray-400 text-2xl">search_off</span>
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No challenges found</h3>
            <p className="text-gray-500 mb-4 text-sm sm:text-base">
              There are no challenges matching your selected filter.
            </p>
            <button
              onClick={() => setActiveFilter("all")}
              className="py-2 px-4 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 transition-colors text-sm sm:text-base"
            >
              View All Challenges
            </button>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 sm:hidden">
          <div className="flex justify-around">
            <Link href="/dashboard" className="flex flex-col items-center text-gray-600">
              <span className="material-icons">home</span>
              <span className="text-xs mt-1">Home</span>
            </Link>
            <Link href="#" className="flex flex-col items-center text-emerald-600">
              <span className="material-icons">emoji_events</span>
              <span className="text-xs mt-1">Challenges</span>
            </Link>
            <Link href="#" className="flex flex-col items-center text-gray-600">
              <span className="material-icons">account_circle</span>
              <span className="text-xs mt-1">Profile</span>
            </Link>
            <Link href="#" className="flex flex-col items-center text-gray-600">
              <span className="material-icons">settings</span>
              <span className="text-xs mt-1">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
