"use client";

import { useAuth } from '@/components/minikit-provider';
import { useState } from 'react';

// Reward type definition
interface Reward {
  id: number;
  title: string;
  description: string;
  points: number;
  available: boolean;
  image: string;
  category: string;
}

export default function RewardsPage() {
  const { userData } = useAuth();
  const userPoints = userData?.points || 0;
  
  const [showAvailable, setShowAvailable] = useState(true);
  
  // Sample rewards data
  const rewards: Reward[] = [
    {
      id: 1,
      title: "5 USDC",
      description: "Redeem your points for 5 USDC, sent directly to your wallet",
      points: 1000,
      available: userPoints >= 1000,
      image: "attach_money",
      category: "crypto"
    },
    {
      id: 2,
      title: "HealthyWorld T-shirt",
      description: "Show your commitment to health with our exclusive t-shirt",
      points: 2500,
      available: userPoints >= 2500,
      image: "checkroom",
      category: "merchandise"
    },
    {
      id: 3,
      title: "Premium Badge",
      description: "Unlock a special badge for your profile",
      points: 500,
      available: userPoints >= 500,
      image: "workspace_premium",
      category: "digital"
    },
    {
      id: 4,
      title: "10 USDC",
      description: "Redeem your points for 10 USDC, sent directly to your wallet",
      points: 2000,
      available: userPoints >= 2000,
      image: "attach_money",
      category: "crypto"
    },
    {
      id: 5,
      title: "Exclusive NFT",
      description: "Limited edition HealthyWorld NFT for your collection",
      points: 3000,
      available: userPoints >= 3000,
      image: "diamond",
      category: "digital"
    },
  ];
  
  const filteredRewards = showAvailable 
    ? rewards.filter(reward => reward.available)
    : rewards;
  
  return (
    <div className="container mx-auto px-4 pt-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rewards</h1>
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center">
          <span className="material-icons text-sm mr-1">stars</span>
          <span>{userPoints} pts</span>
        </div>
      </div>
      
      {/* Filter toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setShowAvailable(true)}
            className={`px-4 py-2 rounded-full text-sm ${
              showAvailable ? 'bg-green-500 text-white' : 'text-gray-700'
            }`}
          >
            Available
          </button>
          <button
            onClick={() => setShowAvailable(false)}
            className={`px-4 py-2 rounded-full text-sm ${
              !showAvailable ? 'bg-green-500 text-white' : 'text-gray-700'
            }`}
          >
            All Rewards
          </button>
        </div>
      </div>
      
      {/* Rewards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRewards.map(reward => (
          <div 
            key={reward.id} 
            className={`bg-white rounded-lg shadow-md overflow-hidden ${
              !reward.available ? 'opacity-70' : ''
            }`}
          >
            <div className="p-4">
              <div className="flex items-center mb-3">
                <div className={`p-3 rounded-full mr-3 ${
                  reward.category === 'crypto' ? 'bg-blue-100 text-blue-500' :
                  reward.category === 'merchandise' ? 'bg-purple-100 text-purple-500' :
                  'bg-amber-100 text-amber-500'
                }`}>
                  <span className="material-icons">{reward.image}</span>
                </div>
                <div>
                  <h3 className="font-bold">{reward.title}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="material-icons text-sm mr-1">stars</span>
                    <span>{reward.points} points</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
              
              <button 
                className={`w-full py-2 px-4 rounded-full text-center text-sm font-medium ${
                  reward.available 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!reward.available}
              >
                {reward.available ? 'Redeem Reward' : `Need ${reward.points - userPoints} more points`}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {filteredRewards.length === 0 && (
        <div className="text-center py-8">
          <div className="bg-gray-100 inline-block p-3 rounded-full mb-3">
            <span className="material-icons text-gray-400 text-3xl">redeem</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No rewards available yet</h3>
          <p className="text-gray-500">Complete challenges to earn more points and unlock rewards!</p>
        </div>
      )}
    </div>
  );
} 