'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ChatMessage, PendingMessage } from '@/components/chat/types';
import { MessageBodyContent } from '@/components/chat/message-content';
import type { MessageReaction } from '@/components/chat/types';

type BubblePosition = 'single' | 'first' | 'middle' | 'last';

type MessageBubbleProps = {
  message: ChatMessage | PendingMessage;
  currentUserId?: string;
  currentUsername?: string | null;
  peerId?: string;
  reactions?: MessageReaction[];
  position?: BubblePosition;
  isMine?: boolean;
  onReply: () => void;
  onOpenActions: () => void;
};

function bubbleRadius(isMine: boolean, position: BubblePosition) {
  if (position === 'single') {
    return isMine ? 'rounded-[18px] rounded-br-[6px]' : 'rounded-[18px] rounded-bl-[6px]';
  }
  if (position === 'first') {
    return isMine
      ? 'rounded-[18px] rounded-br-[6px]'
      : 'rounded-[18px] rounded-bl-[6px]';
  }
  if (position === 'middle') {
    return isMine
      ? 'rounded-l-[18px] rounded-tr-[18px] rounded-br-[6px]'
      : 'rounded-r-[18px] rounded-tl-[18px] rounded-bl-[6px]';
  }
  return isMine
    ? 'rounded-[18px] rounded-tr-[6px]'
    : 'rounded-[18px] rounded-tl-[6px]';
}

export function MessageBubble({
  message,
  reactions = [],
  position = 'single',
  isMine = false,
  onReply,
  onOpenActions,
}: MessageBubbleProps) {
  const [swipeReply, setSwipeReply] = useState(false);
  const x = useMotionValue(0);
  const replyOpacity = useTransform(x, [-72, -24, 0], [1, 0.4, 0]);

  const pending = 'status' in message ? message.status : null;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -48) onReply();
    setSwipeReply(false);
  };

  if (message.deletedAt) {
    return (
      <p
        className={cn(
          'rounded-[18px] bg-muted/50 px-3 py-2 text-sm italic text-muted-foreground',
          isMine ? 'rounded-br-[6px]' : 'rounded-bl-[6px]',
        )}
      >
        Message deleted
      </p>
    );
  }

  return (
    <motion.div
      style={{ x }}
      drag="x"
      dragConstraints={{ left: -80, right: 0 }}
      dragElastic={0.12}
      onDragStart={() => setSwipeReply(true)}
      onDragEnd={handleDragEnd}
      className="relative max-w-full"
    >
      <motion.span
        style={{ opacity: replyOpacity }}
        className="absolute -left-7 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
      >
        ↩
      </motion.span>

      <motion.button
        type="button"
        layout
        initial={{ opacity: 0, y: 4, scale: 0.99 }}
        animate={{ opacity: pending === 'sending' ? 0.7 : 1, y: 0, scale: 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={onOpenActions}
        onContextMenu={(event) => {
          event.preventDefault();
          onOpenActions();
        }}
        className={cn(
          'group w-full px-3 py-2 text-left transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          bubbleRadius(isMine, position),
          isMine
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted/80 text-foreground',
          pending === 'failed' && 'border border-destructive/40 bg-destructive/10 text-destructive',
          swipeReply && 'shadow-md',
        )}
        aria-label="Message actions"
      >
        {message.replyToSnippet ? (
          <div
            className={cn(
              'mb-1.5 rounded-lg border-l-2 px-2 py-1 text-xs opacity-90',
              isMine ? 'border-primary-foreground/40 bg-primary-foreground/10' : 'border-primary/60 bg-background/60',
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

        {reactions.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
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
  );
}
