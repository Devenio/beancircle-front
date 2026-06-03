'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Bell, MapPin } from 'lucide-react';
import { useEffect } from 'react';
import {
  ActivityCard,
  ActivityCardSkeleton,
} from '@/components/activity/activity-card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { getActivityFeed } from '@/lib/api/activity';
import { registerVisit } from '@/lib/api/gamification';

export default function HomePage() {
  const t = useTranslations('activity');
  const tc = useTranslations('common');
  const { locale } = useParams<{ locale: string }>();

  useEffect(() => {
    registerVisit(locale);
  }, [locale]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['activity', locale],
      queryFn: ({ pageParam }) => getActivityFeed(locale, pageParam ?? 0),
      initialPageParam: 0,
      getNextPageParam: (last) => last.nextOffset ?? undefined,
    });

  const items = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-bold leading-none">{t('title')}</h1>
          <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/notifications" />}
        >
          <Bell className="size-6" />
          <span className="sr-only">Notifications</span>
        </Button>
      </header>

      <div className="space-y-3 p-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <ActivityCardSkeleton key={i} />)
        ) : items.length === 0 ? (
          <Empty className="mt-16 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MapPin />
              </EmptyMedia>
              <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('emptyBody')}</EmptyDescription>
            </EmptyHeader>
            <Button render={<Link href="/discover" />}>{t('checkInNow')}</Button>
          </Empty>
        ) : (
          <>
            {items.map((item) => (
              <ActivityCard key={item.id} item={item} locale={locale} />
            ))}
            {hasNextPage ? (
              <Button
                variant="outline"
                className="w-full"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {isFetchingNextPage ? '…' : tc('seeAll')}
              </Button>
            ) : null}
          </>
        )}
      </div>

      <Button
        size="icon-lg"
        className="fixed bottom-24 left-1/2 z-40 size-14 -translate-x-1/2 rounded-full shadow-lg"
        render={<Link href="/discover" />}
      >
        <MapPin className="size-6" />
        <span className="sr-only">{t('checkInNow')}</span>
      </Button>
    </div>
  );
}
