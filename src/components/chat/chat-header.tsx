'use client';

import { ArrowLeft, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/chat/user-avatar';
import type { ChatMember } from '@/components/chat/types';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';

type ChatHeaderProps = {
  peer?: ChatMember;
  online?: boolean;
  typingUsername?: string | null;
};

export function ChatHeader({ peer, online, typingUsername }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur-md">
      <div className="flex items-center gap-2 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link
          href="/messages"
          aria-label="Back to conversations"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-5" />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <UserAvatar
            src={peer?.avatarUrl}
            name={peer?.name ?? peer?.username}
            online={online}
            size="default"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight">
              {peer?.name ?? peer?.username ?? 'Chat'}
            </p>
            {typingUsername ? (
              <p className="truncate text-xs text-primary">{typingUsername} is typing…</p>
            ) : null}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn('size-10 shrink-0 rounded-full text-muted-foreground')}
          aria-label="Chat options"
        >
          <MoreVertical className="size-5" />
        </Button>
      </div>
    </header>
  );
}
