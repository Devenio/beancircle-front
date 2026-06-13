'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  getCollectionSummary,
  getMyCollectibles,
  type CardRarity,
  type UserCollectible,
} from '@/lib/api/gamification';

const RARITY_RING: Record<CardRarity, string> = {
  COMMON: 'ring-zinc-400',
  UNCOMMON: 'ring-emerald-400',
  RARE: 'ring-blue-400',
  EPIC: 'ring-violet-400',
  LEGENDARY: 'ring-amber-400',
};

const RARITY_BADGE: Record<CardRarity, string> = {
  COMMON: 'bg-zinc-400/20 text-zinc-600 dark:text-zinc-300',
  UNCOMMON: 'bg-emerald-400/20 text-emerald-600 dark:text-emerald-300',
  RARE: 'bg-blue-400/20 text-blue-600 dark:text-blue-300',
  EPIC: 'bg-violet-400/20 text-violet-600 dark:text-violet-300',
  LEGENDARY: 'bg-amber-400/20 text-amber-600 dark:text-amber-300',
};

/**
 * "Badges" row on the profile — collected cafe cards. For your own profile it
 * shows individual cards (with rarity rings + tappable detail); for others it
 * shows only the collection summary the API exposes. Hidden when empty.
 */
export function CollectiblesBadges({
  userId,
  isSelf,
  locale,
}: {
  userId: string;
  isSelf: boolean;
  locale: string;
}) {
  const t = useTranslations('collectibles');
  const [selected, setSelected] = useState<UserCollectible | null>(null);

  const { data: mine } = useQuery({
    queryKey: ['collectibles', locale],
    queryFn: () => getMyCollectibles(locale),
    enabled: isSelf,
  });

  const { data: summary } = useQuery({
    queryKey: ['collectibles', 'summary', userId, locale],
    queryFn: () => getCollectionSummary(userId, locale),
    enabled: !isSelf,
  });

  const owned = isSelf ? mine?.progress.owned ?? 0 : summary?.owned ?? 0;
  const total = isSelf ? mine?.progress.total ?? 0 : summary?.total ?? 0;

  // Hide entirely when there's nothing to show.
  if (isSelf ? !mine || mine.progress.total === 0 : !summary || summary.owned === 0) {
    return null;
  }

  // Other users: only a summary is available.
  if (!isSelf) {
    return (
      <section className="px-4">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
          <span className="text-sm font-semibold">{t('badgesTitle')}</span>
          <span className="text-sm text-muted-foreground">
            {t('progress', { owned, total })}
          </span>
        </div>
      </section>
    );
  }

  const cards = mine?.recent ?? [];
  const ghostCount = Math.min(3, Math.max(0, total - owned));

  return (
    <section className="px-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t('badgesTitle')}</h2>
        <span className="text-xs text-muted-foreground">
          {t('progress', { owned, total })}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {cards.map((c) => {
          const img = c.card.artworkUrl ?? c.card.cafe?.photos?.[0]?.url;
          const active = selected?.id === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(active ? null : c)}
              className="flex w-16 shrink-0 flex-col items-center gap-1"
            >
              <span
                className={cn(
                  'grid size-14 place-items-center overflow-hidden rounded-full ring-2 transition-all',
                  RARITY_RING[c.card.rarity],
                  active && 'ring-4',
                )}
              >
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-lg">☕</span>
                )}
              </span>
              <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                {c.card.name}
              </span>
            </button>
          );
        })}

        {Array.from({ length: ghostCount }).map((_, i) => (
          <div
            key={`ghost-${i}`}
            className="flex w-16 shrink-0 flex-col items-center gap-1"
          >
            <span className="size-14 rounded-full border-2 border-dashed border-border bg-muted/40" />
            <span className="text-[10px] text-muted-foreground/50">···</span>
          </div>
        ))}
      </div>

      {selected ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
          <span className="font-medium">{selected.card.name}</span>
          {selected.card.cafe?.name ? (
            <span className="text-muted-foreground">· {selected.card.cafe.name}</span>
          ) : null}
          <span
            className={cn(
              'ms-auto rounded-full px-2 py-0.5 text-[10px] font-medium',
              RARITY_BADGE[selected.card.rarity],
            )}
          >
            {t(`rarity.${selected.card.rarity}`)}
          </span>
        </div>
      ) : null}
    </section>
  );
}
