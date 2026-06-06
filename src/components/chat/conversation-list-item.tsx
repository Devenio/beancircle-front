'use client';

import { BellOff, Pin } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/chat/user-avatar';
import type { Conversation } from '@/components/chat/types';
import { formatConversationTimestamp, previewFromLastMessage } from '@/components/chat/utils';
import { getDisplayUnread } from '@/stores/chat-archive-store';
import { cn } from '@/lib/utils';

export type ConversationListItemProps = {
  conversation: Conversation;
  typingLabel?: string | null;
  online?: boolean;
  className?: string;
  href?: string;
  onClick?: () => void;
  children?: React.ReactNode;
};

export function ConversationListItem({
  conversation,
  typingLabel,
  online,
  className,
  children,
}: ConversationListItemProps) {
  const t = useTranslations('messages');
  const member = conversation.otherMember;
  const displayName = member?.name ?? member?.username ?? 'Unknown';
  const muted = conversation.muted ?? false;
  const preview = typingLabel ?? previewFromLastMessage(conversation.lastMessage);
  const apiUnread = conversation.unreadCount ?? 0;
  const unread = getDisplayUnread(conversation.id, apiUnread);
  const pinned = conversation.pinned ?? false;
  const timestamp = formatConversationTimestamp(
    conversation.lastMessage?.createdAt ?? conversation.updatedAt,
  );

  return (
    <div
      className={cn(
        'flex min-h-[56px] items-center gap-3 border-0 px-3 py-3',
        className,
      )}
    >
      <UserAvatar src={member?.avatarUrl} name={displayName} online={online} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className={cn('truncate text-sm font-semibold', unread > 0 && 'text-foreground')}>
              {displayName}
            </p>
            {pinned ? (
              <AnimatePresence initial={false}>
                <motion.span
                  key="pinned"
                  initial={{ opacity: 0, scale: 0.5, rotate: -40 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 40 }}
                  transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                  className="inline-flex"
                >
                  <Pin className="size-3 shrink-0 text-muted-foreground" aria-label={t('pin')} />
                </motion.span>
              </AnimatePresence>
            ) : null}
            {muted ? (
              <BellOff className="size-3 shrink-0 text-muted-foreground" aria-label={t('muted')} />
            ) : null}
          </div>
          {timestamp ? (
            <span className="shrink-0 text-[11px] text-muted-foreground">{timestamp}</span>
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
            'min-w-6 shrink-0 justify-center rounded-full px-2 py-0.5',
            muted && 'bg-muted text-muted-foreground',
          )}
        >
          {unread > 99 ? '99+' : unread}
        </Badge>
      ) : null}
      {children}
    </div>
  );
}
