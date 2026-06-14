'use client';

import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const NeshanDiscoverMap = dynamic(
  () => import('@/components/discover/neshan-discover-map').then((m) => m.NeshanDiscoverMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted text-muted-foreground text-sm">
        Loading map…
      </div>
    ),
  },
);

export default function DiscoverMapPage() {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/discover"
          className="flex size-8 items-center justify-center rounded-full bg-muted text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-sm font-semibold">Discover Map</h1>
          <p className="text-xs text-muted-foreground">Cafes & nearby people</p>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <NeshanDiscoverMap />
      </div>
    </div>
  );
}
