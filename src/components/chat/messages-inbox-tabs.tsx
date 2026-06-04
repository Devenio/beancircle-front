'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type InboxTab = 'chats' | 'archived';

export function MessagesInboxTabs({
  value,
  onChange,
  chatsUnread,
  archivedUnread,
}: {
  value: InboxTab;
  onChange: (tab: InboxTab) => void;
  chatsUnread: number;
  archivedUnread: number;
}) {
  const t = useTranslations('messages');

  const tabs: { id: InboxTab; label: string; badge: number }[] = [
    { id: 'chats', label: t('inboxTabChats'), badge: chatsUnread },
    { id: 'archived', label: t('inboxTabArchived'), badge: archivedUnread },
  ];

  return (
    <div
      className="relative flex rounded-xl bg-muted/60 p-1"
      role="tablist"
      aria-label={t('inboxTabsLabel')}
    >
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative z-10 flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {active ? (
              <motion.span
                layoutId="inbox-tab-pill"
                className="absolute inset-0 rounded-lg bg-background shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            ) : null}
            <span className="relative z-10">{tab.label}</span>
            {tab.badge > 0 ? (
              <Badge
                variant={active ? 'default' : 'secondary'}
                className="relative z-10 h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]"
              >
                {tab.badge > 99 ? '99+' : tab.badge}
              </Badge>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
