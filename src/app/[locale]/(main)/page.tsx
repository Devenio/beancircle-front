'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Bell, Coffee, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  ActivityCard,
  ActivityCardSkeleton,
} from '@/components/activity/activity-card';
import { BeanComposerSheet } from '@/components/beans/bean-composer-sheet';
import { BeanFeed } from '@/components/beans/bean-feed';
import { TrendingTopics } from '@/components/beans/trending-topics';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { getActivityFeed } from '@/lib/api/activity';
import { getBeanFeed, type BeanFeedScope } from '@/lib/api/beans';
import { registerVisit } from '@/lib/api/gamification';
import { useAuthStore } from '@/stores/auth-store';
import { UserAvatar } from '@/components/chat/user-avatar';
import { StreakIndicator } from '@/components/streak/streak-indicator';
import { DailyBonusCard } from '@/components/beanscore/daily-bonus-card';
import { HomeChallengesStrip } from '@/components/home/home-challenges-strip';

const SCOPES: BeanFeedScope[] = ['feed', 'trending', 'local', 'friends'];

export default function HomePage() {
  const t = useTranslations('activity');
  const tb = useTranslations('beans');
  const { locale } = useParams<{ locale: string }>();
  const me = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<'beans' | 'activity'>('beans');
  const [scope, setScope] = useState<BeanFeedScope>('feed');
  const [composing, setComposing] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    registerVisit(locale).then(() => {
      qc.invalidateQueries({ queryKey: ['streaks', locale] });
    });
  }, [locale, qc]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 pt-3">
          <div>
            <h1 className="text-lg font-bold leading-none">
              {tab === 'beans' ? tb('title') : t('title')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {tab === 'beans' ? tb('subtitle') : t('subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <StreakIndicator locale={locale} />
            <Button
              variant="ghost"
              size="icon"
              render={<Link href="/notifications" />}
            >
              <Bell className="size-6" />
              <span className="sr-only">Notifications</span>
            </Button>
          </div>
        </div>
        <div className="mt-2 flex gap-1 px-4 pb-2">
          {(['beans', 'activity'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                tab === key
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {key === 'beans' ? tb('tab') : t('title')}
            </button>
          ))}
        </div>
      </header>

      {tab === 'beans' ? (
        <div className="pb-4">
          <DailyBonusCard locale={locale} />
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-start"
          >
            <UserAvatar src={me?.avatarUrl} name={me?.name} />
            <span className="flex-1 rounded-full bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              {tb('composer.prompts.brewing')}
            </span>
          </button>

          <HomeChallengesStrip locale={locale} />

          <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 scrollbar-none">
            {SCOPES.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setScope(key)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  scope === key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted',
                )}
              >
                {tb(`scopes.${key}`)}
              </button>
            ))}
          </div>

          {scope === 'trending' ? <TrendingTopics locale={locale} /> : null}

          <BeanFeed
            queryKey={['beans', scope, locale]}
            fetchPage={(cursor) => getBeanFeed(scope, locale, cursor)}
            locale={locale}
          />
        </div>
      ) : (
        <ActivityTab locale={locale} />
      )}

      <Button
        size="icon-lg"
        className="fixed bottom-24 left-1/2 z-40 size-14 -translate-x-1/2 rounded-full shadow-lg"
        onClick={() => setComposing(true)}
      >
        <Coffee className="size-6" />
        <span className="sr-only">{tb('shareTitle')}</span>
      </Button>

      <BeanComposerSheet
        open={composing}
        onOpenChange={setComposing}
        locale={locale}
      />
    </div>
  );
}

function ActivityTab({ locale }: { locale: string }) {
  const t = useTranslations('activity');
  const tc = useTranslations('common');

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['activity', locale],
      queryFn: ({ pageParam }) => getActivityFeed(locale, pageParam ?? 0),
      initialPageParam: 0,
      getNextPageParam: (last) => last.nextOffset ?? undefined,
    });

  const items = data?.pages.flatMap((p) => p.data) ?? [];

  return (
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
  );
}
