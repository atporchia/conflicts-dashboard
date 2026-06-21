'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Conflict } from '@/lib/types';

interface ConflictMapProps {
  conflicts: Conflict[];
  onCountrySelect?: (country: string) => void;
  selectedCountry?: string | null;
}

export function ConflictMap({ conflicts, onCountrySelect, selectedCountry }: ConflictMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Color by conflict type
  function getColor(type: Conflict['type']): string {
    switch (type) {
      case 'interstate': return '#ef4444'; // red
      case 'civil_war': return '#f97316'; // orange
      case 'insurgency': return '#eab308'; // yellow
      case 'terrorism': return '#a855f7'; // purple
      case 'territorial_dispute': return '#3b82f6'; // blue
      default: return '#6b7280'; // gray
    }
  }

  useEffect(() => {
    // Dynamically import Leaflet
    async function initMap() {
      const L = (await import('leaflet')).default;

      // Fix for default marker icons
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.Marker.prototype.options.icon = DefaultIcon;

      if (!mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current).setView([20, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;

      // Add markers for each conflict
      conflicts.forEach((conflict) => {
        if (conflict.latitude && conflict.longitude) {
          const marker = L.marker([conflict.latitude, conflict.longitude])
            .addTo(map)
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-bold text-gray-900">${conflict.name}</h3>
                <p class="text-sm text-gray-600">${conflict.type.replace('_', ' ')}</p>
                <p class="text-xs text-gray-500 mt-1">Status: ${conflict.status}</p>
                <p class="text-xs text-gray-500">Countries: ${conflict.countries_involved.join(', ')}</p>
              </div>
            `);

          marker.on('click', () => {
            // Clicking a marker selects the first country
            if (conflict.countries_involved.length > 0) {
              onCountrySelect?.(conflict.countries_involved[0]);
            }
          });
        }
      });

      // Fit bounds to show all markers
      if (conflicts.length > 0) {
        const bounds = L.latLngBounds([]);
        conflicts.forEach((c) => {
          if (c.latitude && c.longitude) {
            bounds.extend([c.latitude, c.longitude]);
          }
        });
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [conflicts, onCountrySelect]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '400px' }}
    />
  );
}