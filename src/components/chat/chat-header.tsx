'use client';

import { ArrowLeft, MoreVertical, Pin, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/chat/user-avatar';
import type { ChatMember, ConnectionState } from '@/components/chat/types';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';

type ChatHeaderProps = {
  peer?: ChatMember;
  online?: boolean;
  typingUsername?: string | null;
  connectionState: ConnectionState;
  pinnedPreview?: string;
};

export function ChatHeader({
  peer,
  online,
  typingUsername,
  connectionState,
  pinnedPreview,
}: ChatHeaderProps) {
  const subtitle = typingUsername
    ? `${typingUsername} is typing…`
    : online
      ? 'Online'
      : connectionState === 'connecting'
        ? 'Reconnecting…'
        : 'Last seen recently';

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="flex items-center gap-2 px-2 py-2.5 pt-[max(0.5rem,env(safe-area-inset-top))]">
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
            <p className="truncate text-sm font-semibold">{peer?.name ?? peer?.username ?? 'Chat'}</p>
            <p
              className={cn(
                'truncate text-xs',
                typingUsername ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {subtitle}
            </p>
          </div>
        </div>

        <Badge
          variant={connectionState === 'online' ? 'secondary' : 'outline'}
          className="hidden gap-1 sm:inline-flex"
        >
          {connectionState === 'online' ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
          {connectionState === 'online' ? 'Live' : connectionState === 'connecting' ? 'Sync' : 'Offline'}
        </Badge>

        <Button variant="ghost" size="icon" className="size-10 shrink-0 rounded-full" aria-label="Chat options">
          <MoreVertical />
        </Button>
      </div>

      {pinnedPreview ? (
        <div className="flex items-center gap-2 border-t border-border/60 bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          <Pin className="size-3.5 shrink-0" />
          <span className="truncate">{pinnedPreview}</span>
        </div>
      ) : null}
    </header>
  );
}
