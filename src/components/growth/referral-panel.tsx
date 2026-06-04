'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ReferralStats = {
  code: string;
  total: number;
  pointsEarned: number;
  referrals: {
    pointsAwarded: number;
    referred: { username?: string | null; name?: string | null };
  }[];
};

export function ReferralPanel({ locale }: { locale: string }) {
  const t = useTranslations('growth');
  const qc = useQueryClient();
  const [applyCode, setApplyCode] = useState('');
  const [message, setMessage] = useState('');

  const { data } = useQuery({
    queryKey: ['referrals', locale],
    queryFn: () => api<ReferralStats>('/growth/referrals/me', { locale }),
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      api('/growth/referrals/apply', {
        method: 'POST',
        body: JSON.stringify({ code: applyCode }),
        locale,
      }),
    onSuccess: () => {
      setMessage(t('applied'));
      setApplyCode('');
      qc.invalidateQueries({ queryKey: ['referrals', locale] });
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (e: Error) => {
      setMessage(e.message);
      setTimeout(() => setMessage(''), 4000);
    },
  });

  async function copyCode() {
    if (!data?.code) return;
    await navigator.clipboard.writeText(data.code);
    setMessage(t('copied'));
    setTimeout(() => setMessage(''), 2000);
  }

  if (!data) return null;

  return (
    <section className="rounded-xl border p-4">
      <h2 className="font-semibold">{t('title')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-muted px-3 py-2 font-mono text-sm">
          {data.code}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={copyCode}>
          {t('copy')}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {t('stats', { total: data.total, points: data.pointsEarned })}
      </p>
      <div className="mt-4 border-t pt-4">
        <p className="text-sm font-medium">{t('haveCode')}</p>
        <div className="mt-2 flex gap-2">
          <Input
            value={applyCode}
            onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
            placeholder={t('codePlaceholder')}
            className="font-mono"
          />
          <Button
            type="button"
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending || applyCode.length < 4}
          >
            {t('apply')}
          </Button>
        </div>
      </div>
      {message ? (
        <p className="mt-2 text-sm text-green-600" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
