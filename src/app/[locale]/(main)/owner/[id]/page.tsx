'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

type Analytics = {
  cafe: {
    id: string;
    name: string;
    followerCount: number;
    reviewCount: number;
    avgRating: number;
    isPartner: boolean;
    checkinCode?: string | null;
  };
  metrics: {
    checkins30: number;
    checkinsTotal: number;
    reviews30: number;
    stampCount: number;
  };
  recentCheckins: {
    createdAt: string;
    user: { username?: string | null; name?: string | null };
  }[];
};

export default function OwnerCafePage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const t = useTranslations('owner');
  const qc = useQueryClient();
  const [name, setName] = useState('');

  const { data } = useQuery({
    queryKey: ['owner-analytics', id, locale],
    queryFn: () => api<Analytics>(`/owner/cafes/${id}/analytics`, { locale }),
  });

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api(`/owner/cafes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        locale,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-analytics', id, locale] }),
  });

  if (!data) return null;

  const { cafe, metrics, recentCheckins } = data;

  return (
    <div className="space-y-6 p-4 pb-24">
      <header>
        <h1 className="text-xl font-bold">{cafe.name}</h1>
        <p className="text-sm text-muted-foreground">{t('analytics')}</p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Metric label={t('checkins30')} value={metrics.checkins30} />
        <Metric label={t('checkinsTotal')} value={metrics.checkinsTotal} />
        <Metric label={t('reviews30')} value={metrics.reviews30} />
        <Metric label={t('stamps')} value={metrics.stampCount} />
        <Metric label={t('followers')} value={cafe.followerCount} />
        <Metric label={t('rating')} value={cafe.avgRating.toFixed(1)} />
      </div>

      {cafe.checkinCode ? (
        <p className="rounded-lg bg-muted px-3 py-2 font-mono text-xs">
          {t('checkinCode')}: {cafe.checkinCode}
        </p>
      ) : null}

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">{t('editCafe')}</h2>
        <Input
          className="mt-2"
          placeholder={cafe.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => updateMutation.mutate({ isPartner: !cafe.isPartner })}
          >
            {cafe.isPartner ? t('unpartner') : t('partner')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => name && updateMutation.mutate({ name })}
          >
            {t('saveName')}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">{t('recentCheckins')}</h2>
        <ul className="space-y-2 text-sm">
          {recentCheckins.map((c, i) => (
            <li key={i} className="flex justify-between border-b py-2">
              <span>{c.user.username ?? c.user.name}</span>
              <span className="text-muted-foreground">
                {new Date(c.createdAt).toLocaleDateString(locale)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
