'use client';

import { ArchiveRestore, CheckCheck, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { haptic } from '@/lib/mobile/haptics';

export function ArchiveBulkActionsContextMenu({
  children,
  count,
  onUnarchiveAll,
  onMarkAllRead,
  onDeleteAll,
}: {
  children: React.ReactNode;
  count: number;
  onUnarchiveAll: () => void;
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
}) {
  const t = useTranslations('messages');

  if (count === 0) return <>{children}</>;

  return (
    <ContextMenu>
      <ContextMenuTrigger className="block">{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem
          onClick={() => {
            haptic('light');
            onUnarchiveAll();
          }}
        >
          <ArchiveRestore />
          {t('unarchiveAll')}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            haptic('light');
            onMarkAllRead();
          }}
        >
          <CheckCheck />
          {t('markAllRead')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={() => {
            haptic('light');
            onDeleteAll();
          }}
        >
          <Trash2 />
          {t('deleteAllArchived')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
