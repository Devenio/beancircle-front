import {
  hashId,
  layoutOrbits,
  type DiscoverPerson,
  type OrbitPerson,
} from '../people/types';

export type WorldLayer = 'all' | 'people' | 'cafes' | 'events' | 'communities';

export const WORLD_LAYERS: WorldLayer[] = [
  'all',
  'people',
  'cafes',
  'events',
  'communities',
];

export type CafeHeat = 'TRENDING' | 'BUSY' | 'POPULAR' | 'NEW' | null;

export type WorldVibe =
  | 'remote_work_hub'
  | 'quiet_study'
  | 'best_coffee'
  | 'date_night'
  | 'outdoor'
  | 'pet_friendly'
  | null;

export type WorldPerson = DiscoverPerson & {
  context?: { cafeId: string; cafeName: string } | null;
};

export type WorldCafe = {
  id: string;
  name: string;
  logoUrl?: string | null;
  photoUrl?: string | null;
  address: string;
  distanceM: number;
  distanceLabel: string;
  avgRating: number;
  followerCount: number;
  vibe: WorldVibe;
  isOpen: boolean | null;
  heat: CafeHeat;
  presentCount: number;
  friendsPresent: number;
  communityCount: number;
  isPartner: boolean;
  promoted: boolean;
  featuredRank: number | null;
};

export type WorldEvent = {
  id: string;
  title: string;
  type: string;
  startsAt: string;
  endsAt: string;
  coverUrl?: string | null;
  locationLabel?: string | null;
  capacity?: number | null;
  rsvpCount: number;
  distanceM: number | null;
  cafe?: { id: string; name: string } | null;
};

export type WorldCommunity = {
  id: string;
  name: string;
  slug: string;
  emoji?: string | null;
  category: string;
  coverUrl?: string | null;
  memberCount: number;
  activeNow: number;
  nearbyMembers: number;
  upcomingEvents: number;
  isMember: boolean;
  cafe?: { id: string; name: string } | null;
};

export type WorldCounts = {
  people: number;
  cafes: number;
  events: number;
  communities: number;
};

export type WorldPayload = {
  counts: WorldCounts;
  radiusKm: number;
  people: WorldPerson[];
  cafes: WorldCafe[];
  events: WorldEvent[];
  communities: WorldCommunity[];
  generatedAt: string;
};

/** A selected entity in the world scene. */
export type WorldSelection =
  | { kind: 'person'; person: OrbitPerson & WorldPerson }
  | { kind: 'cafe'; cafe: WorldCafe }
  | { kind: 'event'; event: WorldEvent }
  | { kind: 'community'; community: WorldCommunity };

type SceneSpot = { angle: number; radius: number; height: number };

export type CafeNode = WorldCafe & SceneSpot;
export type EventNode = WorldEvent & SceneSpot;
export type CommunityNode = WorldCommunity & SceneSpot;

/** Cafes sit grounded between the people orbits, radius scaled by distance. */
export function layoutCafes(cafes: WorldCafe[], radiusKm: number): CafeNode[] {
  return cafes.map((cafe) => {
    const h = hashId(cafe.id);
    const clamped = Math.max(120, Math.min(cafe.distanceM, radiusKm * 1000));
    const t = clamped / (radiusKm * 1000);
    return {
      ...cafe,
      radius: 1.6 + t * 4.2,
      angle: ((h % 360) * Math.PI) / 180,
      height: -0.25 + ((h % 40) / 40) * 0.5,
    };
  });
}

/** Events float above the world; closer in time = closer to center. */
export function layoutEvents(events: WorldEvent[]): EventNode[] {
  const now = Date.now();
  return events.map((event) => {
    const h = hashId(event.id);
    const msToStart = new Date(event.startsAt).getTime() - now;
    const hours = Math.max(0, msToStart) / 3_600_000;
    const t = Math.min(hours / 24, 1);
    return {
      ...event,
      radius: 2.2 + t * 3.4,
      angle: (((h + 120) % 360) * Math.PI) / 180,
      height: 1.1 + ((h % 50) / 50) * 0.8,
    };
  });
}

/** Communities form the outer ring, size handled by the scene. */
export function layoutCommunities(communities: WorldCommunity[]): CommunityNode[] {
  return communities.map((community, i) => {
    const h = hashId(community.id);
    return {
      ...community,
      radius: 6.4 + (h % 10) / 10,
      angle: (i / Math.max(communities.length, 1)) * Math.PI * 2 + (h % 30) / 60,
      height: 0.3 + ((h % 60) / 60) * 1.0 - 0.5,
    };
  });
}

export type EventTiming =
  | { state: 'now' }
  | { state: 'soon'; minutes: number }
  | { state: 'upcoming'; hours: number }
  | { state: 'ended' };

export function eventTiming(startsAt: string, endsAt: string, now = Date.now()): EventTiming {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (now >= end) return { state: 'ended' };
  if (now >= start) return { state: 'now' };
  const minutes = Math.ceil((start - now) / 60_000);
  if (minutes < 90) return { state: 'soon', minutes };
  return { state: 'upcoming', hours: Math.round(minutes / 60) };
}

export { layoutOrbits, hashId };
export type { DiscoverPerson, OrbitPerson };
