'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Coffee, Plus, Search } from 'lucide-react';
import { listUnclaimedCafes, claimCafe } from '@/lib/api/owner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useRouter } from '@/i18n/navigation';

export default function OwnerClaimPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations('owner');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);

  const { data: cafes, isLoading } = useQuery({
    queryKey: ['unclaimed-cafes', query, locale],
    queryFn: () => listUnclaimedCafes(query, locale),
  });

  const claim = useMutation({
    mutationFn: (cafeId: string) => claimCafe(cafeId, {}, locale),
    onSuccess: (_data, cafeId) => setSubmitted(cafeId),
  });

  return (
    <div className="space-y-5 p-4 pb-24">
      <header className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/owner" />}
          aria-label={t('back')}
        >
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{t('addCafe')}</h1>
          <p className="text-sm text-muted-foreground">{t('addCafeHint')}</p>
        </div>
      </header>

      {submitted ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {t('claimSubmittedTitle')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t('weWillCall')}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            render={<Link href="/owner" />}
          >
            {t('backToCafes')}
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="ps-9"
            />
          </div>

          <section className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t('loading')}</p>
            ) : !cafes?.length ? (
              <p className="text-sm text-muted-foreground">{t('noUnclaimed')}</p>
            ) : (
              <ul className="space-y-2">
                {cafes.map((cafe) => (
                  <li
                    key={cafe.id}
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
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                        <Coffee className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{cafe.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {cafe.address}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => claim.mutate(cafe.id)}
                      disabled={claim.isPending}
                    >
                      {t('thisIsMine')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="rounded-xl border border-dashed p-4 text-center">
            <p className="text-sm text-muted-foreground">{t('notInList')}</p>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="mt-3"
              onClick={() => router.push('/cafe-os/new')}
            >
              <Plus className="h-4 w-4" />
              {t('createOwn')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
