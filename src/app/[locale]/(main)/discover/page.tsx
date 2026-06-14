'use client';

import dynamic from 'next/dynamic';
import { Navigation } from 'lucide-react';

const NeshanDiscoverMap = dynamic(
  () => import('@/components/discover/neshan-discover-map').then((m) => m.NeshanDiscoverMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Navigation className="size-4 animate-pulse" />
        Loading map…
      </div>
    ),
  },
);

export default function DiscoverPage() {
  return (
    <div className="relative -mx-2 -mt-2 h-[calc(100dvh-7.5rem)] min-h-[420px] overflow-hidden rounded-2xl border border-border/40">
      <NeshanDiscoverMap />
    </div>
  );
}
