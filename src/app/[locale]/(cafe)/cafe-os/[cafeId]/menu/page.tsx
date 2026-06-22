'use client';

import { MenuBuilder } from '@/components/cafe-os/menu/menu-builder';
import { MenuDesigner } from '@/components/cafe-os/menu/menu-designer';
import { CafeDesignPicker } from '@/components/cafe-os/menu/cafe-design-picker';
import { MenuQrCard } from '@/components/cafe-os/menu/menu-qr-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import type { CafeMenuData } from '@/components/cafe-menu/types';
import { cafeOsApi } from '@/lib/api/cafe-os';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function MenuBuilderPage() {
  const t = useTranslations('cafeOs.menu');
  const locale = useLocale();
  const { cafeId } = useParams<{ cafeId: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'builder' | 'design'>('builder');

  const { data: menu, isLoading } = useQuery({
    queryKey: ['cafe-menu', cafeId],
    queryFn: () => cafeOsApi.menu(cafeId),
  });

  const publishMutation = useMutation({
    mutationFn: (isPublished: boolean) =>
      cafeOsApi.updateMenuSettings(cafeId, { isPublished }),
    onMutate: async (isPublished) => {
      await qc.cancelQueries({ queryKey: ['cafe-menu', cafeId] });
      qc.setQueryData<CafeMenuData>(['cafe-menu', cafeId], (prev) =>
        prev ? { ...prev, isPublished } : prev,
      );
    },
    onError: () => qc.invalidateQueries({ queryKey: ['cafe-menu', cafeId] }),
  });

  if (isLoading || !menu) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        {menu.isPublished && menu.slug ? (
          <a
            href={`/${locale}/m/${menu.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary"
          >
            {t('viewLive')}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
        <div>
          <p className="text-sm font-medium">{t('published')}</p>
          <p className="text-xs text-muted-foreground">
            {menu.isPublished ? t('publishedHint') : t('unpublishedHint')}
          </p>
        </div>
        <Switch
          checked={menu.isPublished}
          onCheckedChange={(c) => publishMutation.mutate(c)}
        />
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-accent p-1">
        {(['builder', 'design'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              tab === id ? 'bg-background shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {t(`tabs.${id}`)}
          </button>
        ))}
      </div>

      {tab === 'builder' ? (
        <>
          <MenuBuilder menu={menu} cafeId={cafeId} locale={locale} />
          <MenuQrCard
            slug={menu.slug}
            isPublished={menu.isPublished}
            cafeName={menu.cafe?.name}
            locale={locale}
          />
        </>
      ) : (
        <div className="space-y-4">
          <CafeDesignPicker cafeId={cafeId} />
          <MenuDesigner menu={menu} cafeId={cafeId} />
        </div>
      )}
    </div>
  );
}
