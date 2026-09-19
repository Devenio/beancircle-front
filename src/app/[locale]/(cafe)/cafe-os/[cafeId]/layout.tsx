'use client';

import { IdentityPill } from '@/components/cafe-os/identity-switcher';
import { Link, usePathname } from '@/i18n/navigation';
import { getSocket } from '@/lib/realtime/socket';
import { cafeOsApi } from '@/lib/api/cafe-os';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  ChartNoAxesColumn,
  Clock,
  LayoutDashboard,
  Megaphone,
  MenuSquare,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function CafeOsShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('cafeOs');
  const { cafeId } = useParams<{ cafeId: string }>();
  const pathname = usePathname();
  const base = `/cafe-os/${cafeId}`;

  const { data: cafe } = useQuery({
    queryKey: ['cafe-os-cafe', cafeId],
    queryFn: () => cafeOsApi.getCafe(cafeId),
    enabled: !!cafeId,
  });
  const unverified = cafe ? !cafe.isVerified : false;

  // Join the cafe's realtime room for live dashboard updates.
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !cafeId) return;
    const join = () => socket.emit('cafe:join', cafeId);
    join();
    socket.on('connect', join);
    return () => {
      socket.off('connect', join);
      socket.emit('cafe:leave', cafeId);
    };
  }, [cafeId]);

  const tabs = [
    { href: base, icon: LayoutDashboard, label: t('nav.dashboard'), exact: true },
    { href: `${base}/menu`, icon: MenuSquare, label: t('nav.menu') },
    { href: `${base}/customers`, icon: Users, label: t('nav.customers') },
    { href: `${base}/marketing`, icon: Megaphone, label: t('nav.marketing') },
    { href: `${base}/more`, icon: ChartNoAxesColumn, label: t('nav.more') },
  ];

  const isPoster = pathname.includes('/qr/poster/');

  if (isPoster) return <>{children}</>;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur-md">
        <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t('cafeMode')}
        </span>
        <IdentityPill />
      </header>

      {unverified ? (
        <div className="flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-700 dark:text-amber-400">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t('unverified.title')}</p>
            <p className="text-xs opacity-90">{t('unverified.body')}</p>
          </div>
        </div>
      ) : null}

      <div className="flex-1 pb-[calc(5.25rem+env(safe-area-inset-bottom))]">
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="flex items-stretch justify-around">
          {tabs.map((tab) => {
            const active = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
