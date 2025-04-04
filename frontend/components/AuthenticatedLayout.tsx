"use client";

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNavigation from './BottomNavigation';
import { useAuth } from './minikit-provider';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login page if not authenticated
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  if (isLoading) {
    return (
      <div className="h-screen w-full flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Return empty div while redirecting
    return <div></div>;
  }
  
  return (
    <div className="pb-16"> {/* Add padding to bottom to account for navigation */}
      {children}
      <BottomNavigation />
    </div>
  );
} 