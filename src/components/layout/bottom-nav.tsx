'use client';

import { Home, Stamp, Compass, MessageCircle, Coffee } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Link, usePathname } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { haptic } from '@/lib/mobile/haptics';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useIdentityStore } from '@/stores/identity-store';
import {
  useChatArchiveStore,
  getDisplayUnread,
} from '@/stores/chat-archive-store';
import type { Conversation, ChatMember } from '@/components/chat/types';
import type { OwnerCafe } from '@/lib/api/owner';
import { listOwnerCafes } from '@/lib/api/owner';

type TabKey = 'home' | 'passport' | 'explore' | 'messages' | 'profile';

type NavTab = {
  href: string;
  key: TabKey;
  Icon: typeof Home;
  avatar?: boolean;
};

const TABS: NavTab[] = [
  { href: '/feed', key: 'home', Icon: Home },
  { href: '/passport', key: 'passport', Icon: Stamp },
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
  const { active, cafes, switchToPersonal, switchToCafe, setSwitcherOpen, switcherOpen } =
    useIdentityStore();

  const { data: conversations } = useQuery({
    queryKey: ['conversations', locale],
    queryFn: () => api<Conversation[]>('/conversations', { locale }),
    staleTime: 30_000,
  });

  const { data: ownerCafes } = useQuery({
    queryKey: ['owner-cafes-nav', locale],
    queryFn: () => listOwnerCafes(locale),
    staleTime: 60_000,
  });

  const activeCafe =
    active.type === 'cafe'
      ? cafes.find((c) => c.cafeId === active.cafeId)
      : null;

  const activeConversations = (conversations ?? []).filter((c) => !archivedAt[c.id]);
  const totalUnread = activeConversations.reduce((sum, c) => {
    const unread = getDisplayUnread(c.id, c.unreadCount ?? 0);
    return sum + (c.muted ? 0 : unread);
  }, 0);

  const latestUnreadSender: ChatMember | undefined = activeConversations
    .filter((c) => !c.muted && getDisplayUnread(c.id, c.unreadCount ?? 0) > 0)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))[0]
    ?.otherMember;

  const hasCafes = (ownerCafes?.length ?? 0) > 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
      {/* Cafe switcher pill - above bottom nav */}
      <AnimatePresence>
        {hasCafes && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-auto mx-auto mb-2 w-[min(92vw,430px)]"
          >
            <button
              type="button"
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition-all',
                active.type === 'cafe'
                  ? 'border-amber-300/40 bg-amber-500/10 shadow-sm'
                  : 'border-border/50 bg-background/80 hover:bg-background/95',
              )}
            >
              {activeCafe?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeCafe.logoUrl}
                  alt=""
                  className="h-6 w-6 rounded-lg object-cover"
                />
              ) : (
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-lg',
                    active.type === 'cafe'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Coffee className="h-3.5 w-3.5" />
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-xs font-medium">
                {active.type === 'cafe'
                  ? activeCafe?.name ?? 'Cafe'
                  : t('switchToCafe')}
              </span>
              {active.type === 'cafe' && (
                <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                  {t('cafeMode')}
                </span>
              )}
            </button>

            {/* Expanded switcher */}
            <AnimatePresence>
              {switcherOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1 overflow-hidden rounded-2xl border border-border bg-background/95 shadow-lg backdrop-blur-xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      switchToPersonal();
                      haptic('selection');
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors hover:bg-muted',
                      active.type === 'personal' && 'bg-muted',
                    )}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-[10px] font-bold text-muted-foreground">
                      {initials(user ?? undefined)}
                    </span>
                    <span className="flex-1 font-medium">{t('personalAccount')}</span>
                    {active.type === 'personal' && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                  {ownerCafes?.map(({ cafe }) => (
                    <button
                      key={cafe.id}
                      type="button"
                      onClick={() => {
                        switchToCafe(cafe.id);
                        haptic('selection');
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 border-t border-border px-3 py-2.5 text-left text-xs transition-colors hover:bg-muted',
                        active.type === 'cafe' && active.cafeId === cafe.id && 'bg-muted',
                      )}
                    >
                      {cafe.photos?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cafe.photos[0].url}
                          alt=""
                          className="h-6 w-6 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                          <Coffee className="h-3 w-3" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {cafe.name}
                      </span>
                      {active.type === 'cafe' && active.cafeId === cafe.id && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

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
              fallback={tab.avatar ? initials(user ?? undefined) : undefined}
            />
          );
        })}
      </div>
    </div>
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
