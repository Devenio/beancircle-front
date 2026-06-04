'use client';

import { Archive, MessageCircle, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';

export function MessagesEmptyState({
  query,
  archivedCount,
  onViewArchived,
}: {
  query: string;
  archivedCount: number;
  onViewArchived: () => void;
}) {
  const t = useTranslations('messages');

  if (query) {
    return (
      <Empty className="border-0 px-6 py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageCircle />
          </EmptyMedia>
          <EmptyTitle className="text-lg">{t('noResults')}</EmptyTitle>
          <EmptyDescription className="max-w-xs">{t('noResultsBody')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Empty className="border-0 px-6 py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageCircle />
        </EmptyMedia>
        <EmptyTitle className="text-lg">{t('emptyListTitle')}</EmptyTitle>
        <EmptyDescription className="max-w-xs">{t('emptyListActiveHint')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="mt-4 flex w-full max-w-xs flex-col gap-2">
        <Link
          href="/discover"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <UserPlus className="size-4" />
          {t('startNewChat')}
        </Link>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full gap-2"
          onClick={onViewArchived}
        >
          <Archive className="size-4" />
          {archivedCount > 0
            ? t('viewArchivedChatsCount', { count: archivedCount })
            : t('viewArchivedChats')}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
