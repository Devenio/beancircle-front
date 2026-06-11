'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { hashId, type DiscoverPerson } from '../people/types';
import {
  layoutCafes,
  layoutCommunities,
  layoutEvents,
  layoutOrbits,
  type WorldCounts,
  type WorldPayload,
  type WorldPerson,
} from './types';

const EMPTY_COUNTS: WorldCounts = { people: 0, cafes: 0, events: 0, communities: 0 };

function pickIntent(interests: string[]) {
  const map: Record<string, 'coffee' | 'networking' | 'gaming' | 'walking' | 'coworking'> = {
    COFFEE: 'coffee',
    STARTUPS: 'networking',
    BUSINESS: 'networking',
    GAMING: 'gaming',
    FITNESS: 'walking',
    TECH: 'coworking',
    AI: 'coworking',
    MUSIC: 'walking',
  };
  for (const i of interests) {
    if (map[i]) return map[i]!;
  }
  return 'coffee';
}

/** Mirrors the people-galaxy enrichment: synthesize availability for some online users. */
function enrichPerson(p: WorldPerson): WorldPerson & DiscoverPerson {
  const h = hashId(p.id);
  const availability =
    p.lastActive === 'online' && h % 3 === 0
      ? { intent: pickIntent(p.sharedInterests), minutesLeft: 25 + (h % 35) }
      : null;
  return { ...p, distanceM: p.distanceM ?? 1200, availability };
}

export function useWorldData(radiusKm = 5) {
  const { locale } = useParams<{ locale: string }>();

  const query = useQuery({
    queryKey: ['discover', 'world', radiusKm, locale],
    queryFn: () =>
      api<WorldPayload>(`/discover/world?radiusKm=${radiusKm}`, { locale }),
    refetchInterval: 30_000,
  });

  const data = query.data;

  const people = useMemo(
    () => (data?.people ?? []).map(enrichPerson),
    [data?.people],
  );
  const orbits = useMemo(() => {
    const placed = layoutOrbits(people, radiusKm);
    // Re-attach world context lost through the generic layout typing.
    return placed.map((o, i) => ({ ...o, context: people[i]?.context ?? null }));
  }, [people, radiusKm]);
  const cafes = useMemo(
    () => layoutCafes(data?.cafes ?? [], radiusKm),
    [data?.cafes, radiusKm],
  );
  const events = useMemo(() => layoutEvents(data?.events ?? []), [data?.events]);
  const communities = useMemo(
    () => layoutCommunities(data?.communities ?? []),
    [data?.communities],
  );

  return {
    counts: data?.counts ?? EMPTY_COUNTS,
    people,
    orbits,
    cafes,
    events,
    communities,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
