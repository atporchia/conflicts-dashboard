'use client';

import { Conflict } from '@/lib/types';

interface StatsOverviewProps {
  conflicts: Conflict[];
}

export function StatsOverview({ conflicts }: StatsOverviewProps) {
  const totalConflicts = conflicts.length;
  const escalating = conflicts.filter(c => c.status === 'escalating').length;
  const ongoing = conflicts.filter(c => c.status === 'ongoing').length;
  const highIntensity = conflicts.filter(c => c.intensity === 'high').length;

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-gray-400 text-sm">Active Conflicts</p>
        <p className="text-3xl font-bold text-white">{totalConflicts}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Escalating</p>
          <p className="text-2xl font-bold text-red-400">{escalating}</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Ongoing</p>
          <p className="text-2xl font-bold text-yellow-400">{ongoing}</p>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-gray-400 text-sm">High Intensity</p>
        <p className="text-2xl font-bold text-orange-400">{highIntensity}</p>
      </div>
    </div>
  );
}