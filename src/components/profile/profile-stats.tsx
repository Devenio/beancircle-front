'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMyCollectibles, getMyStreaks, type CardRarity } from '@/lib/api/gamification';

const RARITY_STYLE: Record<CardRarity, string> = {
  COMMON: 'from-zinc-400/30 to-zinc-500/30 text-zinc-600',
  UNCOMMON: 'from-emerald-400/30 to-emerald-500/30 text-emerald-600',
  RARE: 'from-blue-400/30 to-blue-500/30 text-blue-600',
  EPIC: 'from-violet-400/30 to-fuchsia-500/30 text-violet-600',
  LEGENDARY: 'from-amber-400/40 to-orange-500/40 text-amber-600',
};

export function StreakCard({ locale }: { locale: string }) {
  const t = useTranslations('streaks');
  const { data } = useQuery({
    queryKey: ['streaks', locale],
    queryFn: () => getMyStreaks(locale),
  });
  const headline = data?.headline;
  const current = headline?.current ?? 0;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-gradient-to-br from-orange-500/10 to-amber-500/5 p-4">
      <div className="relative flex size-16 items-center justify-center">
        <Flame
          className={cn(
            'size-16',
            current > 0 ? 'text-orange-500' : 'text-muted-foreground/30',
          )}
        />
        <span className="absolute text-lg font-bold text-foreground">
          {current}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{t('title')}</p>
        <p className="text-xs text-muted-foreground">
          {t('current')}: {t('days', { count: current })} · {t('best')}:{' '}
          {t('days', { count: headline?.best ?? 0 })}
        </p>
        {headline?.nextMilestone ? (
          <p className="mt-1 text-xs text-orange-600">
            {t('nextMilestone', { count: headline.nextMilestone - current })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function CollectionCard({ locale }: { locale: string }) {
  const t = useTranslations('collectibles');
  const { data } = useQuery({
    queryKey: ['collectibles', locale],
    queryFn: () => getMyCollectibles(locale),
  });

  const owned = data?.progress.owned ?? 0;
  const total = data?.progress.total ?? 0;
  const percent = data?.progress.percent ?? 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold">{t('title')}</p>
        <p className="text-sm font-bold">
          {t('progress', { owned, total })}
        </p>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      {data?.recent.length ? (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {data.recent.slice(0, 12).map((c) => (
            <div
              key={c.id}
              className={cn(
                'flex h-20 w-16 shrink-0 flex-col items-center justify-end overflow-hidden rounded-xl bg-gradient-to-br p-1.5 text-center',
                RARITY_STYLE[c.card.rarity],
              )}
            >
              {c.card.cafe?.photos?.[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.card.cafe.photos[0].url}
                  alt=""
                  className="mb-1 size-8 rounded-lg object-cover"
                />
              ) : (
                <span className="mb-1 text-xl">☕</span>
              )}
              <span className="w-full truncate text-[9px] font-medium text-foreground">
                {c.card.cafe?.name ?? c.card.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">{t('emptyBody')}</p>
      )}
    </div>
  );
}
