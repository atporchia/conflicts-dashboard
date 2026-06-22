import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { ConflictStats } from '@/components/dashboard/conflict-stats';
import { RecentUpdates } from '@/components/dashboard/recent-updates';
import { ConflictDrawer } from '@/components/dashboard/conflict-drawer';

const ConflictMap = lazy(() =>
  import('@/components/map/conflict-map').then(m => ({ default: m.ConflictMap }))
);

interface DashboardClientProps {
  selectedCountry: string | null;
}

export function DashboardClient({ selectedCountry: _selectedCountry }: DashboardClientProps) {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [drawerCountry, setDrawerCountry] = useState<string | null>(null);
  const [drawerNews, setDrawerNews] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/conflicts?limit=100')
      .then(r => r.json())
      .then(d => setConflicts(d.data || []))
      .catch(() => setConflicts([]));
  }, []);

  useEffect(() => {
    fetch('/api/news?limit=20&exclude_frozen=true')
      .then(r => r.json())
      .then(d => setNews(d.data || []))
      .catch(() => setNews([]));
  }, []);

  useEffect(() => {
    if (!drawerCountry) { setDrawerNews([]); return; }
    fetch(`/api/news?limit=10&country=${encodeURIComponent(drawerCountry)}`)
      .then(r => r.json())
      .then(d => setDrawerNews(d.data || []))
      .catch(() => setDrawerNews([]));
  }, [drawerCountry]);

  const handleCountrySelect = useCallback((country: string) => {
    setDrawerCountry(country);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerCountry(null);
  }, []);

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
                selectedCountry={drawerCountry}
              />
            </Suspense>
          </div>

          <div className="px-4 pb-4 flex-1">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-full">
              <h2 className="text-sm font-semibold text-white mb-3">Recent Updates</h2>
              <RecentUpdates news={news} />
            </div>
          </div>
        </div>

        <div className="lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l border-gray-800/60 p-4 overflow-y-auto">
          <ConflictStats
            conflicts={conflicts}
            news={news}
            selectedCountry={null}
            onClearCountry={() => {}}
          />
        </div>
      </div>

      <ConflictDrawer
        country={drawerCountry}
        conflicts={conflicts}
        news={drawerNews}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
