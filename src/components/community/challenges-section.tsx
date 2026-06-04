'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';

type ChallengeRow = {
  id: string;
  title: string;
  description: string;
  goal: number;
  rewardPoints: number;
  endsAt: string;
  participants?: { progress: number; completedAt: string | null }[];
};

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
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${done ? 100 : pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {done
                  ? t('completed')
                  : t('progress', { current: progress, goal: c.goal })}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
