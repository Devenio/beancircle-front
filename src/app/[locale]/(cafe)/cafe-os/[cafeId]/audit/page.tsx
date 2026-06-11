'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cafeOsApi } from '@/lib/api/cafe-os';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function AuditLogPage() {
  const t = useTranslations('cafeOs');
  const format = useFormatter();
  const { cafeId } = useParams<{ cafeId: string }>();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['cafe-audit', cafeId],
      queryFn: ({ pageParam }) =>
        cafeOsApi.auditLog(cafeId, pageParam as string | undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
    });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  const entries = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">{t('more.audit')}</h1>
      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t('audit.empty')}
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={entry.actor?.avatarUrl ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {(entry.actor?.username ?? 'S')[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">
                    {entry.actor?.name || entry.actor?.username || 'System'}
                  </span>{' '}
                  <span className="text-muted-foreground">{entry.action}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {format.dateTime(new Date(entry.createdAt), {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      {hasNextPage && (
        <Button
          variant="outline"
          className="w-full"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          {t('audit.loadMore')}
        </Button>
      )}
    </div>
  );
}
