'use client';

import {
  Copy,
  CheckSquare,
  Download,
  ExternalLink,
  Forward,
  MessageSquareReply,
  Pencil,
  Pin,
  Share2,
  Smile,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChatBottomSheet } from '@/components/chat/chat-bottom-sheet';
import { haptic } from '@/lib/mobile/haptics';
import type { ChatMessage, PendingMessage } from '@/components/chat/types';
import { messagePreview } from '@/components/chat/utils';
import { cn } from '@/lib/utils';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

type MessageActionsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: ChatMessage | PendingMessage | null;
  isMine: boolean;
  onReply: () => void;
  onCopy: () => void;
  onForward: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onReact: (emoji: string) => void;
  onSaveMedia?: () => void;
  onShareMedia?: () => void;
  onCopyLink?: () => void;
  onOpenDetails?: () => void;
  onSelect?: () => void;
};

export function MessageActionsSheet({
  open,
  onOpenChange,
  message,
  isMine,
  onReply,
  onCopy,
  onForward,
  onEdit,
  onDelete,
  onPin,
  onReact,
  onSaveMedia,
  onShareMedia,
  onCopyLink,
  onOpenDetails,
  onSelect,
}: MessageActionsSheetProps) {
  const t = useTranslations('messages');
  if (!message) return null;

  const isMedia = message.type === 'image' || message.type === 'video';
  const mediaUrl = message.imageUrl ?? message.attachment?.url;

  const actions = [
    { icon: MessageSquareReply, label: t('reply'), onClick: onReply },
    { icon: Copy, label: t('copy'), onClick: onCopy },
    { icon: Forward, label: t('forward'), onClick: onForward },
    ...(onSelect ? [{ icon: CheckSquare, label: t('selectMessages'), onClick: onSelect }] : []),
    { icon: Pin, label: message.pinned ? t('unpin') : t('pin'), onClick: onPin },
    ...(isMine && message.type === 'text' && !message.deletedAt
      ? [{ icon: Pencil, label: t('edit'), onClick: onEdit }]
      : []),
    ...(isMedia && mediaUrl
      ? [
          ...(onSaveMedia ? [{ icon: Download, label: t('saveMedia'), onClick: onSaveMedia }] : []),
          ...(onShareMedia ? [{ icon: Share2, label: t('share'), onClick: onShareMedia }] : []),
          ...(onCopyLink ? [{ icon: Copy, label: t('copyLink'), onClick: onCopyLink }] : []),
          ...(onOpenDetails
            ? [{ icon: ExternalLink, label: t('openDetails'), onClick: onOpenDetails }]
            : []),
        ]
      : []),
    ...(isMine && !message.deletedAt
      ? [{ icon: Trash2, label: t('delete'), onClick: onDelete, destructive: true }]
      : []),
  ];

  const run = (fn: () => void) => {
    haptic('light');
    fn();
    onOpenChange(false);
  };

  return (
    <ChatBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('messageActions')}
      description={messagePreview(message)}
    >
      <div className="flex items-center justify-between gap-1.5 px-4 pb-2">
        {REACTIONS.map((emoji, index) => (
          <motion.button
            key={emoji}
            type="button"
            className="flex size-11 items-center justify-center rounded-full bg-muted text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            initial={{ opacity: 0, scale: 0.4, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: index * 0.035,
              type: 'spring',
              stiffness: 600,
              damping: 22,
            }}
            whileHover={{ scale: 1.15, y: -4 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              haptic('selection');
              onReact(emoji);
              onOpenChange(false);
            }}
            aria-label={t('reactWith', { emoji })}
          >
            {emoji}
          </motion.button>
        ))}
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground"
          aria-label={t('moreReactions')}
        >
          <Smile className="size-5" />
        </button>
      </div>

      <Separator className="my-2" />

      <div className="flex flex-col gap-0.5 px-2 pb-2">
        {actions.map(({ icon: Icon, label, onClick, destructive }) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            className="h-12 justify-start gap-3 rounded-xl px-3 text-base"
            onClick={() => run(onClick)}
          >
            <Icon className={cn('size-5', destructive && 'text-destructive')} />
            <span className={destructive ? 'text-destructive' : undefined}>{label}</span>
          </Button>
        ))}
      </div>
    </ChatBottomSheet>
  );
}
