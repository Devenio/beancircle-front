'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import type { CheckinResult, PassportMe } from '@/lib/api/passport';
import { BeanScorePanel } from '@/components/beanscore/beanscore-panel';
import { StampGrid } from '@/components/passport/stamp-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from '@/i18n/navigation';

export function PassportContent() {
  const t = useTranslations('passport');
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const [qrCode, setQrCode] = useState(searchParams.get('code') ?? '');
  const [flash, setFlash] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['passport', locale],
    queryFn: () => api<PassportMe>('/passport/me', { locale }),
  });

  const checkinMutation = useMutation({
    mutationFn: (body: { cafeId?: string; checkinCode?: string }) =>
      api<CheckinResult>('/passport/checkin', {
        method: 'POST',
        body: JSON.stringify(body),
        locale,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['passport', locale] });
      const parts: string[] = [];
      if (res.newStamp) parts.push(t('stampEarned'));
      if (res.earnedBadges?.length) parts.push(t('badgeEarned'));
      if (res.unlockedRewards?.length) parts.push(t('rewardUnlocked'));
      setFlash(parts.join(' ') || t('checkinSuccess'));
      setQrCode('');
      setTimeout(() => setFlash(null), 4000);
    },
    onError: (e: Error) => {
      setFlash(e.message);
      setTimeout(() => setFlash(null), 4000);
    },
  });

  const redeemMutation = useMutation({
    mutationFn: (rewardId: string) =>
      api(`/passport/rewards/${rewardId}/redeem`, { method: 'POST', locale }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['passport', locale] }),
  });

  useEffect(() => {
    const code = searchParams.get('code');
    if (code && code.length >= 4) {
      checkinMutation.mutate({ checkinCode: code });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deep link once
  }, []);

  if (isLoading || !data) {
    return <p className="p-8 text-center text-sm text-muted-foreground">{t('loading')}</p>;
  }

  const { passport, progress, nextReward, rewardCatalog, badges } = data;
  const progressPct = nextReward
    ? Math.min(100, (progress.stamps / nextReward.requiredStamps) * 100)
    : 100;

  return (
    <div className="space-y-6 p-4 pb-24">
      <header>
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <BeanScorePanel locale={locale} />

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span>{t('stamps', { count: passport.totalStamps })}</span>
          <span>{t('checkins', { count: passport.totalCheckins })}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {nextReward ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t('nextReward', {
              title: nextReward.title,
              count: Math.max(0, nextReward.requiredStamps - progress.stamps),
            })}
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">{t('allRewardsUnlocked')}</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">{t('qrCheckin')}</h2>
        <div className="flex gap-2">
          <Input
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value.toUpperCase())}
            placeholder={t('qrPlaceholder')}
            className="font-mono text-sm"
          />
          <Button
            type="button"
            disabled={!qrCode.trim() || checkinMutation.isPending}
            onClick={() => checkinMutation.mutate({ checkinCode: qrCode.trim() })}
          >
            {t('checkin')}
          </Button>
        </div>
        {flash ? (
          <p className="mt-2 text-sm text-primary" role="status">
            {flash}
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">{t('yourStamps')}</h2>
        <StampGrid stamps={data.stamps} />
      </section>

      {badges.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">{t('badges')}</h2>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <div
                key={b.id}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
                title={b.badge.description}
              >
                <span className="font-semibold">{b.badge.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold">{t('rewards')}</h2>
        <ul className="space-y-2">
          {rewardCatalog.map((reward) => (
            <li
              key={reward.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div>
                <p className="font-medium">{reward.title}</p>
                <p className="text-xs text-muted-foreground">{reward.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('requiresStamps', { count: reward.requiredStamps })}
                </p>
              </div>
              {reward.unlocked && !reward.redeemed ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={redeemMutation.isPending}
                  onClick={() => redeemMutation.mutate(reward.id)}
                >
                  {t('redeem')}
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {reward.redeemed
                    ? t('redeemed')
                    : reward.unlocked
                      ? t('unlocked')
                      : t('locked')}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <Button type="button" variant="outline" className="w-full" onClick={() => router.push('/discover')}>
        {t('discoverCafes')}
      </Button>
    </div>
  );
}
