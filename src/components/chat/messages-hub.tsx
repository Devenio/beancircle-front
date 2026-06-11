'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ChevronLeft, Filter, Search, Sparkles, X } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteForPeerDialog } from '@/components/chat/delete-for-peer-dialog';
import { useChatStore } from '@/stores/chat-store';
import { useChatArchiveStore, getDisplayUnread } from '@/stores/chat-archive-store';
import { ArchivePreviewSection } from '@/components/chat/archive-preview-section';
import { MessagesEmptyState } from '@/components/chat/messages-empty-state';
import { ArchivedEmptyPanel } from '@/components/chat/archived-empty-panel';
import { SwipeableConversationRow } from '@/components/chat/swipeable-conversation-row';
import { SwipeableArchivedRow } from '@/components/chat/swipeable-archived-row';
import { ArchiveFilterSheet } from '@/components/chat/archive-filter-sheet';
import { VirtualConversationList } from '@/components/chat/virtual-conversation-list';
import { ArchiveBulkActionsContextMenu } from '@/components/chat/archive-bulk-actions-context-menu';
import { UserSearchResults, type SearchUser } from '@/components/chat/user-search-results';
import type { Conversation } from '@/components/chat/types';
import { useAuthStore } from '@/stores/auth-store';
import { conversationSortKey } from '@/components/chat/utils';
import { filterArchivedList, inactiveConversationSuggestions, type ArchiveFilterId } from '@/lib/chat-archive';
import { haptic } from '@/lib/mobile/haptics';

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-1 p-3">
      {Array.from({ length: 6 }).map((_, i) => (
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

export function MessagesHub({ locale }: { locale: string }) {
  const t = useTranslations('messages');
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const isArchivedView = pathname.startsWith('/messages/archived');
  const [query, setQuery] = useState('');
  const [archiveCollapsed, setArchiveCollapsed] = useState(true);
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilterId>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [deleteAlsoForPeer, setDeleteAlsoForPeer] = useState(false);
  const [deleteAllAlsoForPeer, setDeleteAllAlsoForPeer] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [startingUserId, setStartingUserId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  const currentUserId = useAuthStore((s) => s.user?.id);

  const archivedAt = useChatArchiveStore((s) => s.archivedAt);
  const forceUnreadIds = useChatArchiveStore((s) => s.forceUnreadIds);
  const archive = useChatArchiveStore((s) => s.archive);
  const unarchive = useChatArchiveStore((s) => s.unarchive);
  const markForceUnread = useChatArchiveStore((s) => s.markForceUnread);
  const clearForceUnread = useChatArchiveStore((s) => s.clearForceUnread);
  const lastOpenedAt = useChatArchiveStore((s) => s.lastOpenedAt);

  const typingMap = useChatStore((s) => s.typingByConversation);
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);

  const { data, isLoading } = useQuery({
    queryKey: ['conversations', locale],
    queryFn: () => api<Conversation[]>('/conversations', { locale }),
  });

  const trimmedQuery = query.trim();
  const isUserSearch = !isArchivedView && trimmedQuery.length >= 2;

  const { data: searchData, isFetching: isSearchingUsers } = useQuery({
    queryKey: ['search', 'messages', trimmedQuery, locale],
    queryFn: () =>
      api<{ users: SearchUser[] }>(`/search?q=${encodeURIComponent(trimmedQuery)}`, { locale }),
    enabled: isUserSearch,
    staleTime: 30_000,
  });

  const startChatMutation = useMutation({
    mutationFn: (participantId: string) =>
      api<{ id: string }>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ participantId }),
        locale,
      }),
    onMutate: (participantId) => {
      setStartingUserId(participantId);
    },
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setQuery('');
      setChatError(null);
      haptic('success');
      router.push(`/messages/${conv.id}`);
    },
    onError: (err: Error) => {
      const msg = err.message.toLowerCase();
      if (msg.includes('block')) {
        setChatError(t('messageBlocked'));
      } else {
        setChatError(err.message || t('messageStartFailed'));
      }
      haptic('error');
    },
    onSettled: () => {
      setStartingUserId(null);
    },
  });

  const archivedIds = useMemo(() => new Set(Object.keys(archivedAt)), [archivedAt]);
  const archivedCount = archivedIds.size;

  const activeChats = useMemo(
    () => (data ?? []).filter((c) => !archivedIds.has(c.id)),
    [data, archivedIds],
  );

  const activePeerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const chat of activeChats) {
      if (chat.otherMember?.id) ids.add(chat.otherMember.id);
    }
    return ids;
  }, [activeChats]);

  const newUsers = useMemo(() => {
    if (!isUserSearch || !searchData?.users) return [];
    return searchData.users.filter(
      (user) => user.id && user.id !== currentUserId && !activePeerIds.has(user.id),
    );
  }, [activePeerIds, currentUserId, isUserSearch, searchData?.users]);

  const existingChatUserIds = useMemo(() => {
    const ids = new Set<string>();
    for (const chat of data ?? []) {
      if (chat.otherMember?.id) ids.add(chat.otherMember.id);
    }
    return ids;
  }, [data]);

  const findConversationForUser = useCallback(
    (userId: string) =>
      (data ?? []).find((conversation) => conversation.otherMember?.id === userId),
    [data],
  );

  const handleStartChat = useCallback(
    (user: SearchUser) => {
      if (!user.id || startChatMutation.isPending) return;
      setChatError(null);
      const existing = findConversationForUser(user.id);
      if (existing) {
        if (archivedIds.has(existing.id)) {
          unarchive(existing.id);
        }
        setQuery('');
        haptic('success');
        router.push(`/messages/${existing.id}`);
        return;
      }
      startChatMutation.mutate(user.id);
    },
    [archivedIds, findConversationForUser, router, startChatMutation, unarchive],
  );

  const archivedChats = useMemo(
    () => (data ?? []).filter((c) => archivedIds.has(c.id)),
    [data, archivedIds],
  );

  const filteredActive = useMemo(() => {
    const q = query.trim().toLowerCase();
    const searched = q
      ? activeChats.filter((item) => {
          const name = item.otherMember?.name?.toLowerCase() ?? '';
          const username = item.otherMember?.username?.toLowerCase() ?? '';
          const preview = (item.lastMessage?.body ?? '').toLowerCase();
          return name.includes(q) || username.includes(q) || preview.includes(q);
        })
      : activeChats;
    return [...searched].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return conversationSortKey(b) - conversationSortKey(a);
    });
  }, [activeChats, query]);

  const filteredArchived = useMemo(
    () =>
      filterArchivedList(archivedChats, {
        query: isArchivedView ? query : '',
        filter: archiveFilter,
        archivedAt,
        forceUnreadIds,
      }),
    [archivedChats, query, isArchivedView, archiveFilter, archivedAt, forceUnreadIds],
  );

  const chatsUnread = useMemo(
    () =>
      activeChats.reduce((sum, c) => {
        const unread = getDisplayUnread(c.id, c.unreadCount ?? 0);
        return sum + (c.muted ? 0 : unread);
      }, 0),
    [activeChats],
  );

  const archivedUnread = useMemo(
    () =>
      archivedChats.reduce((sum, c) => {
        const unread = getDisplayUnread(c.id, c.unreadCount ?? 0);
        return sum + (c.muted ? 0 : unread);
      }, 0),
    [archivedChats],
  );

  const inactiveSuggestion = useMemo(
    () => inactiveConversationSuggestions(data ?? [], lastOpenedAt, archivedAt).slice(0, 1),
    [data, lastOpenedAt, archivedAt],
  );

  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      api(`/conversations/${id}/pin`, {
        method: 'POST',
        body: JSON.stringify({ pinned }),
        locale,
      }),
    onMutate: async ({ id, pinned }) => {
      await qc.cancelQueries({ queryKey: ['conversations', locale] });
      const previous = qc.getQueryData<Conversation[]>(['conversations', locale]);
      qc.setQueryData<Conversation[]>(['conversations', locale], (prev) => {
        if (!prev) return prev;
        return prev.map((c) => (c.id === id ? { ...c, pinned } : c));
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['conversations', locale], ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
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
      clearForceUnread(conv.id);
      haptic('success');
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    [clearForceUnread, locale, qc],
  );

  const archiveConv = useCallback(
    (conv: Conversation) => {
      archive(conv.id);
      haptic('light');
    },
    [archive],
  );

  const handleUnarchive = useCallback(
    (id: string) => {
      unarchive(id);
      haptic('success');
    },
    [unarchive],
  );

  const unarchiveAll = useCallback(() => {
    archivedChats.forEach((c) => unarchive(c.id));
    router.push('/messages');
  }, [archivedChats, router, unarchive]);

  const markAllArchivedRead = useCallback(async () => {
    await Promise.all(
      archivedChats
        .filter((c) => (c.unreadCount ?? 0) > 0)
        .map((c) =>
          api(`/conversations/${c.id}/read`, {
            method: 'POST',
            body: JSON.stringify({ lastMessageId: c.lastMessage?.id }),
            locale,
          }),
        ),
    );
    archivedChats.forEach((c) => clearForceUnread(c.id));
    qc.invalidateQueries({ queryKey: ['conversations'] });
  }, [archivedChats, clearForceUnread, locale, qc]);

  const deleteAllArchived = useCallback(async () => {
    for (const c of archivedChats) {
      await api(`/conversations/${c.id}/messages`, {
        method: 'DELETE',
        body: JSON.stringify({ forEveryone: deleteAllAlsoForPeer }),
        locale,
      });
      unarchive(c.id);
    }
    setDeleteAllOpen(false);
    setDeleteAllAlsoForPeer(false);
    qc.invalidateQueries({ queryKey: ['conversations'] });
    haptic('success');
  }, [archivedChats, deleteAllAlsoForPeer, locale, qc, unarchive]);

  const confirmDeleteOne = useCallback(async () => {
    if (!deleteTarget) return;
    await api(`/conversations/${deleteTarget.id}/messages`, {
      method: 'DELETE',
      body: JSON.stringify({ forEveryone: deleteAlsoForPeer }),
      locale,
    });
    unarchive(deleteTarget.id);
    setDeleteTarget(null);
    setDeleteAlsoForPeer(false);
    qc.invalidateQueries({ queryKey: ['conversations'] });
    haptic('success');
  }, [deleteAlsoForPeer, deleteTarget, locale, qc, unarchive]);

  const searchPlaceholder = isArchivedView ? t('searchArchivedPlaceholder') : t('search');
  const goToArchived = useCallback(() => router.push('/messages/archived'), [router]);

  const renderArchivedList = () => {
    if (isLoading) return <ListSkeleton />;
    if (filteredArchived.length === 0) {
      return (
        <ArchivedEmptyPanel query={query} filterActive={archiveFilter !== 'all'} />
      );
    }
    if (filteredArchived.length > 24) {
      return (
        <VirtualConversationList
          count={filteredArchived.length}
          renderRow={(index) => {
            const conversation = filteredArchived[index];
            return (
              <SwipeableArchivedRow
                key={conversation.id}
                conversation={conversation}
                typingLabel={typingMap[conversation.id]}
                online={
                  conversation.otherMember?.id
                    ? onlineUserIds.has(conversation.otherMember.id)
                    : false
                }
                onUnarchive={() => handleUnarchive(conversation.id)}
                onMute={() =>
                  muteMutation.mutate({ id: conversation.id, muted: !conversation.muted })
                }
                onTogglePin={() =>
                  pinMutation.mutate({ id: conversation.id, pinned: !conversation.pinned })
                }
                onToggleRead={() => {
                  if ((conversation.unreadCount ?? 0) > 0) void markRead(conversation);
                  else markForceUnread(conversation.id);
                }}
                onDelete={() => {
                  setDeleteAlsoForPeer(false);
                  setDeleteTarget(conversation);
                }}
              />
            );
          }}
        />
      );
    }
    return (
      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pb-24 chat-scrollbar">
        <AnimatePresence initial={false}>
          {filteredArchived.map((conversation) => (
            <motion.div
              key={conversation.id}
              layout
              exit={{ opacity: 0, x: 48, transition: { duration: 0.18 } }}
            >
              <SwipeableArchivedRow
                conversation={conversation}
                typingLabel={typingMap[conversation.id]}
                online={
                  conversation.otherMember?.id
                    ? onlineUserIds.has(conversation.otherMember.id)
                    : false
                }
                onUnarchive={() => handleUnarchive(conversation.id)}
                onMute={() =>
                  muteMutation.mutate({ id: conversation.id, muted: !conversation.muted })
                }
                onTogglePin={() =>
                  pinMutation.mutate({ id: conversation.id, pinned: !conversation.pinned })
                }
                onToggleRead={() => {
                  if ((conversation.unreadCount ?? 0) > 0) void markRead(conversation);
                  else markForceUnread(conversation.id);
                }}
                onDelete={() => {
                  setDeleteAlsoForPeer(false);
                  setDeleteTarget(conversation);
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md">
        <div className="flex items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
          {isArchivedView ? (
            <button
              type="button"
              onClick={() => router.push('/messages')}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground active:bg-muted"
              aria-label={t('backToConversations')}
            >
              <ChevronLeft className="size-5 rtl:rotate-180" />
            </button>
          ) : null}
          <h1 className="min-w-0 flex-1 text-2xl font-bold tracking-tight">
            {isArchivedView ? t('inboxTabArchived') : t('title')}
          </h1>
          {!isArchivedView && chatsUnread > 0 ? (
            <Badge variant="secondary">{chatsUnread > 99 ? '99+' : chatsUnread}</Badge>
          ) : isArchivedView && archivedUnread > 0 ? (
            <Badge variant="secondary">{archivedUnread > 99 ? '99+' : archivedUnread}</Badge>
          ) : null}
        </div>
        <div className="px-4 pb-4">
          <div className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-muted/40 px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (chatError) setChatError(null);
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-full min-h-0 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query ? (
              <button
                type="button"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted"
                onClick={() => {
                  setQuery('');
                  setChatError(null);
                }}
                aria-label={t('clearSearch')}
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>
        {isArchivedView ? (
          <div className="flex items-center justify-between px-4 pb-2">
            <p className="text-xs text-muted-foreground">
              {archiveFilter !== 'all'
                ? t('archiveFilterActive', { filter: t(`archiveFilter.${archiveFilter}`) })
                : t('archivedInboxHint')}
            </p>
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary active:bg-muted"
              onClick={() => setFilterOpen(true)}
            >
              <Filter className="size-3.5" />
              {t('archiveFilters')}
            </button>
          </div>
        ) : null}
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait" initial={false}>
          {!isArchivedView ? (
            <motion.div
              key="chats"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.15 }}
              className="flex min-h-0 flex-1 flex-col gap-3 pt-3"
            >
              {inactiveSuggestion[0] && !query ? (
                <div className="mx-3 flex items-start gap-2 rounded-2xl border border-border/80 bg-muted/40 px-3 py-2.5">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{t('archiveSuggestionTitle')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('archiveSuggestionBody', {
                        name:
                          inactiveSuggestion[0].otherMember?.name ??
                          inactiveSuggestion[0].otherMember?.username ??
                          '',
                      })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-8 shrink-0 text-xs"
                    onClick={() => archiveConv(inactiveSuggestion[0])}
                  >
                    {t('archive')}
                  </Button>
                </div>
              ) : null}

              {!isUserSearch ? (
                <ArchivePreviewSection
                  conversations={archivedChats}
                  archivedAt={archivedAt}
                  collapsed={archiveCollapsed}
                  onCollapsedChange={setArchiveCollapsed}
                  onViewAll={goToArchived}
                  onUnarchive={handleUnarchive}
                  onUnarchiveAll={unarchiveAll}
                  onMarkAllRead={() => void markAllArchivedRead()}
                  onDeleteAll={() => {
          setDeleteAllAlsoForPeer(false);
          setDeleteAllOpen(true);
        }}
                />
              ) : null}

              {isLoading ? (
                <ListSkeleton />
              ) : isUserSearch && filteredActive.length === 0 && newUsers.length === 0 && !isSearchingUsers ? (
                <MessagesEmptyState
                  query={query}
                  archivedCount={archivedCount}
                  onViewArchived={goToArchived}
                />
              ) : !isUserSearch && filteredActive.length === 0 ? (
                <MessagesEmptyState
                  query={query}
                  archivedCount={archivedCount}
                  onViewArchived={goToArchived}
                />
              ) : (
                <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pb-24 chat-scrollbar">
                  {isUserSearch ? (
                    <>
                      {isSearchingUsers && newUsers.length === 0 ? (
                        <div className="px-3 py-4">
                          <ListSkeleton />
                        </div>
                      ) : null}
                      <UserSearchResults
                        users={newUsers}
                        startingUserId={startingUserId}
                        existingChatUserIds={existingChatUserIds}
                        errorMessage={chatError}
                        onStartChat={handleStartChat}
                      />
                      {filteredActive.length > 0 ? (
                        <h2 className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t('searchChats')}
                        </h2>
                      ) : null}
                    </>
                  ) : null}
                  <AnimatePresence initial={false}>
                    {filteredActive.map((conversation) => (
                      <motion.div
                        key={conversation.id}
                        layout
                        transition={{ layout: { duration: 0.28, ease: [0.32, 0.72, 0, 1] } }}
                        exit={{ opacity: 0, x: -40, transition: { duration: 0.18 } }}
                      >
                        <SwipeableConversationRow
                          conversation={conversation}
                          typingLabel={typingMap[conversation.id]}
                          online={
                            conversation.otherMember?.id
                              ? onlineUserIds.has(conversation.otherMember.id)
                              : false
                          }
                          onMarkRead={() => void markRead(conversation)}
                          onMute={() =>
                            muteMutation.mutate({
                              id: conversation.id,
                              muted: !conversation.muted,
                            })
                          }
                          onArchive={() => archiveConv(conversation)}
                          onTogglePin={() =>
                            pinMutation.mutate({
                              id: conversation.id,
                              pinned: !conversation.pinned,
                            })
                          }
                          onDelete={() => {
                            setDeleteAlsoForPeer(false);
                            setDeleteTarget(conversation);
                          }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="archived"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="flex min-h-0 flex-1 flex-col pt-3"
            >
              {archivedCount > 0 ? (
                <ArchiveBulkActionsContextMenu
                  count={archivedCount}
                  onUnarchiveAll={unarchiveAll}
                  onMarkAllRead={() => void markAllArchivedRead()}
                  onDeleteAll={() => {
                    setDeleteAllAlsoForPeer(false);
                    setDeleteAllOpen(true);
                  }}
                >
                  <button
                    type="button"
                    className="mx-3 mt-2 text-start text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    {t('archiveBulkActionsHint')}
                  </button>
                </ArchiveBulkActionsContextMenu>
              ) : null}
              {renderArchivedList()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ArchiveFilterSheet open={filterOpen} onOpenChange={setFilterOpen} value={archiveFilter} onChange={setArchiveFilter} />

      <DeleteForPeerDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteAlsoForPeer(false);
          }
        }}
        title={t('deleteChat')}
        description={t('deleteChatDescription')}
        peerName={
          deleteTarget?.otherMember?.name ??
          deleteTarget?.otherMember?.username ??
          t('unknownUser')
        }
        alsoDeleteForPeer={deleteAlsoForPeer}
        onAlsoDeleteForPeerChange={setDeleteAlsoForPeer}
        onConfirm={() => void confirmDeleteOne()}
      />

      <DeleteForPeerDialog
        open={deleteAllOpen}
        onOpenChange={(open) => {
          setDeleteAllOpen(open);
          if (!open) setDeleteAllAlsoForPeer(false);
        }}
        title={t('deleteAllArchived')}
        description={t('deleteAllArchivedConfirm', { count: archivedCount })}
        alsoDeleteLabel={t('alsoDeleteForEveryone')}
        showAlsoDeleteForPeer
        alsoDeleteForPeer={deleteAllAlsoForPeer}
        onAlsoDeleteForPeerChange={setDeleteAllAlsoForPeer}
        onConfirm={() => void deleteAllArchived()}
      />
    </div>
  );
}
