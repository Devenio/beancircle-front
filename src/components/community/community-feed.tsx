'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { FeedCard } from '@/components/feed/feed-card';
import { ProfileAvatar as Avatar } from '@/components/chat/user-avatar';
import { Link } from '@/i18n/navigation';

type CommunityFeed = {
  posts: {
    data: unknown[];
    nextCursor: string | null;
  };
  recentCheckins: {
    id: string;
    createdAt: string;
    user: {
      id: string;
      username?: string | null;
      name?: string | null;
      avatarUrl?: string | null;
    };
    cafe: { id: string; name: string; photos?: { url: string }[] };
  }[];
};

export function CommunityFeed({ locale }: { locale: string }) {
  const t = useTranslations('community');

  const { data, isLoading } = useQuery({
    queryKey: ['community', locale],
    queryFn: () => api<CommunityFeed>('/community/feed', { locale }),
  });

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">{t('loading')}</p>;
  }

  const posts = data?.posts?.data ?? [];
  const checkins = data?.recentCheckins ?? [];

  return (
    <div>
      {checkins.length > 0 ? (
        <section className="border-b px-4 py-3">
          <h2 className="mb-2 text-sm font-semibold">{t('recentCheckins')}</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {checkins.map((c) => (
              <Link
                key={c.id}
                href={`/cafe/${c.cafe.id}`}
                className="flex min-w-[140px] flex-col gap-1 rounded-lg border p-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar src={c.user.avatarUrl} name={c.user.name} className="h-6 w-6" />
                  <span className="truncate text-xs font-medium">
                    {c.user.username ?? c.user.name}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{c.cafe.name}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <section>
        <h2 className="px-4 py-3 text-sm font-semibold">{t('activity')}</h2>
        {posts.length === 0 ? (
          <p className="px-4 text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          posts.map((post) => (
            <FeedCard
              key={(post as { id: string }).id}
              post={post as never}
              locale={locale}
            />
          ))
        )}
      </section>
    </div>
  );
}
