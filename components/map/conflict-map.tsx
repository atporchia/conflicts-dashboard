'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Conflict } from '@/lib/types';

interface ConflictMapProps {
  conflicts: Conflict[];
  selectedCountry?: string | null;
}

// Map GeoJSON country names to our database country names
const COUNTRY_NAME_MAP: Record<string, string> = {
  'Russian Federation': 'Russia',
  'Syrian Arab Republic': 'Syria',
  'Democratic Republic of the Congo': 'DRC',
  'Republic of the Congo': 'Congo',
  'Myanmar': 'Myanmar',
  'Burma': 'Myanmar',
  'United States': 'USA',
  'United Kingdom': 'UK',
  'Czech Republic': 'Czechia',
  'Republic of Serbia': 'Serbia',
  'Bosnia and Herzegovina': 'Bosnia',
  'North Macedonia': 'Macedonia',
  'Eswatini': 'Swaziland',
  'Cabo Verde': 'Cape Verde',
  'Timor-Leste': 'East Timor',
};

function normalizeCountryName(name: string): string {
  return COUNTRY_NAME_MAP[name] || name;
}

export function ConflictMap({ conflicts, selectedCountry }: ConflictMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Build a map of normalized country -> conflicts for coloring
  const countryConflicts = new Map<string, Conflict[]>();
  conflicts.forEach((conflict) => {
    conflict.countries_involved.forEach((country) => {
      const normalized = normalizeCountryName(country);
      const existing = countryConflicts.get(normalized) || [];
      existing.push(conflict);
      countryConflicts.set(normalized, existing);
    });
  });

  // Color by conflict type
  function getColor(types: Conflict['type'][]): string {
    const hasType = (type: Conflict['type']) => types.some((t) => t === type);
    if (hasType('interstate')) return '#ef4444'; // red
    if (hasType('civil_war')) return '#f97316'; // orange
    if (hasType('insurgency')) return '#eab308'; // yellow
    if (hasType('terrorism')) return '#a855f7'; // purple
    if (hasType('territorial_dispute')) return '#3b82f6'; // blue
    return '#6b7280'; // gray
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

      // Fetch world GeoJSON
      try {
        const res = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
        if (!res.ok) throw new Error('Failed to fetch GeoJSON');
        const data = await res.json();
        setGeoJsonData(data);
        setError(null);
      } catch (e) {
        console.error('Failed to load GeoJSON', e);
        setError('Failed to load map data');
      }
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
    if (!mapRef.current || !geoJsonData) return;

    const L = require('leaflet');

    // Remove existing GeoJSON layers
    mapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.GeoJSON) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Add country polygons
    const geoJsonLayer = L.geoJSON(geoJsonData, {
      style: (feature: any) => {
        const rawName = feature.properties.ADMIN;
        const countryName = normalizeCountryName(rawName);
        const conflicts = countryConflicts.get(countryName);
        
        if (conflicts && conflicts.length > 0) {
          const types = conflicts.map((c: any) => c.type);
          return {
            fillColor: getColor(types),
            weight: 2,
            opacity: 1,
            color: '#ffffff',
            fillOpacity: 0.7,
          };
        }
        return {
          fillColor: '#1f2937',
          weight: 1,
          opacity: 0.5,
          color: '#374151',
          fillOpacity: 0.3,
        };
      },
      onEachFeature: (feature: any, layer: any) => {
        const rawName = feature.properties.ADMIN;
        const countryName = normalizeCountryName(rawName);
        const conflicts = countryConflicts.get(countryName);

        layer.on({
          mouseover: (e: any) => {
            if (conflicts && conflicts.length > 0) {
              const types = conflicts.map((c: any) => c.type.replace('_', ' ')).join(', ');
              const names = conflicts.map((c: any) => c.name).join('; ');
              layer.bindTooltip(
                `<strong>${countryName}</strong><br/>${conflicts.length} active conflict(s)<br/>${types}<br/><em>${names}</em>`,
                { sticky: true, maxWidth: 300 }
              ).openTooltip();
            } else {
              layer.bindTooltip(`<strong>${countryName}</strong><br/>No active conflicts`, { sticky: true }).openTooltip();
            }
          },
          mouseout: () => {
            layer.closeTooltip();
          },
          click: () => {
            if (conflicts && conflicts.length > 0) {
              // Navigate to filtered view
              window.location.href = `/?country=${encodeURIComponent(countryName)}`;
            }
          },
        });
      },
    }).addTo(mapRef.current);

    // Fit bounds if there are conflicts
    if (conflicts.length > 0) {
      const bounds = L.latLngBounds([]);
      conflicts.forEach((c: any) => {
        if (c.latitude && c.longitude) {
          bounds.extend([c.latitude, c.longitude]);
        }
      });
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [geoJsonData, conflicts]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '400px' }}
    />
  );
}