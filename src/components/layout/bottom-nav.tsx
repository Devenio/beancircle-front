'use client';

import { Home, PlusSquare, Search, MessageCircle, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

const tabs = [
  { href: '/', icon: Home, key: 'home' as const },
  { href: '/explore', icon: Search, key: 'explore' as const },
  { href: '/create', icon: PlusSquare, key: 'create' as const },
  { href: '/messages', icon: MessageCircle, key: 'messages' as const },
  { href: '/profile', icon: User, key: 'profile' as const },
];

export function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[430px] -translate-x-1/2 items-center justify-around border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] pt-2">
      {tabs.map(({ href, icon: Icon, key }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${active ? 'text-neutral-900' : 'text-neutral-500'}`}
          >
            <motion.span
              animate={{ scale: active ? 1.08 : 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            >
              <Icon className="h-6 w-6" />
            </motion.span>
            <span>{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
