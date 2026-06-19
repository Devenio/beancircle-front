'use client';

import {
  Copy,
  CheckSquare,
  Forward,
  MessageSquareReply,
  Pencil,
  Pin,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { ChatMessage, PendingMessage } from '@/components/chat/types';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

type MessageContextMenuProps = {
  children: React.ReactNode;
  message: ChatMessage | PendingMessage;
  isMine: boolean;
  onReply: () => void;
  onCopy: () => void;
  onForward: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onReact: (emoji: string) => void;
  onSelect?: () => void;
};

export function MessageContextMenu({
  children,
  message,
  isMine,
  onReply,
  onCopy,
  onForward,
  onEdit,
  onDelete,
  onPin,
  onReact,
  onSelect,
}: MessageContextMenuProps) {
  if (message.deletedAt) return <>{children}</>;

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <div className="flex items-center justify-between gap-1 px-1 py-2">
          {REACTIONS.map((emoji, index) => (
            <motion.button
              key={emoji}
              type="button"
              className="flex size-10 items-center justify-center rounded-md text-lg transition-colors hover:bg-accent"
              onClick={() => onReact(emoji)}
              aria-label={`React with ${emoji}`}
              initial={{ opacity: 0, scale: 0.4, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                delay: index * 0.03,
                type: 'spring',
                stiffness: 600,
                damping: 24,
              }}
              whileHover={{ scale: 1.2, y: -3 }}
              whileTap={{ scale: 0.85 }}
            >
              {emoji}
            </motion.button>
          ))}
        </div>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onReply}>
          <MessageSquareReply />
          Reply
        </ContextMenuItem>
        <ContextMenuItem onClick={onCopy}>
          <Copy />
          Copy
        </ContextMenuItem>
        <ContextMenuItem onClick={onForward}>
          <Forward />
          Forward
        </ContextMenuItem>
        {onSelect ? (
          <ContextMenuItem onClick={onSelect}>
            <CheckSquare />
            Select
          </ContextMenuItem>
        ) : null}
        <ContextMenuItem onClick={onPin}>
          <Pin />
          {message.pinned ? 'Unpin' : 'Pin'}
        </ContextMenuItem>
        {isMine && message.type === 'text' ? (
          <ContextMenuItem onClick={onEdit}>
            <Pencil />
            Edit
          </ContextMenuItem>
        ) : null}
        {isMine ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 />
              Delete
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}
