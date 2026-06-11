'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';
import { useLocationPing } from '../people/hooks/use-location-ping';
import { FriendRequestsSheet } from '../people/friend-requests-sheet';
import { DiscoveryCard } from '../people/experience/discovery-card';
import { RadarMode } from '../people/experience/radar-mode';
import { HeatmapMode } from '../people/experience/heatmap-mode';
import { AvailabilityBeacon } from '../people/experience/availability-beacon';
import { ParticleBurst } from '../people/experience/particle-burst';
import { MeetNowButton } from '../people/experience/meet-now-button';
import { MeetNowFlow } from '../people/experience/meet-now-flow';
import { useMeetNowStore } from '@/stores/meet-now-store';
import type { AvailabilityIntent } from '../people/types';
import { useWorldData } from './use-world-data';
import { WorldHeader } from './world-header';
import { WorldEmptyState } from './world-empty-state';
import { LiveWorldFeed } from './live-world-feed';
import { CafeWorldCard, CommunityWorldCard, EventWorldCard } from './world-cards';
import { WORLD_LAYERS, type WorldLayer, type WorldSelection } from './types';

const WorldGalaxy = dynamic(
  () => import('./world-galaxy').then((m) => m.WorldGalaxy),
  { ssr: false, loading: () => <WorldLoader /> },
);

function WorldLoader() {
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

type PeopleMode = 'galaxy' | 'radar' | 'heatmap';
const PEOPLE_MODES: PeopleMode[] = ['galaxy', 'radar', 'heatmap'];

export function WorldExperience() {
  const t = useTranslations('discover.world');
  const tPeople = useTranslations('discover.people');
  const { locale } = useParams<{ locale: string }>();

  const [layer, setLayer] = useState<WorldLayer>('all');
  const [peopleMode, setPeopleMode] = useState<PeopleMode>('galaxy');
  const [radiusKm, setRadiusKm] = useState(5);
  const [selection, setSelection] = useState<WorldSelection | null>(null);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [burst, setBurst] = useState(false);
  const [myAvailability, setMyAvailability] = useState<{
    intent: AvailabilityIntent;
    minutes: number;
  } | null>(null);
  const openMeetNow = useMeetNowStore((s) => s.open);

  useLocationPing(true);
  const {
    counts,
    orbits,
    cafes,
    events,
    communities,
    isLoading,
    isFetching,
    refetch,
  } = useWorldData(radiusKm);

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

  const handleSelect = useCallback((sel: WorldSelection | null) => {
    setSelection(sel);
  }, []);

  const selectedId =
    selection?.kind === 'person'
      ? selection.person.id
      : selection?.kind === 'cafe'
        ? selection.cafe.id
        : selection?.kind === 'event'
          ? selection.event.id
          : selection?.kind === 'community'
            ? selection.community.id
            : null;

  const layerEmpty = useMemo(() => {
    if (isLoading) return false;
    switch (layer) {
      case 'people':
        return displayOrbits.length === 0;
      case 'cafes':
        return cafes.length === 0;
      case 'events':
        return events.length === 0;
      case 'communities':
        return communities.length === 0;
      default:
        return (
          displayOrbits.length + cafes.length + events.length + communities.length === 0
        );
    }
  }, [isLoading, layer, displayOrbits, cafes, events, communities]);

  const showPeopleSubModes = layer === 'people';
  const usePeopleAltMode = showPeopleSubModes && peopleMode !== 'galaxy';

  return (
    <div className="relative -mx-2 -mt-2 h-[calc(100dvh-7.5rem)] min-h-[420px] overflow-hidden rounded-2xl border border-border/40 bg-[#030712]">
      <WorldHeader
        counts={counts}
        radiusKm={radiusKm}
        layer={layer}
        onSelectLayer={setLayer}
      />

      <div className="absolute end-3 top-3 z-20 flex gap-1">
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-full bg-black/40 p-2 text-white/70 backdrop-blur-md"
          aria-label={t('refresh')}
        >
          <motion.span
            animate={isFetching ? { rotate: 360 } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            className="block"
          >
            ↻
          </motion.span>
        </button>
        <button
          type="button"
          onClick={() => setRequestsOpen(true)}
          className="relative rounded-full bg-black/40 p-2 text-white/70 backdrop-blur-md"
          aria-label={tPeople('friendRequests')}
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
        {usePeopleAltMode ? (
          peopleMode === 'radar' ? (
            <RadarMode
              orbits={displayOrbits}
              selectedId={selection?.kind === 'person' ? selection.person.id : null}
              onSelect={(p) => handleSelect(p ? { kind: 'person', person: p } : null)}
            />
          ) : (
            <HeatmapMode
              orbits={displayOrbits}
              onSelect={(p) => handleSelect(p ? { kind: 'person', person: p } : null)}
            />
          )
        ) : (
          <WorldGalaxy
            layer={layer}
            orbits={displayOrbits}
            cafes={cafes}
            events={events}
            communities={communities}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        )}
      </div>

      {layerEmpty ? (
        <WorldEmptyState
          layer={layer}
          counts={counts}
          radiusKm={radiusKm}
          onSwitchLayer={setLayer}
          onExpand={() => setRadiusKm((r) => Math.min(r * 2, 50))}
        />
      ) : null}

      {isLoading ? (
        <div className="absolute inset-0 z-10">
          <WorldLoader />
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-[7.25rem] z-20 flex justify-center px-4">
        <LiveWorldFeed />
      </div>

      <div className="absolute inset-x-0 bottom-[4.25rem] z-20 flex justify-center px-4">
        <MeetNowButton onClick={openMeetNow} disabled={isLoading} />
      </div>

      <div className="absolute inset-x-0 bottom-3 z-20 px-4">
        <div className="flex justify-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {WORLD_LAYERS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLayer(l)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-colors',
                layer === l
                  ? 'bg-white/15 text-white'
                  : 'bg-black/30 text-white/50 hover:text-white/80',
              )}
            >
              {t(`layers.${l}`)}
            </button>
          ))}
        </div>
        {showPeopleSubModes ? (
          <div className="mt-1.5 flex justify-center gap-1.5">
            {PEOPLE_MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPeopleMode(m)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur-md transition-colors',
                  peopleMode === m
                    ? 'bg-white/15 text-white'
                    : 'bg-black/30 text-white/45 hover:text-white/75',
                )}
              >
                {tPeople(`modes.${m}`)}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <AvailabilityBeacon
        onSet={(intent, minutes) => setMyAvailability({ intent, minutes })}
      />

      <DiscoveryCard
        person={selection?.kind === 'person' ? selection.person : null}
        onClose={() => setSelection(null)}
        onFriendAction={() => {
          setBurst(true);
          setTimeout(() => setBurst(false), 800);
        }}
      />
      <CafeWorldCard
        cafe={selection?.kind === 'cafe' ? selection.cafe : null}
        onClose={() => setSelection(null)}
      />
      <EventWorldCard
        event={selection?.kind === 'event' ? selection.event : null}
        onClose={() => setSelection(null)}
      />
      <CommunityWorldCard
        community={selection?.kind === 'community' ? selection.community : null}
        onClose={() => setSelection(null)}
      />

      <ParticleBurst active={burst} />
      <MeetNowFlow />
      <FriendRequestsSheet open={requestsOpen} onClose={() => setRequestsOpen(false)} />

      {myAvailability ? (
        <p className="absolute bottom-16 start-3 z-20 text-[10px] text-amber-400/90">
          {tPeople(`availability.${myAvailability.intent}`)} · {myAvailability.minutes}m
        </p>
      ) : null}
    </div>
  );
}
