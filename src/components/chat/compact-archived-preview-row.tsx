'use client';

import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { ArchiveRestore } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ConversationListItem } from '@/components/chat/conversation-list-item';
import {
  SWIPE_ACTION_WIDTH,
  SwipeActionButton,
  useSnapSwipeRow,
} from '@/components/chat/swipe-row-actions';
import type { Conversation } from '@/components/chat/types';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/mobile/haptics';

export function CompactArchivedPreviewRow({
  conversation,
  onUnarchive,
}: {
  conversation: Conversation;
  onUnarchive: () => void;
}) {
  const t = useTranslations('messages');

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
      leftWidth: 0,
      enableRight: true,
    });

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl"
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
      </div>
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
        className={cn('relative bg-card', dragging && 'shadow-sm', revealed && 'cursor-pointer')}
      >
        <div className="flex items-center pe-1">
          <Link
            href={`/messages/${conversation.id}`}
            className={cn('min-w-0 flex-1', (dragging || revealed) && 'pointer-events-none')}
          >
            <ConversationListItem conversation={conversation} className="py-2.5" />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-primary"
            aria-label={t('unarchive')}
            onClick={(e) => {
              e.preventDefault();
              onUnarchive();
            }}
          >
            <ArchiveRestore className="size-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
