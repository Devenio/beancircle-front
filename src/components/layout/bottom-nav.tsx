'use client';

import { Home, CalendarDays, Compass, MessageCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Link, usePathname } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { haptic } from '@/lib/mobile/haptics';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  useChatArchiveStore,
  getDisplayUnread,
} from '@/stores/chat-archive-store';
import type { Conversation, ChatMember } from '@/components/chat/types';

type TabKey = 'home' | 'events' | 'explore' | 'messages' | 'profile';

type NavTab = {
  href: string;
  key: TabKey;
  Icon: typeof Home;
  avatar?: boolean;
};

const TABS: NavTab[] = [
  { href: '/', key: 'home', Icon: Home },
  { href: '/events', key: 'events', Icon: CalendarDays },
  { href: '/discover', key: 'explore', Icon: Compass },
  { href: '/messages', key: 'messages', Icon: MessageCircle },
  { href: '/profile', key: 'profile', Icon: Home, avatar: true },
];

function initials(member?: { name?: string | null; username?: string | null }) {
  const source = member?.name || member?.username || '';
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function BottomNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const user = useAuthStore((s) => s.user);
  const archivedAt = useChatArchiveStore((s) => s.archivedAt);

  const { data: conversations } = useQuery({
    queryKey: ['conversations', locale],
    queryFn: () => api<Conversation[]>('/conversations', { locale }),
    staleTime: 30_000,
  });

  const active = (conversations ?? []).filter((c) => !archivedAt[c.id]);
  const totalUnread = active.reduce((sum, c) => {
    const unread = getDisplayUnread(c.id, c.unreadCount ?? 0);
    return sum + (c.muted ? 0 : unread);
  }, 0);

  const latestUnreadSender: ChatMember | undefined = active
    .filter((c) => !c.muted && getDisplayUnread(c.id, c.unreadCount ?? 0) > 0)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))[0]
    ?.otherMember;

  return (
    <nav
      aria-label={t('home')}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/90 to-transparent"
      />

      <div
        className={cn(
          'pointer-events-auto relative flex w-[min(92vw,430px)] items-center',
          'rounded-[22px] border border-border/50 bg-background/90 px-1 py-1.5',
          'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.06)]',
          'backdrop-blur-xl backdrop-saturate-150',
          'dark:border-white/10 dark:bg-background/85 dark:shadow-[0_4px_32px_-8px_rgba(0,0,0,0.5)]',
        )}
      >
        {TABS.map((tab) => {
          const isActive =
            tab.href === '/'
              ? pathname === '/'
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <NavItem
              key={tab.href}
              tab={tab}
              isActive={isActive}
              label={t(tab.key)}
              reduceMotion={!!reduceMotion}
              unread={tab.key === 'messages' ? totalUnread : 0}
              unreadSender={tab.key === 'messages' ? latestUnreadSender : undefined}
              avatarUrl={tab.avatar ? user?.avatarUrl ?? null : null}
              fallback={tab.avatar ? initials(user) : undefined}
            />
          );
        })}
      </div>
    </nav>
  );
}

type NavItemProps = {
  tab: NavTab;
  isActive: boolean;
  label: string;
  reduceMotion: boolean;
  unread: number;
  unreadSender?: ChatMember;
  avatarUrl: string | null;
  fallback?: string;
};

function NavItem({
  tab,
  isActive,
  label,
  reduceMotion,
  unread,
  unreadSender,
  avatarUrl,
  fallback,
}: NavItemProps) {
  const { Icon, avatar } = tab;
  const hasUnread = unread > 0;

  return (
    <Link
      href={tab.href}
      onClick={() => haptic('selection')}
      aria-current={isActive ? 'page' : undefined}
      aria-label={hasUnread ? `${label}, ${unread} unread` : label}
      className="group relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-0.5 py-1.5 outline-none"
    >
      {isActive ? (
        <motion.span
          layoutId="nav-active-pill"
          aria-hidden
          className="absolute inset-x-0.5 inset-y-0 rounded-2xl bg-primary/10 dark:bg-primary/15"
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 480, damping: 34, mass: 0.7 }
          }
        />
      ) : null}

      {/* Fixed icon slot — badges sit inside so layout never shifts */}
      <motion.span
        className="relative flex h-7 w-7 shrink-0 items-center justify-center"
        whileTap={{ scale: 0.9 }}
        animate={reduceMotion ? undefined : { scale: isActive ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 22 }}
      >
        {isActive ? (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-primary/20 blur-md dark:bg-primary/25"
          />
        ) : null}

        {avatar ? (
          <ProfileGlyph
            isActive={isActive}
            avatarUrl={avatarUrl}
            fallback={fallback ?? '·'}
          />
        ) : (
          <>
            <Icon
              className={cn(
                'relative h-[22px] w-[22px] transition-colors duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground group-active:text-foreground/70',
              )}
              strokeWidth={isActive ? 2.25 : 1.75}
              fill={isActive ? 'currentColor' : 'none'}
              fillOpacity={isActive ? 0.12 : 0}
            />
            {tab.key === 'messages' ? (
              <MessagesIndicators
                unread={unread}
                sender={unreadSender}
                reduceMotion={reduceMotion}
              />
            ) : null}
          </>
        )}
      </motion.span>

      <span
        className={cn(
          'relative max-w-full truncate px-0.5 text-[10px] leading-none transition-colors duration-200',
          isActive
            ? 'font-semibold text-foreground'
            : 'font-medium text-muted-foreground',
        )}
      >
        {label}
      </span>
    </Link>
  );
}

function ProfileGlyph({
  isActive,
  avatarUrl,
  fallback,
}: {
  isActive: boolean;
  avatarUrl: string | null;
  fallback: string;
}) {
  return (
    <span
      className={cn(
        'relative h-[22px] w-[22px] overflow-hidden rounded-full transition-all duration-200',
        isActive
          ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
          : 'ring-1 ring-border',
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <span className="grid h-full w-full place-items-center bg-muted text-[9px] font-semibold text-muted-foreground">
          {fallback}
        </span>
      )}
    </span>
  );
}

function MessagesIndicators({
  unread,
  sender,
  reduceMotion,
}: {
  unread: number;
  sender?: ChatMember;
  reduceMotion: boolean;
}) {
  if (unread <= 0) return null;
  const count = unread > 99 ? '99+' : String(unread);

  return (
    <>
      {sender ? (
        <span className="absolute -bottom-0.5 -right-1 grid h-3.5 w-3.5 place-items-center overflow-hidden rounded-full ring-[1.5px] ring-background">
          {sender.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sender.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <span className="grid h-full w-full place-items-center bg-muted text-[7px] font-bold text-muted-foreground">
              {initials(sender)}
            </span>
          )}
        </span>
      ) : null}

      <span className="absolute -top-1 -right-1.5">
        {!reduceMotion ? (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-destructive"
            animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        ) : null}
        <span className="relative flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold leading-none text-white ring-[1.5px] ring-background">
          {count}
        </span>
      </span>
    </>
  );
}
