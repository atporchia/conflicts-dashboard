'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Conflict } from '@/lib/types';

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ConflictMapProps {
  conflicts: Conflict[];
  onConflictSelect?: (conflict: Conflict) => void;
  selectedConflictId?: string;
}

export function ConflictMap({ conflicts, onConflictSelect, selectedConflictId }: ConflictMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    const map = mapRef.current;
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for conflicts
    conflicts.forEach((conflict) => {
      if (conflict.latitude && conflict.longitude) {
        const marker = L.marker([conflict.latitude, conflict.longitude])
          .addTo(map)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-gray-900">${conflict.name}</h3>
              <p class="text-sm text-gray-600">${conflict.type.replace('_', ' ')}</p>
              <p class="text-xs text-gray-500 mt-1">Status: ${conflict.status}</p>
            </div>
          `);

        marker.on('click', () => {
          onConflictSelect?.(conflict);
        });

        // Highlight selected conflict
        if (conflict.id === selectedConflictId) {
          marker.openPopup();
        }
      }
    });
  }, [conflicts, onConflictSelect, selectedConflictId]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '400px' }}
    />
  );
}