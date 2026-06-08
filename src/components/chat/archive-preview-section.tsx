'use client';

import { Archive, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { CompactArchivedPreviewRow } from '@/components/chat/compact-archived-preview-row';
import { ArchiveBulkActionsContextMenu } from '@/components/chat/archive-bulk-actions-context-menu';
import { sortArchivedConversations } from '@/lib/chat-archive';
import type { Conversation } from '@/components/chat/types';
import { cn } from '@/lib/utils';

const PREVIEW_LIMIT = 3;

export function ArchivePreviewSection({
  conversations,
  archivedAt,
  collapsed,
  onCollapsedChange,
  onViewAll,
  onUnarchive,
  onUnarchiveAll,
  onMarkAllRead,
  onDeleteAll,
}: {
  conversations: Conversation[];
  archivedAt: Record<string, number>;
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
  onViewAll: () => void;
  onUnarchive: (id: string) => void;
  onUnarchiveAll: () => void;
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
}) {
  const t = useTranslations('messages');
  const count = conversations.length;
  const sorted = sortArchivedConversations(conversations, archivedAt);
  const preview = sorted.slice(0, PREVIEW_LIMIT);

  return (
    <section className="mx-3 rounded-2xl border border-border/80 bg-muted/30">
      <ArchiveBulkActionsContextMenu
        count={count}
        onUnarchiveAll={onUnarchiveAll}
        onMarkAllRead={onMarkAllRead}
        onDeleteAll={onDeleteAll}
      >
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          className="flex w-full min-h-[52px] items-center gap-3 px-3 py-2.5 text-start active:bg-muted/60"
        >
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Archive className="size-5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">{t('archivePreviewTitle')}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {count === 0 ? t('archivePreviewEmptyHint') : t('archivedEntryHint')}
          </span>
        </span>
        <Badge variant="secondary" className="min-w-6 justify-center rounded-full">
          {count > 99 ? '99+' : count}
        </Badge>
        {collapsed ? (
          <ChevronRight className="size-5 shrink-0 text-muted-foreground rtl:rotate-180" />
        ) : (
          <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
        )}
        </button>
      </ArchiveBulkActionsContextMenu>

      {!collapsed && count > 0 ? (
        <div className="space-y-0.5 border-t border-border/60 px-2 pb-2 pt-1">
          {preview.map((conv) => (
            <CompactArchivedPreviewRow
              key={conv.id}
              conversation={conv}
              onUnarchive={() => onUnarchive(conv.id)}
            />
          ))}
          <button
            type="button"
            onClick={onViewAll}
            className="mt-1 flex w-full min-h-10 items-center justify-center gap-1 rounded-xl text-sm font-medium text-primary active:bg-muted/50"
          >
            {t('viewAllArchived')}
            <ChevronRight className="size-4 rtl:rotate-180" />
          </button>
        </div>
      ) : null}

      {!collapsed && count === 0 ? (
        <button
          type="button"
          onClick={onViewAll}
          className={cn(
            'w-full border-t border-border/60 px-3 py-3 text-center text-sm font-medium text-primary',
            'active:bg-muted/50',
          )}
        >
          {t('viewArchivedChats')}
        </button>
      ) : null}

    </section>
  );
}
