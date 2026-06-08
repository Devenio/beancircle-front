'use client';

import { memo, useCallback, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChatOlderMessagesSkeleton } from '@/components/chat/chat-messages-skeleton';
import { DateSeparator } from '@/components/chat/date-separator';
import type { ChatMessage, PendingMessage } from '@/components/chat/types';
import type { MessageDateGroup } from '@/components/chat/utils';
import {
  appendSenderGroupRows,
  estimateMessageRowHeight,
  VirtualMessageRow,
  type MessageVirtualRow,
  type VirtualMessageListHandlers,
} from '@/components/chat/virtual-message-row';

export type ChatVirtualRow =
  | { kind: 'date'; id: string; date: string }
  | { kind: 'unread'; id: string }
  | MessageVirtualRow;

export type VirtualMessageListController = {
  scrollToMessage: (messageId: string) => boolean;
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
  flashMessageId?: string;
  scrollControllerRef?: React.RefObject<VirtualMessageListController | null>;
  unreadLabel: string;
  loadingOlder?: boolean;
  loadingOlderLabel?: string;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  handlersRef: React.RefObject<VirtualMessageListHandlers>;
};

export function buildVirtualRows(
  groupedMessages: MessageDateGroup[],
  firstUnreadId?: string | null,
): ChatVirtualRow[] {
  const rows: ChatVirtualRow[] = [];
  const unreadState = { firstUnreadId, inserted: !firstUnreadId };

  for (const dateGroup of groupedMessages) {
    rows.push({ kind: 'date', id: `date-${dateGroup.date}`, date: dateGroup.date });
    for (const senderGroup of dateGroup.senderGroups) {
      appendSenderGroupRows(rows, senderGroup, unreadState);
    }
  }

  return rows;
}

function VirtualMessageListInner({
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
  flashMessageId,
  scrollControllerRef,
  unreadLabel,
  loadingOlder,
  loadingOlderLabel,
  selectionMode = false,
  selectedIds,
  handlersRef,
}: VirtualMessageListProps) {
  const rows = useMemo(
    () => buildVirtualRows(groupedMessages, firstUnreadId),
    [groupedMessages, firstUnreadId],
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => listRef.current,
    getItemKey: (index) => rows[index]?.id ?? index,
    anchorTo: 'end',
    followOnAppend: true,
    scrollEndThreshold: 80,
    directDomUpdates: true,
    directDomUpdatesMode: 'transform',
    estimateSize: (index) => {
      const row = rows[index];
      if (row?.kind === 'date') return 36;
      if (row?.kind === 'unread') return 40;
      if (row?.kind === 'message') return estimateMessageRowHeight(row.message);
      return 64;
    },
    overscan: 4,
  });

  const items = virtualizer.getVirtualItems();

  const scrollToMessage = useCallback(
    (messageId: string) => {
      const index = rows.findIndex(
        (row) =>
          row.kind === 'message' &&
          !('clientId' in row.message) &&
          row.message.id === messageId,
      );
      if (index === -1) return false;

      virtualizer.scrollToIndex(index, { align: 'center', behavior: 'smooth' });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = listRef.current?.querySelector(`[data-message-id="${messageId}"]`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });
      return true;
    },
    [rows, virtualizer, listRef],
  );

  useEffect(() => {
    if (!scrollControllerRef) return;
    scrollControllerRef.current = { scrollToMessage };
  }, [scrollControllerRef, scrollToMessage]);

  return (
    <div
      ref={virtualizer.containerRef}
      className="relative w-full pb-2"
      style={{ height: `${virtualizer.getTotalSize()}px` }}
    >
      {loadingOlder ? (
        <div className="pointer-events-none absolute left-0 top-0 z-10 w-full px-0">
          <ChatOlderMessagesSkeleton label={loadingOlderLabel} />
        </div>
      ) : null}
      {items.map((virtualRow) => {
        const row = rows[virtualRow.index];
        if (!row) return null;

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className="absolute top-0 left-0 w-full px-0 will-change-transform"
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
              <VirtualMessageRow
                message={row.message}
                isMine={row.isMine}
                position={row.position}
                showAvatar={row.showAvatar}
                showFooter={row.showFooter}
                currentUserId={currentUserId}
                currentUsername={currentUsername}
                peerId={peerId}
                peerAvatar={peerAvatar}
                peerName={peerName}
                peerOnline={peerOnline}
                highlightMessageId={highlightMessageId}
                flashMessageId={flashMessageId}
                unreadMessageId={firstUnreadId}
                selectionMode={selectionMode}
                selected={
                  !('clientId' in row.message) && selectedIds
                    ? selectedIds.has(row.message.id)
                    : false
                }
                handlersRef={handlersRef}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export const VirtualMessageList = memo(VirtualMessageListInner, (prev, next) =>
  prev.groupedMessages === next.groupedMessages &&
  prev.firstUnreadId === next.firstUnreadId &&
  prev.listRef === next.listRef &&
  prev.currentUserId === next.currentUserId &&
  prev.currentUsername === next.currentUsername &&
  prev.peerId === next.peerId &&
  prev.peerAvatar === next.peerAvatar &&
  prev.peerName === next.peerName &&
  prev.peerOnline === next.peerOnline &&
  prev.highlightMessageId === next.highlightMessageId &&
  prev.flashMessageId === next.flashMessageId &&
  prev.scrollControllerRef === next.scrollControllerRef &&
  prev.unreadLabel === next.unreadLabel &&
  prev.loadingOlder === next.loadingOlder &&
  prev.loadingOlderLabel === next.loadingOlderLabel &&
  prev.selectionMode === next.selectionMode &&
  prev.selectedIds === next.selectedIds &&
  prev.handlersRef === next.handlersRef,
);

export type { VirtualMessageListHandlers };
