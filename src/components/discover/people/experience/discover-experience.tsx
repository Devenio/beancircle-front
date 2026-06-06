'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Bell, Radar, Globe2, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';
import { useLocationPing } from '../hooks/use-location-ping';
import { useDiscoverData } from '../hooks/use-discover-data';
import { FriendRequestsSheet } from '../friend-requests-sheet';
import { DiscoveryCard } from './discovery-card';
import { RadarMode } from './radar-mode';
import { HeatmapMode } from './heatmap-mode';
import { AiMatchesRail } from './ai-matches-rail';
import { AvailabilityBeacon } from './availability-beacon';
import { ExploreRewards } from './explore-rewards';
import { SmartEmptyState } from './smart-empty-state';
import { ParticleBurst } from './particle-burst';
import { layoutOrbits, type AvailabilityIntent, type DiscoverMode, type OrbitPerson, type ActivityCircle } from '../types';

const FriendGalaxy = dynamic(
  () => import('./friend-galaxy').then((m) => m.FriendGalaxy),
  { ssr: false, loading: () => <GalaxyLoader /> },
);

function GalaxyLoader() {
  return (
    <div className="flex h-full items-center justify-center bg-[#030712]">
      <motion.div
        className="size-16 rounded-full bg-primary/30"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />
    </div>
  );
}

const MODES: { id: DiscoverMode; icon: typeof Globe2; labelKey: string }[] = [
  { id: 'galaxy', icon: Globe2, labelKey: 'modes.galaxy' },
  { id: 'radar', icon: Radar, labelKey: 'modes.radar' },
  { id: 'heatmap', icon: Flame, labelKey: 'modes.heatmap' },
];

export function DiscoverExperience() {
  const t = useTranslations('discover.people');
  const { locale } = useParams<{ locale: string }>();
  const [mode, setMode] = useState<DiscoverMode>('galaxy');
  const [radiusKm, setRadiusKm] = useState(5);
  const [selected, setSelected] = useState<OrbitPerson | null>(null);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [burst, setBurst] = useState(false);
  const [myAvailability, setMyAvailability] = useState<{ intent: AvailabilityIntent; minutes: number } | null>(null);

  useLocationPing(true);
  const { orbits, aiMatches, activities, isLoading, refetch, isFetching } = useDiscoverData(radiusKm);

  const displayOrbits = useMemo(() => {
    if (!myAvailability) return orbits;
    return orbits.map((o) => ({ ...o, glow: o.glow + 0.2 }));
  }, [orbits, myAvailability]);

  const { data: requestCount } = useQuery({
    queryKey: ['friends', 'requests-count', locale],
    queryFn: async () => {
      const res = await api<{ incoming: unknown[] }>('/friends/requests', { locale });
      return res.incoming.length;
    },
  });

  const handleSelect = useCallback((person: OrbitPerson | null) => {
    setSelected(person);
  }, []);

  const handleAiSelect = useCallback(
    (p: (typeof aiMatches)[0]) => {
      const orbit = displayOrbits.find((o) => o.id === p.id) ?? layoutOrbits([p], radiusKm)[0]!;
      setSelected(orbit);
    },
    [displayOrbits, radiusKm],
  );

  const showEmpty = !isLoading && displayOrbits.length === 0;

  return (
    <div className="relative -mx-4 -mt-2 h-[calc(100dvh-7.5rem)] min-h-[420px] overflow-hidden rounded-2xl border border-border/40 bg-[#030712]">
      <ExploreRewards discoveredCount={displayOrbits.length} />
      <AiMatchesRail matches={aiMatches} onSelect={handleAiSelect} />

      <div className="absolute end-3 top-2 z-20 flex gap-1">
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-full bg-black/40 p-2 text-white/70 backdrop-blur-md"
          aria-label="Refresh"
        >
          <motion.span animate={isFetching ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 1 }}>
            ↻
          </motion.span>
        </button>
        <button
          type="button"
          onClick={() => setRequestsOpen(true)}
          className="relative rounded-full bg-black/40 p-2 text-white/70 backdrop-blur-md"
        >
          <Bell className="size-4" />
          {requestCount ? (
            <span className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
              {requestCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="absolute inset-0">
        {mode === 'galaxy' ? (
          <FriendGalaxy
            orbits={displayOrbits}
            activities={activities}
            selectedId={selected?.id ?? null}
            onSelect={handleSelect}
          />
        ) : null}
        {mode === 'radar' ? (
          <RadarMode
            orbits={displayOrbits}
            selectedId={selected?.id ?? null}
            onSelect={handleSelect}
          />
        ) : null}
        {mode === 'heatmap' ? (
          <HeatmapMode orbits={displayOrbits} onSelect={handleSelect} />
        ) : null}
      </div>

      {showEmpty ? (
        <SmartEmptyState
          radiusKm={radiusKm}
          onExpand={() => setRadiusKm((r) => Math.min(r * 2, 50))}
          onTryInterest={() => refetch()}
        />
      ) : null}

      {isLoading ? <GalaxyLoader /> : null}

      <div className="absolute inset-x-0 bottom-14 z-20 flex justify-center gap-2 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {activities.map((a) => (
          <ActivityChip key={a.id} activity={a} />
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-2 px-4">
        {MODES.map(({ id, icon: Icon, labelKey }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium backdrop-blur-md transition-colors',
              mode === id
                ? 'bg-white/15 text-white'
                : 'bg-black/30 text-white/50 hover:text-white/80',
            )}
          >
            <Icon className="size-3.5" />
            {t(labelKey)}
          </button>
        ))}
      </div>

      <AvailabilityBeacon
        onSet={(intent, minutes) => setMyAvailability({ intent, minutes })}
      />

      <DiscoveryCard
        person={selected}
        onClose={() => setSelected(null)}
        onFriendAction={() => {
          setBurst(true);
          setTimeout(() => setBurst(false), 800);
        }}
      />
      <ParticleBurst active={burst} />
      <FriendRequestsSheet open={requestsOpen} onClose={() => setRequestsOpen(false)} />

      {myAvailability ? (
        <p className="absolute bottom-16 start-3 z-20 text-[10px] text-amber-400/90">
          {t(`availability.${myAvailability.intent}`)} · {myAvailability.minutes}m
        </p>
      ) : null}
    </div>
  );
}

function ActivityChip({ activity }: { activity: ActivityCircle }) {
  return (
    <span className="shrink-0 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] text-white/75 backdrop-blur-md">
      {activity.emoji} {activity.label} · {activity.memberCount}
    </span>
  );
}
