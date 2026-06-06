export type DiscoverPerson = {
  id: string;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  age?: number;
  distanceLabel?: string;
  mutualFriendsCount: number;
  sharedInterests: string[];
  sharedGroupsCount: number;
  lastActive: 'online' | 'today' | 'week' | 'offline';
  relationship: 'none' | 'pending_out' | 'pending_in' | 'friends';
};

export type FriendRequestItem = {
  id: string;
  sender?: { id: string; name?: string | null; username?: string | null; avatarUrl?: string | null };
  receiver?: { id: string; name?: string | null; username?: string | null; avatarUrl?: string | null };
};

export type DiscoverFiltersState = {
  radiusKm: number;
  interests: string[];
  activity?: 'online' | 'today' | 'week';
  relationship?: 'friends_only' | 'not_friends' | 'suggested';
};

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
