"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HealthData {
  todaySteps: number;
  todayWater: number;
  todaySleep: number;
  weeklySteps: number[];
  weeklyWater: number[];
  weeklySleep: number[];
  monthlySteps: number[];
  monthlyWater: number[];
  monthlySleep: number[];
}

interface HealthDataContextType extends HealthData {
  updateSteps: (steps: number) => void;
  updateWater: (cups: number) => void;
  updateSleep: (hours: number) => void;
  isLoading: boolean;
}

const HealthDataContext = createContext<HealthDataContextType>({
  todaySteps: 0,
  todayWater: 0,
  todaySleep: 0,
  weeklySteps: [0, 0, 0, 0, 0, 0, 0],
  weeklyWater: [0, 0, 0, 0, 0, 0, 0],
  weeklySleep: [0, 0, 0, 0, 0, 0, 0],
  monthlySteps: Array(30).fill(0),
  monthlyWater: Array(30).fill(0),
  monthlySleep: Array(30).fill(0),
  updateSteps: () => {},
  updateWater: () => {},
  updateSleep: () => {},
  isLoading: true,
});

export const useHealthData = () => useContext(HealthDataContext);

export function HealthDataProvider({ children }: { children: ReactNode }) {
  const [healthData, setHealthData] = useState<HealthData>({
    todaySteps: 0,
    todayWater: 0,
    todaySleep: 0,
    weeklySteps: [0, 0, 0, 0, 0, 0, 0],
    weeklyWater: [0, 0, 0, 0, 0, 0, 0],
    weeklySleep: [0, 0, 0, 0, 0, 0, 0],
    monthlySteps: Array(30).fill(0),
    monthlyWater: Array(30).fill(0),
    monthlySleep: Array(30).fill(0),
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load health data from localStorage on initial render
  useEffect(() => {
    const loadHealthData = () => {
      try {
        const storedData = localStorage.getItem('healthyworld_health_data');
        if (storedData) {
          setHealthData(JSON.parse(storedData));
        } else {
          // If no data exists, generate mock data
          generateMockData();
        }
      } catch (error) {
        console.error('Error loading health data:', error);
        generateMockData();
      } finally {
        setIsLoading(false);
      }
    };

    loadHealthData();
  }, []);

  // Generate random mock data for demo purposes
  const generateMockData = () => {
    const mockWeeklySteps = Array(7).fill(0).map(() => Math.floor(Math.random() * 5000) + 3000);
    const mockWeeklyWater = Array(7).fill(0).map(() => Math.floor(Math.random() * 5) + 3);
    const mockWeeklySleep = Array(7).fill(0).map(() => (Math.random() * 3) + 5);
    
    const mockMonthlySteps = Array(30).fill(0).map(() => Math.floor(Math.random() * 6000) + 2000);
    const mockMonthlyWater = Array(30).fill(0).map(() => Math.floor(Math.random() * 6) + 2);
    const mockMonthlySleep = Array(30).fill(0).map(() => (Math.random() * 4) + 4);
    
    const mockData = {
      todaySteps: Math.floor(Math.random() * 8000) + 2000,
      todayWater: Math.floor(Math.random() * 6) + 2,
      todaySleep: Math.floor(Math.random() * 3) + 5,
      weeklySteps: mockWeeklySteps,
      weeklyWater: mockWeeklyWater,
      weeklySleep: mockWeeklySleep,
      monthlySteps: mockMonthlySteps,
      monthlyWater: mockMonthlyWater,
      monthlySleep: mockMonthlySleep,
    };
    
    setHealthData(mockData);
    localStorage.setItem('healthyworld_health_data', JSON.stringify(mockData));
  };

  // Update steps
  const updateSteps = (steps: number) => {
    const updatedData = {
      ...healthData,
      todaySteps: steps,
      weeklySteps: [
        ...healthData.weeklySteps.slice(0, 6),
        steps
      ],
      monthlySteps: [
        ...healthData.monthlySteps.slice(0, 29),
        steps
      ]
    };
    
    setHealthData(updatedData);
    localStorage.setItem('healthyworld_health_data', JSON.stringify(updatedData));
  };

  // Update water
  const updateWater = (cups: number) => {
    const updatedData = {
      ...healthData,
      todayWater: cups,
      weeklyWater: [
        ...healthData.weeklyWater.slice(0, 6),
        cups
      ],
      monthlyWater: [
        ...healthData.monthlyWater.slice(0, 29),
        cups
      ]
    };
    
    setHealthData(updatedData);
    localStorage.setItem('healthyworld_health_data', JSON.stringify(updatedData));
  };

  // Update sleep
  const updateSleep = (hours: number) => {
    const updatedData = {
      ...healthData,
      todaySleep: hours,
      weeklySleep: [
        ...healthData.weeklySleep.slice(0, 6),
        hours
      ],
      monthlySleep: [
        ...healthData.monthlySleep.slice(0, 29),
        hours
      ]
    };
    
    setHealthData(updatedData);
    localStorage.setItem('healthyworld_health_data', JSON.stringify(updatedData));
  };

  return (
    <HealthDataContext.Provider 
      value={{
        ...healthData,
        updateSteps,
        updateWater,
        updateSleep,
        isLoading
      }}
    >
      {children}
    </HealthDataContext.Provider>
  );
} 