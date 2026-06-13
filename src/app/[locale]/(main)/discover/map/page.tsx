'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import type { MapCafe } from '@/components/discover/cafe-map-inner';

// Leaflet must never run on the server
const CafeMapInner = dynamic(
  () =>
    import('@/components/discover/cafe-map-inner').then((m) => m.CafeMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
        <MapPin className="mr-2 h-5 w-5 animate-pulse" />
        Loading map…
      </div>
    ),
  },
);

export default function CafeMapPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations('discover');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cafes-map', locale],
    queryFn: () =>
      api<MapCafe[]>(`/discover?limit=100`, { locale }),
    staleTime: 60_000,
  });

  const cafes = data ?? [];
  const cafesWithCoords = cafes.filter((c) => c.lat != null && c.lng != null);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/discover"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-sm font-semibold">Cafe Map</h1>
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? 'Loading cafes…'
              : cafesWithCoords.length > 0
                ? `${cafesWithCoords.length} cafes on map`
                : cafes.length > 0
                  ? 'No location data yet — cafes shown in list below'
                  : t('loading')}
          </p>
        </div>
        <span className="text-lg">🗺️</span>
      </div>

      {/* Map area */}
      <div className="relative flex-1 overflow-hidden">
        {isError ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t('error')}
          </div>
        ) : cafesWithCoords.length === 0 && !isLoading ? (
          /* Fallback list when no lat/lng data exists yet */
          <div className="h-full overflow-y-auto p-4">
            <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              📍 Cafes don&apos;t have coordinates yet. Ask owners to add their location
              in the Cafe OS dashboard. Showing all cafes as a list for now.
            </p>
            {cafes.map((cafe) => (
              <Link
                key={cafe.id}
                href={`/cafe/${cafe.id}`}
                className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:bg-accent"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">
                  ☕
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{cafe.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{cafe.address}</p>
                  <p className="text-xs text-muted-foreground">★ {cafe.avgRating.toFixed(1)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <CafeMapInner cafes={cafes} />
        )}
      </div>
    </div>
  );
}
