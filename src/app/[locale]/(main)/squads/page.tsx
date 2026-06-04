'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Users } from 'lucide-react';
import { useState } from 'react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  listMySquads,
  listSquads,
  type SquadCategory,
  type SquadSummary,
} from '@/lib/api/squads';

const CATEGORIES: SquadCategory[] = [
  'GAMERS',
  'COFFEE_LOVERS',
  'ARTISTS',
  'STUDENTS',
  'DEVELOPERS',
  'BOOK_CLUB',
];

export default function SquadsPage() {
  const t = useTranslations('squads');
  const { locale } = useParams<{ locale: string }>();
  const [tab, setTab] = useState<'discover' | 'mine'>('discover');
  const [category, setCategory] = useState<SquadCategory | null>(null);

  const discoverQuery = useQuery({
    queryKey: ['squads', locale, category],
    queryFn: () => listSquads(locale, category ? { category } : {}),
    enabled: tab === 'discover',
  });
  const mineQuery = useQuery({
    queryKey: ['squads-mine', locale],
    queryFn: () => listMySquads(locale),
    enabled: tab === 'mine',
  });

  const isLoading = tab === 'discover' ? discoverQuery.isLoading : mineQuery.isLoading;
  const squads = tab === 'discover' ? discoverQuery.data : mineQuery.data;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-bold leading-none">{t('title')}</h1>
        <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
        <div className="mt-3 flex gap-1 rounded-full bg-muted p-1">
          {(['discover', 'mine'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                tab === key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground',
              )}
            >
              {key === 'discover' ? t('discover') : t('mine')}
            </button>
          ))}
        </div>
      </header>

      {tab === 'discover' ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-border px-4 py-3">
          <CatChip active={category === null} onClick={() => setCategory(null)}>
            {t('discover')}
          </CatChip>
          {CATEGORIES.map((c) => (
            <CatChip
              key={c}
              active={category === c}
              onClick={() => setCategory(c)}
            >
              {t(`categories.${c}`)}
            </CatChip>
          ))}
        </div>
      ) : null}

      <div className="space-y-3 p-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))
        ) : !squads?.length ? (
          <Empty className="mt-16 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('emptyBody')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          squads.map((sq) => <SquadRow key={sq.id} squad={sq} />)
        )}
      </div>
    </div>
  );
}

function SquadRow({ squad }: { squad: SquadSummary }) {
  const t = useTranslations('squads');
  return (
    <Link
      href={`/squads/${squad.id}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 text-2xl">
        {squad.emoji ?? '☕'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{squad.name}</p>
        <p className="text-xs text-muted-foreground">
          {t(`categories.${squad.category}`)} ·{' '}
          {t('members', { count: squad.memberCount })}
        </p>
      </div>
      {squad.myRole ? (
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {t('joined')}
        </span>
      ) : null}
    </Link>
  );
}

function CatChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}
