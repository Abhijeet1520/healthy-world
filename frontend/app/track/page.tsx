"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/minikit-provider';
import { useHealthData } from '@/components/health-data-provider';
import HealthChart from '@/components/HealthChart';

export default function TrackPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { 
    todaySteps, todayWater, todaySleep,
    weeklySteps, weeklyWater, weeklySleep,
    updateSteps, updateWater, updateSleep,
    isLoading: isHealthDataLoading 
  } = useHealthData();
  
  const [steps, setSteps] = useState(todaySteps);
  const [water, setWater] = useState(todayWater);
  const [sleep, setSleep] = useState(todaySleep);
  const [activeTab, setActiveTab] = useState('steps');

  // Update local state when health data loads
  useEffect(() => {
    setSteps(todaySteps);
    setWater(todayWater);
    setSleep(todaySleep);
  }, [todaySteps, todayWater, todaySleep]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state
  if (isLoading || isHealthDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your health data...</p>
        </div>
      </div>
    );
  }

  // Handle form submits
  const handleStepsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSteps(steps);
  };

  const handleWaterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWater(water);
  };

  const handleSleepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSleep(sleep);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 pb-32 shadow">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white text-3xl font-bold">Track Your Health</h1>
          <p className="text-white text-opacity-90 mt-2">
            Monitor your daily progress and stay on track with your health goals
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-24">
        <div className="bg-white rounded-xl shadow mb-6">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('steps')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === 'steps'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="material-icons mr-2 align-middle">directions_walk</span>
              Steps
            </button>
            <button
              onClick={() => setActiveTab('water')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === 'water'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="material-icons mr-2 align-middle">water_drop</span>
              Water
            </button>
            <button
              onClick={() => setActiveTab('sleep')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === 'sleep'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="material-icons mr-2 align-middle">bedtime</span>
              Sleep
            </button>
          </div>

          {/* Steps Tab */}
          {activeTab === 'steps' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Steps</h2>
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Current Steps</p>
                      <p className="text-3xl font-bold">{todaySteps}</p>
                      <p className="text-sm text-blue-600">Goal: 10,000 steps</p>
                    </div>
                    <span className="material-icons text-5xl text-blue-500">directions_walk</span>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min((todaySteps / 10000) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-xs text-blue-600 mt-1">
                      {Math.min(Math.round((todaySteps / 10000) * 100), 100)}% of daily goal
                    </p>
                  </div>
                </div>

                <form onSubmit={handleStepsSubmit} className="mb-6">
                  <div className="mb-4">
                    <label htmlFor="steps" className="block text-sm font-medium text-gray-700 mb-1">
                      Update Steps
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        id="steps"
                        value={steps}
                        onChange={(e) => setSteps(parseInt(e.target.value) || 0)}
                        className="flex-1 rounded-l-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </form>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Progress</h3>
                  <div className="bg-white border rounded-lg p-4 h-64">
                    <HealthChart 
                      data={weeklySteps}
                      labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                      color="#3B82F6"
                      goal={10000}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Water Tab */}
          {activeTab === 'water' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Water Intake</h2>
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Cups of Water</p>
                      <p className="text-3xl font-bold">{todayWater}</p>
                      <p className="text-sm text-blue-600">Goal: 8 cups</p>
                    </div>
                    <span className="material-icons text-5xl text-blue-500">water_drop</span>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min((todayWater / 8) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-xs text-blue-600 mt-1">
                      {Math.min(Math.round((todayWater / 8) * 100), 100)}% of daily goal
                    </p>
                  </div>
                </div>

                <form onSubmit={handleWaterSubmit} className="mb-6">
                  <div className="mb-4">
                    <label htmlFor="water" className="block text-sm font-medium text-gray-700 mb-1">
                      Update Water Intake
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        id="water"
                        value={water}
                        onChange={(e) => setWater(parseInt(e.target.value) || 0)}
                        className="flex-1 rounded-l-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </form>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Progress</h3>
                  <div className="bg-white border rounded-lg p-4 h-64">
                    <HealthChart 
                      data={weeklyWater}
                      labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                      color="#3B82F6"
                      goal={8}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sleep Tab */}
          {activeTab === 'sleep' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Sleep</h2>
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Hours of Sleep</p>
                      <p className="text-3xl font-bold">{todaySleep}</p>
                      <p className="text-sm text-blue-600">Goal: 8 hours</p>
                    </div>
                    <span className="material-icons text-5xl text-blue-500">bedtime</span>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min((todaySleep / 8) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-xs text-blue-600 mt-1">
                      {Math.min(Math.round((todaySleep / 8) * 100), 100)}% of daily goal
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSleepSubmit} className="mb-6">
                  <div className="mb-4">
                    <label htmlFor="sleep" className="block text-sm font-medium text-gray-700 mb-1">
                      Update Sleep Hours
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        id="sleep"
                        step="0.5"
                        value={sleep}
                        onChange={(e) => setSleep(parseFloat(e.target.value) || 0)}
                        className="flex-1 rounded-l-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </form>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Progress</h3>
                  <div className="bg-white border rounded-lg p-4 h-64">
                    <HealthChart 
                      data={weeklySleep}
                      labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                      color="#3B82F6"
                      goal={8}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 