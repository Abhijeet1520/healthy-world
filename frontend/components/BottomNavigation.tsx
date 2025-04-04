"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('/dashboard');
  
  useEffect(() => {
    // Update the active tab based on the current path
    if (pathname) {
      if (pathname.includes('/dashboard')) {
        setActiveTab('/dashboard');
      } else if (pathname.includes('/challenges')) {
        setActiveTab('/challenges');
      } else if (pathname.includes('/rewards')) {
        setActiveTab('/rewards');
      }
    }
  }, [pathname]);
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50">
      <div className="flex justify-around items-center h-16">
        <Link 
          href="/dashboard" 
          className={`flex flex-col items-center justify-center w-full h-full ${activeTab === '/dashboard' ? 'text-green-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('/dashboard')}
        >
          <span className="material-icons text-2xl">dashboard</span>
          <span className="text-xs mt-1">Dashboard</span>
        </Link>
        
        <Link 
          href="/challenges" 
          className={`flex flex-col items-center justify-center w-full h-full ${activeTab === '/challenges' ? 'text-green-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('/challenges')}
        >
          <span className="material-icons text-2xl">fitness_center</span>
          <span className="text-xs mt-1">Challenges</span>
        </Link>
        
        <Link 
          href="/rewards" 
          className={`flex flex-col items-center justify-center w-full h-full ${activeTab === '/rewards' ? 'text-green-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('/rewards')}
        >
          <span className="material-icons text-2xl">card_giftcard</span>
          <span className="text-xs mt-1">Rewards</span>
        </Link>
      </div>
    </div>
  );
} 