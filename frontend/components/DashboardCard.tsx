import React from 'react';

interface DashboardCardProps {
  icon: string;
  iconColor: string;
  title: string;
  value: string;
  subtext?: string;
  progress?: number;
  bgColor?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  icon,
  iconColor,
  title,
  value,
  subtext,
  progress,
  bgColor = 'bg-white'
}) => {
  return (
    <div className={`${bgColor} rounded-xl shadow p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <span className={`material-icons text-3xl ${iconColor}`}>{icon}</span>
      </div>
      
      {typeof progress === 'number' && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full" 
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCard; 