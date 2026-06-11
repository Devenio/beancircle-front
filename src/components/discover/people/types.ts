export const INTEREST_OPTIONS = [
  'COFFEE',
  'BUSINESS',
  'STARTUPS',
  'AI',
  'FITNESS',
  'MUSIC',
  'GAMING',
  'TECH',
] as const;

export const RADIUS_OPTIONS = [1, 5, 10, 25, 50] as const;

export type DiscoverFiltersState = {
  radiusKm: number;
  interests: string[];
  activity?: 'online' | 'today' | 'week';
  relationship?: 'friends_only' | 'not_friends' | 'suggested';
};

export type DiscoverPerson = {
  id: string;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  age?: number;
  distanceM?: number;
  distanceLabel?: string;
  mutualFriendsCount: number;
  sharedInterests: string[];
  sharedGroupsCount: number;
  lastActive: 'online' | 'today' | 'week' | 'offline';
  relationship: 'none' | 'pending_out' | 'pending_in' | 'friends';
  matchReasons?: string[];
  score?: number;
  availability?: UserAvailability | null;
};

export type UserAvailability = {
  intent: AvailabilityIntent;
  minutesLeft: number;
};

export type AvailabilityIntent =
  | 'coffee'
  | 'networking'
  | 'gaming'
  | 'walking'
  | 'coworking';

export type DiscoverMode = 'galaxy' | 'radar' | 'heatmap';

export type FriendRequestItem = {
  id: string;
  sender?: { id: string; name?: string | null; username?: string | null; avatarUrl?: string | null };
  receiver?: { id: string; name?: string | null; username?: string | null; avatarUrl?: string | null };
};

export type OrbitPerson = DiscoverPerson & {
  orbitRadius: number;
  orbitAngle: number;
  orbitHeight: number;
  glow: number;
};

export const AVAILABILITY_INTENTS: AvailabilityIntent[] = [
  'coffee',
  'networking',
  'gaming',
  'walking',
  'coworking',
];

export const AVAILABILITY_DURATIONS = [15, 30, 60] as const;

/** Stable hash → orbit slot */
export function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Map distance in meters to orbit radius (world units) */
export function distanceToOrbit(distanceM: number, maxRadiusKm = 5): number {
  const clamped = Math.max(80, Math.min(distanceM, maxRadiusKm * 1000));
  const t = clamped / (maxRadiusKm * 1000);
  return 1.2 + t * 4.8;
}

export function layoutOrbits(people: DiscoverPerson[], maxRadiusKm = 5): OrbitPerson[] {
  return people.map((p) => {
    const h = hashId(p.id);
    const distanceM = p.distanceM ?? 800;
    const online = p.lastActive === 'online';
    const available = !!p.availability;
    return {
      ...p,
      orbitRadius: distanceToOrbit(distanceM, maxRadiusKm),
      orbitAngle: ((h % 360) * Math.PI) / 180,
      orbitHeight: ((h % 100) / 100 - 0.5) * 1.2,
      glow: (online ? 0.4 : 0.15) + (available ? 0.35 : 0),
    };
  });
}

