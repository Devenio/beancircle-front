'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { PassportContent } from './passport-content';

function PassportFallback() {
  const t = useTranslations('passport');
  return <p className="p-8 text-center text-sm text-muted-foreground">{t('loading')}</p>;
}

export default function PassportPage() {
  return (
    <Suspense fallback={<PassportFallback />}>
      <PassportContent />
    </Suspense>
  );
}
