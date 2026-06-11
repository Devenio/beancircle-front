'use client';

import { Link, useRouter } from '@/i18n/navigation';
import { useIdentityStore } from '@/stores/identity-store';
import {
  CalendarDays,
  ChartNoAxesColumn,
  ChevronRight,
  Gift,
  LayoutGrid,
  QrCode,
  ScrollText,
  Store,
  UserRound,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function MorePage() {
  const t = useTranslations('cafeOs');
  const { cafeId } = useParams<{ cafeId: string }>();
  const router = useRouter();
  const switchToPersonal = useIdentityStore((s) => s.switchToPersonal);
  const base = `/cafe-os/${cafeId}`;

  const items = [
    { href: `${base}/profile`, icon: Store, label: t('more.profile') },
    { href: `${base}/staff`, icon: Users, label: t('more.staff') },
    { href: `${base}/qr`, icon: QrCode, label: t('more.qr') },
    { href: `${base}/tables`, icon: LayoutGrid, label: t('more.tables') },
    { href: `${base}/loyalty`, icon: Gift, label: t('more.loyalty') },
    { href: `${base}/analytics`, icon: ChartNoAxesColumn, label: t('more.analytics') },
    { href: `${base}/events`, icon: CalendarDays, label: t('more.events') },
    { href: `${base}/audit`, icon: ScrollText, label: t('more.audit') },
  ];

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold">{t('nav.more')}</h1>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-accent ${
                i > 0 ? 'border-t border-border' : ''
              }`}
            >
              <Icon className="h-5 w-5 text-primary" />
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          switchToPersonal();
          router.push('/');
        }}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 transition hover:bg-accent"
      >
        <UserRound className="h-5 w-5 text-muted-foreground" />
        <span className="flex-1 text-start text-sm font-medium">
          {t('more.backToPersonal')}
        </span>
      </button>
    </div>
  );
}
