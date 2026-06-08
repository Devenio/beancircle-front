'use client';

import {
  ArchiveRestore,
  Bell,
  BellOff,
  CheckCheck,
  Eye,
  Pin,
  Trash2,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { Conversation } from '@/components/chat/types';
import { haptic } from '@/lib/mobile/haptics';

type ArchivedConversationContextMenuProps = {
  children: React.ReactNode;
  conversation: Conversation;
  onUnarchive: () => void;
  onTogglePin: () => void;
  onToggleMute: () => void;
  onToggleRead: () => void;
  onDelete: () => void;
};

export function ArchivedConversationContextMenu({
  children,
  conversation,
  onUnarchive,
  onTogglePin,
  onToggleMute,
  onToggleRead,
  onDelete,
}: ArchivedConversationContextMenuProps) {
  const t = useTranslations('messages');
  const router = useRouter();
  const pinned = conversation.pinned ?? false;
  const muted = conversation.muted ?? false;
  const unread = conversation.unreadCount ?? 0;
  const username = conversation.otherMember?.username;

  return (
    <ContextMenu>
      <ContextMenuTrigger className="block">{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem
          onClick={() => {
            haptic('light');
            onUnarchive();
          }}
        >
          <ArchiveRestore />
          {t('unarchive')}
        </ContextMenuItem>
        {username ? (
          <ContextMenuItem
            onClick={() => {
              haptic('light');
              router.push(`/profile/${username}`);
            }}
          >
            <User />
            {t('viewProfile')}
          </ContextMenuItem>
        ) : null}
        <ContextMenuItem
          onClick={() => {
            haptic('light');
            onTogglePin();
          }}
        >
          <Pin />
          {pinned ? t('unpin') : t('pinInArchive')}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            haptic('light');
            onToggleMute();
          }}
        >
          {muted ? <Bell /> : <BellOff />}
          {muted ? t('unmute') : t('mute')}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            haptic('light');
            onToggleRead();
          }}
        >
          {unread > 0 ? <CheckCheck /> : <Eye />}
          {unread > 0 ? t('markRead') : t('markUnread')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={() => {
            haptic('light');
            onDelete();
          }}
        >
          <Trash2 />
          {t('deleteChat')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
