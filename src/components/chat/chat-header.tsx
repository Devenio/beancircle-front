'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { UserAvatar } from '@/components/chat/user-avatar';
import { ChatOptionsMenu } from '@/components/chat/chat-options-menu';
import type { ChatMember } from '@/components/chat/types';
import { resolvePresenceStatus } from '@/components/chat/utils';
import { useLongPress } from '@/hooks/use-long-press';
import { ArrowLeft, BellOff } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

type ChatHeaderProps = {
  peer?: ChatMember;
  online?: boolean;
  typingUsername?: string | null;
  lastSeenAt?: string | null;
  lastSeenHidden?: boolean;
  muted?: boolean;
  searchOpen?: boolean;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
  onToggleMute: () => void;
  onBlock: () => void;
  onReport: (reason: string) => void;
  onClearHistory: () => void;
};

export function ChatHeader({
  peer,
  online,
  typingUsername,
  lastSeenAt,
  lastSeenHidden,
  muted,
  searchOpen,
  onOpenProfile,
  onOpenSearch,
  onToggleMute,
  onBlock,
  onReport,
  onClearHistory,
}: ChatHeaderProps) {
  const t = useTranslations('messages');
  const locale = useLocale();

  const avatarLongPress = useLongPress(onOpenProfile);

  const status = resolvePresenceStatus({
    online,
    typingUsername,
    lastSeenAt,
    lastSeenHidden,
    locale,
  });

  const statusLabel =
    muted && !typingUsername
      ? t('muted')
      : status.params
        ? t(status.key, status.params)
        : t(status.key);

  const statusClass =
    muted && !typingUsername
      ? 'text-muted-foreground'
      : status.tone === 'typing'
      ? 'text-primary'
      : status.tone === 'online'
        ? 'text-emerald-500'
        : 'text-muted-foreground';

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur-md">
      <div className="flex items-center gap-1 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link
          href="/messages"
          aria-label={t('backToConversations')}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-5" />
        </Link>

        <button
          type="button"
          onClick={onOpenProfile}
          {...avatarLongPress.bind()}
          className={cn(
            'flex min-w-0 flex-1 items-start gap-3 rounded-xl px-1 py-0.5 text-left',
            'transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <UserAvatar
            src={peer?.avatarUrl}
            name={peer?.name ?? peer?.username}
            online={online}
            size="default"
            className="mt-0.5 shrink-0"
          />
          <div className="min-w-0 flex-1 py-0.5">
            <p className="flex min-w-0 items-center gap-1.5 truncate text-[15px] font-semibold leading-tight">
              <span className="truncate">{peer?.name ?? peer?.username ?? 'Chat'}</span>
              {muted ? (
                <BellOff
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-label={t('muted')}
                />
              ) : null}
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={statusLabel}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.2 }}
                className={cn('mt-0.5 truncate text-xs leading-snug', statusClass)}
              >
                {statusLabel}
              </motion.p>
            </AnimatePresence>
          </div>
        </button>

        <ChatOptionsMenu
          muted={muted}
          searchActive={searchOpen}
          onViewProfile={onOpenProfile}
          onOpenSearch={onOpenSearch}
          onToggleMute={onToggleMute}
          onBlock={onBlock}
          onReport={onReport}
          onClearHistory={onClearHistory}
        />
      </div>
    </header>
  );
}
