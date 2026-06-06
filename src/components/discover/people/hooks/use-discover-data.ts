'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { api } from '@/lib/api/client';
import { layoutOrbits, MOCK_ACTIVITIES, type ActivityCircle, type DiscoverPerson } from '../types';

type NearbyPage = {
  items: DiscoverPerson[];
  nextCursor: string | null;
  hasMore: boolean;
};

type SuggestionItem = DiscoverPerson & { reason?: string; score?: number };

function parseDistanceM(label?: string, explicit?: number): number {
  if (explicit != null) return explicit;
  if (!label) return 1200;
  const m = label.match(/([\d.]+)\s*km/i);
  if (m) return parseFloat(m[1]!) * 1000;
  const meters = label.match(/([\d.]+)\s*m/i);
  if (meters) return parseFloat(meters[1]!);
  return 1200;
}

function hashNum(id: string) {
  return id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

function enrichPerson(p: DiscoverPerson): DiscoverPerson {
  const distanceM = parseDistanceM(p.distanceLabel, p.distanceM);
  const h = hashNum(p.id);
  const availability =
    p.lastActive === 'online' && h % 3 === 0
      ? { intent: pickIntent(p.sharedInterests), minutesLeft: 25 + (h % 35) }
      : null;
  return { ...p, distanceM, availability };
}

function hashAvail(id: string) {
  return hashNum(id) % 3 === 0;
}

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

export function useDiscoverData(radiusKm = 5) {
  const { locale } = useParams<{ locale: string }>();

  const nearby = useInfiniteQuery({
    queryKey: ['discover', 'nearby', radiusKm, locale],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set('radiusKm', String(radiusKm));
      params.set('limit', '48');
      if (pageParam) params.set('cursor', pageParam);
      return api<NearbyPage>(`/discover/nearby?${params}`, { locale });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const suggestions = useQuery({
    queryKey: ['discover', 'suggestions', locale],
    queryFn: () =>
      api<{ items: SuggestionItem[] }>(`/discover/suggestions?limit=6`, { locale }),
  });

  const people = useMemo(() => {
    const raw = nearby.data?.pages.flatMap((p) => p.items) ?? [];
    return raw.map(enrichPerson);
  }, [nearby.data]);

  const orbits = useMemo(() => layoutOrbits(people, radiusKm), [people, radiusKm]);

  const aiMatches = useMemo(() => {
    const fromSuggestions = (suggestions.data?.items ?? []).map(enrichPerson);
    if (fromSuggestions.length) return fromSuggestions;
    return [...people]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 4);
  }, [people, suggestions.data]);

  const activities: ActivityCircle[] = MOCK_ACTIVITIES;

  return {
    people,
    orbits,
    aiMatches,
    activities,
    isLoading: nearby.isLoading,
    hasMore: nearby.hasNextPage,
    fetchMore: nearby.fetchNextPage,
    refetch: nearby.refetch,
    isFetching: nearby.isFetching,
  };
}
