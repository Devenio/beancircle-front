'use client';

import { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DateSeparator } from '@/components/chat/date-separator';
import { MessageGroup } from '@/components/chat/message-group';
import type { ChatMessage, PendingMessage } from '@/components/chat/types';
import type { MessageDateGroup } from '@/components/chat/utils';

export type ChatVirtualRow =
  | { kind: 'date'; id: string; date: string }
  | { kind: 'unread'; id: string }
  | {
      kind: 'group';
      id: string;
      group: MessageDateGroup['senderGroups'][number];
      date: string;
    };

type VirtualMessageListProps = {
  groupedMessages: MessageDateGroup[];
  firstUnreadId?: string | null;
  listRef: React.RefObject<HTMLDivElement | null>;
  currentUserId?: string;
  currentUsername?: string | null;
  peerId?: string;
  peerAvatar?: string | null;
  peerName?: string | null;
  peerOnline?: boolean;
  highlightMessageId?: string;
  onReply: (msg: ChatMessage | PendingMessage) => void;
  onOpenActions: (msg: ChatMessage | PendingMessage) => void;
  onCopy: (msg: ChatMessage | PendingMessage) => void;
  onForward: (msg: ChatMessage | PendingMessage) => void;
  onEdit: (msg: ChatMessage | PendingMessage) => void;
  onDelete: (msg: ChatMessage | PendingMessage) => void;
  onPin: (msg: ChatMessage | PendingMessage) => void;
  onReact: (msg: ChatMessage | PendingMessage, emoji: string) => void;
  onOpenMedia?: (msg: ChatMessage | PendingMessage) => void;
  unreadLabel: string;
  loadingOlder?: boolean;
};

export function buildVirtualRows(
  groupedMessages: MessageDateGroup[],
  firstUnreadId?: string | null,
): ChatVirtualRow[] {
  const rows: ChatVirtualRow[] = [];
  let unreadInserted = !firstUnreadId;

  for (const dateGroup of groupedMessages) {
    rows.push({ kind: 'date', id: `date-${dateGroup.date}`, date: dateGroup.date });
    for (const senderGroup of dateGroup.senderGroups) {
      const hasUnread = senderGroup.messages.some(
        (msg) => !('clientId' in msg) && msg.id === firstUnreadId,
      );
      if (hasUnread && !unreadInserted) {
        rows.push({ kind: 'unread', id: 'unread-divider' });
        unreadInserted = true;
      }
      rows.push({
        kind: 'group',
        id: `group-${dateGroup.date}-${senderGroup.senderId}-${senderGroup.messages[0]?.id ?? 'x'}`,
        group: senderGroup,
        date: dateGroup.date,
      });
    }
  }
  return rows;
}

export function VirtualMessageList({
  groupedMessages,
  firstUnreadId,
  listRef,
  currentUserId,
  currentUsername,
  peerId,
  peerAvatar,
  peerName,
  peerOnline,
  highlightMessageId,
  onReply,
  onOpenActions,
  onCopy,
  onForward,
  onEdit,
  onDelete,
  onPin,
  onReact,
  onOpenMedia,
  unreadLabel,
  loadingOlder,
}: VirtualMessageListProps) {
  const rows = useMemo(
    () => buildVirtualRows(groupedMessages, firstUnreadId),
    [groupedMessages, firstUnreadId],
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => listRef.current,
    estimateSize: (index) => {
      const row = rows[index];
      if (row?.kind === 'date') return 36;
      if (row?.kind === 'unread') return 40;
      const count = row?.kind === 'group' ? row.group.messages.length : 1;
      return 56 + count * 52;
    },
    overscan: 10,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      className="relative w-full pb-2"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {loadingOlder ? (
        <div className="absolute left-0 top-0 z-10 flex w-full justify-center py-2">
          <span className="rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow">
            …
          </span>
        </div>
      ) : null}
      {items.map((virtualRow) => {
        const row = rows[virtualRow.index];
        if (!row) return null;
        return (
          <div
            key={row.id}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className="absolute left-0 top-0 w-full px-0"
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            {row.kind === 'date' ? (
              <DateSeparator date={row.date} />
            ) : row.kind === 'unread' ? (
              <div className="my-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-primary/40" />
                <span className="text-xs font-medium text-primary">{unreadLabel}</span>
                <div className="h-px flex-1 bg-primary/40" />
              </div>
            ) : (
              <MessageGroup
                group={row.group}
                currentUserId={currentUserId}
                currentUsername={currentUsername}
                peerId={peerId}
                peerAvatar={peerAvatar}
                peerName={peerName}
                peerOnline={peerOnline}
                highlightMessageId={highlightMessageId}
                unreadMessageId={firstUnreadId}
                onReply={onReply}
                onOpenActions={onOpenActions}
                onCopy={onCopy}
                onForward={onForward}
                onEdit={onEdit}
                onDelete={onDelete}
                onPin={onPin}
                onReact={onReact}
                onOpenMedia={onOpenMedia}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
