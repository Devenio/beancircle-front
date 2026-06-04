'use client';

import {
  Archive,
  Bell,
  BellOff,
  CheckCheck,
  Pin,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChatBottomSheet } from '@/components/chat/chat-bottom-sheet';
import { touch } from '@/lib/mobile/touch';
import type { Conversation } from '@/components/chat/types';
import { cn } from '@/lib/utils';

type ConversationActionsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation | null;
  onMarkRead: () => void;
  onTogglePin: () => void;
  onToggleMute: () => void;
  onArchive: () => void;
};

export function ConversationActionsSheet({
  open,
  onOpenChange,
  conversation,
  onMarkRead,
  onTogglePin,
  onToggleMute,
  onArchive,
}: ConversationActionsSheetProps) {
  const t = useTranslations('messages');
  if (!conversation) return null;

  const name =
    conversation.otherMember?.name ?? conversation.otherMember?.username ?? t('title');
  const unread = conversation.unreadCount ?? 0;
  const muted = conversation.muted ?? false;
  const pinned = conversation.pinned ?? false;

  const actions = [
    ...(unread > 0
      ? [{ icon: CheckCheck, label: t('markRead'), onClick: onMarkRead }]
      : []),
    { icon: Pin, label: pinned ? t('unpin') : t('pinChat'), onClick: onTogglePin },
    {
      icon: muted ? Bell : BellOff,
      label: muted ? t('unmute') : t('muteNotifications'),
      onClick: onToggleMute,
    },
    { icon: Archive, label: t('archiveChat'), onClick: onArchive, destructive: false },
  ];

  return (
    <ChatBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={name}
      description={t('conversationActions')}
    >
      <div className="flex flex-col gap-1 px-2 pb-2">
        {actions.map(({ icon: Icon, label, onClick, destructive }) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            className={cn(
              touch.actionRow,
              'justify-start gap-3 rounded-xl px-4 text-base',
              touch.motion,
            )}
            onClick={() => {
              onClick();
              onOpenChange(false);
            }}
          >
            <Icon className={destructive ? 'text-destructive' : 'size-5'} />
            <span className={destructive ? 'text-destructive' : undefined}>{label}</span>
          </Button>
        ))}
      </div>
      <Separator className="my-2" />
    </ChatBottomSheet>
  );
}
