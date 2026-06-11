'use client';

import { PublicMenuView } from '@/components/cafe-menu/public-menu-view';
import type { CafeMenuData } from '@/components/cafe-menu/types';
import { api } from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function PublicMenuPage() {
  const { slug, locale } = useParams<{ slug: string; locale: string }>();
  const t = useTranslations('cafeMenu');

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-menu', slug, locale],
    queryFn: () => api<CafeMenuData>(`/menus/public/${slug}`, { locale }),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAF7F2]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2C1810] border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#FAF7F2] px-6 text-center">
        <h1 className="font-serif text-2xl text-[#2C1810]">{t('notFound')}</h1>
        <p className="mt-2 text-sm text-[#6B5E54]">{t('notFoundHint')}</p>
      </div>
    );
  }

  return (
    <PublicMenuView
      menu={data}
      locale={locale}
      labels={{
        viewMenu: t('viewMenu'),
        scrollHint: t('scrollHint'),
        unavailable: t('unavailable'),
        poweredBy: t('poweredBy'),
      }}
    />
  );
}
