'use client';

import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { DiscoverTabs } from '@/components/discover/discover-tabs';

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations('discover.people');
  const isPeople = pathname.includes('/discover/people');

  return (
    <div className={isPeople ? 'px-2 pt-2' : 'p-4'}>
      <DiscoverTabs />
      {isPeople ? (
        <p className="mb-2 px-2 text-center text-xs text-muted-foreground">{t('galaxyHint')}</p>
      ) : null}
      {children}
    </div>
  );
}
