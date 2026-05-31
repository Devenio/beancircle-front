'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MessageBubble } from '@/components/chat/message-bubble';
import { UserAvatar } from '@/components/chat/user-avatar';
import { MessageStatusIcon } from '@/components/chat/message-status';
import type { ChatMessage, MessageReaction, PendingMessage } from '@/components/chat/types';
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
  reactionsByMessage: Record<string, MessageReaction[]>;
  onReply: (msg: ChatMessage | PendingMessage) => void;
  onOpenActions: (msg: ChatMessage | PendingMessage) => void;
};

export function MessageGroup({
  group,
  currentUserId,
  currentUsername,
  peerId,
  peerAvatar,
  peerName,
  peerOnline,
  reactionsByMessage,
  onReply,
  onOpenActions,
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
          return (
            <div
              key={'clientId' in msg ? msg.clientId : msg.id}
              className={cn('flex w-full gap-2', isMine ? 'justify-end' : 'justify-start')}
            >
              {!isMine ? (
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
                reactions={reactionsByMessage[msg.id] ?? []}
                position={getGroupPosition(index, messages.length)}
                isMine={isMine}
                onReply={() => onReply(msg)}
                onOpenActions={() => onOpenActions(msg)}
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
        {isMine && lastStatus ? <MessageStatusIcon status={lastStatus} className="size-3" /> : null}
      </footer>
    </div>
  );
}
