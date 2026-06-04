'use client';

import { Archive } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export function ArchivedEmptyPanel({ query, filterActive }: { query: string; filterActive: boolean }) {
  const t = useTranslations('messages');
  const filtered = query || filterActive;

  return (
    <Empty className="border-0 px-6 py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Archive />
        </EmptyMedia>
        <EmptyTitle className="text-lg">
          {filtered ? t('archivedNoResults') : t('archivedEmptyTitle')}
        </EmptyTitle>
        <EmptyDescription className="max-w-xs">
          {filtered ? t('archivedNoResultsBody') : t('archivedEmptyBody')}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
