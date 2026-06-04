'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ChatBottomSheet } from '@/components/chat/chat-bottom-sheet';
import type { ArchiveFilterId } from '@/lib/chat-archive';
import { cn } from '@/lib/utils';

const FILTERS: ArchiveFilterId[] = ['all', 'unread', 'muted', 'pinned', 'recent'];

export function ArchiveFilterSheet({
  open,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ArchiveFilterId;
  onChange: (filter: ArchiveFilterId) => void;
}) {
  const t = useTranslations('messages');

  return (
    <ChatBottomSheet open={open} onOpenChange={onOpenChange} title={t('archiveFilters')} description={t('archiveFiltersHint')}>
      <div className="flex flex-col gap-1 px-2 pb-4">
        {FILTERS.map((id) => (
          <Button
            key={id}
            type="button"
            variant="ghost"
            className={cn(
              'h-11 justify-start rounded-xl px-3 text-base',
              value === id && 'bg-muted font-semibold',
            )}
            onClick={() => {
              onChange(id);
              onOpenChange(false);
            }}
          >
            {t(`archiveFilter.${id}`)}
          </Button>
        ))}
      </div>
    </ChatBottomSheet>
  );
}
