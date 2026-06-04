'use client';

import { ArchiveRestore, CheckCheck, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ChatBottomSheet } from '@/components/chat/chat-bottom-sheet';
import { cn } from '@/lib/utils';

export function ArchiveBulkActionsSheet({
  open,
  onOpenChange,
  count,
  onUnarchiveAll,
  onMarkAllRead,
  onDeleteAll,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onUnarchiveAll: () => void;
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
}) {
  const t = useTranslations('messages');

  const actions = [
    { icon: ArchiveRestore, label: t('unarchiveAll'), onClick: onUnarchiveAll },
    { icon: CheckCheck, label: t('markAllRead'), onClick: onMarkAllRead },
    { icon: Trash2, label: t('deleteAllArchived'), onClick: onDeleteAll, destructive: true },
  ];

  return (
    <ChatBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('archiveBulkActions')}
      description={t('archiveBulkActionsDesc', { count })}
    >
      <div className="flex flex-col gap-1 px-2 pb-4">
        {actions.map(({ icon: Icon, label, onClick, destructive }) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            className="h-12 justify-start gap-3 rounded-xl px-3 text-base"
            onClick={() => {
              onClick();
              onOpenChange(false);
            }}
          >
            <Icon className={cn('size-5', destructive && 'text-destructive')} />
            <span className={destructive ? 'text-destructive' : undefined}>{label}</span>
          </Button>
        ))}
      </div>
    </ChatBottomSheet>
  );
}
