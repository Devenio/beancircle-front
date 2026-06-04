'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';

export type DiscoverCafe = {
  id: string;
  name: string;
  address: string;
  avgRating: number;
  followerCount?: number;
  workspaceScore?: number;
  photos?: { url: string }[];
};

export function CafeCard({ cafe, compact }: { cafe: DiscoverCafe; compact?: boolean }) {
  return (
    <Link
      href={`/cafe/${cafe.id}`}
      className={`block shrink-0 overflow-hidden rounded-xl border border-border bg-card ${compact ? 'w-40' : 'w-full'}`}
    >
      <div className={`relative bg-muted ${compact ? 'h-28' : 'h-36'}`}>
        {cafe.photos?.[0]?.url ? (
          <Image
            src={cafe.photos[0].url}
            alt={cafe.name}
            fill
            className="object-cover"
            sizes={compact ? '160px' : '100vw'}
          />
        ) : null}
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-semibold">{cafe.name}</p>
        <p className="text-xs text-muted-foreground">
          {cafe.avgRating.toFixed(1)} · {cafe.followerCount ?? 0} followers
        </p>
      </div>
    </Link>
  );
}
