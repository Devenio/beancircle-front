'use client';

import { PublicDesignedView } from '@/components/designs/public-designed-view';
import type { CafeMenuData } from '@/components/cafe-menu/types';
import { api } from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

export default function PublicMenuPage() {
  const { slug, locale } = useParams<{ slug: string; locale: string }>();
  const searchParams = useSearchParams();
  const t = useTranslations('cafeMenu');
  const scanned = useRef(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-menu', slug, locale],
    queryFn: () => api<CafeMenuData>(`/menus/public/${slug}`, { locale }),
    retry: false,
  });

  // Fire the scan beacon once per page load, attributing the table/qr code.
  useEffect(() => {
    if (!slug || scanned.current) return;
    scanned.current = true;
    const tableCode = searchParams.get('t');
    api(`/menus/public/${slug}/scan`, {
      method: 'POST',
      body: JSON.stringify(tableCode ? { code: tableCode } : {}),
      locale,
    }).catch(() => {
      // Scan tracking is best-effort; never block the menu.
    });
  }, [slug, searchParams, locale]);

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
    <PublicDesignedView
      menu={data}
      locale={locale}
      labels={{
        viewMenu: t('viewMenu'),
        scrollHint: t('scrollHint'),
        unavailable: t('unavailable'),
        poweredBy: t('poweredBy'),
        off: t('off'),
        calories: t('calories'),
        prepTime: t('prepTime'),
        ingredients: t('ingredients'),
        allergens: t('allergens'),
      }}
      onItemView={(itemId) => {
        api(`/menus/public/${slug}/items/${itemId}/view`, {
          method: 'POST',
          locale,
        }).catch(() => {});
      }}
    />
  );
}
