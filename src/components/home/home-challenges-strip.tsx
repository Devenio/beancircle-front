'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { ChallengesSection } from '@/components/community/challenges-section';
import { EventsSection } from '@/components/community/events-section';

const STORAGE_KEY = 'beancircle:homeChallenges:collapsed';

/**
 * Collapsible "Active Challenges" strip on the home feed — surfaces the
 * challenges + events that used to live on the (now removed) Community tab.
 * Collapsed state persists in localStorage.
 */
export function HomeChallengesStrip({ locale }: { locale: string }) {
  const t = useTranslations('challenges');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  };

  const { data: me } = useQuery({
    queryKey: ['me', locale],
    queryFn: () => api<{ cityId?: string }>('/users/me', { locale }),
  });

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={t('toggleStrip')}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-semibold"
      >
        <span>{t('activeStrip')}</span>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform',
            collapsed && 'ltr:-rotate-90 rtl:rotate-90',
          )}
        />
      </button>
      {!collapsed ? (
        <div>
          <ChallengesSection locale={locale} cityId={me?.cityId} />
          <EventsSection locale={locale} cityId={me?.cityId} />
        </div>
      ) : null}
    </div>
  );
}
