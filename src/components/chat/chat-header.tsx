'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { UserAvatar } from '@/components/chat/user-avatar';
import { ChatOptionsMenu } from '@/components/chat/chat-options-menu';
import type { ChatMember } from '@/components/chat/types';
import { formatLastSeen } from '@/components/chat/utils';
import { useLongPress } from '@/hooks/use-long-press';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { touchIconButton } from '@/lib/mobile/touch';

type ChatHeaderProps = {
  peer?: ChatMember;
  online?: boolean;
  typingUsername?: string | null;
  lastSeenAt?: string | null;
  lastSeenHidden?: boolean;
  muted?: boolean;
  onOpenProfile: () => void;
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
  onOpenProfile,
  onToggleMute,
  onBlock,
  onReport,
  onClearHistory,
}: ChatHeaderProps) {
  const t = useTranslations('messages');

  const avatarLongPress = useLongPress(onOpenProfile);

  const lastSeenKey = !online && !typingUsername
    ? formatLastSeen(lastSeenAt, lastSeenHidden)
    : null;

  const statusLabel = typingUsername
    ? t('typing', { name: typingUsername })
    : online
      ? t('online')
      : lastSeenKey === 'recently'
        ? t('lastSeenRecently')
        : lastSeenKey === 'just_now'
          ? t('lastSeenJustNow')
          : lastSeenKey === 'yesterday'
            ? t('lastSeenYesterday')
            : lastSeenKey?.startsWith('today:')
              ? t('lastSeenToday', { time: lastSeenKey.split(':')[1] ?? '' })
              : lastSeenKey?.endsWith('m')
                ? t('lastSeenMinutes', { count: parseInt(lastSeenKey, 10) || 0 })
                : lastSeenKey
                  ? t('lastSeenDate', { date: lastSeenKey })
                  : null;

  const statusClass = typingUsername
    ? 'text-primary'
    : online
      ? 'text-emerald-500'
      : 'text-muted-foreground';

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur-md">
      <div className="flex items-center gap-1 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link
          href="/messages"
          aria-label={t('backToConversations')}
          className={touchIconButton('text-foreground hover:bg-muted')}
        >
          <ArrowLeft className="size-5" />
        </Link>

        <button
          type="button"
          onClick={onOpenProfile}
          {...avatarLongPress.bind()}
          className={cn(
            'flex min-h-[48px] min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left',
            'transition-colors duration-200 hover:bg-muted/50 active:scale-[0.99]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
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
            <AnimatePresence mode="wait" initial={false}>
              {statusLabel ? (
                <motion.p
                  key={statusLabel}
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.2 }}
                  className={cn('truncate text-xs', statusClass)}
                >
                  {statusLabel}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        </button>

        <ChatOptionsMenu
          muted={muted}
          onViewProfile={onOpenProfile}
          onToggleMute={onToggleMute}
          onBlock={onBlock}
          onReport={onReport}
          onClearHistory={onClearHistory}
        />
      </div>
    </header>
  );
}
