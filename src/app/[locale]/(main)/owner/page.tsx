'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';

type OwnerCafe = {
  cafe: {
    id: string;
    name: string;
    address: string;
    isPartner: boolean;
    photos?: { url: string }[];
  };
};

export default function OwnerDashboardPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations('owner');
  const qc = useQueryClient();
  const [claimCode, setClaimCode] = useState('');
  const [flash, setFlash] = useState('');

  const { data: cafes, isLoading } = useQuery({
    queryKey: ['owner-cafes', locale],
    queryFn: () => api<OwnerCafe[]>('/owner/cafes', { locale }),
  });

  const claimMutation = useMutation({
    mutationFn: () =>
      api('/owner/cafes/claim', {
        method: 'POST',
        body: JSON.stringify({ claimCode }),
        locale,
      }),
    onSuccess: () => {
      setFlash(t('claimed'));
      setClaimCode('');
      qc.invalidateQueries({ queryKey: ['owner-cafes', locale] });
      setTimeout(() => setFlash(''), 3000);
    },
    onError: (e: Error) => {
      setFlash(e.message);
      setTimeout(() => setFlash(''), 4000);
    },
  });

  return (
    <div className="space-y-6 p-4 pb-24">
      <header>
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">{t('claimTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('claimHint')}</p>
        <div className="mt-3 flex gap-2">
          <Input
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
            placeholder="CLM-XXXX"
            className="font-mono"
          />
          <Button
            type="button"
            onClick={() => claimMutation.mutate()}
            disabled={claimMutation.isPending}
          >
            {t('claim')}
          </Button>
        </div>
        {flash ? <p className="mt-2 text-sm text-green-600">{flash}</p> : null}
      </section>

      <section>
        <h2 className="mb-2 font-semibold">{t('yourCafes')}</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : !cafes?.length ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ul className="space-y-2">
            {cafes.map(({ cafe }) => (
              <li key={cafe.id}>
                <Link
                  href={`/owner/${cafe.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {cafe.photos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cafe.photos[0].url}
                      alt=""
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{cafe.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {cafe.address}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
