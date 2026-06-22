import { useEffect, useRef } from 'react';
import type { Conflict, NewsItem } from '@/lib/types';

interface ConflictDrawerProps {
  country: string | null;
  conflicts: Conflict[];
  news: NewsItem[];
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  escalating:     { label: 'Escalating',     color: 'text-red-400',    bg: 'bg-red-500/15',    dot: 'bg-red-400' },
  ongoing:        { label: 'Ongoing',         color: 'text-orange-400', bg: 'bg-orange-500/15', dot: 'bg-orange-400' },
  'de-escalating':{ label: 'De-escalating',  color: 'text-yellow-400', bg: 'bg-yellow-500/15', dot: 'bg-yellow-400' },
  frozen:         { label: 'Frozen',          color: 'text-blue-400',   bg: 'bg-blue-500/15',   dot: 'bg-blue-400' },
};

const INTENSITY_CONFIG: Record<string, { label: string; color: string; bars: number }> = {
  high:   { label: 'High',   color: 'bg-red-500',    bars: 3 },
  medium: { label: 'Medium', color: 'bg-orange-400', bars: 2 },
  low:    { label: 'Low',    color: 'bg-yellow-400', bars: 1 },
};

const TYPE_LABELS: Record<string, string> = {
  civil_war:           'Civil War',
  interstate:          'Interstate',
  insurgency:          'Insurgency',
  terrorism:           'Terrorism',
  territorial_dispute: 'Territorial Dispute',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function IntensityBars({ intensity }: { intensity: string }) {
  const cfg = INTENSITY_CONFIG[intensity];
  if (!cfg) return null;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className={`rounded-sm transition-all ${i <= cfg.bars ? cfg.color : 'bg-gray-700'}`}
          style={{ width: 4, height: 4 + i * 3 }}
        />
      ))}
      <span className="text-xs text-gray-400 ml-1">{cfg.label}</span>
    </div>
  );
}

export function ConflictDrawer({ country, conflicts, news, onClose }: ConflictDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const isOpen = !!country;

  const countryConflicts = country
    ? conflicts.filter(c => c.countries_involved?.some(
        n => n.toLowerCase() === country.toLowerCase()
      ))
    : [];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-[1999] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden
      />

      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full z-[2000] w-full sm:w-96 bg-gray-950 border-l border-gray-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">{country || ''}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {countryConflicts.length} active conflict{countryConflicts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {countryConflicts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center pt-8">No active conflicts found for this country.</p>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Conflicts</h3>
              {countryConflicts.map(c => {
                const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.ongoing;
                return (
                  <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white leading-snug">{c.name}</p>
                      <span className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      {c.intensity && (
                        <IntensityBars intensity={c.intensity} />
                      )}
                      {c.type && (
                        <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-300">
                          {TYPE_LABELS[c.type] || c.type}
                        </span>
                      )}
                    </div>

                    {c.countries_involved && c.countries_involved.length > 1 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Countries involved</p>
                        <div className="flex flex-wrap gap-1">
                          {c.countries_involved.map(n => (
                            <span
                              key={n}
                              className={`text-xs px-2 py-0.5 rounded-full border ${
                                n.toLowerCase() === country?.toLowerCase()
                                  ? 'border-blue-500/50 text-blue-300 bg-blue-500/10'
                                  : 'border-gray-700 text-gray-400 bg-gray-800/50'
                              }`}
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {c.description && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{c.description}</p>
                    )}

                    {c.start_date && (
                      <p className="text-xs text-gray-600">
                        Started {new Date(c.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {news.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Latest Headlines</h3>
              {news.slice(0, 6).map(item => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="flex items-start gap-3 py-2 border-b border-gray-800/60">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                        {item.headline}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                        <span className="truncate">{item.source}</span>
                        <span>·</span>
                        <span className="flex-shrink-0">{timeAgo(item.published_at)}</span>
                      </div>
                    </div>
                    <span className="text-gray-700 group-hover:text-gray-400 mt-0.5 flex-shrink-0 text-sm">↗</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
