import { api } from './client';

export type ActivityType =
  | 'FRIEND_CHECKIN'
  | 'FRIEND_JOINED_EVENT'
  | 'FRIEND_EARNED_BADGE'
  | 'FRIEND_COMPLETED_CHALLENGE'
  | 'FRIEND_JOINED_SQUAD'
  | 'FRIEND_STREAK_MILESTONE'
  | 'FRIEND_COLLECTED_CARD'
  | 'CAFE_TRENDING'
  | 'EVENT_ANNOUNCED'
  | 'SQUAD_ACTIVITY';

export type ActivityActor = {
  id: string;
  username?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
};

export type ActivityItem = {
  id: string;
  type: ActivityType;
  actorId: string;
  cheerCount: number;
  createdAt: string;
  badgeCode?: string | null;
  payload?: {
    mood?: string | null;
    status?: string | null;
    withCount?: number;
    milestone?: number;
    rarity?: string;
    cardName?: string;
  } | null;
  actor: ActivityActor;
  cafe?: {
    id: string;
    name: string;
    address?: string;
    photos?: { url: string }[];
  } | null;
  event?: {
    id: string;
    title: string;
    type?: string;
    startsAt: string;
    coverUrl?: string | null;
  } | null;
  squad?: {
    id: string;
    name: string;
    slug: string;
    emoji?: string | null;
    category?: string;
  } | null;
};

export type ActivityFeed = {
  data: ActivityItem[];
  nextOffset: number | null;
};

export function getActivityFeed(
  locale: string,
  offset = 0,
  limit = 20,
): Promise<ActivityFeed> {
  return api<ActivityFeed>(
    `/activity/feed?offset=${offset}&limit=${limit}`,
    { locale },
  );
}

export function cheerActivity(id: string, locale: string) {
  return api<{ id: string; cheerCount: number }>(`/activity/${id}/cheer`, {
    method: 'POST',
    locale,
  });
}
