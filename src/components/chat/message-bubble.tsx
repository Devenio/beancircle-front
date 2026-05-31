'use client';

import { useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ChatMessage, MessageDeliveryStatus, PendingMessage } from '@/components/chat/types';
import { formatTime, getDeliveryStatus, isMineMessage } from '@/components/chat/utils';
import { MessageStatusIcon } from '@/components/chat/message-status';
import { MessageBodyContent } from '@/components/chat/message-content';
import { Badge } from '@/components/ui/badge';
import type { MessageReaction } from '@/components/chat/types';

type MessageBubbleProps = {
  message: ChatMessage | PendingMessage;
  currentUserId?: string;
  currentUsername?: string | null;
  peerId?: string;
  reactions?: MessageReaction[];
  onReply: () => void;
  onOpenActions: () => void;
  showAvatar?: boolean;
  isGrouped?: boolean;
};

export function MessageBubble({
  message,
  currentUserId,
  currentUsername,
  peerId,
  reactions = [],
  onReply,
  onOpenActions,
  showAvatar,
  isGrouped,
}: MessageBubbleProps) {
  const [swipeReply, setSwipeReply] = useState(false);
  const x = useMotionValue(0);
  const replyOpacity = useTransform(x, [-72, -24, 0], [1, 0.4, 0]);

  const isMine = isMineMessage(message, currentUserId, currentUsername);
  const pending = 'status' in message ? message.status : null;
  const status: MessageDeliveryStatus | null = useMemo(
    () => getDeliveryStatus(message, currentUserId, currentUsername, peerId),
    [message, currentUserId, currentUsername, peerId],
  );

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -48) onReply();
    setSwipeReply(false);
  };

  if (message.deletedAt) {
    return (
      <div className={cn('flex w-full', isMine ? 'justify-end' : 'justify-start')}>
        <p className="rounded-2xl bg-muted/60 px-3 py-2 text-sm italic text-muted-foreground">Message deleted</p>
      </div>
    );
  }

  return (
    <div className={cn('flex w-full gap-2', isMine ? 'justify-end' : 'justify-start', isGrouped && 'mt-0.5')}>
      {!isMine && showAvatar ? <div className="size-7 shrink-0" /> : null}
      {!isMine && !showAvatar ? <div className="size-7 shrink-0" /> : null}

      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.12}
        onDragStart={() => setSwipeReply(true)}
        onDragEnd={handleDragEnd}
        className="relative max-w-[82%]"
      >
        <motion.span
          style={{ opacity: replyOpacity }}
          className="absolute -left-8 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
        >
          ↩
        </motion.span>

        <motion.button
          type="button"
          layout
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: pending === 'sending' ? 0.75 : 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onOpenActions}
          onContextMenu={(event) => {
            event.preventDefault();
            onOpenActions();
          }}
          className={cn(
            'group w-full rounded-2xl px-3 py-2 text-left shadow-sm transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isMine
              ? 'rounded-br-md bg-primary text-primary-foreground'
              : 'rounded-bl-md border border-border/60 bg-card text-card-foreground',
            pending === 'failed' && 'border border-destructive/40 bg-destructive/10 text-destructive',
            swipeReply && 'shadow-md',
          )}
          aria-label="Message actions"
        >
          {message.pinned ? (
            <Badge variant="secondary" className="mb-1 h-5 px-1.5 text-[10px]">
              Pinned
            </Badge>
          ) : null}

          {message.replyToSnippet ? (
            <div
              className={cn(
                'mb-2 rounded-lg border-l-2 px-2 py-1 text-xs',
                isMine ? 'border-primary-foreground/50 bg-primary-foreground/10' : 'border-primary bg-muted/60',
              )}
            >
              {message.replyToSnippet}
            </div>
          ) : null}

          <MessageBodyContent
            type={message.type}
            body={message.body}
            sticker={message.sticker}
            attachment={message.attachment}
            location={message.location}
            isMine={isMine}
          />

          <div
            className={cn(
              'mt-1 flex items-center justify-end gap-1.5 text-[10px]',
              isMine ? 'text-primary-foreground/75' : 'text-muted-foreground',
            )}
          >
            {message.editedAt ? <span>edited</span> : null}
            <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
            {status ? <MessageStatusIcon status={status} /> : null}
          </div>

          {reactions.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {reactions.map((reaction) => (
                <span
                  key={`${reaction.userId}-${reaction.emoji}`}
                  className="rounded-full bg-background/80 px-1.5 py-0.5 text-xs shadow-sm"
                >
                  {reaction.emoji}
                </span>
              ))}
            </div>
          ) : null}
        </motion.button>
      </motion.div>
    </div>
  );
}
