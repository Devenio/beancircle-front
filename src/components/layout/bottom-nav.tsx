'use client';

import { Home, CalendarDays, Compass, MessageCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Link, usePathname } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api/client';
import type { Conversation } from '@/components/chat/types';
import { useChatArchiveStore } from '@/stores/chat-archive-store';
import { getDisplayUnread } from '@/stores/chat-archive-store';

const tabs = [
  { href: '/', icon: Home, key: 'home' as const },
  { href: '/events', icon: CalendarDays, key: 'events' as const },
  { href: '/discover', icon: Compass, key: 'discover' as const },
  { href: '/messages', icon: MessageCircle, key: 'messages' as const },
  { href: '/profile', icon: User, key: 'profile' as const },
];

export function BottomNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const archivedAt = useChatArchiveStore((s) => s.archivedAt);
  const { data: conversations } = useQuery({
    queryKey: ['conversations', locale],
    queryFn: () => api<Conversation[]>('/conversations', { locale }),
    staleTime: 30_000,
  });
  const totalUnread = (conversations ?? []).reduce((sum, c) => {
    if (archivedAt[c.id]) return sum;
    const unread = getDisplayUnread(c.id, c.unreadCount ?? 0);
    return sum + (c.muted ? 0 : unread);
  }, 0);

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[430px] -translate-x-1/2 items-center justify-around border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-md">
      {tabs.map(({ href, icon: Icon, key }) => {
        const active =
          href === '/'
            ? pathname === '/'
            : pathname === href || pathname.startsWith(`${href}/`);
        const showBadge = key === 'messages' && totalUnread > 0;
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${active ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            <motion.span
              animate={{ scale: active ? 1.08 : 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              className="relative"
            >
              <Icon className="h-6 w-6" />
              {showBadge ? (
                <Badge className="absolute -top-1.5 -right-2 h-4 min-w-4 rounded-full px-1 text-[10px]">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </Badge>
              ) : null}
            </motion.span>
            <span>{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
