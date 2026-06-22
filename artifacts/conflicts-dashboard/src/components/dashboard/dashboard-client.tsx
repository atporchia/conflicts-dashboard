import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useLocation } from 'wouter';
import { ConflictStats } from '@/components/dashboard/conflict-stats';
import { RecentUpdates } from '@/components/dashboard/recent-updates';

const ConflictMap = lazy(() =>
  import('@/components/map/conflict-map').then(m => ({ default: m.ConflictMap }))
);

interface DashboardClientProps {
  selectedCountry: string | null;
}

export function DashboardClient({ selectedCountry }: DashboardClientProps) {
  const [, setLocation] = useLocation();
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/conflicts?limit=100')
      .then(r => r.json())
      .then(d => setConflicts(d.data || []))
      .catch(() => setConflicts([]));
  }, []);

  useEffect(() => {
    const url = selectedCountry
      ? `/api/news?limit=20&country=${encodeURIComponent(selectedCountry)}`
      : `/api/news?limit=20&exclude_frozen=true`;
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

  const handleClearCountry = useCallback(() => {
    setLocation('/');
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between border-b border-gray-800/60">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Global Conflict Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Live visualization of armed conflicts worldwide</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{conflicts.length} conflicts tracked</span>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4">
            <Suspense fallback={
              <div className="w-full bg-gray-900 rounded-xl flex items-center justify-center text-gray-500 text-sm" style={{ height: '420px' }}>
                Loading map…
              </div>
            }>
              <ConflictMap
                conflicts={conflicts}
                onCountrySelect={handleCountrySelect}
                selectedCountry={selectedCountry}
              />
            </Suspense>
          </div>

          <div className="px-4 pb-4 flex-1">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">
                  {selectedCountry ? `${selectedCountry} — Recent News` : 'Recent Updates'}
                </h2>
                {selectedCountry && (
                  <button
                    onClick={handleClearCountry}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    ← All conflicts
                  </button>
                )}
              </div>
              <RecentUpdates news={news} />
            </div>
          </div>
        </div>

        <div className="lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l border-gray-800/60 p-4 overflow-y-auto">
          <ConflictStats
            conflicts={conflicts}
            news={news}
            selectedCountry={selectedCountry}
            onClearCountry={handleClearCountry}
          />
        </div>
      </div>
    </div>
  );
}
