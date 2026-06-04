'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function SettingsHubSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <Skeleton className="h-12 w-full rounded-none" />
      <Skeleton className="mx-4 mt-3 h-9 w-full rounded-[10px]" />
      <div className="mt-4 flex gap-3 border-b border-border/80 px-4 py-3">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex-1 space-y-2 pt-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="mt-4">
          <Skeleton className="mx-4 mb-2 h-3 w-24" />
          <Skeleton className="h-32 w-full rounded-none" />
        </div>
      ))}
    </div>
  );
}
