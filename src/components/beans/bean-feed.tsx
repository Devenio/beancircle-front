'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Coffee } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Bean, BeanPage } from '@/lib/api/beans';
import type { BeanComposerContext } from './bean-composer';
import { BeanCard } from './bean-card';
import { BeanComposerSheet } from './bean-composer-sheet';

export function BeanCardSkeleton() {
  return (
    <div className="space-y-3 border-b border-border px-4 py-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="ms-[3.125rem] h-16 w-4/5" />
    </div>
  );
}

export function BeanFeed({
  queryKey,
  fetchPage,
  locale,
  emptyTitle,
  emptyBody,
  composerContext,
}: {
  queryKey: readonly unknown[];
  fetchPage: (cursor?: string) => Promise<BeanPage>;
  locale: string;
  emptyTitle?: string;
  emptyBody?: string;
  composerContext?: BeanComposerContext;
}) {
  const t = useTranslations('beans');
  const [quoting, setQuoting] = useState<Bean | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      queryFn: ({ pageParam }) => fetchPage(pageParam ?? undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
    });

  const beans = data?.pages.flatMap((p) => p.data) ?? [];

  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 4 }).map((_, i) => (
          <BeanCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!beans.length) {
    return (
      <Empty className="mx-4 mt-8 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Coffee />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle ?? t('emptyTitle')}</EmptyTitle>
          <EmptyDescription>{emptyBody ?? t('emptyBody')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div>
      {beans.map((bean) => (
        <BeanCard
          key={bean.id}
          bean={bean}
          locale={locale}
          onQuote={setQuoting}
        />
      ))}
      {hasNextPage ? (
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? '…' : t('loadMore')}
          </Button>
        </div>
      ) : null}
      <BeanComposerSheet
        open={!!quoting}
        onOpenChange={(open) => !open && setQuoting(null)}
        locale={locale}
        quotedBean={quoting}
        context={composerContext}
      />
    </div>
  );
}
