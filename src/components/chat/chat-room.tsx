'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowDown, Check, Loader2 } from 'lucide-react';
import { ChatMessagesSkeleton } from '@/components/chat/chat-messages-skeleton';
import { ChatHeader } from '@/components/chat/chat-header';
import { ChatComposer } from '@/components/chat/composer';
import { Button } from '@/components/ui/button';
import { PinnedMessageBanner } from '@/components/chat/pinned-message-banner';
import { ChatBlockedBar } from '@/components/chat/chat-blocked-bar';
import { MessageActionsSheet } from '@/components/chat/message-actions-sheet';
import { MediaViewerSheet } from '@/components/chat/attachment-picker-sheet';
import { ForwardPickerSheet } from '@/components/chat/forward-picker-sheet';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { ChatProfileSheet } from '@/components/chat/chat-profile-sheet';
import { MediaComposerModal } from '@/components/chat/media-composer-modal';
import { LocationPickerModal } from '@/components/chat/location-picker-modal';
import { MessageSearchBar } from '@/components/chat/message-search-bar';
import { MessageSelectionHeader } from '@/components/chat/message-selection-header';
import { MessageSelectionBar } from '@/components/chat/message-selection-bar';
import { VirtualMessageList } from '@/components/chat/virtual-message-list';
import type { VirtualMessageListHandlers } from '@/components/chat/virtual-message-row';
import { useChatRoom } from '@/components/chat/hooks/use-chat-room';
import { useChatStore } from '@/stores/chat-store';
import type { ChatMessage, Conversation, PendingMessage } from '@/components/chat/types';
import { groupMessagesBySenderAndDate, isMineMessage, messagePreview } from '@/components/chat/utils';
import { DeleteForPeerDialog } from '@/components/chat/delete-for-peer-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/chat/user-avatar';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/mobile/haptics';
import { useCoarsePointer } from '@/hooks/use-coarse-pointer';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

type ChatRoomProps = {
  conversationId: string;
  locale: string;
};

type ForwardState = Record<string, 'idle' | 'sending' | 'ok' | 'failed'>;

export function ChatRoom({ conversationId, locale }: ChatRoomProps) {
  const t = useTranslations('messages');
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);

  const room = useChatRoom(conversationId, locale);
  const [activeMessage, setActiveMessage] = useState<ChatMessage | PendingMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardSources, setForwardSources] = useState<ChatMessage[]>([]);
  const [forwardTargets, setForwardTargets] = useState<Set<string>>(new Set());
  const [forwardState, setForwardState] = useState<ForwardState>({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);
  const [deleteSelectedAlsoForPeer, setDeleteSelectedAlsoForPeer] = useState(false);
  const [deleteMessageTarget, setDeleteMessageTarget] = useState<ChatMessage | null>(null);
  const [deleteMessageAlsoForPeer, setDeleteMessageAlsoForPeer] = useState(false);
  const [showJumpToUnread, setShowJumpToUnread] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const isNearBottomRef = useRef(true);
  const scrollRafRef = useRef<number | null>(null);
  const messageHandlersRef = useRef<VirtualMessageListHandlers>({
    onReply: () => {},
    onOpenActions: () => {},
    onCopy: () => {},
    onForward: () => {},
    onEdit: () => {},
    onDelete: () => {},
    onPin: () => {},
    onReact: () => {},
  });
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaViewer, setMediaViewer] = useState<{
    url: string;
    type: 'image' | 'video';
  } | null>(null);
  const getLastSeen = useChatStore((s) => s.getLastSeen);
  const coarse = useCoarsePointer();

  const { data: conversations } = useQuery({
    queryKey: ['conversations', locale],
    queryFn: () => api<Conversation[]>('/conversations', { locale }),
    enabled: forwardOpen,
  });

  const groupedMessages = useMemo(
    () => groupMessagesBySenderAndDate(room.messages, room.currentUserId, room.currentUsername),
    [room.messages, room.currentUserId, room.currentUsername],
  );

  const peerOnline = room.peer?.id ? onlineUserIds.has(room.peer.id) : (room.peerPresence?.online ?? false);
  const peerLastSeen = room.peer?.id
    ? getLastSeen(room.peer.id)?.lastSeenAt ?? room.peerPresence?.lastSeenAt
    : room.peerPresence?.lastSeenAt;
  const peerLastSeenHidden = room.peer?.id
    ? getLastSeen(room.peer.id)?.hidden ?? room.peerPresence?.hidden
    : room.peerPresence?.hidden;

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return room.messages.filter(
      (msg) => msg.body?.toLowerCase().includes(q) && !msg.deletedAt,
    );
  }, [room.messages, searchQuery]);

  const selectableMessages = useMemo(
    () =>
      room.messages.filter(
        (msg): msg is ChatMessage => !('clientId' in msg) && !msg.deletedAt,
      ),
    [room.messages],
  );

  const selectedMessages = useMemo(
    () => selectableMessages.filter((msg) => selectedIds.has(msg.id)),
    [selectableMessages, selectedIds],
  );

  const deletableSelected = useMemo(
    () =>
      selectedMessages.filter((msg) =>
        isMineMessage(msg, room.currentUserId, room.currentUsername),
      ),
    [selectedMessages, room.currentUserId, room.currentUsername],
  );

  const pinnableSelected = useMemo(
    () => selectedMessages.filter((msg) => !msg.pinned),
    [selectedMessages],
  );

  const unpinnableSelected = useMemo(
    () => selectedMessages.filter((msg) => msg.pinned),
    [selectedMessages],
  );

  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelectMessage = useCallback((msg: ChatMessage | PendingMessage) => {
    if ('clientId' in msg || msg.deletedAt) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(msg.id)) next.delete(msg.id);
      else next.add(msg.id);
      return next;
    });
  }, []);

  useEffect(() => {
    setSearchIndex(0);
  }, [searchQuery]);

  const closeChatSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchIndex(0);
  }, []);

  const enterSelection = useCallback(
    (message?: ChatMessage) => {
      setSelectionMode(true);
      setSelectedIds(message ? new Set([message.id]) : new Set());
      setActiveMessage(null);
      closeChatSearch();
    },
    [closeChatSearch],
  );

  const scrollToSearchMatch = useCallback(
    (index: number) => {
      const msg = searchMatches[index];
      if (!msg || 'clientId' in msg) return;
      const el = room.listRef.current?.querySelector(`[data-message-id="${msg.id}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [searchMatches, room.listRef],
  );

  useEffect(() => {
    if (searchMatches.length > 0) scrollToSearchMatch(searchIndex);
  }, [searchIndex, searchMatches.length, scrollToSearchMatch]);

  useEffect(() => {
    setIsNearBottom(true);
    isNearBottomRef.current = true;
  }, [conversationId]);

  useEffect(() => {
    const node = room.listRef.current;
    if (!node) return;
    let scrollClassTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      node.classList.add('is-scrolling');
      clearTimeout(scrollClassTimer);
      scrollClassTimer = setTimeout(() => node.classList.remove('is-scrolling'), 800);

      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null;
        const current = room.listRef.current;
        if (!current) return;

        const nearBottom =
          current.scrollHeight - current.scrollTop - current.clientHeight < 80;
        if (nearBottom !== isNearBottomRef.current) {
          isNearBottomRef.current = nearBottom;
          setIsNearBottom(nearBottom);
        }
        if (nearBottom) room.acknowledgeUnread();
        if (current.scrollTop < 80 && room.hasOlderMessages && !room.isFetchingOlder) {
          void room.loadOlderMessages();
        }
      });
    };
    node.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      node.removeEventListener('scroll', onScroll);
      clearTimeout(scrollClassTimer);
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, [room.listRef, room.acknowledgeUnread, room.hasOlderMessages, room.isFetchingOlder, room.loadOlderMessages]);

  const scrollToLatest = useCallback(() => {
    room.scrollToBottom('smooth');
    setShowJumpToUnread(false);
    room.acknowledgeUnread();
  }, [room.scrollToBottom, room.acknowledgeUnread]);

  const copyMessage = (msg: ChatMessage | PendingMessage) => {
    const text =
      msg.body ||
      msg.sticker ||
      (msg.location ? `${msg.location.lat}, ${msg.location.lng}` : '') ||
      msg.attachment?.url ||
      msg.imageUrl ||
      '';
    if (text) {
      void navigator.clipboard.writeText(text);
      haptic('light');
    }
  };

  const getMessageMediaUrl = (msg: ChatMessage | PendingMessage) =>
    msg.imageUrl ?? msg.attachment?.url;

  const openMediaViewer = (msg: ChatMessage | PendingMessage) => {
    const url = getMessageMediaUrl(msg);
    if (!url) return;
    setMediaViewer({ url, type: msg.type === 'video' ? 'video' : 'image' });
    setMediaViewerOpen(true);
  };

  const saveMediaFromUrl = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = url.split('/').pop()?.split('?')[0] ?? 'media';
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      haptic('success');
    } catch {
      haptic('error');
    }
  };

  const shareMediaFromUrl = async (url: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ url, title: 'Media' });
        haptic('success');
      } catch {
        /* user cancelled */
      }
    } else {
      void navigator.clipboard.writeText(url);
      haptic('light');
    }
  };

  const copyMediaLink = (url: string) => {
    void navigator.clipboard.writeText(url);
    haptic('light');
  };

  const activeMediaUrl = activeMessage ? getMessageMediaUrl(activeMessage) : undefined;

  const openForward = (msg: ChatMessage | PendingMessage) => {
    if ('clientId' in msg) return;
    setForwardSources([msg]);
    setForwardTargets(new Set());
    setForwardState({});
    setForwardOpen(true);
  };

  const openBulkForward = () => {
    if (selectedMessages.length === 0) return;
    setForwardSources(selectedMessages);
    setForwardTargets(new Set());
    setForwardState({});
    setForwardOpen(true);
  };

  const copySelectedMessages = () => {
    const text = selectedMessages
      .map((msg) => messagePreview(msg))
      .filter(Boolean)
      .join('\n\n');
    if (!text) return;
    void navigator.clipboard.writeText(text);
    haptic('light');
    exitSelection();
  };

  const peerDisplayName =
    room.peer?.name ?? room.peer?.username ?? t('unknownUser');

  const openDeleteMessage = (msg: ChatMessage | PendingMessage) => {
    if ('clientId' in msg) return;
    setDeleteMessageAlsoForPeer(false);
    setDeleteMessageTarget(msg);
  };

  const confirmDeleteSelected = async () => {
    const ids = deletableSelected.map((msg) => msg.id);
    if (ids.length === 0) return;
    await room.deleteManyMessages(ids, deleteSelectedAlsoForPeer);
    setDeleteSelectedOpen(false);
    setDeleteSelectedAlsoForPeer(false);
    exitSelection();
  };

  const confirmDeleteMessage = () => {
    if (!deleteMessageTarget) return;
    const mine = isMineMessage(deleteMessageTarget, room.currentUserId, room.currentUsername);
    room.deleteMutation.mutate(
      {
        messageId: deleteMessageTarget.id,
        forEveryone: mine && deleteMessageAlsoForPeer,
      },
      {
        onSuccess: () => {
          setDeleteMessageTarget(null);
          setDeleteMessageAlsoForPeer(false);
          setActiveMessage(null);
          haptic('success');
        },
      },
    );
  };

  const pinSelected = async () => {
    await Promise.all(
      pinnableSelected.map((msg) =>
        room.pinMutation.mutateAsync({ messageId: msg.id, pinned: true }),
      ),
    );
    exitSelection();
  };

  const unpinSelected = async () => {
    await Promise.all(
      unpinnableSelected.map((msg) =>
        room.pinMutation.mutateAsync({ messageId: msg.id, pinned: false }),
      ),
    );
    exitSelection();
  };

  const toggleForwardTarget = (id: string) => {
    setForwardTargets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runForward = async () => {
    if (forwardSources.length === 0 || forwardTargets.size === 0) return;
    const targets = [...forwardTargets];
    setForwardState(Object.fromEntries(targets.map((id) => [id, 'sending'])));
    try {
      const next: ForwardState = Object.fromEntries(targets.map((id) => [id, 'ok' as const]));
      for (const source of forwardSources) {
        const res = await room.forwardMessage(source.id, targets);
        const results = (res?.results ?? []) as { conversationId: string; ok: boolean }[];
        for (const id of targets) {
          const match = results.find((r) => r.conversationId === id);
          if (!match?.ok) next[id] = 'failed';
        }
      }
      setForwardState(next);
      setTimeout(() => {
        setForwardOpen(false);
        setForwardSources([]);
        setActiveMessage(null);
        exitSelection();
      }, 700);
    } catch {
      setForwardState(Object.fromEntries(targets.map((id) => [id, 'failed'])));
    }
  };

  const jumpToUnread = () => {
    const node = room.listRef.current;
    if (!node || !room.firstUnreadId) return;
    const el = node.querySelector(`[data-message-id="${room.firstUnreadId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setShowJumpToUnread(false);
    room.acknowledgeUnread();
  };

  const openReportFromProfile = () => {
    setProfileOpen(false);
    void room.reportPeer('Reported from chat profile');
  };

  messageHandlersRef.current = {
    onReply: room.setReplyTo,
    onOpenActions: (msg) => {
      if (selectionMode) toggleSelectMessage(msg);
      else setActiveMessage(msg);
    },
    onCopy: copyMessage,
    onForward: openForward,
    onEdit: (msg) => {
      if ('clientId' in msg) return;
      setEditingMessageId(msg.id);
      setEditingDraft(msg.body ?? '');
    },
    onDelete: openDeleteMessage,
    onPin: (msg) => {
      if ('clientId' in msg) return;
      room.pinMutation.mutate({ messageId: msg.id, pinned: !msg.pinned });
    },
    onReact: (msg, emoji) => {
      if ('clientId' in msg) return;
      room.toggleReaction(msg.id, emoji);
    },
    onOpenMedia: openMediaViewer,
    onToggleSelect: toggleSelectMessage,
    onEnterSelection: enterSelection,
  };

  return (
    <div className="flex h-dvh flex-col bg-background">
      {selectionMode ? (
        <MessageSelectionHeader
          count={selectedIds.size}
          totalSelectable={selectableMessages.length}
          onCancel={exitSelection}
          onSelectAll={() => setSelectedIds(new Set(selectableMessages.map((m) => m.id)))}
          onClearAll={() => setSelectedIds(new Set())}
        />
      ) : (
        <ChatHeader
          peer={room.peer}
          online={peerOnline}
          typingUsername={room.typingUsername}
          lastSeenAt={peerLastSeen}
          lastSeenHidden={peerLastSeenHidden}
          muted={room.muted}
          blockStatus={room.blockStatus}
          searchOpen={searchOpen}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onToggleMute={() => void room.toggleMute()}
          onBlock={() => void room.blockPeer()}
          onUnblock={() => void room.unblockPeer()}
          onReport={(reason) => void room.reportPeer(reason)}
          onClearHistory={() => void room.clearHistory()}
        />
      )}

      {searchOpen && !selectionMode ? (
        <MessageSearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onClose={closeChatSearch}
          matchCount={searchMatches.length}
          activeIndex={searchIndex}
          onNext={() => setSearchIndex((i) => (i + 1) % Math.max(searchMatches.length, 1))}
          onPrev={() =>
            setSearchIndex((i) => (i - 1 + Math.max(searchMatches.length, 1)) % Math.max(searchMatches.length, 1))
          }
        />
      ) : null}

      <AnimatePresence initial={false}>
        {room.pinnedMessages.length > 0 && !selectionMode ? (
          <motion.div
            key="pinned-messages-banner"
            initial={{ opacity: 0, y: -10, scaleY: 0.94 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.94 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="origin-top overflow-hidden"
          >
            <PinnedMessageBanner
              messages={room.pinnedMessages}
              currentUserId={room.currentUserId}
              scrollContainerRef={room.listRef}
              onJumpToMessage={(messageId) => {
                const el = room.listRef.current?.querySelector(`[data-message-id="${messageId}"]`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              onUnpin={(messageId) =>
                room.pinMutation.mutate({ messageId, pinned: false })
              }
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="relative min-h-0 flex-1">
        <div
          ref={room.listRef}
          className={cn(
            'relative h-full overflow-y-auto overscroll-contain px-3 py-3 chat-scrollbar',
          )}
        >
        {/* Self-contained wallpaper (never 404s): layered gradients + dot grid. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background dark:from-primary/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.18]"
          style={{
            backgroundImage:
              'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            color: 'var(--muted-foreground)',
          }}
        />
        <div className="relative z-10">
          {room.isLoading ? (
            <ChatMessagesSkeleton label={t('loadingMessages')} />
          ) : room.isMessagesError ? (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm text-muted-foreground">{t('messagesLoadError')}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void room.refetchMessages()}>
                {t('retryLoadMessages')}
              </Button>
            </div>
          ) : room.messages.length === 0 ? (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
              <p className="text-lg font-medium">{t('emptyChatTitle')}</p>
              <p className="max-w-xs text-sm text-muted-foreground">{t('emptyChatBody')}</p>
            </div>
          ) : (
            <LayoutGroup id={`messages-${conversationId}`}>
              <VirtualMessageList
                key={conversationId}
                groupedMessages={groupedMessages}
                firstUnreadId={room.firstUnreadId}
                listRef={room.listRef}
                currentUserId={room.currentUserId}
                currentUsername={room.currentUsername}
                peerId={room.peer?.id}
                peerAvatar={room.peer?.avatarUrl}
                peerName={room.peer?.name ?? room.peer?.username}
                peerOnline={peerOnline}
                highlightMessageId={searchMatches[searchIndex]?.id}
                unreadLabel={t('unreadMessages')}
                loadingOlder={room.isFetchingOlder}
                loadingOlderLabel={t('loadingOlderMessages')}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                handlersRef={messageHandlersRef}
              />
            </LayoutGroup>
          )}

          <AnimatePresence>
            {room.typingUsername ? (
              <TypingIndicator label={t('typing', { name: room.typingUsername })} />
            ) : null}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {room.firstUnreadId && showJumpToUnread ? (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={jumpToUnread}
              className="sticky bottom-3 z-20 mx-auto flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg"
            >
              <ArrowDown className="size-3.5" />
              {t('jumpToUnread')}
            </motion.button>
          ) : null}
        </AnimatePresence>
        </div>

        <AnimatePresence>
          {!isNearBottom && !room.isLoading && room.messages.length > 0 ? (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              onClick={scrollToLatest}
              aria-label={t('scrollToBottom')}
              className="absolute bottom-3 end-3 z-20 flex size-10 items-center justify-center rounded-full border border-border/60 bg-background/95 text-foreground shadow-lg backdrop-blur-sm transition-colors hover:bg-muted"
            >
              <ArrowDown className="size-5" />
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      {editingMessageId ? (
        <div className="border-t border-border bg-muted/30 px-3 py-2">
          <div className="flex gap-2">
            <Input
              value={editingDraft}
              onChange={(event) => setEditingDraft(event.target.value)}
              aria-label="Edit message"
            />
            <Button
              onClick={() => {
                room.editMutation.mutate({ messageId: editingMessageId, body: editingDraft.trim() });
                setEditingMessageId(null);
                setEditingDraft('');
              }}
            >
              {t('save')}
            </Button>
            <Button variant="outline" onClick={() => setEditingMessageId(null)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      ) : selectionMode ? (
        <MessageSelectionBar
          count={selectedIds.size}
          canDelete={deletableSelected.length}
          canPin={pinnableSelected.length}
          canUnpin={unpinnableSelected.length}
          onCopy={copySelectedMessages}
          onForward={openBulkForward}
          onDelete={() => setDeleteSelectedOpen(true)}
          onPin={() => void pinSelected()}
          onUnpin={() => void unpinSelected()}
        />
      ) : room.isBlocked && room.blockStatus ? (
        <ChatBlockedBar
          peerName={room.peer?.name ?? room.peer?.username}
          blockStatus={room.blockStatus}
          onUnblock={() => void room.unblockPeer()}
        />
      ) : (
        <ChatComposer
          draft={room.draft}
          onDraftChange={room.updateDraft}
          onSend={room.sendText}
          onTyping={room.emitTyping}
          replyTo={room.replyTo}
          onCancelReply={() => room.setReplyTo(null)}
          onPickImage={(files) => room.handlePickFiles(files, 'image')}
          onPickFile={(files) => room.handlePickFiles(files, 'file')}
          onPickVideo={(files) => room.handlePickFiles(files, 'video')}
          onOpenLocation={() => room.setLocationPickerOpen(true)}
          recordingMode={room.recordingMode}
          recordingElapsedSec={room.recordingElapsedSec}
          onStartRecording={room.startRecording}
          onStopRecording={room.stopRecording}
          composerError={room.composerError}
          uploading={room.uploadingCount > 0}
          placeholder={t('typeMessage')}
          isSending={room.isSending}
          inputRef={room.composerInputRef}
        />
      )}

      <MediaComposerModal
        open={room.mediaComposerOpen}
        items={room.mediaComposerItems}
        onOpenChange={room.setMediaComposerOpen}
        onSend={room.sendMediaFromComposer}
        uploading={room.uploadingCount > 0}
      />

      <LocationPickerModal
        open={room.locationPickerOpen}
        onOpenChange={room.setLocationPickerOpen}
        onSend={room.sendLocationFromPicker}
      />

      <ChatProfileSheet
        open={profileOpen}
        onOpenChange={setProfileOpen}
        conversationId={conversationId}
        locale={locale}
        peer={room.peer}
        onMute={() => void room.toggleMute()}
        onBlock={() => void room.blockPeer()}
        onReport={openReportFromProfile}
      />

      <MessageActionsSheet
        open={Boolean(activeMessage)}
        onOpenChange={(open) => !open && setActiveMessage(null)}
        message={activeMessage}
        isMine={activeMessage ? isMineMessage(activeMessage, room.currentUserId, room.currentUsername) : false}
        onReply={() => activeMessage && room.setReplyTo(activeMessage)}
        onCopy={() => activeMessage && copyMessage(activeMessage)}
        onForward={() => activeMessage && openForward(activeMessage)}
        onEdit={() => {
          if (!activeMessage) return;
          setEditingMessageId(activeMessage.id);
          setEditingDraft(activeMessage.body ?? '');
        }}
        onDelete={() => activeMessage && openDeleteMessage(activeMessage)}
        onPin={() =>
          activeMessage &&
          room.pinMutation.mutate({ messageId: activeMessage.id, pinned: !activeMessage.pinned })
        }
        onReact={(emoji) => {
          if (!activeMessage || 'clientId' in activeMessage) return;
          room.toggleReaction(activeMessage.id, emoji);
        }}
        onSaveMedia={
          activeMediaUrl ? () => void saveMediaFromUrl(activeMediaUrl) : undefined
        }
        onShareMedia={
          activeMediaUrl ? () => void shareMediaFromUrl(activeMediaUrl) : undefined
        }
        onCopyLink={activeMediaUrl ? () => copyMediaLink(activeMediaUrl) : undefined}
        onOpenDetails={
          activeMediaUrl
            ? () => {
                openMediaViewer(activeMessage!);
                setActiveMessage(null);
              }
            : undefined
        }
        onSelect={() => {
          if (!activeMessage || 'clientId' in activeMessage) return;
          enterSelection(activeMessage);
        }}
      />

      <DeleteForPeerDialog
        open={deleteSelectedOpen}
        onOpenChange={(open) => {
          setDeleteSelectedOpen(open);
          if (!open) setDeleteSelectedAlsoForPeer(false);
        }}
        title={t('deleteSelectedTitle')}
        description={
          deletableSelected.length < selectedIds.size
            ? t('deleteSelectedPartial', { count: deletableSelected.length })
            : t('deleteSelectedDescription', { count: deletableSelected.length })
        }
        peerName={peerDisplayName}
        showAlsoDeleteForPeer={deletableSelected.some((msg) =>
          isMineMessage(msg, room.currentUserId, room.currentUsername),
        )}
        alsoDeleteForPeer={deleteSelectedAlsoForPeer}
        onAlsoDeleteForPeerChange={setDeleteSelectedAlsoForPeer}
        onConfirm={() => void confirmDeleteSelected()}
        loading={room.deleteMutation.isPending}
      />

      <DeleteForPeerDialog
        open={Boolean(deleteMessageTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteMessageTarget(null);
            setDeleteMessageAlsoForPeer(false);
          }
        }}
        title={t('delete')}
        description={t('deleteMessageDescription')}
        peerName={peerDisplayName}
        showAlsoDeleteForPeer={
          deleteMessageTarget
            ? isMineMessage(deleteMessageTarget, room.currentUserId, room.currentUsername)
            : false
        }
        alsoDeleteForPeer={deleteMessageAlsoForPeer}
        onAlsoDeleteForPeerChange={setDeleteMessageAlsoForPeer}
        onConfirm={confirmDeleteMessage}
        loading={room.deleteMutation.isPending}
      />

      <MediaViewerSheet
        open={mediaViewerOpen}
        onOpenChange={setMediaViewerOpen}
        url={mediaViewer?.url}
        type={mediaViewer?.type}
        onSave={mediaViewer?.url ? () => void saveMediaFromUrl(mediaViewer.url) : undefined}
        onShare={mediaViewer?.url ? () => void shareMediaFromUrl(mediaViewer.url) : undefined}
        onCopyLink={mediaViewer?.url ? () => copyMediaLink(mediaViewer.url) : undefined}
      />

      {coarse ? (
        <ForwardPickerSheet
          open={forwardOpen}
          onOpenChange={setForwardOpen}
          conversations={conversations}
          currentConversationId={conversationId}
          forwardTargets={forwardTargets}
          forwardState={forwardState}
          isForwarding={room.isForwarding}
          onToggleTarget={toggleForwardTarget}
          onForward={() => void runForward()}
        />
      ) : (
      <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('forward')}</DialogTitle>
            <DialogDescription>{t('forwardDescription')}</DialogDescription>
          </DialogHeader>
          <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {conversations
              ?.filter((item) => item.id !== conversationId)
              .map((conv) => {
                const selected = forwardTargets.has(conv.id);
                const status = forwardState[conv.id];
                const name =
                  conv.otherMember?.name ?? conv.otherMember?.username ?? 'Conversation';
                return (
                  <button
                    key={conv.id}
                    type="button"
                    disabled={status === 'sending'}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                      selected ? 'bg-primary/10' : 'hover:bg-muted',
                    )}
                    onClick={() => toggleForwardTarget(conv.id)}
                  >
                    <UserAvatar src={conv.otherMember?.avatarUrl} name={name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
                    {status === 'sending' ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : status === 'ok' ? (
                      <Check className="size-4 text-primary" />
                    ) : status === 'failed' ? (
                      <span className="text-xs text-destructive">{t('failed')}</span>
                    ) : (
                      <span
                        className={cn(
                          'flex size-5 items-center justify-center rounded-full border',
                          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                        )}
                      >
                        {selected ? <Check className="size-3.5" /> : null}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
          <DialogFooter>
            <Button
              onClick={runForward}
              disabled={forwardTargets.size === 0 || room.isForwarding}
            >
              {room.isForwarding
                ? t('sending')
                : t('forwardToCount', { count: forwardTargets.size })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
