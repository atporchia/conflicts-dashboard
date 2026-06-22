import { useEffect, useRef, useState } from 'react';
import type { Conflict } from '@/lib/types';

interface ConflictMapProps {
  conflicts: Conflict[];
  onCountrySelect: (country: string) => void;
}

export function ConflictMap({ conflicts, onCountrySelect }: ConflictMapProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);

  function getColor(type: Conflict['type']): string {
    switch (type) {
      case 'interstate': return '#ef4444';
      case 'civil_war': return '#f97316';
      case 'insurgency': return '#eab308';
      case 'terrorism': return '#a855f7';
      case 'territorial_dispute': return '#3b82f6';
      default: return '#6b7280';
    }
  }

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;

    async function initMap() {
      if (!container) return;
      const L = (await import('leaflet')).default;

      const map = L.map(container, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);

      setTimeout(() => map.invalidateSize(), 200);
    }

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    async function updateMarkers() {
      const L = (await import('leaflet')).default;
      const map = mapRef.current;

      markersRef.current.forEach((m: any) => m.remove());
      markersRef.current = [];

      conflicts.forEach((conflict) => {
        if (conflict.latitude && conflict.longitude) {
          const color = getColor(conflict.type);

          const marker = L.circleMarker([conflict.latitude, conflict.longitude], {
            radius: 10,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          }).addTo(map);

          marker.bindTooltip(
            `<strong>${conflict.name}</strong><br/>${conflict.type.replace(/_/g, ' ')}<br/>${conflict.countries_involved.join(', ')}`,
            { sticky: true }
          );

          marker.on('click', () => {
            if (conflict.countries_involved.length > 0) {
              onCountrySelect(conflict.countries_involved[0]);
            }
          });

          markersRef.current.push(marker);
        }
      });

      if (conflicts.length > 0) {
        const bounds = L.latLngBounds([]);
        conflicts.forEach((c: any) => {
          if (c.latitude && c.longitude) {
            bounds.extend([c.latitude, c.longitude]);
          }
        });
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }

    updateMarkers();
  }, [conflicts, mapReady, onCountrySelect]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '400px', width: '100%' }}
    />
  );
}
