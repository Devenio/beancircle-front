'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { PlusSquare } from 'lucide-react';
import { api } from '@/lib/api/client';
import { FeedCard } from '@/components/feed/feed-card';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

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
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-4 py-3">
        <h1 className="text-lg font-bold">Bean Circle</h1>
        <Button variant="ghost" size="icon" render={<Link href="/create" />}>
          <PlusSquare className="h-6 w-6" />
          <span className="sr-only">Create</span>
        </Button>
      </header>
      {isLoading && <p className="p-4 text-center text-sm text-muted-foreground">{t('empty')}</p>}
      {data?.data?.length === 0 && (
        <p className="p-8 text-center text-muted-foreground">{t('empty')}</p>
      )}
      {data?.data?.map((post) => (
        <FeedCard key={(post as { id: string }).id} post={post as never} locale={locale} />
      ))}
    </div>
  );
}
