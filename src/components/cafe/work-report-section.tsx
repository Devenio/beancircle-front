'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

type WorkInsights = {
  workspaceScore: number;
  workFriendlyScore: number;
  liveWifiScore: number | null;
  liveNoiseLevel: number | null;
  liveOutletScore: number | null;
  workReportCount: number;
  bestWorkspace: boolean;
  fastWifi: boolean;
  quiet: boolean;
};

function ScorePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-8 w-8 rounded-md border text-sm ${
              value === n ? 'border-primary bg-primary text-primary-foreground' : ''
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function WorkReportSection({
  cafeId,
  locale,
}: {
  cafeId: string;
  locale: string;
}) {
  const t = useTranslations('work');
  const qc = useQueryClient();
  const [wifi, setWifi] = useState(4);
  const [noise, setNoise] = useState(3);
  const [outlets, setOutlets] = useState(4);
  const [message, setMessage] = useState('');

  const { data } = useQuery({
    queryKey: ['work', cafeId, locale],
    queryFn: () => api<WorkInsights>(`/cafes/${cafeId}/work`, { locale }),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      api(`/cafes/${cafeId}/work-reports`, {
        method: 'POST',
        body: JSON.stringify({
          wifiScore: wifi,
          noiseLevel: noise,
          outletScore: outlets,
        }),
        locale,
      }),
    onSuccess: () => {
      setMessage(t('submitted'));
      qc.invalidateQueries({ queryKey: ['work', cafeId, locale] });
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (e: Error) => {
      setMessage(e.message);
      setTimeout(() => setMessage(''), 4000);
    },
  });

  return (
    <section className="mt-6 rounded-xl border p-4">
      <h2 className="font-semibold">{t('title')}</h2>
      {data ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {t('score', { score: data.workFriendlyScore })}
          {data.workReportCount > 0
            ? ` · ${t('reports', { count: data.workReportCount })}`
            : ''}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {data?.fastWifi ? (
          <span className="rounded-full bg-muted px-2 py-1">{t('fastWifi')}</span>
        ) : null}
        {data?.quiet ? (
          <span className="rounded-full bg-muted px-2 py-1">{t('quiet')}</span>
        ) : null}
        {data?.bestWorkspace ? (
          <span className="rounded-full bg-muted px-2 py-1">{t('bestWorkspace')}</span>
        ) : null}
      </div>
      <div className="mt-4 space-y-3">
        <ScorePicker label={t('wifi')} value={wifi} onChange={setWifi} />
        <ScorePicker label={t('noise')} value={noise} onChange={setNoise} />
        <ScorePicker label={t('outlets')} value={outlets} onChange={setOutlets} />
      </div>
      <Button
        type="button"
        className="mt-4"
        onClick={() => submitMutation.mutate()}
        disabled={submitMutation.isPending}
      >
        {t('submit')}
      </Button>
      {message ? (
        <p className="mt-2 text-sm text-green-600" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
