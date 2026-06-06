'use client';

import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MessageBubble } from '@/components/chat/message-bubble';
import { UserAvatar } from '@/components/chat/user-avatar';
import { MessageStatusIcon } from '@/components/chat/message-status';
import type { ChatMessage, PendingMessage } from '@/components/chat/types';
import {
  formatTime,
  getDeliveryStatus,
  getGroupPosition,
  type MessageSenderGroup,
} from '@/components/chat/utils';

export type VirtualMessageListHandlers = {
  onReply: (msg: ChatMessage | PendingMessage) => void;
  onOpenActions: (msg: ChatMessage | PendingMessage) => void;
  onCopy: (msg: ChatMessage | PendingMessage) => void;
  onForward: (msg: ChatMessage | PendingMessage) => void;
  onEdit: (msg: ChatMessage | PendingMessage) => void;
  onDelete: (msg: ChatMessage | PendingMessage) => void;
  onPin: (msg: ChatMessage | PendingMessage) => void;
  onReact: (msg: ChatMessage | PendingMessage, emoji: string) => void;
  onOpenMedia?: (msg: ChatMessage | PendingMessage) => void;
  onToggleSelect?: (msg: ChatMessage | PendingMessage) => void;
  onEnterSelection?: (msg: ChatMessage) => void;
};

type VirtualMessageRowProps = {
  message: ChatMessage | PendingMessage;
  isMine: boolean;
  position: ReturnType<typeof getGroupPosition>;
  showAvatar: boolean;
  showFooter: boolean;
  currentUserId?: string;
  currentUsername?: string | null;
  peerId?: string;
  peerAvatar?: string | null;
  peerName?: string | null;
  peerOnline?: boolean;
  highlightMessageId?: string;
  unreadMessageId?: string | null;
  selectionMode?: boolean;
  selected?: boolean;
  handlersRef: React.RefObject<VirtualMessageListHandlers>;
};

export const VirtualMessageRow = memo(
  VirtualMessageRowInner,
  (prev, next) =>
    prev.message === next.message &&
    prev.selected === next.selected &&
    prev.selectionMode === next.selectionMode &&
    prev.highlightMessageId === next.highlightMessageId &&
    prev.unreadMessageId === next.unreadMessageId &&
    prev.position === next.position &&
    prev.showAvatar === next.showAvatar &&
    prev.showFooter === next.showFooter &&
    prev.isMine === next.isMine &&
    prev.handlersRef === next.handlersRef,
);

function VirtualMessageRowInner({
  message,
  isMine,
  position,
  showAvatar,
  showFooter,
  currentUserId,
  currentUsername,
  peerId,
  peerAvatar,
  peerName,
  peerOnline,
  highlightMessageId,
  unreadMessageId,
  selectionMode = false,
  selected = false,
  handlersRef,
}: VirtualMessageRowProps) {
  const handlers = handlersRef.current;
  if (!handlers) return null;
  const messageId = 'clientId' in message ? undefined : message.id;
  const selectable = Boolean(selectionMode && messageId && !message.deletedAt);
  const status =
    showFooter && isMine
      ? getDeliveryStatus(message, currentUserId, currentUsername, peerId)
      : null;

  return (
    <div
      className={cn('flex w-full gap-2 pb-1', isMine ? 'justify-end' : 'justify-start')}
      data-message-id={messageId}
    >
      {!isMine && !selectionMode ? (
        showAvatar ? (
          <UserAvatar src={peerAvatar} name={peerName} online={peerOnline} size="sm" className="self-end" />
        ) : (
          <div className="w-7 shrink-0" aria-hidden />
        )
      ) : null}

      <div
        className={cn(
          'flex min-w-0 max-w-[88%] flex-col',
          isMine ? 'items-end' : 'items-start',
          !selectionMode &&
            messageId &&
            messageId === highlightMessageId &&
            'rounded-lg ring-2 ring-primary/50',
          !selectionMode &&
            unreadMessageId &&
            messageId === unreadMessageId &&
            'rounded-lg bg-primary/5',
        )}
      >
        <MessageBubble
          message={message}
          currentUserId={currentUserId}
          currentUsername={currentUsername}
          peerId={peerId}
          position={position}
          isMine={isMine}
          onReply={() => handlers.onReply(message)}
          onOpenActions={() => handlers.onOpenActions(message)}
          onCopy={() => handlers.onCopy(message)}
          onForward={() => handlers.onForward(message)}
          onEdit={() => handlers.onEdit(message)}
          onDelete={() => handlers.onDelete(message)}
          onPin={() => handlers.onPin(message)}
          onReact={(emoji) => handlers.onReact(message, emoji)}
          onOpenMedia={handlers.onOpenMedia ? () => handlers.onOpenMedia?.(message) : undefined}
          selectionMode={selectable}
          selected={selected}
          onToggleSelect={selectable ? () => handlers.onToggleSelect?.(message) : undefined}
          onSelect={
            messageId && handlers.onEnterSelection
              ? () => handlers.onEnterSelection?.(message as ChatMessage)
              : undefined
          }
        />

        {showFooter ? (
          <footer
            className={cn(
              'mt-0.5 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground/70',
              isMine ? 'flex-row-reverse' : 'flex-row',
            )}
          >
            <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
            {message.editedAt ? <span>· edited</span> : null}
            {isMine && status ? (
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={status}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                  className="inline-flex"
                >
                  <MessageStatusIcon status={status} className="size-3" />
                </motion.span>
              </AnimatePresence>
            ) : null}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export function estimateMessageRowHeight(message: ChatMessage | PendingMessage): number {
  if (message.type === 'image' || message.type === 'video') return 228;
  if (message.type === 'file') return 92;
  if (message.type === 'location') return 168;
  if (message.sticker) return 120;
  const bodyLen = message.body?.length ?? 0;
  const lines = Math.max(1, Math.ceil(bodyLen / 42));
  const reactions = message.reactions?.length ?? 0;
  return 44 + lines * 22 + (reactions > 0 ? 36 : 0) + 18;
}

export type MessageVirtualRow = {
  kind: 'message';
  id: string;
  message: ChatMessage | PendingMessage;
  isMine: boolean;
  position: ReturnType<typeof getGroupPosition>;
  showAvatar: boolean;
  showFooter: boolean;
};

export function appendSenderGroupRows(
  rows: Array<
    | { kind: 'date'; id: string; date: string }
    | { kind: 'unread'; id: string }
    | MessageVirtualRow
  >,
  group: MessageSenderGroup,
  unreadState: { firstUnreadId?: string | null; inserted: boolean },
): boolean {
  const { messages, isMine } = group;
  let { inserted } = unreadState;

  for (let index = 0; index < messages.length; index += 1) {
    const msg = messages[index];
    const msgId = 'clientId' in msg ? msg.clientId : msg.id;

    if (
      unreadState.firstUnreadId &&
      !inserted &&
      !('clientId' in msg) &&
      msg.id === unreadState.firstUnreadId
    ) {
      rows.push({ kind: 'unread', id: 'unread-divider' });
      inserted = true;
    }

    rows.push({
      kind: 'message',
      id: msgId,
      message: msg,
      isMine,
      position: getGroupPosition(index, messages.length),
      showAvatar: !isMine && index === messages.length - 1,
      showFooter: index === messages.length - 1,
    });
  }

  unreadState.inserted = inserted;
  return inserted;
}
