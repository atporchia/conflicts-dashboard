'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Conflict } from '@/lib/types';

interface ConflictMapProps {
  conflicts: Conflict[];
}

export function ConflictMap({ conflicts }: ConflictMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

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
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    // Force map to recalculate size after mount
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers
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
            window.location.href = `/?country=${encodeURIComponent(conflict.countries_involved[0])}`;
          }
        });

        markersRef.current.push(marker);
      }
    });

    // Fit bounds
    if (conflicts.length > 0) {
      const bounds = L.latLngBounds([]);
      conflicts.forEach((c) => {
        if (c.latitude && c.longitude) {
          bounds.extend([c.latitude, c.longitude]);
        }
      });
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [conflicts]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '400px', width: '100%' }}
    />
  );
}