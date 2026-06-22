'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Conflict } from '@/lib/types';

const ConflictMap = dynamic(
  () => import('@/components/map/conflict-map').then(mod => ({ default: mod.ConflictMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
        Loading map...
      </div>
    ),
  }
);

interface MapWrapperProps {
  conflicts: Conflict[];
}

export function MapWrapper({ conflicts }: MapWrapperProps) {
  const router = useRouter();
  return (
    <ConflictMap
      conflicts={conflicts}
      onCountrySelect={(country) => router.push(`/?country=${encodeURIComponent(country)}`)}
    />
  );
}