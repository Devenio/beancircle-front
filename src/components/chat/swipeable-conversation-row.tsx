'use client';

import { useState } from 'react';
import { animate, motion, useMotionValue, type PanInfo } from 'framer-motion';
import { Archive, BellOff, CheckCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/chat/user-avatar';
import { useLongPress } from '@/hooks/use-long-press';
import { haptic } from '@/lib/mobile/haptics';
import { touch } from '@/lib/mobile/touch';
import type { Conversation } from '@/components/chat/types';
import { previewFromLastMessage } from '@/components/chat/utils';
import { cn } from '@/lib/utils';

type SwipeableConversationRowProps = {
  conversation: Conversation;
  typingLabel?: string | null;
  online?: boolean;
  onLongPress: () => void;
  onMarkRead: () => void;
  onMute: () => void;
  onArchive: () => void;
};

const SWIPE_THRESHOLD = 72;

export function SwipeableConversationRow({
  conversation,
  typingLabel,
  online,
  onLongPress,
  onMarkRead,
  onMute,
  onArchive,
}: SwipeableConversationRowProps) {
  const t = useTranslations('messages');
  const member = conversation.otherMember;
  const displayName = member?.name ?? member?.username ?? 'Unknown';
  const preview = typingLabel ?? previewFromLastMessage(conversation.lastMessage);
  const unread = conversation.unreadCount ?? 0;
  const muted = conversation.muted ?? false;
  const pinned = conversation.pinned ?? false;

  const x = useMotionValue(0);
  const [dragging, setDragging] = useState(false);
  const longPress = useLongPress(onLongPress);

  const reset = () => animate(x, 0, { type: 'spring', stiffness: 480, damping: 32 });

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setDragging(false);
    if (info.offset.x > SWIPE_THRESHOLD && unread > 0) {
      haptic('success');
      onMarkRead();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      haptic('light');
      if (info.velocity.x < -500 || info.offset.x < -120) onArchive();
      else onMute();
    }
    reset();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Behind actions */}
      <div className="absolute inset-0 flex items-stretch">
        <div className="flex w-1/2 items-center justify-start bg-emerald-500/90 pl-4 text-sm font-medium text-white">
          <CheckCheck className="mr-2 size-5" />
          {t('markRead')}
        </div>
        <div className="ml-auto flex w-1/2 items-center justify-end gap-2 bg-muted pr-4 text-sm font-medium text-foreground">
          {t('mute')}
          <BellOff className="size-5" />
          <span className="text-muted-foreground">|</span>
          {t('archiveChat')}
          <Archive className="size-5" />
        </div>
      </div>

      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -140, right: 140 }}
        dragElastic={0.08}
        onDragStart={() => setDragging(true)}
        onDragEnd={handleDragEnd}
        {...longPress.bind()}
        className={cn('relative bg-background', dragging && 'shadow-sm')}
      >
        <Link
          href={`/messages/${conversation.id}`}
          className={cn(
            'flex min-h-[56px] items-center gap-3 px-3 py-3',
            touch.motion,
            'hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            unread > 0 && !muted && 'bg-primary/5',
            dragging && 'pointer-events-none',
          )}
          draggable={false}
        >
          <UserAvatar src={member?.avatarUrl} name={displayName} online={online} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className={cn('truncate text-sm font-semibold', unread > 0 && 'text-foreground')}>
                {displayName}
              </p>
              {pinned ? (
                <span className="text-[10px] text-muted-foreground" aria-label={t('pin')}>
                  📌
                </span>
              ) : null}
            </div>
            <p
              className={cn(
                'truncate text-sm',
                typingLabel ? 'text-primary' : 'text-muted-foreground',
                unread > 0 && !typingLabel && !muted && 'font-medium text-foreground',
              )}
            >
              {preview}
            </p>
          </div>
          {unread > 0 ? (
            <Badge
              className={cn(
                'min-w-6 justify-center rounded-full px-2 py-0.5',
                muted && 'bg-muted text-muted-foreground',
              )}
            >
              {unread > 99 ? '99+' : unread}
            </Badge>
          ) : null}
        </Link>
      </motion.div>
    </div>
  );
}
