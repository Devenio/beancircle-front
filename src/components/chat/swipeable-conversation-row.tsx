'use client';

import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Archive, Bell, BellOff, CheckCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ConversationListItem } from '@/components/chat/conversation-list-item';
import { ConversationContextMenu } from '@/components/chat/conversation-context-menu';
import {
  SWIPE_ACTION_WIDTH,
  SwipeActionButton,
  useSnapSwipeRow,
} from '@/components/chat/swipe-row-actions';
import { haptic } from '@/lib/mobile/haptics';
import type { Conversation } from '@/components/chat/types';
import { cn } from '@/lib/utils';

type SwipeableConversationRowProps = {
  conversation: Conversation;
  typingLabel?: string | null;
  online?: boolean;
  onMarkRead: () => void;
  onMute: () => void;
  onArchive: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
};

export function SwipeableConversationRow({
  conversation,
  typingLabel,
  online,
  onMarkRead,
  onMute,
  onArchive,
  onTogglePin,
  onDelete,
}: SwipeableConversationRowProps) {
  const t = useTranslations('messages');
  const unread = conversation.unreadCount ?? 0;
  const canMarkRead = unread > 0;
  const muted = conversation.muted ?? false;

  const {
    containerRef,
    x,
    dragging,
    revealed,
    reset,
    handleDragStart,
    handleDragEnd,
    runAction,
    dragConstraints,
  } = useSnapSwipeRow({
      rightWidth: SWIPE_ACTION_WIDTH,
      leftWidth: SWIPE_ACTION_WIDTH * 2,
      enableRight: true,
    });

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl"
      style={{ '--swipe-action-width': `${SWIPE_ACTION_WIDTH}px` } as CSSProperties}
    >
      <div className="absolute inset-0 flex items-stretch">
        <div className="flex shrink-0 items-stretch" style={{ width: SWIPE_ACTION_WIDTH }}>
          <SwipeActionButton
            tone={canMarkRead ? 'read' : 'readDisabled'}
            disabled={!canMarkRead}
            icon={<CheckCheck />}
            label={t('read')}
            className="w-full"
            onClick={() => {
              haptic('success');
              runAction(onMarkRead);
            }}
          />
        </div>
        <div className="min-w-0 flex-1" aria-hidden />
        <div className="flex shrink-0 items-stretch" style={{ width: SWIPE_ACTION_WIDTH * 2 }}>
          <SwipeActionButton
            tone={muted ? 'unmute' : 'mute'}
            icon={muted ? <Bell /> : <BellOff />}
            label={muted ? t('unmute') : t('mute')}
            onClick={() => {
              haptic('light');
              runAction(onMute);
            }}
          />
          <SwipeActionButton
            tone="archive"
            icon={<Archive />}
            label={t('archive')}
            onClick={() => {
              haptic('light');
              runAction(onArchive);
            }}
          />
        </div>
      </div>

      <ConversationContextMenu
        conversation={conversation}
        onMarkRead={onMarkRead}
        onTogglePin={onTogglePin}
        onToggleMute={onMute}
        onArchive={onArchive}
        onDelete={onDelete}
      >
        <motion.div
          style={{ x }}
          drag="x"
          dragConstraints={dragConstraints}
          dragElastic={0.12}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onClick={() => {
            if (revealed) reset();
          }}
          className={cn('relative bg-background', dragging && 'shadow-sm', revealed && 'cursor-pointer')}
        >
          <Link
            href={`/messages/${conversation.id}`}
            className={cn(
              'block border-0 transition-colors duration-200',
              'hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:outline-none',
              (dragging || revealed) && 'pointer-events-none',
            )}
            draggable={false}
          >
            <ConversationListItem
              conversation={conversation}
              typingLabel={typingLabel}
              online={online}
            />
          </Link>
        </motion.div>
      </ConversationContextMenu>
    </div>
  );
}
