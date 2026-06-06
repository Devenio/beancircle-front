'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  ImageIcon,
  MapPin,
  Mic,
  Pin,
  Video,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/mobile/haptics';
import { messagePreview } from '@/components/chat/utils';
import type { ChatMessage, ChatMessageType } from '@/components/chat/types';

const PIN_TRANSITION = { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const };

type PinnedMessageBannerProps = {
  messages: ChatMessage[];
  currentUserId?: string;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  onJumpToMessage: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
};

function typeIcon(type: ChatMessageType) {
  switch (type) {
    case 'image':
      return ImageIcon;
    case 'voice':
      return Mic;
    case 'video':
      return Video;
    case 'location':
      return MapPin;
    case 'file':
      return FileText;
    default:
      return Pin;
  }
}

function mediaThumb(message: ChatMessage): string | undefined {
  if (message.type === 'image') return message.imageUrl ?? message.attachment?.url;
  if (message.type === 'video') return message.attachment?.url;
  return undefined;
}

export function PinnedMessageBanner({
  messages,
  currentUserId,
  scrollContainerRef,
  onJumpToMessage,
  onUnpin,
}: PinnedMessageBannerProps) {
  const t = useTranslations('messages');
  const [compact, setCompact] = useState(false);
  const [activeIndex, setActiveIndex] = useState(messages.length - 1);

  const sorted = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );

  useEffect(() => {
    setActiveIndex(Math.max(0, sorted.length - 1));
  }, [sorted.length]);

  useEffect(() => {
    const node = scrollContainerRef?.current;
    if (!node || compact || sorted.length === 0) return;

    const collapse = () => setCompact(true);
    node.addEventListener('scroll', collapse, { once: true, passive: true });
    return () => node.removeEventListener('scroll', collapse);
  }, [scrollContainerRef, compact, sorted.length]);

  const message = sorted[activeIndex];
  if (!message) return null;

  const preview = messagePreview(message);
  const thumb = mediaThumb(message);
  const TypeIcon = typeIcon(message.type);
  const isMine = Boolean(currentUserId && message.senderId === currentUserId);
  const senderLabel = isMine
    ? t('pinnedByYou')
    : message.sender.name ?? message.sender.username ?? t('pinnedMessage');
  const hasMultiple = sorted.length > 1;

  const jump = () => {
    haptic('light');
    onJumpToMessage(message.id);
  };

  const unpin = (event: React.MouseEvent) => {
    event.stopPropagation();
    haptic('selection');
    onUnpin(message.id);
  };

  const showPrev = () => {
    haptic('selection');
    setActiveIndex((i) => Math.max(0, i - 1));
  };

  const showNext = () => {
    haptic('selection');
    setActiveIndex((i) => Math.min(sorted.length - 1, i + 1));
  };

  return (
    <motion.div
      layout
      transition={PIN_TRANSITION}
      className={cn(
        'relative z-30 border-b border-border/50 bg-primary/[0.06] dark:bg-primary/10',
        compact ? 'py-1.5' : 'py-2.5',
      )}
    >
      <div className="flex items-stretch gap-2 px-3">
        {hasMultiple ? (
          <motion.button
            type="button"
            onClick={showPrev}
            disabled={activeIndex === 0}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="flex size-7 shrink-0 self-center items-center justify-center rounded-full text-muted-foreground disabled:opacity-30 active:bg-muted/60"
            aria-label={t('pinnedPrevious')}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </motion.button>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          <motion.button
            key={message.id}
            type="button"
            onClick={jump}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={PIN_TRANSITION}
            className={cn(
              'min-w-0 flex-1 rounded-xl bg-background/60 text-left',
              'px-3 py-2 shadow-sm active:bg-muted/40 dark:bg-background/40',
              compact ? 'py-1.5' : 'py-2',
            )}
            aria-label={t('jumpToPinned')}
          >
            <div className="flex items-start gap-2.5">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt=""
                  className={cn(
                    'shrink-0 rounded-lg object-cover ring-1 ring-border/60',
                    compact ? 'size-8' : 'size-10',
                  )}
                  draggable={false}
                />
              ) : (
                <span
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary',
                    compact ? 'size-8' : 'size-10',
                  )}
                >
                  {message.type === 'sticker' ? (
                    <span className="text-lg leading-none">{message.sticker}</span>
                  ) : (
                    <TypeIcon className={compact ? 'size-3.5' : 'size-4'} strokeWidth={2} />
                  )}
                </span>
              )}

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <Pin className="size-3 shrink-0 text-primary" aria-hidden />
                  <span className="truncate text-[11px] font-semibold text-primary">
                    {t('pinnedMessage')}
                  </span>
                  {!compact ? (
                    <>
                      <span className="text-[11px] text-muted-foreground/60">·</span>
                      <span className="truncate text-[11px] font-medium text-muted-foreground">
                        {senderLabel}
                      </span>
                    </>
                  ) : null}
                  {hasMultiple ? (
                    <motion.span
                      key={`${activeIndex}-${sorted.length}`}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="ms-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      {activeIndex + 1}/{sorted.length}
                    </motion.span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    'mt-0.5 block text-foreground/90',
                    compact ? 'truncate text-xs' : 'line-clamp-2 text-[13px] leading-snug',
                  )}
                >
                  {preview || t('pinnedMessage')}
                </span>
              </span>
            </div>
          </motion.button>
        </AnimatePresence>

        <div className="flex shrink-0 flex-col items-center justify-center gap-1 self-center">
          {hasMultiple ? (
            <motion.button
              type="button"
              onClick={showNext}
              disabled={activeIndex === sorted.length - 1}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.12 }}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground disabled:opacity-30 active:bg-muted/60"
              aria-label={t('pinnedNext')}
            >
              <ChevronRight className="size-4 rtl:rotate-180" />
            </motion.button>
          ) : null}
          <motion.button
            type="button"
            onClick={unpin}
            whileTap={{ scale: 0.82, rotate: 90 }}
            transition={{ type: 'spring', stiffness: 520, damping: 28 }}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground active:bg-muted/60"
            aria-label={t('unpin')}
          >
            <X className="size-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
