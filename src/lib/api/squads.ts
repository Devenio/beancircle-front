import { api } from './client';

export type SquadCategory =
  | 'GAMERS'
  | 'COFFEE_LOVERS'
  | 'ARTISTS'
  | 'STUDENTS'
  | 'DEVELOPERS'
  | 'BOOK_CLUB'
  | 'OTHER';

export type SquadRole = 'MEMBER' | 'ADMIN' | 'OWNER';

export type SquadSummary = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category: SquadCategory;
  emoji?: string | null;
  coverUrl?: string | null;
  memberCount: number;
  cafe?: { id: string; name: string } | null;
  _count?: { members: number; messages: number };
  myRole?: SquadRole | null;
};

export type SquadDetail = SquadSummary & {
  isMember: boolean;
  city?: { id: string; name: string } | null;
};

export type SquadMemberRow = {
  id: string;
  role: SquadRole;
  points: number;
  user: {
    id: string;
    username?: string | null;
    name?: string | null;
    avatarUrl?: string | null;
  };
};

export type SquadMessage = {
  id: string;
  body?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  sender: {
    id: string;
    username?: string | null;
    name?: string | null;
    avatarUrl?: string | null;
  };
};

export function listSquads(
  locale: string,
  params: { cityId?: string; category?: SquadCategory; q?: string } = {},
): Promise<SquadSummary[]> {
  const qs = new URLSearchParams();
  if (params.cityId) qs.set('cityId', params.cityId);
  if (params.category) qs.set('category', params.category);
  if (params.q) qs.set('q', params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return api<SquadSummary[]>(`/squads${suffix}`, { locale });
}

export function listMySquads(locale: string): Promise<SquadSummary[]> {
  return api<SquadSummary[]>('/squads/mine', { locale });
}

export function getSquad(id: string, locale: string): Promise<SquadDetail> {
  return api<SquadDetail>(`/squads/${id}`, { locale });
}

export function joinSquad(id: string, locale: string) {
  return api(`/squads/${id}/join`, { method: 'POST', locale });
}

export function leaveSquad(id: string, locale: string) {
  return api(`/squads/${id}/join`, { method: 'DELETE', locale });
}

export function getSquadMembers(
  id: string,
  locale: string,
): Promise<SquadMemberRow[]> {
  return api<SquadMemberRow[]>(`/squads/${id}/members`, { locale });
}

export function getSquadLeaderboard(
  id: string,
  locale: string,
): Promise<SquadMemberRow[]> {
  return api<SquadMemberRow[]>(`/squads/${id}/leaderboard`, { locale });
}

export function getSquadMessages(
  id: string,
  locale: string,
  cursor?: string,
): Promise<{ data: SquadMessage[]; nextCursor: string | null }> {
  const suffix = cursor ? `?cursor=${cursor}` : '';
  return api<{ data: SquadMessage[]; nextCursor: string | null }>(
    `/squads/${id}/messages${suffix}`,
    { locale },
  );
}

export function sendSquadMessage(
  id: string,
  body: string,
  locale: string,
): Promise<SquadMessage> {
  return api<SquadMessage>(`/squads/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
    locale,
  });
}
