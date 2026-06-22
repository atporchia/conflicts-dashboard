'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { RecentUpdates } from '@/components/dashboard/recent-updates';

const ConflictMap = dynamic(
  () => import('@/components/map/conflict-map').then(m => ({ default: m.ConflictMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
        Loading map...
      </div>
    ),
  }
);

interface DashboardClientProps {
  selectedCountry: string | null;
}

export function DashboardClient({ selectedCountry }: DashboardClientProps) {
  const router = useRouter();
  const [conflicts, setConflicts] = useState([] as any[]);
  const [news, setNews] = useState([] as any[]);
  const [ingesting, setIngesting] = useState(false);

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
      router.push(`/?country=${encodeURIComponent(country)}`);
    },
    [router]
  );

  const handleRefreshNews = async () => {
    setIngesting(true);
    try {
      const res = await fetch('/api/news/ingest', { method: 'POST' });
      const result = await res.json();
      if (result.inserted > 0) {
        const url = selectedCountry
          ? `/api/news?limit=100&country=${encodeURIComponent(selectedCountry)}`
          : `/api/news?limit=100&exclude_frozen=true`;
        const newsRes = await fetch(url);
        const newsData = await newsRes.json();
        setNews(newsData.data || []);
      }
    } catch {
      // silently fail — news refresh is best-effort
    } finally {
      setIngesting(false);
    }
  };

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
              <ConflictMap conflicts={conflicts} onCountrySelect={handleCountrySelect} />
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recent Updates</h2>
              <button
                onClick={handleRefreshNews}
                disabled={ingesting}
                className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {ingesting ? 'Refreshing…' : 'Refresh News'}
              </button>
            </div>
            <RecentUpdates news={news} />
          </div>
        </div>
      )}
    </div>
  );
}
