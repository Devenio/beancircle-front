'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cafeOsApi } from '@/lib/api/cafe-os';
import { Link } from '@/i18n/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ChevronRight, Crown, Search, Users } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function CustomersPage() {
  const t = useTranslations('cafeOs.customers');
  const format = useFormatter();
  const { cafeId } = useParams<{ cafeId: string }>();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'recent' | 'visits'>('recent');

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['cafe-customers', cafeId, q, sort],
      queryFn: ({ pageParam }) =>
        cafeOsApi.customers(cafeId, {
          q: q || undefined,
          sort,
          cursor: pageParam as string | undefined,
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
    });

  const customers = data?.pages.flatMap((p) => p.data) ?? [];
  const totals = data?.pages[0]?.totals;

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">{t('title')}</h1>

      {totals ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold">{totals.customers}</p>
            <p className="text-xs text-muted-foreground">{t('totalCustomers')}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold">{totals.vips}</p>
            <p className="text-xs text-muted-foreground">{t('vips')}</p>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            placeholder={t('searchPlaceholder')}
            className="ps-9"
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setSort((s) => (s === 'recent' ? 'visits' : 'recent'))}
          className="rounded-lg border border-border px-3 text-xs font-medium"
        >
          {sort === 'recent' ? t('sortRecent') : t('sortVisits')}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : !customers.length ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/cafe-os/${cafeId}/customers/${c.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:bg-accent"
            >
              <Avatar className="h-11 w-11">
                <AvatarImage src={c.user.avatarUrl ?? undefined} />
                <AvatarFallback>{(c.user.name ?? c.user.username ?? '?')[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <span className="truncate">{c.user.name || c.user.username}</span>
                  {c.isVip ? <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" /> : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('visitMeta', {
                    visits: c.visitCount,
                    last: format.relativeTime(new Date(c.lastVisitAt)),
                  })}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180" />
            </Link>
          ))}
          {hasNextPage ? (
            <Button
              variant="outline"
              className="w-full"
              disabled={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              {t('loadMore')}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
