'use client';

import { useState } from 'react';
import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ChatMessage, PendingMessage } from '@/components/chat/types';
import { MessageBodyContent } from '@/components/chat/message-content';
import { MessageContextMenu } from '@/components/chat/message-context-menu';

type BubblePosition = 'single' | 'first' | 'middle' | 'last';

type MessageBubbleProps = {
  message: ChatMessage | PendingMessage;
  currentUserId?: string;
  currentUsername?: string | null;
  peerId?: string;
  position?: BubblePosition;
  isMine?: boolean;
  onReply: () => void;
  onOpenActions: () => void;
  onCopy: () => void;
  onForward: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onReact: (emoji: string) => void;
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
  currentUserId,
  position = 'single',
  isMine = false,
  onReply,
  onOpenActions,
  onCopy,
  onForward,
  onEdit,
  onDelete,
  onPin,
  onReact,
}: MessageBubbleProps) {
  const reactions = message.reactions ?? [];
  const [swipeReply, setSwipeReply] = useState(false);
  const x = useMotionValue(0);
  const replyOpacity = useTransform(x, [-72, -24, 0], [1, 0.4, 0]);

  const pending = 'status' in message ? message.status : null;

  const resetDragPosition = () => {
    animate(x, 0, { type: 'spring', stiffness: 520, damping: 32 });
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -48) onReply();
    setSwipeReply(false);
    resetDragPosition();
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
    <MessageContextMenu
      message={message}
      isMine={isMine}
      onReply={onReply}
      onCopy={onCopy}
      onForward={onForward}
      onEdit={onEdit}
      onDelete={onDelete}
      onPin={onPin}
      onReact={onReact}
    >
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.12}
        dragSnapToOrigin
        onDragStart={() => setSwipeReply(true)}
        onDragEnd={handleDragEnd}
        className="relative max-w-full"
      >
        <motion.span
          style={{ opacity: replyOpacity }}
          className="pointer-events-none absolute -left-7 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
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
          {message.forwardedFromName ? (
            <div
              className={cn(
                'mb-1 flex items-center gap-1 text-[11px] italic opacity-80',
                isMine ? 'text-primary-foreground/80' : 'text-muted-foreground',
              )}
            >
              <span aria-hidden>↪</span>
              Forwarded from {message.forwardedFromName}
            </div>
          ) : null}

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
              {reactions.map((reaction) => {
                const mine = currentUserId
                  ? reaction.userIds.includes(currentUserId)
                  : false;
                return (
                  <button
                    key={reaction.emoji}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onReact(reaction.emoji);
                    }}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs shadow-sm transition-colors',
                      mine
                        ? 'bg-primary/15 ring-1 ring-primary/40'
                        : 'bg-background/80 hover:bg-background',
                    )}
                  >
                    <span>{reaction.emoji}</span>
                    {reaction.count > 1 ? (
                      <span className="tabular-nums text-[10px] font-medium opacity-80">
                        {reaction.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </motion.button>
      </motion.div>
    </MessageContextMenu>
  );
}
