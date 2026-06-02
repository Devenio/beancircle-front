'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

type ComingSoonShellProps = {
  titleKey: string;
  bodyKey: string;
  namespace: 'passport' | 'community';
};

export function ComingSoonShell({
  titleKey,
  bodyKey,
  namespace,
}: ComingSoonShellProps) {
  const t = useTranslations(namespace);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold">{t(titleKey)}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t(bodyKey)}</p>
      <Link href="/discover">
        <Button type="button">{t('ctaDiscover')}</Button>
      </Link>
      <Link href="/cafes">
        <Button type="button" variant="outline">
          {t('ctaCafes')}
        </Button>
      </Link>
    </div>
  );
}
