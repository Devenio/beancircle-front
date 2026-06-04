'use client';

import { useMemo, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { MessageCircle, Search } from 'lucide-react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { api } from '@/lib/api/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatStore } from '@/stores/chat-store';
import { SwipeableConversationRow } from '@/components/chat/swipeable-conversation-row';
import { ConversationActionsSheet } from '@/components/chat/conversation-actions-sheet';
import type { Conversation } from '@/components/chat/types';
import { conversationSortKey } from '@/components/chat/utils';
import { haptic } from '@/lib/mobile/haptics';

const ARCHIVED_KEY = 'chat.archived.ids';

function readArchived(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(ARCHIVED_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function ConversationListSkeleton() {
  return (
    <div className="flex flex-col gap-1 p-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex min-h-[56px] items-center gap-3 rounded-2xl px-3 py-3">
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
    <Empty className="border-0 px-6 py-20">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageCircle />
        </EmptyMedia>
        <EmptyTitle className="text-lg">
          {query ? t('noResults') : t('emptyListTitle')}
        </EmptyTitle>
        <EmptyDescription className="max-w-xs">
          {query ? t('noResultsBody') : t('emptyListBody')}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function ConversationList({ locale }: { locale: string }) {
  const t = useTranslations('messages');
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [archived, setArchived] = useState<Set<string>>(() => readArchived());
  const [sheetConv, setSheetConv] = useState<Conversation | null>(null);
  const typingMap = useChatStore((s) => s.typingByConversation);
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);

  const { data, isLoading } = useQuery({
    queryKey: ['conversations', locale],
    queryFn: () => api<Conversation[]>('/conversations', { locale }),
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      api(`/conversations/${id}/pin`, {
        method: 'POST',
        body: JSON.stringify({ pinned }),
        locale,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const muteMutation = useMutation({
    mutationFn: ({ id, muted }: { id: string; muted: boolean }) =>
      api(`/conversations/${id}/mute`, {
        method: 'POST',
        body: JSON.stringify({ muted }),
        locale,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const markRead = useCallback(
    async (conv: Conversation) => {
      await api(`/conversations/${conv.id}/read`, {
        method: 'POST',
        body: JSON.stringify({ lastMessageId: conv.lastMessage?.id }),
        locale,
      });
      haptic('success');
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    [locale, qc],
  );

  const archiveConv = useCallback((conv: Conversation) => {
    setArchived((prev) => {
      const next = new Set(prev);
      next.add(conv.id);
      localStorage.setItem(ARCHIVED_KEY, JSON.stringify([...next]));
      return next;
    });
    haptic('light');
  }, []);

  const filtered = useMemo(() => {
    const list = (data ?? []).filter((c) => !archived.has(c.id));
    const q = query.trim().toLowerCase();
    const searched = q
      ? list.filter((item) => {
          const name = item.otherMember?.name?.toLowerCase() ?? '';
          const username = item.otherMember?.username?.toLowerCase() ?? '';
          return name.includes(q) || username.includes(q);
        })
      : list;

    return [...searched].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return conversationSortKey(b) - conversationSortKey(a);
    });
  }, [data, query, archived]);

  const totalUnread = useMemo(
    () => (data ?? []).reduce((sum, c) => sum + (c.muted ? 0 : c.unreadCount ?? 0), 0),
    [data],
  );

  return (
    <div className="flex h-full min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          {totalUnread > 0 ? (
            <Badge variant="secondary">{totalUnread > 99 ? '99+' : totalUnread}</Badge>
          ) : null}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search')}
            className="h-12 min-h-[48px] rounded-2xl border-border bg-muted/40 pl-9 text-base"
            aria-label={t('search')}
          />
        </div>
      </header>

      {isLoading ? (
        <ConversationListSkeleton />
      ) : filtered.length === 0 ? (
        <ConversationEmpty query={query} />
      ) : (
        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pb-24 chat-scrollbar">
          {filtered.map((conversation) => (
            <SwipeableConversationRow
              key={conversation.id}
              conversation={conversation}
              typingLabel={typingMap[conversation.id]}
              online={
                conversation.otherMember?.id
                  ? onlineUserIds.has(conversation.otherMember.id)
                  : false
              }
              onLongPress={() => {
                haptic('medium');
                setSheetConv(conversation);
              }}
              onMarkRead={() => void markRead(conversation)}
              onMute={() =>
                muteMutation.mutate({ id: conversation.id, muted: !conversation.muted })
              }
              onArchive={() => archiveConv(conversation)}
            />
          ))}
        </div>
      )}

      <ConversationActionsSheet
        open={Boolean(sheetConv)}
        onOpenChange={(open) => !open && setSheetConv(null)}
        conversation={sheetConv}
        onMarkRead={() => sheetConv && void markRead(sheetConv)}
        onTogglePin={() =>
          sheetConv &&
          pinMutation.mutate({ id: sheetConv.id, pinned: !sheetConv.pinned })
        }
        onToggleMute={() =>
          sheetConv &&
          muteMutation.mutate({ id: sheetConv.id, muted: !sheetConv.muted })
        }
        onArchive={() => sheetConv && archiveConv(sheetConv)}
      />
    </div>
  );
}
