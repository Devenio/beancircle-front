'use client';

import {
  Copy,
  Forward,
  MessageSquareReply,
  Pencil,
  Pin,
  Smile,
  Trash2,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ChatMessage, PendingMessage } from '@/components/chat/types';
import { messagePreview } from '@/components/chat/utils';

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
}: MessageActionsSheetProps) {
  if (!message) return null;

  const actions = [
    { icon: MessageSquareReply, label: 'Reply', onClick: onReply },
    { icon: Copy, label: 'Copy', onClick: onCopy },
    { icon: Forward, label: 'Forward', onClick: onForward },
    { icon: Pin, label: message.pinned ? 'Unpin' : 'Pin', onClick: onPin },
    ...(isMine && message.type === 'text' && !message.deletedAt
      ? [{ icon: Pencil, label: 'Edit', onClick: onEdit }]
      : []),
    ...(isMine && !message.deletedAt
      ? [{ icon: Trash2, label: 'Delete', onClick: onDelete, destructive: true }]
      : []),
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base">Message</SheetTitle>
          <SheetDescription className="line-clamp-2">{messagePreview(message)}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex items-center justify-between gap-2">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex size-11 items-center justify-center rounded-full bg-muted text-xl transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                onReact(emoji);
                onOpenChange(false);
              }}
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground"
            aria-label="More reactions"
          >
            <Smile className="size-4" />
          </button>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-col gap-1">
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
              <Icon className={destructive ? 'text-destructive' : undefined} />
              <span className={destructive ? 'text-destructive' : undefined}>{label}</span>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
