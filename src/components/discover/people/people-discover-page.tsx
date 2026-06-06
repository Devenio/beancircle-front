'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Bell, List, Map as MapIcon, RefreshCw } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { DiscoveryFilters } from './discovery-filters';
import { FriendRequestsSheet } from './friend-requests-sheet';
import { PersonCard, PersonCardSkeleton } from './person-card';
import { useLocationPing } from './hooks/use-location-ping';
import type { DiscoverFiltersState, DiscoverPerson } from './types';

type NearbyPage = {
  items: DiscoverPerson[];
  nextCursor: string | null;
  hasMore: boolean;
};

const defaultFilters: DiscoverFiltersState = {
  radiusKm: 5,
  interests: [],
};

export function PeopleDiscoverPage() {
  const t = useTranslations('discover.people');
  const { locale } = useParams<{ locale: string }>();
  const [filters, setFilters] = useState<DiscoverFiltersState>(defaultFilters);
  const [requestsOpen, setRequestsOpen] = useState(false);
  useLocationPing(true);

  const queryKey = useMemo(
    () => ['discover', 'nearby', filters, locale],
    [filters, locale],
  );

  const nearbyQuery = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set('radiusKm', String(filters.radiusKm));
      params.set('limit', '20');
      if (pageParam) params.set('cursor', pageParam);
      if (filters.interests.length) params.set('interests', filters.interests.join(','));
      if (filters.activity) params.set('activity', filters.activity);
      if (filters.relationship && filters.relationship !== 'suggested') {
        params.set('relationship', filters.relationship);
      }
      const path =
        filters.relationship === 'suggested'
          ? `/discover/suggestions?${params}`
          : `/discover/nearby?${params}`;
      return api<NearbyPage>(path, { locale });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const { data: requestCount } = useQuery({
    queryKey: ['friends', 'requests-count', locale],
    queryFn: async () => {
      const res = await api<{ incoming: unknown[] }>('/friends/requests', { locale });
      return res.incoming.length;
    },
  });

  const people = nearbyQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !nearbyQuery.hasNextPage) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !nearbyQuery.isFetchingNextPage) {
        void nearbyQuery.fetchNextPage();
      }
    });
    obs.observe(node);
    return () => obs.disconnect();
  }, [nearbyQuery.hasNextPage, nearbyQuery.isFetchingNextPage, nearbyQuery.fetchNextPage]);

  return (
    <div className="pb-24">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => nearbyQuery.refetch()}>
            <RefreshCw className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative" onClick={() => setRequestsOpen(true)}>
            <Bell className="size-5" />
            {requestCount ? (
              <span className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {requestCount}
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1 gap-2" disabled>
          <List className="size-4" />
          {t('listView')}
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-2" render={<Link href="/discover/people/map" />}>
          <MapIcon className="size-4" />
          {t('mapView')}
        </Button>
      </div>

      <DiscoveryFilters filters={filters} onChange={setFilters} />

      <div className="mt-4 space-y-3">
        {nearbyQuery.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <PersonCardSkeleton key={i} />)
          : people.map((person, index) => (
              <PersonCard key={person.id} person={person} index={index} />
            ))}
      </div>

      {nearbyQuery.isFetchingNextPage ? <PersonCardSkeleton /> : null}
      <div ref={sentinelRef} className="h-4" />

      {!nearbyQuery.isLoading && people.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
      ) : null}

      <FriendRequestsSheet open={requestsOpen} onClose={() => setRequestsOpen(false)} />
    </div>
  );
}
