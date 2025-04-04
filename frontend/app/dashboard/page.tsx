"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/minikit-provider';
import { useHealthData } from '@/components/health-data-provider';
import DashboardCard from '@/components/DashboardCard';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading, userData, logout, walletAddress, isVerified } = useAuth();
  const { todaySteps, todayWater, todaySleep } = useHealthData();

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show loading state
  if (isLoading || !isAuthenticated || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 shadow">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-white text-2xl font-bold">HealthyWorld Dashboard</h1>
              <div className="flex items-center mt-2">
                {isVerified && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center mr-2">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" />
                    </svg>
                    Verified
                  </span>
                )}
                <span className="text-white text-sm opacity-90">
                  {walletAddress ? `Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'No wallet connected'}
                </span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white text-sm transition"
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-6xl mx-auto p-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard 
            icon="emoji_events"
            iconColor="text-yellow-500"
            title="Points" 
            value={userData.points.toString()}
            bgColor="bg-white"
          />
          <DashboardCard 
            icon="military_tech"
            iconColor="text-purple-500"
            title="Badges" 
            value={userData.badges.toString()}
            bgColor="bg-white"
          />
          <DashboardCard 
            icon="local_fire_department"
            iconColor="text-orange-500"
            title="Streak Days" 
            value={userData.streakDays.toString()}
            bgColor="bg-white"
          />
          <DashboardCard 
            icon="task_alt"
            iconColor="text-blue-500"
            title="Challenges Completed" 
            value={userData.completedChallenges.toString()}
            bgColor="bg-white"
          />
        </div>
      </div>

      {/* Health Metrics */}
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard 
            icon="directions_walk"
            iconColor="text-green-500"
            title="Steps" 
            value={todaySteps.toString()}
            subtext="Goal: 10,000 steps"
            progress={todaySteps / 10000}
            bgColor="bg-white"
          />
          <DashboardCard 
            icon="water_drop"
            iconColor="text-blue-500"
            title="Water" 
            value={`${todayWater} cups`}
            subtext="Goal: 8 cups"
            progress={todayWater / 8}
            bgColor="bg-white"
          />
          <DashboardCard 
            icon="bedtime"
            iconColor="text-indigo-500"
            title="Sleep" 
            value={`${todaySleep} hrs`}
            subtext="Goal: 8 hours"
            progress={todaySleep / 8}
            bgColor="bg-white"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/track" 
            className="bg-white p-4 rounded-lg shadow text-center hover:shadow-md transition"
          >
            <span className="material-icons text-blue-500 text-3xl mb-2">monitoring</span>
            <p className="font-medium text-blue-500">Track Health</p>
          </Link>
          <Link 
            href="/challenges" 
            className="bg-white p-4 rounded-lg shadow text-center hover:shadow-md transition"
          >
            <span className="material-icons text-purple-500 text-3xl mb-2">emoji_events</span>
            <p className="font-medium text-blue-500">Challenges</p>
          </Link>
          <Link 
            href="/rewards" 
            className="bg-white p-4 rounded-lg shadow text-center hover:shadow-md transition"
          >
            <span className="material-icons text-yellow-500 text-3xl mb-2">redeem</span>
            <p className="font-medium text-blue-500">Rewards</p>
          </Link>
          <Link 
            href="/profile" 
            className="bg-white p-4 rounded-lg shadow text-center hover:shadow-md transition"
          >
            <span className="material-icons text-emerald-500 text-3xl mb-2">person</span>
            <p className="font-medium text-blue-500">Profile</p>
          </Link>
        </div>
      </div>

      {/* World ID Integration Info */}
      <div className="max-w-6xl mx-auto p-6 mb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h3 className="text-blue-800 font-medium flex items-center mb-2">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" />
            </svg>
            World ID Integration
          </h3>
          <p className="text-blue-700 text-sm">
            Your privacy is protected with World ID. Your identity is verified without sharing personal data.
            You can use your World ID to earn rewards and track your health progress securely.
          </p>
        </div>
      </div>
    </div>
  );
} 