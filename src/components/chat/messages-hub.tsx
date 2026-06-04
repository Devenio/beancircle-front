'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Filter, Search, Sparkles, X } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useChatStore } from '@/stores/chat-store';
import { useChatArchiveStore, getDisplayUnread } from '@/stores/chat-archive-store';
import { MessagesInboxTabs, type InboxTab } from '@/components/chat/messages-inbox-tabs';
import { ArchivePreviewSection } from '@/components/chat/archive-preview-section';
import { MessagesEmptyState } from '@/components/chat/messages-empty-state';
import { ArchivedEmptyPanel } from '@/components/chat/archived-empty-panel';
import { SwipeableConversationRow } from '@/components/chat/swipeable-conversation-row';
import { SwipeableArchivedRow } from '@/components/chat/swipeable-archived-row';
import { ConversationActionsSheet } from '@/components/chat/conversation-actions-sheet';
import { ArchivedActionsSheet } from '@/components/chat/archived-actions-sheet';
import { ArchiveFilterSheet } from '@/components/chat/archive-filter-sheet';
import { VirtualConversationList } from '@/components/chat/virtual-conversation-list';
import { ArchiveBulkActionsSheet } from '@/components/chat/archive-bulk-actions-sheet';
import type { Conversation } from '@/components/chat/types';
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

export function MessagesHub({
  locale,
  initialTab = 'chats',
}: {
  locale: string;
  initialTab?: InboxTab;
}) {
  const t = useTranslations('messages');
  const qc = useQueryClient();
  const [tab, setTab] = useState<InboxTab>(initialTab);
  const [query, setQuery] = useState('');
  const [archiveCollapsed, setArchiveCollapsed] = useState(true);
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilterId>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [sheetConv, setSheetConv] = useState<Conversation | null>(null);
  const [archivedSheetConv, setArchivedSheetConv] = useState<Conversation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

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

  const archivedIds = useMemo(() => new Set(Object.keys(archivedAt)), [archivedAt]);
  const archivedCount = archivedIds.size;

  const activeChats = useMemo(
    () => (data ?? []).filter((c) => !archivedIds.has(c.id)),
    [data, archivedIds],
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
        query: tab === 'archived' ? query : '',
        filter: archiveFilter,
        archivedAt,
        forceUnreadIds,
      }),
    [archivedChats, query, tab, archiveFilter, archivedAt, forceUnreadIds],
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
    setTab('chats');
  }, [archivedChats, unarchive]);

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
      await api(`/conversations/${c.id}/messages`, { method: 'DELETE', locale });
      unarchive(c.id);
    }
    setDeleteAllOpen(false);
    qc.invalidateQueries({ queryKey: ['conversations'] });
    haptic('success');
  }, [archivedChats, locale, qc, unarchive]);

  const confirmDeleteOne = useCallback(async () => {
    if (!deleteTarget) return;
    await api(`/conversations/${deleteTarget.id}/messages`, { method: 'DELETE', locale });
    unarchive(deleteTarget.id);
    setDeleteTarget(null);
    qc.invalidateQueries({ queryKey: ['conversations'] });
    haptic('success');
  }, [deleteTarget, locale, qc, unarchive]);

  const searchPlaceholder = tab === 'chats' ? t('search') : t('searchArchivedPlaceholder');

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
                onLongPress={() => setArchivedSheetConv(conversation)}
                onUnarchive={() => handleUnarchive(conversation.id)}
                onMute={() =>
                  muteMutation.mutate({ id: conversation.id, muted: !conversation.muted })
                }
                onDelete={() => setDeleteTarget(conversation)}
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
                onLongPress={() => setArchivedSheetConv(conversation)}
                onUnarchive={() => handleUnarchive(conversation.id)}
                onMute={() =>
                  muteMutation.mutate({ id: conversation.id, muted: !conversation.muted })
                }
                onDelete={() => setDeleteTarget(conversation)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          {tab === 'chats' && chatsUnread > 0 ? (
            <Badge variant="secondary">{chatsUnread > 99 ? '99+' : chatsUnread}</Badge>
          ) : null}
        </div>
        <div className="px-4 pb-3">
          <MessagesInboxTabs
            value={tab}
            onChange={(next) => {
              setTab(next);
              setQuery('');
            }}
            chatsUnread={chatsUnread}
            archivedUnread={archivedUnread}
          />
        </div>
        <div className="px-4 pb-3">
          <div className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-muted/40 px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-full min-h-0 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query ? (
              <button
                type="button"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted"
                onClick={() => setQuery('')}
                aria-label={t('clearSearch')}
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>
        {tab === 'archived' ? (
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
          {tab === 'chats' ? (
            <motion.div
              key="chats"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.15 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              {inactiveSuggestion[0] && !query ? (
                <div className="mx-3 mt-2 flex items-start gap-2 rounded-2xl border border-border/80 bg-muted/40 px-3 py-2.5">
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

              <ArchivePreviewSection
                conversations={archivedChats}
                archivedAt={archivedAt}
                collapsed={archiveCollapsed}
                onCollapsedChange={setArchiveCollapsed}
                onViewAll={() => setTab('archived')}
                onUnarchive={handleUnarchive}
                onUnarchiveAll={unarchiveAll}
                onMarkAllRead={() => void markAllArchivedRead()}
                onDeleteAll={() => setDeleteAllOpen(true)}
              />

              {isLoading ? (
                <ListSkeleton />
              ) : filteredActive.length === 0 ? (
                <MessagesEmptyState
                  query={query}
                  archivedCount={archivedCount}
                  onViewArchived={() => setTab('archived')}
                />
              ) : (
                <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pb-24 chat-scrollbar">
                  <AnimatePresence initial={false}>
                    {filteredActive.map((conversation) => (
                      <motion.div
                        key={conversation.id}
                        layout
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
                          onLongPress={() => setSheetConv(conversation)}
                          onMarkRead={() => void markRead(conversation)}
                          onMute={() =>
                            muteMutation.mutate({
                              id: conversation.id,
                              muted: !conversation.muted,
                            })
                          }
                          onArchive={() => archiveConv(conversation)}
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
              className="flex min-h-0 flex-1 flex-col"
            >
              {archivedCount > 0 ? (
                <button
                  type="button"
                  className="mx-3 mt-2 text-start text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => setBulkOpen(true)}
                >
                  {t('archiveBulkActionsHint')}
                </button>
              ) : null}
              {renderArchivedList()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConversationActionsSheet
        open={Boolean(sheetConv)}
        onOpenChange={(open) => !open && setSheetConv(null)}
        conversation={sheetConv}
        onMarkRead={() => sheetConv && void markRead(sheetConv)}
        onTogglePin={() =>
          sheetConv && pinMutation.mutate({ id: sheetConv.id, pinned: !sheetConv.pinned })
        }
        onToggleMute={() =>
          sheetConv && muteMutation.mutate({ id: sheetConv.id, muted: !sheetConv.muted })
        }
        onArchive={() => sheetConv && archiveConv(sheetConv)}
      />

      <ArchivedActionsSheet
        open={Boolean(archivedSheetConv)}
        onOpenChange={(open) => !open && setArchivedSheetConv(null)}
        conversation={archivedSheetConv}
        onUnarchive={() => archivedSheetConv && handleUnarchive(archivedSheetConv.id)}
        onDelete={() => archivedSheetConv && setDeleteTarget(archivedSheetConv)}
        onToggleMute={() =>
          archivedSheetConv &&
          muteMutation.mutate({ id: archivedSheetConv.id, muted: !archivedSheetConv.muted })
        }
        onTogglePin={() =>
          archivedSheetConv &&
          pinMutation.mutate({ id: archivedSheetConv.id, pinned: !archivedSheetConv.pinned })
        }
        onMarkUnread={() => {
          if (!archivedSheetConv) return;
          if ((archivedSheetConv.unreadCount ?? 0) > 0) void markRead(archivedSheetConv);
          else markForceUnread(archivedSheetConv.id);
        }}
      />

      <ArchiveFilterSheet open={filterOpen} onOpenChange={setFilterOpen} value={archiveFilter} onChange={setArchiveFilter} />

      <ArchiveBulkActionsSheet
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        count={archivedCount}
        onUnarchiveAll={unarchiveAll}
        onMarkAllRead={() => void markAllArchivedRead()}
        onDeleteAll={() => setDeleteAllOpen(true)}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteChat')}</DialogTitle>
            <DialogDescription>{t('deleteChatDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={() => void confirmDeleteOne()}>
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteAllArchived')}</DialogTitle>
            <DialogDescription>
              {t('deleteAllArchivedConfirm', { count: archivedCount })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteAllOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={() => void deleteAllArchived()}>
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
