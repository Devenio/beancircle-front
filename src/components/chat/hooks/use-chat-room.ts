'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { api } from '@/lib/api/client';
import { useChatStore } from '@/stores/chat-store';
import type {
  ChatMessage,
  ConnectionState,
  MessagePayload,
  PendingMessage,
} from '@/components/chat/types';
import { fileToDataUrl, isMineMessage, messagePreview, validateMessageText } from '@/components/chat/utils';

const LIVE_CHAT_STORAGE_KEY = 'messages.live.enabled';
const RECONNECT_BACKOFF_MAX_MS = 30000;

type MessageListResponse = { data: ChatMessage[] };

export function useChatRoom(conversationId: string, locale: string) {
  const qc = useQueryClient();
  const clearUnread = useChatStore((s) => s.clearUnread);
  const setTypingStore = useChatStore((s) => s.setTyping);
  const incrementUnread = useChatStore((s) => s.incrementUnread);

  const [draft, setDraft] = useState('');
  const [liveEnabled, setLiveEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(LIVE_CHAT_STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  });
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    liveEnabled ? 'connecting' : 'offline',
  );
  const [typingUsername, setTypingUsername] = useState<string | null>(null);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [localUsername] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('username');
  });
  const [composerError, setComposerError] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [recordingMode, setRecordingMode] = useState<'none' | 'voice' | 'video'>('none');
  const [recordingElapsedSec, setRecordingElapsedSec] = useState(0);

  const listRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenSentRef = useRef<Set<string>>(new Set());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number>(0);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ id?: string; username?: string; name?: string; avatarUrl?: string }>('/users/me', { locale }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversationId, locale],
    queryFn: () => api<MessageListResponse>(`/conversations/${conversationId}/messages`, { locale }),
  });

  const currentUserId = me?.id;
  const currentUsername = me?.username ?? localUsername;

  const peer = useMemo(() => {
    const all = data?.data ?? [];
    return all.find((item) => item.sender.id && item.sender.id !== currentUserId)?.sender;
  }, [data?.data, currentUserId]);

  useEffect(() => {
    clearUnread(conversationId);
  }, [clearUnread, conversationId]);

  useEffect(() => {
    localStorage.setItem(LIVE_CHAT_STORAGE_KEY, String(liveEnabled));
  }, [liveEnabled]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    if (recordingMode === 'none') {
      setRecordingElapsedSec(0);
      return;
    }
    const tick = () => {
      setRecordingElapsedSec(
        Math.max(0, Math.floor((Date.now() - recordingStartedAtRef.current) / 1000)),
      );
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [recordingMode]);

  useEffect(() => {
    if (!liveEnabled) {
      socketRef.current = null;
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: RECONNECT_BACKOFF_MAX_MS,
      timeout: 10000,
    });
    socketRef.current = socket;
    socket.emit('conversation:join', conversationId);

    socket.on('connect', () => setConnectionState('online'));
    socket.on('disconnect', () => setConnectionState('offline'));
    socket.on('reconnect_attempt', () => setConnectionState('connecting'));

    socket.on('message:new', (msg: ChatMessage) => {
      const mine = isMineMessage(msg, currentUserId, currentUsername);
      if (!mine) incrementUnread(conversationId);
      setLiveMessages((prev) => (prev.some((item) => item.id === msg.id) ? prev : [...prev, msg]));
      qc.invalidateQueries({ queryKey: ['messages', conversationId, locale] });
    });

    socket.on(
      'conversation:typing',
      (payload: { username?: string; userId?: string; typing?: boolean }) => {
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
        }, 3000);
      },
    );

    const patchMessage = (msg: ChatMessage) =>
      setLiveMessages((prev) => prev.map((item) => (item.id === msg.id ? msg : item)));

    socket.on('message:edited', patchMessage);
    socket.on('message:deleted', patchMessage);
    socket.on('message:pinned', patchMessage);
    socket.on('message:seen', (payload: { message?: ChatMessage; messageId?: string; userId?: string }) => {
      if (payload.message) {
        patchMessage(payload.message);
        return;
      }
      if (!payload.messageId) return;
      setLiveMessages((prev) =>
        prev.map((item) =>
          item.id === payload.messageId
            ? { ...item, seenBy: [...new Set([...(item.seenBy ?? []), payload.userId ?? ''])] }
            : item,
        ),
      );
    });

    return () => {
      socket.emit('conversation:leave', conversationId);
      socket.disconnect();
      socketRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [
    conversationId,
    currentUserId,
    currentUsername,
    incrementUnread,
    liveEnabled,
    locale,
    qc,
    setTypingStore,
  ]);

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
        Boolean(text) || Boolean(payload.attachment?.url) || Boolean(payload.location) || Boolean(payload.sticker);
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
      scrollToBottom('smooth');
      return { clientId };
    },
    onSuccess: (created, _vars, context) => {
      setPendingMessages((prev) => prev.filter((item) => item.clientId !== context?.clientId));
      setLiveMessages((prev) => (prev.some((item) => item.id === created.id) ? prev : [...prev, created]));
      qc.invalidateQueries({ queryKey: ['messages', conversationId, locale] });
      scrollToBottom('smooth');
    },
    onError: (_error, payload, context) => {
      setPendingMessages((prev) =>
        prev.map((item) =>
          item.clientId === context?.clientId ? { ...item, ...payload, status: 'failed' } : item,
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
    onSuccess: (updated) => {
      setLiveMessages((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      qc.invalidateQueries({ queryKey: ['messages', conversationId, locale] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) =>
      api<ChatMessage>(`/conversations/${conversationId}/messages/${messageId}`, {
        method: 'DELETE',
        locale,
      }),
    onSuccess: (updated) => {
      setLiveMessages((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      qc.invalidateQueries({ queryKey: ['messages', conversationId, locale] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: ({ messageId, pinned }: { messageId: string; pinned: boolean }) =>
      api<ChatMessage>(`/conversations/${conversationId}/messages/${messageId}/pin`, {
        method: 'POST',
        body: JSON.stringify({ pinned }),
        locale,
      }),
    onSuccess: (updated) => {
      setLiveMessages((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      qc.invalidateQueries({ queryKey: ['messages', conversationId, locale] });
    },
  });

  const seenMutation = useMutation({
    mutationFn: (messageId: string) =>
      api<{ seen: boolean }>(`/conversations/${conversationId}/messages/${messageId}/seen`, {
        method: 'POST',
        locale,
      }),
  });

  const messages = useMemo(() => {
    const merged = [...(data?.data ?? []), ...liveMessages, ...pendingMessages];
    const byId = new Map<string, ChatMessage | PendingMessage>();
    for (const msg of merged) {
      const key = 'clientId' in msg ? (msg as PendingMessage).clientId : msg.id;
      byId.set(key, msg);
    }
    return [...byId.values()].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [data?.data, liveMessages, pendingMessages]);

  const pinnedMessages = useMemo(
    () => messages.filter((item) => !item.deletedAt && item.pinned),
    [messages],
  );

  useEffect(() => {
    if (!messages.length || isLoading) return;
    const frame = requestAnimationFrame(() => {
      scrollToBottom(messages.length > 8 ? 'smooth' : 'auto');
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (typingUsername) scrollToBottom('smooth');
  }, [typingUsername, scrollToBottom]);

  useEffect(() => {
    const unseen = [...messages].reverse().find((msg) => {
      if (msg.deletedAt) return false;
      if (isMineMessage(msg, currentUserId, currentUsername)) return false;
      const seen =
        (currentUserId ? msg.seenBy?.includes(currentUserId) : false) ||
        (currentUsername ? msg.seenBy?.includes(currentUsername) : false);
      return !seen;
    });
    if (!unseen || seenSentRef.current.has(unseen.id)) return;
    seenSentRef.current.add(unseen.id);
    seenMutation.mutate(unseen.id);
  }, [currentUserId, currentUsername, messages, seenMutation]);

  const sendPayload = useCallback(
    (payload: MessagePayload) => {
      setComposerError('');
      sendMutation.mutate(payload);
    },
    [sendMutation],
  );

  const sendText = useCallback(() => {
    const trimmed = draft.trim();
    const validation = validateMessageText(trimmed);
    if (!validation.valid) {
      if (validation.reason === 'spam') {
        setComposerError('That message looks like spam. Try something more meaningful.');
      }
      return;
    }
    setComposerError('');
    sendPayload({
      body: trimmed,
      type: 'text',
      replyToId: replyTo?.id,
      replyToSnippet: replyTo ? messagePreview(replyTo) : undefined,
    });
  }, [draft, replyTo, sendPayload]);

  const retryFailed = useCallback(
    (clientId: string) => {
      const failed = pendingMessages.find((msg) => msg.clientId === clientId);
      if (!failed) return;
      setPendingMessages((prev) => prev.filter((msg) => msg.clientId !== clientId));
      sendPayload({
        body: failed.body,
        type: failed.type,
        attachment: failed.attachment,
        location: failed.location,
        sticker: failed.sticker,
        replyToId: failed.replyToId,
        replyToSnippet: failed.replyToSnippet,
      });
    },
    [pendingMessages, sendPayload],
  );

  const emitTyping = useCallback(() => {
    if (!liveEnabled || !socketRef.current?.connected) return;
    if (typingDebounceRef.current) return;
    typingDebounceRef.current = setTimeout(() => {
      typingDebounceRef.current = null;
    }, 2000);
    socketRef.current.emit('conversation:typing', { conversationId, typing: true });
  }, [conversationId, liveEnabled]);

  const handlePickFiles = useCallback(
    async (files: FileList | null, forcedType: 'image' | 'file' | 'video') => {
      if (!files?.length) return;
      for (const file of Array.from(files)) {
        const url = await fileToDataUrl(file);
        sendPayload({
          type: forcedType,
          body: file.name,
          attachment: { url, name: file.name, mimeType: file.type, size: file.size },
          replyToId: replyTo?.id,
          replyToSnippet: replyTo ? messagePreview(replyTo) : undefined,
        });
      }
    },
    [replyTo, sendPayload],
  );

  const sendLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setComposerError('Location is not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setComposerError('');
        sendPayload({
          type: 'location',
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            label: 'Shared location',
          },
          replyToId: replyTo?.id,
          replyToSnippet: replyTo ? messagePreview(replyTo) : undefined,
        });
      },
      () => setComposerError('Location permission denied.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [replyTo, sendPayload]);

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
        setRecordingMode(mode);
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) mediaChunksRef.current.push(event.data);
        };
        recorder.onstop = async () => {
          const blob = new Blob(mediaChunksRef.current, {
            type: mode === 'voice' ? 'audio/webm' : 'video/webm',
          });
          const file = new File([blob], `${mode}-${Date.now()}.webm`, { type: blob.type });
          const url = await fileToDataUrl(file);
          const durationSec = Math.max(
            1,
            Math.round((Date.now() - recordingStartedAtRef.current) / 1000),
          );
          sendPayload({
            type: mode,
            body: mode === 'voice' ? 'Voice message' : 'Video message',
            attachment: { url, name: file.name, mimeType: blob.type, size: blob.size, durationSec },
            replyToId: replyTo?.id,
            replyToSnippet: replyTo ? messagePreview(replyTo) : undefined,
          });
          setRecordingMode('none');
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
  }, []);

  return {
    me,
    peer,
    messages,
    pinnedMessages,
    isLoading,
    listRef,
    draft,
    setDraft,
    replyTo,
    setReplyTo,
    recordingMode,
    recordingElapsedSec,
    composerError,
    connectionState,
    liveEnabled,
    setLiveEnabled,
    typingUsername,
    currentUserId,
    currentUsername,
    sendText,
    sendPayload,
    retryFailed,
    emitTyping,
    handlePickFiles,
    sendLocation,
    startRecording,
    stopRecording,
    editMutation,
    deleteMutation,
    pinMutation,
    scrollToBottom,
    isSending: sendMutation.isPending,
  };
}
