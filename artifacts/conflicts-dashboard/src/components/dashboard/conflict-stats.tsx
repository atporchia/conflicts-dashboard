import type { Conflict, NewsItem } from '@/lib/types';

interface ConflictStatsProps {
  conflicts: Conflict[];
  news: NewsItem[];
  selectedCountry: string | null;
  onClearCountry: () => void;
}

const STATUS_CONFIG = {
  escalating: { label: 'Escalating', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  ongoing: { label: 'Ongoing', color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  'de-escalating': { label: 'De-escalating', color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  frozen: { label: 'Frozen', color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
};

const TYPE_LABELS: Record<string, string> = {
  civil_war: 'Civil War',
  interstate: 'Interstate',
  insurgency: 'Insurgency',
  terrorism: 'Terrorism',
  territorial_dispute: 'Territorial',
};

const INTENSITY_CONFIG = {
  high: { label: 'High', color: 'bg-red-500', width: '100%' },
  medium: { label: 'Medium', color: 'bg-orange-400', width: '60%' },
  low: { label: 'Low', color: 'bg-yellow-400', width: '30%' },
};

export function ConflictStats({ conflicts, news, selectedCountry, onClearCountry }: ConflictStatsProps) {
  const filtered = selectedCountry
    ? conflicts.filter(c => c.countries_involved?.includes(selectedCountry))
    : conflicts;

  const total = filtered.length;
  const byStatus = Object.entries(STATUS_CONFIG).map(([key]) => ({
    key,
    count: filtered.filter(c => c.status === key).length,
  }));
  const byType = Object.entries(TYPE_LABELS).map(([key, label]) => ({
    key,
    label,
    count: filtered.filter(c => c.type === key).length,
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

  const high = filtered.filter(c => c.intensity === 'high').length;
  const medium = filtered.filter(c => c.intensity === 'medium').length;
  const low = filtered.filter(c => c.intensity === 'low').length;

  const regions = Array.from(
    filtered.reduce((m, c) => {
      if (c.region) m.set(c.region, (m.get(c.region) || 0) + 1);
      return m;
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const allCountries = Array.from(
    new Set(conflicts.flatMap(c => c.countries_involved || []))
  ).length;

  return (
    <div className="flex flex-col gap-4 h-full">
      {selectedCountry && (
        <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2">
          <span className="text-sm text-blue-300 font-medium">📍 {selectedCountry}</span>
          <button
            onClick={onClearCountry}
            className="text-xs text-blue-400 hover:text-blue-200 transition-colors"
          >
            Clear ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {selectedCountry ? 'In Region' : 'Total Conflicts'}
          </p>
          <p className="text-3xl font-bold text-white">{total}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Countries</p>
          <p className="text-3xl font-bold text-white">{allCountries}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Status Breakdown</p>
        <div className="space-y-2">
          {byStatus.map(({ key, count }) => {
            const cfg = STATUS_CONFIG[key as keyof typeof STATUS_CONFIG];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
                  <span className="text-xs text-gray-400">{count}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: cfg.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Intensity</p>
        <div className="flex items-end gap-2">
          {[
            { label: 'High', count: high, color: '#ef4444' },
            { label: 'Med', count: medium, color: '#f97316' },
            { label: 'Low', count: low, color: '#eab308' },
          ].map(({ label, count, color }) => {
            const maxVal = Math.max(high, medium, low, 1);
            const barH = Math.max(Math.round((count / maxVal) * 48), count > 0 ? 4 : 2);
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400">{count}</span>
                <div className="w-full rounded-t-sm" style={{ height: `${barH}px`, background: color, opacity: count > 0 ? 0.85 : 0.2 }} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {byType.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Conflict Types</p>
          <div className="flex flex-wrap gap-2">
            {byType.map(({ key, label, count }) => (
              <div key={key} className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-2.5 py-1.5">
                <span className="text-xs font-semibold text-white">{count}</span>
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {regions.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">By Region</p>
          <div className="space-y-2">
            {regions.map(([region, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={region} className="flex items-center gap-3">
                  <span className="text-xs text-gray-300 w-28 truncate">{region}</span>
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-4 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
