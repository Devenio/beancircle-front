import { api } from './client';

export type BeanType =
  | 'QUICK'
  | 'PHOTO'
  | 'VIDEO'
  | 'LOCAL'
  | 'CAFE'
  | 'EVENT'
  | 'COMMUNITY';

export type BeanReactionType =
  | 'LOVE'
  | 'BREWED'
  | 'HOT'
  | 'NICE'
  | 'INSIGHTFUL'
  | 'FUNNY';

export type BeanAuthor = {
  id: string;
  username?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
};

export type BeanMedia = {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'GIF';
  url: string;
  order: number;
};

export type BeanPollOption = {
  id: string;
  label: string;
  order: number;
  voteCount: number;
};

export type BeanPoll = {
  id: string;
  endsAt?: string | null;
  options: BeanPollOption[];
};

export type Bean = {
  id: string;
  type: BeanType;
  body?: string | null;
  createdAt: string;
  author: BeanAuthor;
  cafe?: { id: string; name: string; slug?: string | null; logoUrl?: string | null } | null;
  event?: { id: string; title: string; startsAt: string; coverUrl?: string | null } | null;
  squad?: { id: string; name: string; slug: string; emoji?: string | null } | null;
  locationLabel?: string | null;
  linkUrl?: string | null;
  parentId?: string | null;
  parent?: { id: string; author: BeanAuthor } | null;
  media?: BeanMedia[];
  poll?: BeanPoll | null;
  myPollOptionId?: string | null;
  quotedBean?: Bean | null;
  rebeanOf?: Bean | null;
  replyCount: number;
  rebeanCount: number;
  quoteCount: number;
  reactionCount: number;
  _count?: { replies: number; rebeans: number; quotes: number; reactions: number };
  myReaction?: BeanReactionType | null;
  rebeaned?: boolean;
  reactionBreakdown?: Partial<Record<BeanReactionType, number>>;
};

export type BeanPage = { data: Bean[]; nextCursor: string | null };

export type BeanFeedScope = 'feed' | 'trending' | 'local' | 'friends';

export type CreateBeanInput = {
  type?: BeanType;
  body?: string;
  cafeId?: string;
  eventId?: string;
  squadId?: string;
  locationLabel?: string;
  lat?: number;
  lng?: number;
  linkUrl?: string;
  parentId?: string;
  quotedBeanId?: string;
  media?: { type?: 'IMAGE' | 'VIDEO' | 'GIF'; url: string }[];
  poll?: { options: string[]; endsAt?: string };
};

export type TrendingTopic = {
  tag: string;
  recentCount: number;
  totalCount: number;
};

function withCursor(path: string, cursor?: string, limit = 20) {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
}

export function getBeanFeed(
  scope: BeanFeedScope,
  locale: string,
  cursor?: string,
): Promise<BeanPage> {
  return api<BeanPage>(withCursor(`/beans/${scope}`, cursor), { locale });
}

export function getBeansForCafe(cafeId: string, locale: string, cursor?: string) {
  return api<BeanPage>(withCursor(`/beans/cafe/${cafeId}`, cursor), { locale });
}

export function getBeansForCommunity(squadId: string, locale: string, cursor?: string) {
  return api<BeanPage>(withCursor(`/beans/community/${squadId}`, cursor), { locale });
}

export function getBeansForEvent(eventId: string, locale: string, cursor?: string) {
  return api<BeanPage>(withCursor(`/beans/event/${eventId}`, cursor), { locale });
}

export function getBeansForUser(username: string, locale: string, cursor?: string) {
  return api<BeanPage>(withCursor(`/beans/user/${username}`, cursor), { locale });
}

export function getBeansForHashtag(tag: string, locale: string, cursor?: string) {
  return api<BeanPage>(
    withCursor(`/beans/hashtag/${encodeURIComponent(tag)}`, cursor),
    { locale },
  );
}

export function getBean(id: string, locale: string): Promise<Bean> {
  return api<Bean>(`/beans/${id}`, { locale });
}

export function getBeanReplies(id: string, locale: string, cursor?: string) {
  return api<BeanPage>(withCursor(`/beans/${id}/replies`, cursor), { locale });
}

export function createBean(input: CreateBeanInput, locale: string): Promise<Bean> {
  return api<Bean>('/beans', {
    method: 'POST',
    body: JSON.stringify(input),
    locale,
  });
}

export function deleteBean(id: string, locale: string) {
  return api<{ deleted: boolean }>(`/beans/${id}`, { method: 'DELETE', locale });
}

export function reactToBean(id: string, type: BeanReactionType, locale: string) {
  return api<{ reaction: BeanReactionType }>(`/beans/${id}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ type }),
    locale,
  });
}

export function unreactBean(id: string, locale: string) {
  return api<{ reaction: null }>(`/beans/${id}/reactions`, {
    method: 'DELETE',
    locale,
  });
}

export function rebean(id: string, locale: string): Promise<Bean> {
  return api<Bean>(`/beans/${id}/rebean`, { method: 'POST', locale });
}

export function unrebean(id: string, locale: string) {
  return api<{ rebeaned: boolean }>(`/beans/${id}/rebean`, {
    method: 'DELETE',
    locale,
  });
}

export function voteBeanPoll(beanId: string, optionId: string, locale: string) {
  return api<BeanPoll & { myOptionId: string | null; totalVotes: number }>(
    `/beans/${beanId}/poll/vote`,
    { method: 'POST', body: JSON.stringify({ optionId }), locale },
  );
}

export function getTrendingTopics(locale: string): Promise<TrendingTopic[]> {
  return api<TrendingTopic[]>('/beans/topics', { locale });
}
