'use client';

import { Conflict } from '@/lib/types';

interface StatsOverviewProps {
  conflicts: Conflict[];
  selectedCountry?: string | null;
}

export function StatsOverview({ conflicts, selectedCountry }: StatsOverviewProps) {
  // Filter conflicts by selected country
  const filteredConflicts = selectedCountry 
    ? conflicts.filter(c => c.countries_involved.includes(selectedCountry))
    : conflicts;

  const totalConflicts = filteredConflicts.length;
  const escalating = filteredConflicts.filter(c => c.status === 'escalating').length;
  const ongoing = filteredConflicts.filter(c => c.status === 'ongoing').length;
  const highIntensity = filteredConflicts.filter(c => c.intensity === 'high').length;

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-gray-400 text-sm">
          {selectedCountry ? `Conflicts in ${selectedCountry}` : 'Active Conflicts'}
        </p>
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