import { useEffect, useRef } from 'react';
import type { Conflict } from '@/lib/types';

interface ConflictMapProps {
  conflicts: Conflict[];
  onCountrySelect: (country: string) => void;
  selectedCountry: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  escalating: '#ef4444',
  ongoing: '#f97316',
  'de-escalating': '#eab308',
  frozen: '#3b82f6',
};

const STATUS_LABELS: Record<string, string> = {
  escalating: 'Escalating',
  ongoing: 'Ongoing',
  'de-escalating': 'De-escalating',
  frozen: 'Frozen',
};

const COUNTRY_ALIASES: Record<string, string[]> = {
  'russia':                            ['russian federation'],
  'myanmar':                           ['myanmar (burma)', 'burma'],
  'palestine':                         ['west bank', 'gaza strip', 'palestinian territory', 'state of palestine'],
  'south korea':                       ['republic of korea'],
  'north korea':                       ["democratic people's republic of korea"],
  'iran':                              ['islamic republic of iran'],
  'syria':                             ['syrian arab republic'],
  'tanzania':                          ['united republic of tanzania'],
  'democratic republic of the congo':  ['drc', 'dr congo', 'congo (kinshasa)', 'congo, the democratic republic of the'],
  'republic of the congo':             ['congo', 'congo (brazzaville)'],
  "côte d'ivoire":                     ["ivory coast", "cote d'ivoire"],
  'czechia':                           ['czech republic'],
  'north macedonia':                   ['macedonia'],
  'eswatini':                          ['swaziland'],
  'cabo verde':                        ['cape verde'],
  'türkiye':                           ['turkey'],
  'united states of america':          ['united states', 'usa', 'us'],
  'united kingdom':                    ['uk'],
};

function normalizeCountry(name: string): string[] {
  const lower = name.toLowerCase();
  const extras = COUNTRY_ALIASES[lower] || [];
  const reverseExtras = Object.entries(COUNTRY_ALIASES)
    .filter(([, aliases]) => aliases.includes(lower))
    .map(([canonical]) => canonical);
  return [lower, ...extras, ...reverseExtras];
}

function buildCountryConflictMap(conflicts: Conflict[]): Map<string, Conflict[]> {
  const map = new Map<string, Conflict[]>();
  for (const c of conflicts) {
    for (const country of c.countries_involved || []) {
      for (const key of normalizeCountry(country)) {
        const existing = map.get(key) || [];
        existing.push(c);
        map.set(key, existing);
      }
    }
  }
  return map;
}

function getPriorityStatus(cs: Conflict[]): string {
  for (const p of ['escalating', 'ongoing', 'de-escalating', 'frozen']) {
    if (cs.some(c => c.status === p)) return p;
  }
  return cs[0]?.status || 'ongoing';
}

let cachedGeoData: any = null;

async function loadGeoJson() {
  if (cachedGeoData) return cachedGeoData;
  const base = import.meta.env.BASE_URL || '/';
  const url = base.replace(/\/$/, '') + '/countries.geojson';
  const res = await fetch(url);
  cachedGeoData = await res.json();
  return cachedGeoData;
}

export function ConflictMap({ conflicts, onCountrySelect, selectedCountry }: ConflictMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const geoLayerRef = useRef<any>(null);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let cancelled = false;

    async function init() {
      const L = (await import('leaflet')).default;
      if (cancelled || !container) return;

      if (!mapRef.current) {
        const map = L.map(container, {
          center: [20, 10],
          zoom: 1,
          zoomControl: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          touchZoom: false,
          keyboard: false,
          dragging: false,
          zoomSnap: 0,
          zoomDelta: 0,
          minZoom: 0.5,
          maxZoom: 3,
          worldCopyJump: false,
          maxBounds: [[-90, -210], [90, 210]],
          maxBoundsViscosity: 1.0,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap © CARTO',
          subdomains: 'abcd',
          maxZoom: 20,
        }).addTo(map);

        mapRef.current = map;
        setTimeout(() => {
          if (!cancelled && mapRef.current) {
            mapRef.current.invalidateSize();
            mapRef.current.fitBounds([[-58, -168], [80, 175]], { padding: [0, 0], animate: false });
          }
        }, 150);
      }

      const map = mapRef.current;
      const geoData = await loadGeoJson();
      if (cancelled) return;

      if (geoLayerRef.current) {
        geoLayerRef.current.remove();
        geoLayerRef.current = null;
      }

      const countryConflicts = buildCountryConflictMap(conflicts);

      const layer = L.geoJSON(geoData, {
        style: (feature: any) => {
          const name = (feature?.properties?.name || feature?.properties?.ADMIN || '').toLowerCase();
          const matched = countryConflicts.get(name);
          const isSelected = selectedCountry &&
            name === selectedCountry.toLowerCase();

          if (matched) {
            const status = getPriorityStatus(matched);
            const color = STATUS_COLORS[status] || '#f97316';
            return {
              fillColor: color,
              fillOpacity: isSelected ? 0.95 : 0.78,
              color: '#fff',
              weight: isSelected ? 2 : 0.8,
            };
          }
          return {
            fillColor: '#d1d5db',
            fillOpacity: 0.7,
            color: '#9ca3af',
            weight: 0.4,
          };
        },
        onEachFeature: (feature: any, featureLayer: any) => {
          const name = feature?.properties?.name || feature?.properties?.ADMIN || '';
          const matched = countryConflicts.get(name.toLowerCase());

          if (matched) {
            const status = getPriorityStatus(matched);
            const color = STATUS_COLORS[status] || '#f97316';
            const conflictNames = matched.map((c: Conflict) => c.name).join(', ');

            featureLayer.bindTooltip(
              `<div style="background:#111827;border:1px solid #374151;border-radius:6px;padding:8px 12px;min-width:160px">
                <div style="font-weight:600;color:#f9fafb;margin-bottom:4px">${name}</div>
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color}"></span>
                  <span style="color:#9ca3af;font-size:12px">${STATUS_LABELS[status] || status}</span>
                </div>
                <div style="color:#6b7280;font-size:11px;margin-top:4px">${conflictNames}</div>
              </div>`,
              { sticky: true, opacity: 1, className: 'leaflet-tooltip-custom' }
            );

            featureLayer.on({
              mouseover: (e: any) => e.target.setStyle({ fillOpacity: 0.95, weight: 1.5 }),
              mouseout: () => layer.resetStyle(featureLayer),
              click: () => onCountrySelect(name),
            });
          }
        },
      }).addTo(map);

      geoLayerRef.current = layer;
    }

    init().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [conflicts, selectedCountry, onCountrySelect]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full" style={{ height: 'clamp(340px, 52vw, 560px)' }}>
      <div ref={mapContainerRef} className="w-full h-full rounded-xl overflow-hidden" />
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 z-[1000]">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-gray-700 border border-gray-200 shadow-sm">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            {STATUS_LABELS[status]}
          </div>
        ))}
      </div>
    </div>
  );
}
