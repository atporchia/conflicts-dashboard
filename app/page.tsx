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

async function getNews(country?: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = country 
      ? `${baseUrl}/api/news?limit=100&country=${encodeURIComponent(country)}`
      : `${baseUrl}/api/news?limit=100`;
    
    const res = await fetch(url, {
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

export default async function Home({
  searchParams,
}: {
  searchParams: { country?: string };
}) {
  const conflictsData = await getConflicts();
  const selectedCountry = searchParams.country || null;
  const newsData = await getNews(selectedCountry || undefined);

  // Get unique countries from conflicts for filter chips
  const countriesSet = new Set<string>();
  conflictsData.data.forEach((c: any) => {
    if (c.countries_involved) {
      c.countries_involved.forEach((country: string) => countriesSet.add(country));
    }
  });
  const allCountries = Array.from(countriesSet).sort();

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
                  selectedCountry={selectedCountry}
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
              <StatsOverview 
                conflicts={conflictsData.data} 
                selectedCountry={selectedCountry}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Country Filter Section - Always visible */}
      <div className="mt-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              {selectedCountry ? `Filtered by: ${selectedCountry}` : 'Filter by Country'}
            </h2>
            {selectedCountry && (
              <a 
                href="/"
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reset Filter
              </a>
            )}
          </div>
          
          {/* Country chips */}
          <div className="flex flex-wrap gap-2">
            <a
              href="/"
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                !selectedCountry 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All Countries
            </a>
            {allCountries.map((country) => (
              <a
                key={country}
                href={`/?country=${encodeURIComponent(country)}`}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCountry === country
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {country}
              </a>
            ))}
          </div>

          {selectedCountry && (
            <p className="text-gray-400 text-sm mt-4">
              Showing {(newsData.data || []).length} articles related to conflicts in {selectedCountry}.
            </p>
          )}
        </div>
      </div>

      {/* Recent Updates Section */}
      <div className="mt-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {selectedCountry ? `Articles for ${selectedCountry}` : 'Recent Updates'}
          </h2>
          <Suspense fallback={<div className="text-gray-500">Loading updates...</div>}>
            <RecentUpdates news={newsData.data || []} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}