'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Pin, Search } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Link } from '@/i18n/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/chat/user-avatar';
import { useChatStore } from '@/stores/chat-store';
import type { Conversation } from '@/components/chat/types';
import { conversationSortKey, previewFromLastMessage } from '@/components/chat/utils';
import { cn } from '@/lib/utils';

function ConversationListSkeleton() {
  return (
    <div className="flex flex-col gap-1 p-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl px-3 py-3">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationEmpty({ query }: { query: string }) {
  const t = useTranslations('messages');
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted text-2xl">💬</div>
      <p className="text-lg font-semibold">{query ? t('noResults') : t('emptyListTitle')}</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        {query ? t('noResultsBody') : t('emptyListBody')}
      </p>
    </div>
  );
}

function ConversationRow({
  conversation,
  unread,
  typingLabel,
  isPinned,
  online,
}: {
  conversation: Conversation;
  unread: number;
  typingLabel?: string | null;
  isPinned: boolean;
  online?: boolean;
}) {
  const member = conversation.otherMember;
  const displayName = member?.name ?? member?.username ?? 'Unknown';
  const preview = typingLabel ?? previewFromLastMessage(conversation.lastMessage);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={`/messages/${conversation.id}`}
        className={cn(
          'flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors duration-200',
          'hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          unread > 0 && 'bg-primary/5',
        )}
      >
        <UserAvatar src={member?.avatarUrl} name={displayName} online={online} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={cn('truncate text-sm font-semibold', unread > 0 && 'text-foreground')}>
              {displayName}
            </p>
            {isPinned ? <Pin className="size-3 shrink-0 text-muted-foreground" /> : null}
          </div>
          <p
            className={cn(
              'truncate text-sm',
              typingLabel ? 'text-primary' : 'text-muted-foreground',
              unread > 0 && !typingLabel && 'font-medium text-foreground',
            )}
          >
            {preview}
          </p>
        </div>
        {unread > 0 ? (
          <Badge className="min-w-5 justify-center rounded-full px-1.5">{unread > 99 ? '99+' : unread}</Badge>
        ) : null}
      </Link>
    </motion.div>
  );
}

export function ConversationList({ locale }: { locale: string }) {
  const t = useTranslations('messages');
  const [query, setQuery] = useState('');
  const pinnedIds = useChatStore((s) => s.pinnedConversationIds);
  const unreadMap = useChatStore((s) => s.unreadByConversation);
  const typingMap = useChatStore((s) => s.typingByConversation);
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);

  const { data, isLoading } = useQuery({
    queryKey: ['conversations', locale],
    queryFn: () => api<Conversation[]>('/conversations', { locale }),
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = query.trim().toLowerCase();
    const searched = q
      ? list.filter((item) => {
          const name = item.otherMember?.name?.toLowerCase() ?? '';
          const username = item.otherMember?.username?.toLowerCase() ?? '';
          return name.includes(q) || username.includes(q);
        })
      : list;

    return [...searched].sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id);
      const bPinned = pinnedIds.includes(b.id);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      return conversationSortKey(b) - conversationSortKey(a);
    });
  }, [data, pinnedIds, query]);

  return (
    <div className="flex h-full min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          {Object.values(unreadMap).reduce((sum, n) => sum + n, 0) > 0 ? (
            <Badge variant="secondary">{Object.values(unreadMap).reduce((sum, n) => sum + n, 0)}</Badge>
          ) : null}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search')}
            className="h-11 rounded-2xl border-border bg-muted/40 pl-9"
            aria-label={t('search')}
          />
        </div>
      </header>

      {isLoading ? (
        <ConversationListSkeleton />
      ) : filtered.length === 0 ? (
        <ConversationEmpty query={query} />
      ) : (
        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pb-24">
          {filtered.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              unread={unreadMap[conversation.id] ?? 0}
              typingLabel={typingMap[conversation.id]}
              isPinned={pinnedIds.includes(conversation.id)}
              online={conversation.otherMember?.id ? onlineUserIds.has(conversation.otherMember.id) : false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
