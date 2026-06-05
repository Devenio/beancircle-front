'use client';

import { Archive, Bell, BellOff, Pin, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { Conversation } from '@/components/chat/types';
import { haptic } from '@/lib/mobile/haptics';

type ConversationContextMenuProps = {
  children: React.ReactNode;
  conversation: Conversation;
  onTogglePin: () => void;
  onToggleMute: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

export function ConversationContextMenu({
  children,
  conversation,
  onTogglePin,
  onToggleMute,
  onArchive,
  onDelete,
}: ConversationContextMenuProps) {
  const t = useTranslations('messages');
  const pinned = conversation.pinned ?? false;
  const muted = conversation.muted ?? false;

  return (
    <ContextMenu>
      <ContextMenuTrigger className="block">{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem
          onClick={() => {
            haptic('light');
            onTogglePin();
          }}
        >
          <Pin />
          {pinned ? t('unpin') : t('pinChat')}
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
            onArchive();
          }}
        >
          <Archive />
          {t('archive')}
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
