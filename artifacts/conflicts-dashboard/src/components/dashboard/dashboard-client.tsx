import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useLocation } from 'wouter';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { RecentUpdates } from '@/components/dashboard/recent-updates';

const ConflictMap = lazy(() =>
  import('@/components/map/conflict-map').then(m => ({ default: m.ConflictMap }))
);

interface DashboardClientProps {
  selectedCountry: string | null;
}

export function DashboardClient({ selectedCountry }: DashboardClientProps) {
  const [, setLocation] = useLocation();
  const [conflicts, setConflicts] = useState([] as any[]);
  const [news, setNews] = useState([] as any[]);

  useEffect(() => {
    fetch('/api/conflicts?limit=50')
      .then(r => r.json())
      .then(d => setConflicts(d.data || []))
      .catch(() => setConflicts([]));
  }, []);

  useEffect(() => {
    const url = selectedCountry
      ? `/api/news?limit=100&country=${encodeURIComponent(selectedCountry)}`
      : `/api/news?limit=100&exclude_frozen=true`;
    fetch(url)
      .then(r => r.json())
      .then(d => setNews(d.data || []))
      .catch(() => setNews([]));
  }, [selectedCountry]);

  const handleCountrySelect = useCallback(
    (country: string) => {
      setLocation(`/?country=${encodeURIComponent(country)}`);
    },
    [setLocation]
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Global Conflict Dashboard</h1>
        <p className="text-gray-400">Real-time visualization of active armed conflicts worldwide</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Global Conflict Map</h2>
            <p className="text-gray-400 text-sm mb-4">
              Hover over markers for details. Click to filter articles by country.
            </p>
            <div className="aspect-video rounded-lg overflow-hidden">
              <Suspense fallback={
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                  Loading map...
                </div>
              }>
                <ConflictMap conflicts={conflicts} onCountrySelect={handleCountrySelect} />
              </Suspense>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Statistics</h2>
            <StatsOverview conflicts={conflicts} selectedCountry={selectedCountry} />
          </div>
        </div>
      </div>

      {selectedCountry && (
        <div className="mt-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                {selectedCountry} Related Articles
              </h2>
              <a
                href="/"
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back
              </a>
            </div>
            <p className="text-gray-400 text-sm mb-4">Showing {news.length} articles</p>
            <RecentUpdates news={news} />
          </div>
        </div>
      )}

      {!selectedCountry && (
        <div className="mt-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Updates</h2>
            <RecentUpdates news={news} />
          </div>
        </div>
      )}
    </div>
  );
}
