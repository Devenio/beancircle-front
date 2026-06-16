'use client';

import { memo, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Check, MessageSquareReply } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage, PendingMessage } from '@/components/chat/types';
import { MessageBodyContent } from '@/components/chat/message-content';
import { MessageContextMenu } from '@/components/chat/message-context-menu';
import { useCoarsePointer } from '@/hooks/use-coarse-pointer';
import { haptic } from '@/lib/mobile/haptics';

type BubblePosition = 'single' | 'first' | 'middle' | 'last';

const SEND_TRANSITION = { duration: 0.3, ease: [0.32, 0.72, 0, 1] as const };

function outgoingLayoutId(message: ChatMessage | PendingMessage): string | undefined {
  if ('clientId' in message) return `outgoing-${message.clientId}`;
  if (message.sendLayoutId) return `outgoing-${message.sendLayoutId}`;
  return undefined;
}

function shouldPlayEnter(message: ChatMessage | PendingMessage): boolean {
  return 'clientId' in message || Boolean(message.enterAnimate);
}

function BubbleMotionShell({
  message,
  isMine,
  pending,
  children,
}: {
  message: ChatMessage | PendingMessage;
  isMine: boolean;
  pending: 'sending' | 'failed' | null;
  children: ReactNode;
}) {
  const layoutId = outgoingLayoutId(message);
  const playEnter = shouldPlayEnter(message);

  return (
    <motion.div
      layout={Boolean(layoutId)}
      layoutId={layoutId}
      initial={
        playEnter
          ? isMine
            ? { opacity: 0, y: 12, scale: 0.95 }
            : { opacity: 0, y: 10, x: -10, scale: 0.97 }
          : false
      }
      animate={{
        opacity: pending === 'sending' ? 0.92 : 1,
        y: 0,
        x: 0,
        scale: 1,
      }}
      transition={
        pending === 'sending'
          ? { opacity: { duration: 0.22, ease: 'easeOut' }, ...SEND_TRANSITION }
          : SEND_TRANSITION
      }
      className="relative max-w-full"
    >
      {children}
    </motion.div>
  );
}

type MessageBubbleProps = {
  message: ChatMessage | PendingMessage;
  currentUserId?: string;
  currentUsername?: string | null;
  peerId?: string;
  position?: BubblePosition;
  isMine?: boolean;
  onReply: () => void;
  onCopy: () => void;
  onForward: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onReact: (emoji: string) => void;
  onOpenMedia?: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onSelect?: () => void;
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

function MessageBubbleInner({
  message,
  currentUserId,
  position = 'single',
  isMine = false,
  onReply,
  onCopy,
  onForward,
  onEdit,
  onDelete,
  onPin,
  onReact,
  onOpenMedia,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onSelect,
}: MessageBubbleProps) {
  const reactions = message.reactions ?? [];
  const coarse = useCoarsePointer();
  const swipeReplyEnabled = coarse && !selectionMode;
  const [swipeReply, setSwipeReply] = useState(false);
  const x = useMotionValue(0);
  const replyOpacity = useTransform(x, [-80, -32, 0], [1, 0.45, 0]);

  const pending = 'status' in message ? message.status : null;
  const isMedia = message.type === 'image' || message.type === 'video';

  const resetDragPosition = () => {
    animate(x, 0, { type: 'spring', stiffness: 520, damping: 32 });
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -56) {
      haptic('light');
      onReply();
    }
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

  const bubbleBody = (
    <div
      onClick={
        selectionMode
          ? (event) => {
              event.stopPropagation();
              haptic('selection');
              onToggleSelect?.();
            }
          : isMedia && !coarse
            ? () => {
                onOpenMedia?.();
              }
            : undefined
      }
      role={isMedia ? 'button' : undefined}
      tabIndex={isMedia ? 0 : undefined}
      onKeyDown={
        isMedia
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenMedia?.();
              }
            }
          : undefined
      }
      className={cn(
        'chat-bubble group w-full px-3 py-2 text-left transition-shadow duration-200',
        isMedia && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        bubbleRadius(isMine, position),
        isMine ? 'bg-primary text-primary-foreground' : 'bg-muted/80 text-foreground',
        pending === 'failed' && 'border border-destructive/40 bg-destructive/10 text-destructive',
        swipeReply && 'shadow-md',
        selectionMode && selected && 'ring-2 ring-primary/50',
        'select-none',
      )}
      aria-label="Message"
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
        imageUrl={message.imageUrl}
        isMine={isMine}
        spoiler={message.spoiler}
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
                  haptic('selection');
                  onReact(reaction.emoji);
                }}
                className={cn(
                  'flex min-h-8 min-w-8 items-center gap-1 rounded-full px-2 py-1 text-xs shadow-sm transition-colors duration-200',
                  mine
                    ? 'bg-primary/15 ring-1 ring-primary/40'
                    : 'bg-background/80 hover:bg-background',
                )}
                aria-label={`React ${reaction.emoji}`}
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
    </div>
  );

  const bubble = swipeReplyEnabled ? (
    <BubbleMotionShell message={message} isMine={isMine} pending={pending}>
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -88, right: 0 }}
        dragElastic={0.1}
        dragSnapToOrigin
        onDragStart={() => setSwipeReply(true)}
        onDragEnd={handleDragEnd}
        className="relative max-w-full"
      >
        <motion.span
          style={{ opacity: replyOpacity }}
          className="pointer-events-none absolute -left-8 top-1/2 flex -translate-y-1/2 items-center text-primary"
          aria-hidden
        >
          <MessageSquareReply className="size-4" />
        </motion.span>
        {bubbleBody}
      </motion.div>
    </BubbleMotionShell>
  ) : (
    <BubbleMotionShell message={message} isMine={isMine} pending={pending}>
      {bubbleBody}
    </BubbleMotionShell>
  );

  if (selectionMode) {
    return (
      <div className={cn('flex w-full items-end gap-2', isMine ? 'flex-row-reverse' : 'flex-row')}>
        <button
          type="button"
          onClick={() => {
            haptic('selection');
            onToggleSelect?.();
          }}
          className={cn(
            'mb-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            selected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/40 bg-background',
          )}
          aria-label={selected ? 'Deselect message' : 'Select message'}
        >
          {selected ? <Check className="size-3" strokeWidth={3} /> : null}
        </button>
        {bubble}
      </div>
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
      onSelect={onSelect}
    >
      {bubble}
    </MessageContextMenu>
  );
}

function messageBubblePropsEqual(prev: MessageBubbleProps, next: MessageBubbleProps) {
  if (prev.message !== next.message) {
    if ('clientId' in prev.message || 'clientId' in next.message) {
      if (
        ('clientId' in prev.message ? prev.message.clientId : prev.message.id) !==
        ('clientId' in next.message ? next.message.clientId : next.message.id)
      ) {
        return false;
      }
    } else if (prev.message.id !== next.message.id) {
      return false;
    }

    if (
      prev.message.body !== next.message.body ||
      prev.message.editedAt !== next.message.editedAt ||
      prev.message.deletedAt !== next.message.deletedAt ||
      prev.message.pinned !== next.message.pinned ||
      prev.message.sendLayoutId !== next.message.sendLayoutId ||
      prev.message.enterAnimate !== next.message.enterAnimate ||
      prev.message.reactions !== next.message.reactions ||
      ('status' in prev.message ? prev.message.status : null) !==
        ('status' in next.message ? next.message.status : null)
    ) {
      return false;
    }
  }

  return (
    prev.position === next.position &&
    prev.isMine === next.isMine &&
    prev.selectionMode === next.selectionMode &&
    prev.selected === next.selected &&
    prev.currentUserId === next.currentUserId
  );
}

export const MessageBubble = memo(MessageBubbleInner, messageBubblePropsEqual);
