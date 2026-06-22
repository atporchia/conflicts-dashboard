import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { ConflictStats } from '@/components/dashboard/conflict-stats';
import { RecentUpdates } from '@/components/dashboard/recent-updates';
import { ConflictDrawer } from '@/components/dashboard/conflict-drawer';

const ConflictMap = lazy(() =>
  import('@/components/map/conflict-map').then(m => ({ default: m.ConflictMap }))
);

const REFRESH_INTERVAL = 60_000;

async function fetchConflicts() {
  const r = await fetch('/api/conflicts?limit=100');
  const d = await r.json();
  return d.data || [];
}

async function fetchNews(country?: string) {
  const url = country
    ? `/api/news?limit=10&country=${encodeURIComponent(country)}`
    : `/api/news?limit=20&exclude_frozen=true`;
  const r = await fetch(url);
  const d = await r.json();
  return d.data || [];
}

interface DashboardClientProps {
  selectedCountry: string | null;
}

export function DashboardClient({ selectedCountry: _selectedCountry }: DashboardClientProps) {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [drawerCountry, setDrawerCountry] = useState<string | null>(null);
  const [drawerNews, setDrawerNews] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMain = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [c, n] = await Promise.all([fetchConflicts(), fetchNews()]);
      setConflicts(c);
      setNews(n);
      setLastUpdated(new Date());
    } catch {/* silent */} finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMain(false);
    timerRef.current = setInterval(() => loadMain(true), REFRESH_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loadMain]);

  useEffect(() => {
    if (!drawerCountry) { setDrawerNews([]); return; }
    fetchNews(drawerCountry).then(setDrawerNews).catch(() => setDrawerNews([]));
  }, [drawerCountry]);

  const handleCountrySelect = useCallback((country: string) => {
    setDrawerCountry(country);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerCountry(null);
  }, []);

  function formatLastUpdated(d: Date) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between border-b border-gray-800/60">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Global Conflict Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Live visualization of armed conflicts worldwide</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-600 hidden sm:block">
              Updated {formatLastUpdated(lastUpdated)}
            </span>
          )}
          <button
            onClick={() => loadMain(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-40"
            title="Refresh now"
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="hidden sm:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">{conflicts.length} conflicts</span>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
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
