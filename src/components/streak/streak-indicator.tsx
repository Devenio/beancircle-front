'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Flame } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { getMyStreaks } from '@/lib/api/gamification';

/** Whole UTC days between an ISO date and today (positive = in the past). */
function daysSinceUTC(iso: string): number {
  const then = new Date(iso);
  const a = Date.UTC(then.getUTCFullYear(), then.getUTCMonth(), then.getUTCDate());
  const now = new Date();
  const b = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((b - a) / 86400000);
}

function useHeadlineStreak(locale: string) {
  const { data } = useQuery({
    queryKey: ['streaks', locale],
    queryFn: () => getMyStreaks(locale),
  });
  return data?.headline ?? null;
}

/**
 * Compact fire + day-count pill for the home header. Always renders (greyed at
 * 0); pulses a yellow ring when the streak is alive but not yet continued today.
 * Tapping opens /profile, where the BeanScore panel lives.
 */
export function StreakIndicator({ locale }: { locale: string }) {
  const t = useTranslations('streaks');
  const headline = useHeadlineStreak(locale);
  const current = headline?.current ?? 0;
  const notContinuedToday =
    !!headline?.lastEventOn && daysSinceUTC(headline.lastEventOn) !== 0;
  const warn = current > 0 && notContinuedToday;

  return (
    <Link
      href="/profile"
      aria-label={t('indicatorLabel', { count: current })}
      className={cn(
        'flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold transition-colors',
        current > 0
          ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400'
          : 'bg-muted text-muted-foreground',
        warn && 'animate-pulse ring-2 ring-yellow-400',
      )}
    >
      <Flame className={cn('size-4', current > 0 && 'fill-orange-500/40')} />
      <span>{current}</span>
    </Link>
  );
}
