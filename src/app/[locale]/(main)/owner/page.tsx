'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { listOwnerCafes } from '@/lib/api/owner';
import { Button } from '@/components/ui/button';
import { VerifiedBadge, UnverifiedBadge } from '@/components/cafe/verified-badge';
import { Link } from '@/i18n/navigation';

export default function OwnerDashboardPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations('owner');

  const { data: cafes, isLoading } = useQuery({
    queryKey: ['owner-cafes', locale],
    queryFn: () => listOwnerCafes(locale),
  });

  return (
    <div className="space-y-6 p-4 pb-24">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button type="button" size="sm" render={<Link href="/owner/claim" />}>
          <Plus className="h-4 w-4" />
          {t('addCafe')}
        </Button>
      </header>

      <section>
        <h2 className="mb-2 font-semibold">{t('yourCafes')}</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : !cafes?.length ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              render={<Link href="/owner/claim" />}
            >
              <Plus className="h-4 w-4" />
              {t('addCafe')}
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {cafes.map(({ cafe }) => (
              <li key={cafe.id}>
                <Link
                  href={`/cafe-os/${cafe.id}`}
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
                    <p className="flex items-center gap-1.5 font-medium">
                      {cafe.name}
                      {cafe.isVerified ? (
                        <VerifiedBadge />
                      ) : (
                        <UnverifiedBadge label={t('notVerified')} />
                      )}
                    </p>
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
