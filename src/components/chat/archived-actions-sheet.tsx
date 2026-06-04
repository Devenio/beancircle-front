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
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChatBottomSheet } from '@/components/chat/chat-bottom-sheet';
import type { Conversation } from '@/components/chat/types';

type ArchivedActionsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation | null;
  onUnarchive: () => void;
  onDelete: () => void;
  onToggleMute: () => void;
  onTogglePin: () => void;
  onMarkUnread: () => void;
};

export function ArchivedActionsSheet({
  open,
  onOpenChange,
  conversation,
  onUnarchive,
  onDelete,
  onToggleMute,
  onTogglePin,
  onMarkUnread,
}: ArchivedActionsSheetProps) {
  const t = useTranslations('messages');
  const router = useRouter();
  if (!conversation) return null;

  const name =
    conversation.otherMember?.name ?? conversation.otherMember?.username ?? t('title');
  const muted = conversation.muted ?? false;
  const pinned = conversation.pinned ?? false;
  const unread = conversation.unreadCount ?? 0;

  const actions: {
    icon: typeof ArchiveRestore;
    label: string;
    onClick: () => void;
    destructive?: boolean;
  }[] = [
    { icon: ArchiveRestore, label: t('unarchive'), onClick: onUnarchive },
    {
      icon: User,
      label: t('viewProfile'),
      onClick: () => {
        const username = conversation.otherMember?.username;
        if (username) router.push(`/profile/${username}`);
        onOpenChange(false);
      },
    },
    { icon: Pin, label: pinned ? t('unpin') : t('pinInArchive'), onClick: onTogglePin },
    {
      icon: muted ? Bell : BellOff,
      label: muted ? t('unmute') : t('muteNotifications'),
      onClick: onToggleMute,
    },
    ...(unread === 0
      ? [{ icon: Eye, label: t('markUnread'), onClick: onMarkUnread }]
      : [{ icon: CheckCheck, label: t('markRead'), onClick: onMarkUnread }]),
    { icon: Trash2, label: t('deleteChat'), onClick: onDelete, destructive: true },
  ];

  return (
    <ChatBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={name}
      description={t('archivedActions')}
    >
      <div className="flex flex-col gap-1 px-2 pb-2">
        {actions.map(({ icon: Icon, label, onClick, destructive }) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            className="h-12 justify-start gap-3 rounded-xl px-3 text-base"
            onClick={() => {
              onClick();
              onOpenChange(false);
            }}
          >
            <Icon className={destructive ? 'size-5 text-destructive' : 'size-5'} />
            <span className={destructive ? 'text-destructive' : undefined}>{label}</span>
          </Button>
        ))}
      </div>
      <Separator className="my-2" />
    </ChatBottomSheet>
  );
}
