import { Suspense } from 'react';
import { ConflictMap } from '@/components/map/conflict-map';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { RecentUpdates } from '@/components/dashboard/recent-updates';

export const dynamic = 'force-dynamic';

async function getConflicts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/conflicts?limit=50`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      return { data: [], meta: { total: 0 } };
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching conflicts:', error);
    return { data: [], meta: { total: 0 } };
  }
}

async function getNews() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/news?limit=10`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      return { data: [], meta: { total: 0 } };
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching news:', error);
    return { data: [], meta: { total: 0 } };
  }
}

export default async function Home() {
  const conflictsData = await getConflicts();
  const newsData = await getNews();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Global Conflict Dashboard
        </h1>
        <p className="text-gray-400">
          Real-time visualization of active armed conflicts worldwide
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Global Conflict Map
            </h2>
            <div className="aspect-video rounded-lg overflow-hidden">
              <Suspense fallback={<div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">Loading map...</div>}>
                <ConflictMap 
                  conflicts={conflictsData.data} 
                />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Statistics Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Statistics
            </h2>
            <Suspense fallback={<div className="text-gray-500">Loading statistics...</div>}>
              <StatsOverview conflicts={conflictsData.data} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Recent Updates Section */}
      <div className="mt-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Recent Updates
          </h2>
          <Suspense fallback={<div className="text-gray-500">Loading updates...</div>}>
            <RecentUpdates news={newsData.data} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}