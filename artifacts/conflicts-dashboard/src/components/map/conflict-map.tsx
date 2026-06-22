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

function buildCountryConflictMap(conflicts: Conflict[]): Map<string, Conflict[]> {
  const map = new Map<string, Conflict[]>();
  conflicts.forEach(c => {
    c.countries_involved?.forEach(country => {
      const existing = map.get(country.toLowerCase()) || [];
      existing.push(c);
      map.set(country.toLowerCase(), existing);
    });
  });
  return map;
}

function getPriorityStatus(conflicts: Conflict[]): string {
  const priority = ['escalating', 'ongoing', 'de-escalating', 'frozen'];
  for (const p of priority) {
    if (conflicts.some(c => c.status === p)) return p;
  }
  return conflicts[0]?.status || 'ongoing';
}

export function ConflictMap({ conflicts, onCountrySelect, selectedCountry }: ConflictMapProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const geoLayerRef = useRef<any>(null);
  const initRef = useRef(false);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || initRef.current) return;
    initRef.current = true;

    async function initMap() {
      if (!container) return;
      const L = (await import('leaflet')).default;

      const map = L.map(container, {
        center: [20, 10],
        zoom: 2,
        zoomControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
        dragging: false,
        minZoom: 2,
        maxZoom: 2,
        worldCopyJump: false,
        maxBounds: [[-85, -180], [85, 180]],
        maxBoundsViscosity: 1.0,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      mapRef.current = map;
      setTimeout(() => {
        map.invalidateSize();
        map.fitWorld({ padding: [2, 2] });
      }, 150);
    }

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    async function updateLayer() {
      const L = (await import('leaflet')).default;

      if (geoLayerRef.current) {
        geoLayerRef.current.remove();
        geoLayerRef.current = null;
      }

      let geoData: any;
      try {
        const res = await fetch(
          'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
        );
        geoData = await res.json();
      } catch {
        return;
      }

      const countryConflicts = buildCountryConflictMap(conflicts);

      const layer = L.geoJSON(geoData, {
        style: (feature: any) => {
          const name = feature?.properties?.ADMIN?.toLowerCase() || '';
          const altName = feature?.properties?.NAME?.toLowerCase() || '';
          const matched = countryConflicts.get(name) || countryConflicts.get(altName);
          const isSelected =
            selectedCountry &&
            (name === selectedCountry.toLowerCase() || altName === selectedCountry.toLowerCase());

          if (matched) {
            const status = getPriorityStatus(matched);
            const color = STATUS_COLORS[status] || '#f97316';
            return {
              fillColor: color,
              fillOpacity: isSelected ? 0.95 : 0.78,
              color: isSelected ? '#1e293b' : '#fff',
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
          const name = feature?.properties?.ADMIN || '';
          const altName = feature?.properties?.NAME || '';
          const matched =
            countryConflicts.get(name.toLowerCase()) ||
            countryConflicts.get(altName.toLowerCase());

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
              mouseover: (e: any) => {
                e.target.setStyle({ fillOpacity: 0.9, weight: 1.5, color: '#9ca3af' });
              },
              mouseout: (e: any) => {
                layer.resetStyle(e.target);
              },
              click: () => {
                onCountrySelect(name);
              },
            });
          }
        },
      }).addTo(map);

      geoLayerRef.current = layer;
    }

    updateLayer();
  }, [conflicts, selectedCountry, onCountrySelect]);

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
