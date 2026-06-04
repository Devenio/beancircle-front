import { api } from './client';

export type StreakType =
  | 'DAILY_VISIT'
  | 'WEEKLY_CAFE'
  | 'CONSECUTIVE_CHECKIN'
  | 'EVENT_PARTICIPATION';

export type StreakRow = {
  type: StreakType;
  current: number;
  best: number;
  lastEventOn: string | null;
  nextMilestone: number | null;
};

export type StreaksResponse = {
  streaks: StreakRow[];
  headline: StreakRow;
};

export function getMyStreaks(locale: string): Promise<StreaksResponse> {
  return api<StreaksResponse>('/streaks/me', { locale });
}

export function registerVisit(locale: string) {
  return api('/streaks/visit', { method: 'POST', locale }).catch(() => null);
}

export type CardRarity =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY';

export type UserCollectible = {
  id: string;
  collectedAt: string;
  card: {
    id: string;
    name: string;
    rarity: CardRarity;
    artworkUrl?: string | null;
    cafe?: {
      id: string;
      name: string;
      photos?: { url: string }[];
    };
  };
};

export type CollectiblesResponse = {
  progress: { owned: number; total: number; percent: number };
  byRarity: Record<CardRarity, number>;
  recent: UserCollectible[];
};

export function getMyCollectibles(
  locale: string,
): Promise<CollectiblesResponse> {
  return api<CollectiblesResponse>('/collectibles/me', { locale });
}

export function getCollectionSummary(
  userId: string,
  locale: string,
): Promise<{ owned: number; total: number; percent: number }> {
  return api(`/collectibles/user/${userId}/summary`, { locale });
}
