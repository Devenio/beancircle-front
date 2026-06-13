'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type ChallengeType =
  | 'CHECKIN_COUNT'
  | 'NEW_STAMPS'
  | 'VISIT_UNIQUE_CAFES'
  | string;

type ChallengeRow = {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  goal: number;
  rewardPoints: number;
  startsAt: string;
  endsAt: string;
  participants?: { progress: number; completedAt: string | null }[];
};

/** Where a challenge's "Join" CTA should send the user to make progress. */
function actionHref(type: ChallengeType): string {
  switch (type) {
    case 'CHECKIN_COUNT':
    case 'VISIT_UNIQUE_CAFES':
    case 'NEW_STAMPS':
      return '/discover/map';
    default:
      return '/discover';
  }
}

/** Fraction of the challenge window still remaining, clamped to [0, 1]. */
function fractionRemaining(startsAt: string, endsAt: string): number {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  const total = end - start;
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, (end - now) / total));
}

export function ChallengesSection({ locale, cityId }: { locale: string; cityId?: string }) {
  const t = useTranslations('challenges');

  const { data, isLoading } = useQuery({
    queryKey: ['challenges', locale, cityId],
    queryFn: () =>
      api<ChallengeRow[]>(
        `/challenges${cityId ? `?cityId=${cityId}` : ''}`,
        { locale },
      ),
  });

  if (isLoading) {
    return <p className="px-4 py-2 text-sm text-muted-foreground">{t('loading')}</p>;
  }

  if (!data?.length) return null;

  return (
    <section className="border-b px-4 py-3">
      <h2 className="mb-2 text-sm font-semibold">{t('title')}</h2>
      <div className="space-y-2">
        {data.map((c) => {
          const p = c.participants?.[0];
          const progress = p?.progress ?? 0;
          const done = !!p?.completedAt;
          const pct = Math.min(100, Math.round((progress / c.goal) * 100));

          const msLeft = new Date(c.endsAt).getTime() - Date.now();
          const hoursLeft = Math.max(0, Math.floor(msLeft / 3_600_000));
          const daysLeft = Math.floor(hoursLeft / 24);
          // Urgent when under 20% of the window remains (and not yet done).
          const urgent = !done && fractionRemaining(c.startsAt, c.endsAt) < 0.2;

          const countdown =
            daysLeft >= 1
              ? t('daysLeft', { count: daysLeft })
              : t('hoursLeft', { count: hoursLeft });

          return (
            <div key={c.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-primary">
                  +{c.rewardPoints}
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    urgent ? 'bg-red-500' : 'bg-primary',
                  )}
                  style={{ width: `${done ? 100 : pct}%` }}
                />
              </div>

              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {done
                    ? t('completed')
                    : t('progress', { current: progress, goal: c.goal })}
                </p>
                {!done ? (
                  <span
                    className={cn(
                      'text-xs font-medium',
                      urgent ? 'text-red-500' : 'text-muted-foreground',
                    )}
                  >
                    {urgent ? t('endingSoon') : countdown}
                  </span>
                ) : null}
              </div>

              {!done ? (
                <Link
                  href={actionHref(c.type)}
                  className={cn(
                    'mt-2 flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                    urgent
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90',
                  )}
                >
                  {t('join')}
                  <ArrowRight className="size-3.5 rtl:rotate-180" />
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
