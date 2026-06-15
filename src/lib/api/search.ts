import { api } from './client';

export type MentionUser = {
  id: string;
  type: 'user';
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
};

export type MentionCafe = {
  id: string;
  type: 'cafe';
  name: string;
  slug: string | null;
  logoUrl: string | null;
};

export type MentionResult = MentionUser | MentionCafe;

export async function searchMentions(q: string, locale: string): Promise<MentionResult[]> {
  if (!q.trim()) return [];
  const res = await api<{
    users: { id: string; username: string | null; name: string | null; avatarUrl: string | null }[];
    cafes: { id: string; name: string; slug: string | null; photos?: { url: string }[] }[];
  }>(`/search?q=${encodeURIComponent(q)}&type=all`, { locale });
  return [
    ...res.users.map((u) => ({
      id: u.id,
      type: 'user' as const,
      username: u.username,
      name: u.name,
      avatarUrl: u.avatarUrl,
    })),
    ...res.cafes.map((c) => ({
      id: c.id,
      type: 'cafe' as const,
      name: c.name,
      slug: c.slug,
      logoUrl: c.photos?.[0]?.url ?? null,
    })),
  ];
}
