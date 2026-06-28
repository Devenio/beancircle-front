'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Coffee,
  Eye,
  LayoutDashboard,
  Plus,
  QrCode,
  Settings,
  Upload,
} from 'lucide-react';
import { listOwnerCafes, type OwnerCafe } from '@/lib/api/owner';
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
        <h2 className="mb-3 font-semibold">{t('yourCafes')}</h2>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : !cafes?.length ? (
          <EmptyOwnerState />
        ) : (
          <ul className="space-y-3">
            {cafes.map((entry) => (
              <OwnerCafeCard key={entry.cafe.id} entry={entry} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyOwnerState() {
  const t = useTranslations('owner');

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <Coffee className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-semibold">{t('emptyTitle')}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t('emptyDescription')}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button size="sm" render={<Link href="/owner/claim" />}>
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          {t('claimExisting')}
        </Button>
        <Button size="sm" variant="outline" render={<Link href="/cafe-os/new" />}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {t('createNew')}
        </Button>
      </div>
    </div>
  );
}

function OwnerCafeCard({ entry }: { entry: OwnerCafe }) {
  const t = useTranslations('owner');
  const { cafe, role } = entry;
  const isOwner = role === 'OWNER';
  const isUnverified = !cafe.isVerified;

  return (
    <li>
      <Link
        href={`/cafe-os/${cafe.id}`}
        className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/50"
      >
        <div className="flex items-center gap-3">
          {cafe.photos?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cafe.photos[0].url}
              alt=""
              className="h-14 w-14 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
              <Coffee className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 font-semibold">
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
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('role')}: {role}
            </p>
          </div>
        </div>

        {isUnverified && isOwner && (
          <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            {t('unverifiedHint')}
          </div>
        )}

        {isOwner && (
          <div className="mt-3 flex gap-2 border-t border-border pt-3">
            <QuickLink
              icon={LayoutDashboard}
              label={t('dashboard')}
              href={`/cafe-os/${cafe.id}`}
            />
            <QuickLink
              icon={Upload}
              label={t('menu')}
              href={`/cafe-os/${cafe.id}/menu`}
            />
            <QuickLink
              icon={QrCode}
              label={t('qrCodes')}
              href={`/cafe-os/${cafe.id}/qr`}
            />
            <QuickLink
              icon={Settings}
              label={t('settings')}
              href={`/cafe-os/${cafe.id}/profile`}
            />
          </div>
        )}
      </Link>
    </li>
  );
}

function QuickLink({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof Coffee;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}
