'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { ProfileAvatar as Avatar } from '@/components/chat/user-avatar';

type BeanScoreProfile = {
  totalPoints: number;
  level: number;
  nextThreshold: number;
  pointsToNext: number;
};

type LeaderRow = {
  totalPoints: number;
  level: number;
  user: {
    id: string;
    username?: string | null;
    name?: string | null;
    avatarUrl?: string | null;
  };
};

export function BeanScorePanel({ locale, cityId }: { locale: string; cityId?: string }) {
  const t = useTranslations('beanscore');
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ['beanscore', locale],
    queryFn: () => api<BeanScoreProfile>('/beanscore/me', { locale }),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['beanscore', 'leaderboard', locale, cityId],
    queryFn: () =>
      api<LeaderRow[]>(
        `/beanscore/leaderboard${cityId ? `?cityId=${cityId}` : ''}`,
        { locale },
      ),
  });

  const dailyMutation = useMutation({
    mutationFn: () =>
      api('/beanscore/daily', { method: 'POST', locale }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['beanscore', locale] }),
  });

  if (!me) return null;

  const progress =
    me.nextThreshold > 0
      ? Math.min(100, Math.round((me.totalPoints / me.nextThreshold) * 100))
      : 100;

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('level', { level: me.level })} · {me.totalPoints} {t('points')}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => dailyMutation.mutate()}
          disabled={dailyMutation.isPending}
        >
          {t('dailyBonus')}
        </Button>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t('toNext', { points: me.pointsToNext })}
      </p>
      {leaderboard && leaderboard.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium">{t('leaderboard')}</h3>
          <ul className="mt-2 space-y-2">
            {leaderboard.slice(0, 5).map((row, i) => (
              <li key={row.user.id} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-muted-foreground">{i + 1}</span>
                <Avatar src={row.user.avatarUrl} name={row.user.name} className="h-7 w-7" />
                <span className="flex-1 truncate">
                  {row.user.username ?? row.user.name}
                </span>
                <span className="font-medium">{row.totalPoints}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
