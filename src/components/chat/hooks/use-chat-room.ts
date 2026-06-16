'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { useChatStore } from '@/stores/chat-store';
import { getSocket, currentConnectionState } from '@/lib/realtime/socket';
import { uploadMessageFile } from '@/lib/api/uploads';
import type {
  BlockStatus,
  ChatMessage,
  Conversation,
  ConnectionState,
  MessagePayload,
  PendingMessage,
  ReactionGroup,
} from '@/components/chat/types';
import type { MediaComposerItem } from '@/components/chat/media-composer-modal';
import {
  isMineMessage,
  messagePreview,
} from '@/components/chat/utils';
import { haptic } from '@/lib/mobile/haptics';
import { useChatArchiveStore } from '@/stores/chat-archive-store';
import { useSettingsApi } from '@/hooks/use-settings-api';

const LIVE_CHAT_STORAGE_KEY = 'messages.live.enabled';
const draftStorageKey = (conversationId: string) => `chat.draft.${conversationId}`;

type MessageListResponse = { data: ChatMessage[]; nextCursor?: string | null };

export function useChatRoom(conversationId: string, locale: string) {
  const qc = useQueryClient();
  const t = useTranslations('messages');
  const setTypingStore = useChatStore((s) => s.setTyping);
  const { settings } = useSettingsApi();
  const saveDrafts = settings?.saveDrafts ?? true;

  const messagesKey = useMemo(
    () => ['messages', conversationId, locale] as const,
    [conversationId, locale],
  );

  const [draft, setDraft] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(draftStorageKey(conversationId)) ?? '';
  });
  const [liveEnabled, setLiveEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(LIVE_CHAT_STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  });
  const [connectionState, setConnectionState] = useState<ConnectionState>(() =>
    liveEnabled ? currentConnectionState() : 'offline',
  );
  const [typingUsername, setTypingUsername] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [localUsername] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('username');
  });
  const [composerError, setComposerError] = useState('');
  const updateDraft = useCallback((value: string) => {
    setDraft(value);
    setComposerError('');
  }, []);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [recordingMode, setRecordingMode] = useState<'none' | 'voice' | 'video'>('none');
  const [recordingElapsedSec, setRecordingElapsedSec] = useState(0);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [mediaComposerOpen, setMediaComposerOpen] = useState(false);
  const [mediaComposerItems, setMediaComposerItems] = useState<MediaComposerItem[]>([]);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [peerPresence, setPeerPresence] = useState<{
    online: boolean;
    lastSeenAt: string | null;
    hidden?: boolean;
  } | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);
  const didInitialScrollRef = useRef(false);
  const unreadAcknowledgedRef = useRef(false);
  const loadingOlderRef = useRef(false);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReadSentRef = useRef<string | null>(null);
  const [entrySnapshot, setEntrySnapshot] = useState<{
    readId: string | null;
    unreadCount: number;
  } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () =>
      api<{ id?: string; username?: string; name?: string; avatarUrl?: string }>(
        '/users/me',
        { locale },
      ),
  });

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: messagesKey,
    queryFn: () =>
      api<MessageListResponse>(`/conversations/${conversationId}/messages`, {
        locale,
      }),
    enabled: Boolean(conversationId),
    refetchOnMount: 'always',
    retry: 2,
  });

  const messagesLoading = isLoading || (isFetching && !data);

  const { data: conversations } = useQuery({
    queryKey: ['conversations', locale],
    queryFn: () => api<Conversation[]>('/conversations', { locale }),
  });

  const currentUserId = me?.id;
  const currentUsername = me?.username ?? localUsername;

  const peer = useMemo(() => {
    const fromMessages = (data?.data ?? []).find(
      (item) => item.sender.id && item.sender.id !== currentUserId,
    )?.sender;
    if (fromMessages) return fromMessages;
    const conv = conversations?.find((c) => c.id === conversationId);
    return conv?.otherMember;
  }, [conversationId, conversations, currentUserId, data?.data]);

  const blockStatusQueryKey = useMemo(
    () => ['block-status', peer?.id, locale] as const,
    [peer?.id, locale],
  );

  const { data: blockStatus } = useQuery({
    queryKey: blockStatusQueryKey,
    queryFn: () => api<BlockStatus>(`/users/${peer!.id}/block-status`, { locale }),
    enabled: Boolean(peer?.id && currentUserId),
    staleTime: 30_000,
  });

  const isBlocked = Boolean(blockStatus?.blocked);
  const blockedByYou = Boolean(blockStatus?.blockedByYou);

  const refreshPeerPresence = useCallback(async () => {
    if (!peer?.id) return;
    try {
      const p = await api<{
        online: boolean;
        lastSeenAt: string | null;
        hidden?: boolean;
      }>(`/users/${peer.id}/presence`, { locale });
      setPeerPresence({
        online: p.online,
        lastSeenAt: p.lastSeenAt,
        hidden: p.hidden,
      });
      const { setOnline, setLastSeen } = useChatStore.getState();
      setOnline(peer.id, p.online, p.lastSeenAt);
      if (!p.online && p.lastSeenAt) {
        setLastSeen(peer.id, p.lastSeenAt, p.hidden);
      } else if (p.hidden) {
        setLastSeen(peer.id, null, true);
      }
    } catch {
      /* ignore */
    }
  }, [locale, peer?.id]);

  useEffect(() => {
    useChatArchiveStore.getState().recordOpened(conversationId);
    useChatArchiveStore.getState().clearForceUnread(conversationId);
  }, [conversationId]);

  useEffect(() => {
    void refreshPeerPresence();
    const timer = setInterval(() => void refreshPeerPresence(), 30_000);
    return () => clearInterval(timer);
  }, [refreshPeerPresence]);

  // Reset per-conversation UI state when switching chats.
  useEffect(() => {
    lastReadSentRef.current = null;
    didInitialScrollRef.current = false;
    unreadAcknowledgedRef.current = false;
    setEntrySnapshot(null);
    setPendingMessages([]);
    setReplyTo(null);
    setComposerError('');
    setDraft(localStorage.getItem(draftStorageKey(conversationId)) ?? '');
  }, [conversationId]);

  // Snapshot inbox read state at entry (before we mark the thread read).
  useEffect(() => {
    if (entrySnapshot !== null) return;
    const conv = conversations?.find((c) => c.id === conversationId);
    if (!conv) return;
    setMuted(Boolean(conv.muted));
    setEntrySnapshot({
      readId: conv.lastReadMessageId ?? null,
      unreadCount: conv.unreadCount ?? 0,
    });
  }, [conversationId, conversations, entrySnapshot]);

  useEffect(() => {
    localStorage.setItem(LIVE_CHAT_STORAGE_KEY, String(liveEnabled));
  }, [liveEnabled]);

  useEffect(() => {
    // Honor Settings → Chat → "Save drafts": when disabled, never persist and
    // proactively drop any draft already stored for this conversation.
    if (!saveDrafts) {
      localStorage.removeItem(draftStorageKey(conversationId));
      return;
    }
    const timer = setTimeout(() => {
      if (draft) localStorage.setItem(draftStorageKey(conversationId), draft);
      else localStorage.removeItem(draftStorageKey(conversationId));
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, conversationId, saveDrafts]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
  }, []);

  const loadOlderMessages = useCallback(async () => {
    const cursor = data?.nextCursor;
    if (!cursor || loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setIsFetchingOlder(true);
    try {
      const res = await api<MessageListResponse>(
        `/conversations/${conversationId}/messages?cursor=${encodeURIComponent(cursor)}`,
        { locale },
      );
      qc.setQueryData<MessageListResponse>(messagesKey, (prev) => {
        if (!prev) return res;
        const existingIds = new Set(prev.data.map((m) => m.id));
        const older = res.data.filter((m) => !existingIds.has(m.id));
        return {
          data: [...older, ...prev.data],
          nextCursor: res.nextCursor ?? null,
        };
      });
    } finally {
      loadingOlderRef.current = false;
      setIsFetchingOlder(false);
    }
  }, [conversationId, data?.nextCursor, locale, messagesKey, qc]);

  // ---- Cache patch helpers (server is source of truth) --------------------

  const patchMessageInCache = useCallback(
    (messageId: string, updater: (msg: ChatMessage) => ChatMessage) => {
      qc.setQueryData<MessageListResponse>(messagesKey, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map((m) => (m.id === messageId ? updater(m) : m)),
        };
      });
    },
    [qc, messagesKey],
  );

  const removeMessageFromCache = useCallback(
    (messageId: string) => {
      qc.setQueryData<MessageListResponse>(messagesKey, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.filter((m) => m.id !== messageId),
        };
      });
    },
    [qc, messagesKey],
  );

  const appendMessageToCache = useCallback(
    (msg: ChatMessage) => {
      qc.setQueryData<MessageListResponse>(messagesKey, (prev) => {
        if (!prev) return { data: [msg] };
        if (prev.data.some((m) => m.id === msg.id)) {
          return {
            ...prev,
            data: prev.data.map((m) => (m.id === msg.id ? msg : m)),
          };
        }
        return { ...prev, data: [...prev.data, msg] };
      });
    },
    [qc, messagesKey],
  );

  // ---- Recording elapsed timer --------------------------------------------

  useEffect(() => {
    if (recordingMode === 'none') {
      setRecordingElapsedSec(0);
      pausedElapsedRef.current = 0;
      return;
    }
    if (recordingPaused) return;
    const tick = () =>
      setRecordingElapsedSec(
        Math.max(0, pausedElapsedRef.current + Math.floor((Date.now() - recordingStartedAtRef.current) / 1000)),
      );
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [recordingMode, recordingPaused]);

  // ---- Mark read (server authoritative) -----------------------------------

  const markRead = useCallback(
    (lastMessageId?: string) => {
      if (!lastMessageId || lastReadSentRef.current === lastMessageId) return;
      lastReadSentRef.current = lastMessageId;
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('message:read', { conversationId, lastMessageId });
      } else {
        void api(`/conversations/${conversationId}/read`, {
          method: 'POST',
          body: JSON.stringify({ lastMessageId }),
          locale,
        }).catch(() => {
          lastReadSentRef.current = null;
        });
      }
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    [conversationId, locale, qc],
  );

  // ---- Single shared socket subscription ----------------------------------

  useEffect(() => {
    if (!liveEnabled) {
      setConnectionState('offline');
      return;
    }
    const socket = getSocket();
    if (!socket) return;

    setConnectionState(socket.connected ? 'online' : 'connecting');
    socket.emit('conversation:join', conversationId);

    const onConnect = () => {
      setConnectionState('online');
      socket.emit('conversation:join', conversationId);
    };
    const onDisconnect = () => setConnectionState('offline');
    const onReconnectAttempt = () => setConnectionState('connecting');

    const onNew = (msg: ChatMessage) => {
      appendMessageToCache({ ...msg, enterAnimate: true });
      const mine = isMineMessage(msg, currentUserId, currentUsername);
      if (!mine) markRead(msg.id);
      window.setTimeout(() => {
        patchMessageInCache(msg.id, (m) => {
          if (!m.enterAnimate) return m;
          const { enterAnimate: _, ...rest } = m;
          return rest;
        });
      }, 400);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToBottom('smooth'));
      });
    };

    const onEdited = (msg: ChatMessage) => patchMessageInCache(msg.id, () => msg);
    const onDeleted = (msg: ChatMessage) => patchMessageInCache(msg.id, () => msg);
    const onPinned = (msg: ChatMessage) =>
      patchMessageInCache(msg.id, (m) => ({ ...m, ...msg, pinned: msg.pinned }));

    const onSeen = (payload: {
      message?: ChatMessage;
      messageId?: string;
      userId?: string;
    }) => {
      if (payload.message) {
        patchMessageInCache(payload.message.id, () => payload.message as ChatMessage);
        return;
      }
      if (!payload.messageId) return;
      patchMessageInCache(payload.messageId, (m) => ({
        ...m,
        seenBy: [...new Set([...(m.seenBy ?? []), payload.userId ?? ''])],
      }));
    };

    const onReaction = (payload: {
      messageId?: string;
      reactions?: ReactionGroup[];
    }) => {
      if (!payload.messageId) return;
      patchMessageInCache(payload.messageId, (m) => ({
        ...m,
        reactions: payload.reactions ?? [],
      }));
    };

    const onRead = (payload: { userId?: string; lastReadMessageId?: string }) => {
      if (!payload.userId || payload.userId === currentUserId) return;
      const uid = payload.userId;
      // Peer read up to lastReadMessageId -> mark all of MY messages up to and
      // including that point as seen by them. Cache data is chronological asc.
      qc.setQueryData<MessageListResponse>(messagesKey, (prev) => {
        if (!prev) return prev;
        let reached = false;
        const data = prev.data.map((m) => {
          if (reached) return m;
          const mine = isMineMessage(m, currentUserId, currentUsername);
          const updated =
            mine && !(m.seenBy ?? []).includes(uid)
              ? { ...m, seenBy: [...(m.seenBy ?? []), uid] }
              : m;
          if (m.id === payload.lastReadMessageId) reached = true;
          return updated;
        });
        return { ...prev, data };
      });
    };

    const onTyping = (payload: {
      username?: string;
      userId?: string;
      typing?: boolean;
    }) => {
      if (payload.userId && payload.userId === currentUserId) return;
      if (payload.username && payload.username === currentUsername) return;
      if (payload.typing === false) {
        setTypingUsername(null);
        setTypingStore(conversationId, null);
        return;
      }
      const actor = payload.username ?? 'Someone';
      setTypingUsername(actor);
      setTypingStore(conversationId, actor);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingUsername(null);
        setTypingStore(conversationId, null);
      }, 4000);
    };

    const onHidden = (payload: { conversationId?: string; messageId?: string }) => {
      if (payload.conversationId !== conversationId || !payload.messageId) return;
      removeMessageFromCache(payload.messageId);
    };

    const onCleared = (payload: { conversationId?: string }) => {
      if (payload.conversationId !== conversationId) return;
      qc.setQueryData<MessageListResponse>(messagesKey, { data: [] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    };

    const heartbeat = setInterval(() => {
      if (socket.connected) socket.emit('presence:heartbeat');
    }, 45_000);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('message:new', onNew);
    socket.on('message:edited', onEdited);
    socket.on('message:deleted', onDeleted);
    socket.on('message:pinned', onPinned);
    socket.on('message:seen', onSeen);
    socket.on('message:reaction', onReaction);
    socket.on('message:read', onRead);
    socket.on('conversation:typing', onTyping);
    socket.on('conversation:cleared', onCleared);
    socket.on('conversation:deleted', onCleared);
    socket.on('message:hidden', onHidden);

    return () => {
      clearInterval(heartbeat);
      socket.emit('conversation:leave', conversationId);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('message:new', onNew);
      socket.off('message:edited', onEdited);
      socket.off('message:deleted', onDeleted);
      socket.off('message:pinned', onPinned);
      socket.off('message:seen', onSeen);
      socket.off('message:reaction', onReaction);
      socket.off('message:read', onRead);
      socket.off('conversation:typing', onTyping);
      socket.off('conversation:cleared', onCleared);
      socket.off('conversation:deleted', onCleared);
      socket.off('message:hidden', onHidden);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTypingUsername(null);
      setTypingStore(conversationId, null);
    };
  }, [
    conversationId,
    currentUserId,
    currentUsername,
    liveEnabled,
    messagesKey,
    appendMessageToCache,
    patchMessageInCache,
    removeMessageFromCache,
    markRead,
    scrollToBottom,
    setTypingStore,
    qc,
  ]);

  // ---- Mutations ----------------------------------------------------------

  const sendMutation = useMutation({
    mutationFn: (payload: MessagePayload) =>
      api<ChatMessage>(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(payload),
        locale,
      }),
    onMutate: async (payload) => {
      const text = (payload.body ?? '').trim();
      const hasContent =
        Boolean(text) ||
        Boolean(payload.attachment?.url) ||
        Boolean(payload.location) ||
        Boolean(payload.sticker);
      if (!hasContent) return { clientId: '' };
      const clientId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimistic: PendingMessage = {
        id: clientId,
        clientId,
        senderId: currentUserId ?? 'self',
        body: text,
        createdAt: new Date().toISOString(),
        type: payload.type,
        attachment: payload.attachment,
        imageUrl: payload.imageUrl,
        location: payload.location,
        sticker: payload.sticker,
        replyToId: payload.replyToId,
        replyToSnippet: payload.replyToSnippet,
        sender: { id: currentUserId ?? 'self', username: currentUsername ?? 'me' },
        status: 'sending',
      };
      setPendingMessages((prev) => [...prev, optimistic]);
      setDraft('');
      setReplyTo(null);
      haptic('light');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToBottom('smooth'));
      });
      return { clientId };
    },
    onSuccess: (created, _vars, context) => {
      if (context?.clientId) {
        appendMessageToCache({ ...created, sendLayoutId: context.clientId });
      } else {
        appendMessageToCache(created);
      }
      setPendingMessages((prev) =>
        prev.filter((item) => item.clientId !== context?.clientId),
      );
      lastReadSentRef.current = created.id;
      qc.invalidateQueries({ queryKey: ['conversations'] });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToBottom('smooth'));
      });
      window.setTimeout(() => {
        patchMessageInCache(created.id, (m) => {
          if (!m.sendLayoutId) return m;
          const { sendLayoutId: _, ...rest } = m;
          return rest;
        });
      }, 450);
    },
    onError: (error, payload, context) => {
      const message = error instanceof Error ? error.message : '';
      if (message.toLowerCase().includes('cannot message')) {
        qc.setQueryData<BlockStatus>(blockStatusQueryKey, {
          blocked: true,
          blockedByYou: false,
          blockedByPeer: true,
        });
        setComposerError(t('chatBlockedCantMessage'));
      }
      setPendingMessages((prev) =>
        prev.map((item) =>
          item.clientId === context?.clientId
            ? { ...item, ...payload, status: 'failed' }
            : item,
        ),
      );
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: string }) =>
      api<ChatMessage>(`/conversations/${conversationId}/messages/${messageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ body }),
        locale,
      }),
    onSuccess: (updated) => patchMessageInCache(updated.id, () => updated),
  });

  const deleteMutation = useMutation({
    mutationFn: ({
      messageId,
      forEveryone,
    }: {
      messageId: string;
      forEveryone: boolean;
    }) =>
      api<ChatMessage | { conversationId: string; messageId: string; scope: 'me' }>(
        `/conversations/${conversationId}/messages/${messageId}`,
        {
          method: 'DELETE',
          body: JSON.stringify({ forEveryone }),
          locale,
        },
      ),
    onSuccess: (result) => {
      if ('scope' in result && result.scope === 'me') {
        removeMessageFromCache(result.messageId);
        return;
      }
      patchMessageInCache((result as ChatMessage).id, () => result as ChatMessage);
    },
  });

  const deleteManyMessages = useCallback(
    async (messageIds: string[], forEveryone: boolean) => {
      const cached = qc.getQueryData<MessageListResponse>(messagesKey);
      const byId = new Map((cached?.data ?? []).map((m) => [m.id, m]));
      const results = await Promise.allSettled(
        messageIds.map((messageId) => {
          const msg = byId.get(messageId);
          const mine = msg
            ? isMineMessage(msg, currentUserId, currentUsername)
            : false;
          return api<ChatMessage | { conversationId: string; messageId: string; scope: 'me' }>(
            `/conversations/${conversationId}/messages/${messageId}`,
            {
              method: 'DELETE',
              body: JSON.stringify({ forEveryone: forEveryone && mine }),
              locale,
            },
          );
        }),
      );
      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        const value = result.value;
        if ('scope' in value && value.scope === 'me') {
          removeMessageFromCache(value.messageId);
        } else {
          patchMessageInCache((value as ChatMessage).id, () => value as ChatMessage);
        }
      }
      haptic('success');
      return results.filter((r) => r.status === 'fulfilled').length;
    },
    [conversationId, currentUserId, currentUsername, locale, patchMessageInCache, qc, messagesKey, removeMessageFromCache],
  );

  const pinMutation = useMutation({
    mutationFn: ({ messageId, pinned }: { messageId: string; pinned: boolean }) =>
      api<ChatMessage>(`/conversations/${conversationId}/messages/${messageId}/pin`, {
        method: 'POST',
        body: JSON.stringify({ pinned }),
        locale,
      }),
    onMutate: async ({ messageId, pinned }) => {
      await qc.cancelQueries({ queryKey: messagesKey });
      const previous = qc.getQueryData<MessageListResponse>(messagesKey);
      qc.setQueryData<MessageListResponse>(messagesKey, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map((m) =>
            m.id === messageId ? { ...m, pinned } : m,
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(messagesKey, ctx.previous);
    },
    onSuccess: (updated) =>
      patchMessageInCache(updated.id, (m) => ({ ...m, ...updated, pinned: updated.pinned })),
  });

  const reactionMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      api<{ messageId: string; reactions: ReactionGroup[] }>(
        `/conversations/${conversationId}/messages/${messageId}/reactions`,
        { method: 'POST', body: JSON.stringify({ emoji }), locale },
      ),
    onSuccess: (res) =>
      patchMessageInCache(res.messageId, (m) => ({
        ...m,
        reactions: res.reactions,
      })),
  });

  const forwardMutation = useMutation({
    mutationFn: ({
      messageId,
      targetConversationIds,
    }: {
      messageId: string;
      targetConversationIds: string[];
    }) =>
      api<{ delivered: number; failed: number; results: unknown[] }>(
        '/messages/forward',
        {
          method: 'POST',
          body: JSON.stringify({ messageId, targetConversationIds }),
          locale,
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });

  // ---- Derived message list ----------------------------------------------

  const messages = useMemo(() => {
    const base = data?.data ?? [];
    const byId = new Map<string, ChatMessage | PendingMessage>();
    for (const msg of base) byId.set(msg.id, msg);
    for (const msg of pendingMessages) byId.set(msg.clientId, msg);
    return [...byId.values()].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [data?.data, pendingMessages]);

  const pinnedMessages = useMemo(
    () => messages.filter((item) => !item.deletedAt && item.pinned),
    [messages],
  );

  // First unread message id captured at entry (for the jump-to-unread divider).
  const firstUnreadId = useMemo(() => {
    if (!entrySnapshot || entrySnapshot.unreadCount <= 0) return null;

    const { readId } = entrySnapshot;

    if (readId === null) {
      for (const msg of messages) {
        if (isMineMessage(msg, currentUserId, currentUsername)) continue;
        if (msg.deletedAt) continue;
        return msg.id;
      }
      return null;
    }

    let passedRead = false;
    for (const msg of messages) {
      if (!passedRead) {
        if (msg.id === readId) passedRead = true;
        continue;
      }
      if (isMineMessage(msg, currentUserId, currentUsername)) continue;
      if (msg.deletedAt) continue;
      return msg.id;
    }
    return null;
  }, [entrySnapshot, messages, currentUserId, currentUsername]);

  // ---- Mark the latest message read (delay when unreads exist) --------------

  useEffect(() => {
    if (messagesLoading || !messages.length) return;
    const last = messages[messages.length - 1];
    if ('clientId' in last) return;
    if (firstUnreadId && !unreadAcknowledgedRef.current) return;
    markRead(last.id);
  }, [messages, messagesLoading, markRead, firstUnreadId]);

  // ---- Initial scroll to latest message -----------------------------------

  useEffect(() => {
    if (messagesLoading || !messages.length || didInitialScrollRef.current) return;
    didInitialScrollRef.current = true;
    requestAnimationFrame(() => scrollToBottom('instant'));
  }, [messagesLoading, messages.length, scrollToBottom]);

  const acknowledgeUnread = useCallback(() => {
    unreadAcknowledgedRef.current = true;
    const last = messages[messages.length - 1];
    if (last && !('clientId' in last)) markRead(last.id);
  }, [messages, markRead]);

  // ---- Actions ------------------------------------------------------------

  const sendPayload = useCallback(
    (payload: MessagePayload) => {
      if (isBlocked) {
        setComposerError(
          blockedByYou ? t('chatBlockedByYou', { name: peer?.name ?? peer?.username ?? t('thisUser') }) : t('chatBlockedCantMessage'),
        );
        return;
      }
      setComposerError('');
      sendMutation.mutate(payload);
    },
    [blockedByYou, isBlocked, peer?.name, peer?.username, sendMutation, t],
  );

  // ---- Typing (debounced, with reliable stop) -----------------------------

  const stopTyping = useCallback(() => {
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('conversation:typing', { conversationId, typing: false });
    }
  }, [conversationId]);

  const emitTyping = useCallback(() => {
    if (!liveEnabled) return;
    const socket = getSocket();
    if (!socket?.connected) return;
    if (!typingDebounceRef.current) {
      socket.emit('conversation:typing', { conversationId, typing: true });
    }
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    // After 2.5s of no keystrokes, tell the peer we stopped typing.
    typingDebounceRef.current = setTimeout(() => {
      typingDebounceRef.current = null;
      socket.emit('conversation:typing', { conversationId, typing: false });
    }, 2500);
  }, [conversationId, liveEnabled]);

  const sendText = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setComposerError('');
    stopTyping();
    sendPayload({
      body: trimmed,
      type: 'text',
      replyToId: replyTo?.id,
      replyToSnippet: replyTo ? messagePreview(replyTo) : undefined,
    });
    localStorage.removeItem(draftStorageKey(conversationId));
  }, [draft, replyTo, sendPayload, stopTyping, conversationId]);

  const retryFailed = useCallback(
    (clientId: string) => {
      const failed = pendingMessages.find((msg) => msg.clientId === clientId);
      if (!failed) return;
      setPendingMessages((prev) => prev.filter((msg) => msg.clientId !== clientId));
      sendPayload({
        body: failed.body,
        type: failed.type,
        attachment: failed.attachment,
        imageUrl: failed.imageUrl,
        location: failed.location,
        sticker: failed.sticker,
        replyToId: failed.replyToId,
        replyToSnippet: failed.replyToSnippet,
      });
    },
    [pendingMessages, sendPayload],
  );

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      reactionMutation.mutate({ messageId, emoji });
    },
    [reactionMutation],
  );

  const forwardMessage = useCallback(
    (messageId: string, targetConversationIds: string[]) =>
      forwardMutation.mutateAsync({ messageId, targetConversationIds }),
    [forwardMutation],
  );

  // ---- Media (presigned upload, no base64) --------------------------------

  const handlePickFiles = useCallback(
    (files: FileList | null, forcedType: 'image' | 'file' | 'video') => {
      if (!files?.length) return;
      setComposerError('');
      const items: MediaComposerItem[] = Array.from(files).map((file) => ({
        file,
        type: forcedType,
      }));
      setMediaComposerItems(items);
      setMediaComposerOpen(true);
    },
    [],
  );

  const sendMediaFromComposer = useCallback(
    async (items: MediaComposerItem[], caption: string) => {
      setComposerError('');
      setUploadProgress(0);
      const total = items.length;
      try {
        for (let i = 0; i < total; i += 1) {
          const item = items[i];
          setUploadingCount((c) => c + 1);
          try {
            const uploaded = await uploadMessageFile(item.file, 'messages', (fraction) => {
              setUploadProgress(Math.round(((i + fraction) / total) * 100));
            });
            sendPayload({
              type: item.type,
              body: caption || (item.type === 'file' ? item.file.name : undefined),
              imageUrl: item.type === 'image' ? uploaded.url : undefined,
              attachment: {
                url: uploaded.url,
                name: uploaded.name,
                mimeType: uploaded.mimeType,
                size: uploaded.size,
              },
              spoiler: item.spoiler || undefined,
              replyToId: replyTo?.id,
              replyToSnippet: replyTo ? messagePreview(replyTo) : undefined,
            });
          } catch (err) {
            const message =
              err instanceof Error ? err.message : 'Upload failed. Please try again.';
            setComposerError(message);
            throw err instanceof Error ? err : new Error(message);
          } finally {
            setUploadingCount((c) => Math.max(0, c - 1));
          }
        }
      } finally {
        setUploadProgress(null);
      }
    },
    [replyTo, sendPayload],
  );

  const sendLocationFromPicker = useCallback(
    (location: { lat: number; lng: number; label?: string }, live: boolean) => {
      setComposerError('');
      sendPayload({
        type: 'location',
        body: live ? 'Live location' : undefined,
        location: {
          lat: location.lat,
          lng: location.lng,
          label: location.label ?? 'Shared location',
        },
        replyToId: replyTo?.id,
        replyToSnippet: replyTo ? messagePreview(replyTo) : undefined,
      });
    },
    [replyTo, sendPayload],
  );

  const startRecording = useCallback(
    async (mode: 'voice' | 'video') => {
      if (recordingMode !== 'none') return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          mode === 'voice' ? { audio: true } : { audio: true, video: true },
        );
        const recorder = new MediaRecorder(stream);
        mediaChunksRef.current = [];
        mediaRecorderRef.current = recorder;
        mediaStreamRef.current = stream;
        recordingStartedAtRef.current = Date.now();
        pausedElapsedRef.current = 0;
        setRecordingPaused(false);
        setRecordingMode(mode);
        if (mode === 'voice') {
          try {
            const ctx = new AudioContext();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            audioContextRef.current = ctx;
            audioAnalyserRef.current = analyser;
          } catch { /* analyser optional */ }
        }
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) mediaChunksRef.current.push(event.data);
        };
        recorder.onstop = async () => {
          const blob = new Blob(mediaChunksRef.current, {
            type: mode === 'voice' ? 'audio/webm' : 'video/webm',
          });
          const file = new File([blob], `${mode}-${Date.now()}.webm`, {
            type: blob.type,
          });
          const durationSec = Math.max(
            1,
            Math.round((Date.now() - recordingStartedAtRef.current) / 1000),
          );
          setRecordingMode('none');
          setUploadingCount((c) => c + 1);
          try {
            const uploaded = await uploadMessageFile(file);
            sendPayload({
              type: mode,
              body: mode === 'voice' ? 'Voice message' : 'Video message',
              attachment: {
                url: uploaded.url,
                name: uploaded.name,
                mimeType: uploaded.mimeType,
                size: uploaded.size,
                durationSec,
              },
              replyToId: replyTo?.id,
              replyToSnippet: replyTo ? messagePreview(replyTo) : undefined,
            });
          } catch (err) {
            setComposerError(
              err instanceof Error ? err.message : 'Upload failed.',
            );
          } finally {
            setUploadingCount((c) => Math.max(0, c - 1));
          }
        };
        recorder.start();
      } catch {
        setComposerError(`Cannot start ${mode} recording.`);
        setRecordingMode('none');
      }
    },
    [recordingMode, replyTo, sendPayload],
  );

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
    for (const track of mediaStreamRef.current?.getTracks() ?? []) track.stop();
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    audioAnalyserRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
  }, []);

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;
    recorder.pause();
    pausedElapsedRef.current += Math.floor((Date.now() - recordingStartedAtRef.current) / 1000);
    setRecordingPaused(true);
  }, []);

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'paused') return;
    recorder.resume();
    recordingStartedAtRef.current = Date.now();
    setRecordingPaused(false);
  }, []);

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    for (const track of mediaStreamRef.current?.getTracks() ?? []) track.stop();
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    mediaChunksRef.current = [];
    audioAnalyserRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setRecordingMode('none');
    setRecordingPaused(false);
  }, []);

  const toggleMute = useCallback(async () => {
    const next = !muted;
    await api(`/conversations/${conversationId}/mute`, {
      method: 'POST',
      body: JSON.stringify({ muted: next }),
      locale,
    });
    setMuted(next);
    qc.invalidateQueries({ queryKey: ['conversations'] });
  }, [conversationId, locale, muted, qc]);

  const blockPeer = useCallback(async () => {
    if (!peer?.id) return;
    await api(`/users/${peer.id}/block`, { method: 'POST', locale });
    haptic('success');
    qc.setQueryData<BlockStatus>(blockStatusQueryKey, {
      blocked: true,
      blockedByYou: true,
      blockedByPeer: false,
    });
    qc.invalidateQueries({ queryKey: ['settings-blocked'] });
    setComposerError('');
  }, [blockStatusQueryKey, locale, peer?.id, qc]);

  const unblockPeer = useCallback(async () => {
    if (!peer?.id) return;
    await api(`/users/${peer.id}/block`, { method: 'DELETE', locale });
    haptic('success');
    qc.setQueryData<BlockStatus>(blockStatusQueryKey, {
      blocked: false,
      blockedByYou: false,
      blockedByPeer: false,
    });
    qc.invalidateQueries({ queryKey: ['settings-blocked'] });
    setComposerError('');
  }, [blockStatusQueryKey, locale, peer?.id, qc]);

  const reportPeer = useCallback(
    async (reason: string) => {
      if (!peer?.id) return;
      await api('/reports', {
        method: 'POST',
        body: JSON.stringify({ targetType: 'USER', targetId: peer.id, reason }),
        locale,
      });
    },
    [peer?.id, locale],
  );

  const clearHistory = useCallback(async () => {
    await api(`/conversations/${conversationId}/messages`, {
      method: 'DELETE',
      locale,
    });
    qc.setQueryData<MessageListResponse>(messagesKey, { data: [] });
  }, [conversationId, locale, messagesKey, qc]);

  return {
    me,
    peer,
    messages,
    pinnedMessages,
    firstUnreadId,
    isLoading: messagesLoading,
    isMessagesError: isError,
    refetchMessages,
    listRef,
    composerInputRef,
    draft,
    setDraft,
    updateDraft,
    replyTo,
    setReplyTo,
    recordingMode,
    recordingElapsedSec,
    recordingPaused,
    audioAnalyserRef,
    composerError,
    connectionState,
    liveEnabled,
    setLiveEnabled,
    typingUsername,
    currentUserId,
    currentUsername,
    uploadingCount,
    uploadProgress,
    mediaComposerOpen,
    setMediaComposerOpen,
    mediaComposerItems,
    locationPickerOpen,
    setLocationPickerOpen,
    muted,
    blockStatus,
    isBlocked,
    blockedByYou,
    peerPresence,
    sendText,
    sendPayload,
    retryFailed,
    emitTyping,
    stopTyping,
    toggleReaction,
    forwardMessage,
    handlePickFiles,
    sendMediaFromComposer,
    sendLocationFromPicker,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    toggleMute,
    blockPeer,
    unblockPeer,
    reportPeer,
    clearHistory,
    acknowledgeUnread,
    loadOlderMessages,
    isFetchingOlder,
    hasOlderMessages: Boolean(data?.nextCursor),
    editMutation,
    deleteMutation,
    deleteManyMessages,
    pinMutation,
    scrollToBottom,
    isSending: sendMutation.isPending,
    isForwarding: forwardMutation.isPending,
  };
}
