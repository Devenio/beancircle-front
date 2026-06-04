'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Link } from '@/i18n/navigation';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import Image from 'next/image';

type CafeListItem = {
  id: string;
  name: string;
  address: string;
  avgRating: number;
  followerCount: number;
  photos?: { url: string }[];
};

export default function CafesPage() {
  const t = useTranslations('cafes');
  const { locale } = useParams<{ locale: string }>();
  const [q, setQ] = useState('');

  const { data: me } = useQuery({
    queryKey: ['me', locale],
    queryFn: () => api<{ cityId?: string }>('/users/me', { locale }),
  });

  const { data: cafes, isLoading, isError } = useQuery({
    queryKey: ['cafes', me?.cityId, q, locale],
    queryFn: () => {
      const params = new URLSearchParams();
      if (me?.cityId) params.set('cityId', me.cityId);
      if (q) params.set('q', q);
      return api<CafeListItem[]>(`/cafes?${params.toString()}`, { locale });
    },
    enabled: !!me,
  });

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-bold">{t('title')}</h1>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('searchPlaceholder')}
      />
      {isLoading && (
        <p className="mt-4 text-sm text-muted-foreground">{t('loading')}</p>
      )}
      {isError && (
        <p className="mt-4 text-sm text-destructive">{t('error')}</p>
      )}
      {!isLoading && cafes?.length === 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
      )}
      <ul className="mt-4 divide-y divide-border">
        {cafes?.map((cafe) => (
          <li key={cafe.id}>
            <Link
              href={`/cafe/${cafe.id}`}
              className="flex gap-3 py-3"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {cafe.photos?.[0]?.url ? (
                  <Image
                    src={cafe.photos[0].url}
                    alt={cafe.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{cafe.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {cafe.address}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('rating', { rating: cafe.avgRating.toFixed(1) })} ·{' '}
                  {t('followers', { count: cafe.followerCount })}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
