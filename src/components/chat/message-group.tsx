'use client';

import { useMemo } from 'react';
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

type MessageGroupProps = {
  group: MessageSenderGroup;
  currentUserId?: string;
  currentUsername?: string | null;
  peerId?: string;
  peerAvatar?: string | null;
  peerName?: string | null;
  peerOnline?: boolean;
  highlightMessageId?: string;
  unreadMessageId?: string | null;
  onReply: (msg: ChatMessage | PendingMessage) => void;
  onOpenActions: (msg: ChatMessage | PendingMessage) => void;
  onCopy: (msg: ChatMessage | PendingMessage) => void;
  onForward: (msg: ChatMessage | PendingMessage) => void;
  onEdit: (msg: ChatMessage | PendingMessage) => void;
  onDelete: (msg: ChatMessage | PendingMessage) => void;
  onPin: (msg: ChatMessage | PendingMessage) => void;
  onReact: (msg: ChatMessage | PendingMessage, emoji: string) => void;
  onOpenMedia?: (msg: ChatMessage | PendingMessage) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (msg: ChatMessage | PendingMessage) => void;
  onEnterSelection?: (msg: ChatMessage) => void;
};

export function MessageGroup({
  group,
  currentUserId,
  currentUsername,
  peerId,
  peerAvatar,
  peerName,
  peerOnline,
  highlightMessageId,
  unreadMessageId,
  onReply,
  onOpenActions,
  onCopy,
  onForward,
  onEdit,
  onDelete,
  onPin,
  onReact,
  onOpenMedia,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
  onEnterSelection,
}: MessageGroupProps) {
  const { isMine, messages } = group;
  const lastMessage = messages[messages.length - 1];

  const lastStatus = useMemo(
    () => getDeliveryStatus(lastMessage, currentUserId, currentUsername, peerId),
    [lastMessage, currentUserId, currentUsername, peerId],
  );

  return (
    <div
      className={cn('mb-5 w-full', isMine ? 'flex flex-col items-end' : 'flex flex-col items-start')}
      role="group"
      aria-label={isMine ? 'Your messages' : `${peerName ?? 'Contact'} messages`}
    >
      <div className={cn('flex w-full max-w-[88%] flex-col gap-2', isMine ? 'items-end' : 'items-start')}>
        {messages.map((msg, index) => {
          const isLast = index === messages.length - 1;
          const messageId = 'clientId' in msg ? undefined : msg.id;
          const selectable = selectionMode && messageId && !msg.deletedAt;
          return (
            <div
              key={'clientId' in msg ? msg.clientId : msg.id}
              data-message-id={messageId}
              className={cn(
                'flex w-full gap-2 rounded-lg transition-colors',
                isMine ? 'justify-end' : 'justify-start',
                !selectionMode &&
                  !('clientId' in msg) &&
                  msg.id === highlightMessageId &&
                  'ring-2 ring-primary/50',
                !selectionMode &&
                  !('clientId' in msg) &&
                  unreadMessageId &&
                  msg.id === unreadMessageId &&
                  'bg-primary/5 -mx-1 px-1 py-0.5',
              )}
            >
              {!isMine && !selectionMode ? (
                isLast ? (
                  <UserAvatar src={peerAvatar} name={peerName} online={peerOnline} size="sm" className="self-end" />
                ) : (
                  <div className="w-7 shrink-0" aria-hidden />
                )
              ) : null}
              <MessageBubble
                message={msg}
                currentUserId={currentUserId}
                currentUsername={currentUsername}
                peerId={peerId}
                position={getGroupPosition(index, messages.length)}
                isMine={isMine}
                onReply={() => onReply(msg)}
                onOpenActions={() => onOpenActions(msg)}
                onCopy={() => onCopy(msg)}
                onForward={() => onForward(msg)}
                onEdit={() => onEdit(msg)}
                onDelete={() => onDelete(msg)}
                onPin={() => onPin(msg)}
                onReact={(emoji) => onReact(msg, emoji)}
                onOpenMedia={onOpenMedia ? () => onOpenMedia(msg) : undefined}
                selectionMode={!!selectable}
                selected={messageId ? selectedIds?.has(messageId) : false}
                onToggleSelect={selectable ? () => onToggleSelect?.(msg) : undefined}
                onSelect={
                  !('clientId' in msg) && onEnterSelection
                    ? () => onEnterSelection(msg)
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>

      <footer
        className={cn(
          'mt-1 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground/70',
          isMine ? 'mr-0 flex-row-reverse' : 'ml-9 flex-row',
        )}
      >
        <time dateTime={lastMessage.createdAt}>{formatTime(lastMessage.createdAt)}</time>
        {lastMessage.editedAt ? <span>· edited</span> : null}
        {isMine && lastStatus ? (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={lastStatus}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="inline-flex"
            >
              <MessageStatusIcon status={lastStatus} className="size-3" />
            </motion.span>
          </AnimatePresence>
        ) : null}
      </footer>
    </div>
  );
}
