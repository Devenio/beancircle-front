'use client';

import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { ArchiveRestore, Bell, BellOff, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ConversationListItem } from '@/components/chat/conversation-list-item';
import { ArchivedConversationContextMenu } from '@/components/chat/archived-conversation-context-menu';
import {
  SWIPE_ACTION_WIDTH,
  SwipeActionButton,
  useSnapSwipeRow,
} from '@/components/chat/swipe-row-actions';
import { haptic } from '@/lib/mobile/haptics';
import type { Conversation } from '@/components/chat/types';
import { cn } from '@/lib/utils';

type SwipeableArchivedRowProps = {
  conversation: Conversation;
  typingLabel?: string | null;
  online?: boolean;
  onUnarchive: () => void;
  onMute: () => void;
  onTogglePin: () => void;
  onToggleRead: () => void;
  onDelete: () => void;
};

export function SwipeableArchivedRow({
  conversation,
  typingLabel,
  online,
  onUnarchive,
  onMute,
  onTogglePin,
  onToggleRead,
  onDelete,
}: SwipeableArchivedRowProps) {
  const t = useTranslations('messages');
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
            tone="unarchive"
            icon={<ArchiveRestore />}
            label={t('unarchive')}
            className="w-full"
            onClick={() => {
              haptic('success');
              runAction(onUnarchive);
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
            tone="delete"
            icon={<Trash2 />}
            label={t('deleteChat')}
            onClick={() => {
              haptic('light');
              runAction(onDelete);
            }}
          />
        </div>
      </div>

      <ArchivedConversationContextMenu
        conversation={conversation}
        onUnarchive={onUnarchive}
        onTogglePin={onTogglePin}
        onToggleMute={onMute}
        onToggleRead={onToggleRead}
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
          layout
          exit={{ opacity: 0, x: 48, transition: { duration: 0.2 } }}
          className={cn('relative bg-background', dragging && 'shadow-sm', revealed && 'cursor-pointer')}
        >
          <Link
            href={`/messages/${conversation.id}`}
            className={cn(
              'block border-0 transition-colors hover:bg-muted/70 focus-visible:outline-none',
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
      </ArchivedConversationContextMenu>
    </div>
  );
}
