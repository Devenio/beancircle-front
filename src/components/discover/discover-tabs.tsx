'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function DiscoverTabs() {
  const t = useTranslations('discover');
  const pathname = usePathname();
  const isPeople = pathname.includes('/discover/people');
  const isPlaces = pathname.includes('/discover/places');

  return (
    <div className="mb-4 flex gap-2 rounded-xl bg-muted/60 p-1">
      <Tab href="/discover/people" active={isPeople || (!isPeople && !isPlaces)}>
        {t('tabs.people')}
      </Tab>
      <Tab href="/discover/places" active={isPlaces}>
        {t('tabs.places')}
      </Tab>
    </div>
  );
}

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors',
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
      )}
    >
      {children}
    </Link>
  );
}
