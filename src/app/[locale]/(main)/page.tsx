'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { FeedCard } from '@/components/feed/feed-card';

export default function HomePage() {
  const t = useTranslations('feed');
  const { locale } = useParams<{ locale: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['feed', locale],
    queryFn: () =>
      api<{ data: unknown[] }>('/posts/feed', { locale }),
  });

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold">Bean Circle</h1>
      </header>
      {isLoading && <p className="p-4 text-center text-sm text-neutral-500">{t('empty')}</p>}
      {data?.data?.length === 0 && (
        <p className="p-8 text-center text-neutral-500">{t('empty')}</p>
      )}
      {data?.data?.map((post) => (
        <FeedCard key={(post as { id: string }).id} post={post as never} locale={locale} />
      ))}
    </div>
  );
}
