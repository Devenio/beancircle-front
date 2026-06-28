'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  BadgeCheck,
  Coffee,
  Info,
  Loader2,
  Phone,
  Plus,
  Search,
  Shield,
} from 'lucide-react';
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
  const [selectedCafe, setSelectedCafe] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const { data: cafes, isLoading } = useQuery({
    queryKey: ['unclaimed-cafes', query, locale],
    queryFn: () => listUnclaimedCafes(query, locale),
  });

  const claim = useMutation({
    mutationFn: ({
      cafeId,
      phone: p,
      message: m,
    }: {
      cafeId: string;
      phone?: string;
      message?: string;
    }) => claimCafe(cafeId, { phone: p, message: m }, locale),
    onSuccess: (_data, vars) => setSubmitted(vars.cafeId),
  });

  if (submitted) {
    const cafeName = cafes?.find((c) => c.id === submitted)?.name ?? '';
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
          </div>
        </header>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
              <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                {t('claimSubmittedTitle')}
              </p>
              {cafeName && (
                <p className="text-sm text-muted-foreground">{cafeName}</p>
              )}
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>{t('weWillCall')}</p>
            <div className="flex items-start gap-2 rounded-lg bg-background/50 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p>{t('claimNextSteps')}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            render={<Link href="/owner" />}
          >
            {t('backToCafes')}
          </Button>
        </div>
      </div>
    );
  }

  if (selectedCafe) {
    return (
      <div className="space-y-5 p-4 pb-24">
        <header className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedCafe(null)}
            aria-label={t('back')}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{t('verifyOwnership')}</h1>
            <p className="text-sm text-muted-foreground">{selectedCafe.name}</p>
          </div>
        </header>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <p>{t('verificationDescription')}</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                <Phone className="mr-1.5 inline h-3.5 w-3.5" />
                {t('contactPhone')}
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('phonePlaceholder')}
                type="tel"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('phoneHint')}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {t('additionalInfo')}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('messagePlaceholder')}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <Button
            onClick={() =>
              claim.mutate({
                cafeId: selectedCafe.id,
                phone: phone || undefined,
                message: message || undefined,
              })
            }
            disabled={claim.isPending || !phone.trim()}
            className="w-full"
          >
            {claim.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('submitClaim')}
          </Button>

          {claim.isError && (
            <p className="text-sm text-destructive">
              {(claim.error as Error).message}
            </p>
          )}
        </div>
      </div>
    );
  }

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
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : !cafes?.length ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <Coffee className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('noUnclaimed')}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {cafes.map((cafe) => (
              <li
                key={cafe.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-accent/50"
              >
                {cafe.photos?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cafe.photos[0].url}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
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
                  onClick={() => setSelectedCafe({ id: cafe.id, name: cafe.name })}
                >
                  {t('thisIsMine')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="rounded-xl border border-dashed border-border p-4 text-center">
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
    </div>
  );
}
