'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { io, type Socket } from 'socket.io-client';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ChatMessage = {
  id: string;
  senderId?: string;
  body?: string;
  sender: { id: string; username?: string };
  createdAt: string;
  type: 'text' | 'image' | 'file' | 'location' | 'voice' | 'video' | 'sticker';
  attachment?: {
    url: string;
    name?: string;
    mimeType?: string;
    size?: number;
    durationSec?: number;
  };
  location?: { lat: number; lng: number; label?: string };
  sticker?: string;
  replyToId?: string;
  replyToSnippet?: string;
  editedAt?: string;
  deletedAt?: string;
  pinned?: boolean;
  seenBy?: string[];
};

type MessageListResponse = {
  data: ChatMessage[];
};

type PendingMessage = ChatMessage & {
  clientId: string;
  status: 'sending' | 'failed';
};

const LIVE_CHAT_STORAGE_KEY = 'messages.live.enabled';
const RECONNECT_BACKOFF_MAX_MS = 30000;
const STICKERS = ['😀', '😍', '🔥', '☕', '🎉', '🤝', '💯', '😎'];

type MessagePayload = {
  body?: string;
  type: ChatMessage['type'];
  attachment?: ChatMessage['attachment'];
  location?: ChatMessage['location'];
  sticker?: string;
  replyToId?: string;
  replyToSnippet?: string;
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function messagePreview(message: ChatMessage): string {
  if (message.deletedAt) return 'Message deleted';
  if (message.type === 'sticker') return `Sticker ${message.sticker ?? ''}`.trim();
  if (message.type === 'location') return message.location?.label ?? 'Location';
  if (message.type === 'voice') return 'Voice message';
  if (message.type === 'video') return 'Video message';
  if (message.type === 'image') return message.attachment?.name ?? 'Image';
  if (message.type === 'file') return message.attachment?.name ?? 'File';
  return message.body ?? '';
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function ChatPage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const t = useTranslations('messages');
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const [liveEnabled, setLiveEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(LIVE_CHAT_STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  });
  const [connectionState, setConnectionState] = useState<'offline' | 'connecting' | 'online'>(
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
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [recordingMode, setRecordingMode] = useState<'none' | 'voice' | 'video'>('none');

  const listRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const seenSentRef = useRef<Set<string>>(new Set());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number>(0);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ id?: string; username?: string }>('/users/me', { locale }),
  });

  const { data } = useQuery({
    queryKey: ['messages', id, locale],
    queryFn: () =>
      api<MessageListResponse>(`/conversations/${id}/messages`, { locale }),
  });

  const peerUsername = useMemo(() => {
    const all = data?.data ?? [];
    return all.find((item) => item.sender.username && item.sender.username !== me?.username)?.sender
      .username;
  }, [data?.data, me?.username]);

  useEffect(() => {
    localStorage.setItem(LIVE_CHAT_STORAGE_KEY, String(liveEnabled));
  }, [liveEnabled]);

  const isNearBottom = useCallback((node: HTMLDivElement | null) => {
    if (!node) return true;
    const threshold = 120;
    return node.scrollHeight - node.scrollTop - node.clientHeight < threshold;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    const onScroll = () => {
      shouldAutoScrollRef.current = isNearBottom(node);
    };
    node.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      node.removeEventListener('scroll', onScroll);
    };
  }, [isNearBottom]);

  useEffect(() => {
    if (!liveEnabled) {
      socketRef.current = null;
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket: Socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: RECONNECT_BACKOFF_MAX_MS,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.emit('conversation:join', id);

    socket.on('connect', () => {
      setConnectionState('online');
    });

    socket.on('disconnect', () => {
      setConnectionState('offline');
    });

    socket.on('reconnect_attempt', () => {
      setConnectionState('connecting');
    });

    socket.on('message:new', (msg: ChatMessage) => {
      setLiveMessages((prev) => {
        if (prev.some((item) => item.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Keep history synced with server-source ordering and sequencing.
      qc.invalidateQueries({ queryKey: ['messages', id, locale] });
    });

    socket.on(
      'conversation:typing',
      (payload: { username?: string; userId?: string; typing?: boolean; conversationId?: string }) => {
      if (payload.conversationId && payload.conversationId !== id) return;
        if (payload.username && payload.username === me?.username) return;
        if (payload.typing === false) {
          setTypingUsername(null);
          return;
        }
        const actor = payload.username ?? (payload.userId ? 'Someone' : null);
        if (!actor) return;
        setTypingUsername(actor);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTypingUsername(null);
      }, 3000);
      },
    );

    socket.on('message:edited', (msg: ChatMessage) => {
      setLiveMessages((prev) => prev.map((item) => (item.id === msg.id ? msg : item)));
    });
    socket.on('message:deleted', (msg: ChatMessage) => {
      setLiveMessages((prev) => prev.map((item) => (item.id === msg.id ? msg : item)));
    });
    socket.on('message:pinned', (msg: ChatMessage) => {
      setLiveMessages((prev) => prev.map((item) => (item.id === msg.id ? msg : item)));
    });
    socket.on(
      'message:seen',
      (payload: { messageId?: string; message?: ChatMessage; userId?: string }) => {
        if (payload.message) {
          setLiveMessages((prev) =>
            prev.map((item) => (item.id === payload.message?.id ? payload.message : item)),
          );
          return;
        }
        if (!payload.messageId) return;
        setLiveMessages((prev) =>
          prev.map((item) =>
            item.id === payload.messageId
              ? {
                  ...item,
                  seenBy: [...new Set([...(item.seenBy ?? []), payload.userId ?? ''])],
                }
              : item,
          ),
        );
      },
    );

    return () => {
      socket.emit('conversation:leave', id);
      socket.disconnect();
      socketRef.current = null;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [id, qc, liveEnabled, locale, me?.username]);

  const sendMutation = useMutation({
    mutationFn: (payload: MessagePayload) =>
      api<ChatMessage>(`/conversations/${id}/messages`, {
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
        senderId: me?.id ?? 'self',
        clientId,
        body: text,
        createdAt: new Date().toISOString(),
        type: payload.type,
        attachment: payload.attachment,
        location: payload.location,
        sticker: payload.sticker,
        replyToId: payload.replyToId,
        replyToSnippet: payload.replyToSnippet,
        sender: {
          id: 'self',
          username: me?.username ?? localUsername ?? 'me',
        },
        status: 'sending',
      };
      setPendingMessages((prev) => [...prev, optimistic]);
      setDraft('');
      setReplyTo(null);
      shouldAutoScrollRef.current = true;
      scrollToBottom('smooth');
      return { clientId };
    },
    onSuccess: (created, _vars, context) => {
      setPendingMessages((prev) => prev.filter((item) => item.clientId !== context?.clientId));
      setLiveMessages((prev) => {
        if (prev.some((item) => item.id === created.id)) return prev;
        return [...prev, created];
      });
      if (peerUsername && created.sender.username === (me?.username ?? localUsername ?? 'me')) {
        setTimeout(() => {
          setLiveMessages((prev) =>
            prev.map((item) =>
              item.id === created.id
                ? { ...item, seenBy: [...new Set([...(item.seenBy ?? []), peerUsername])] }
                : item,
            ),
          );
        }, 1200);
      }
      qc.invalidateQueries({ queryKey: ['messages', id, locale] });
      scrollToBottom('smooth');
    },
    onError: (_error, payload, context) => {
      setPendingMessages((prev) =>
        prev.map((item) =>
          item.clientId === context?.clientId
            ? {
                ...item,
                body: payload.body,
                type: payload.type,
                attachment: payload.attachment,
                location: payload.location,
                sticker: payload.sticker,
                replyToId: payload.replyToId,
                replyToSnippet: payload.replyToSnippet,
                status: 'failed',
              }
            : item,
        ),
      );
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: string }) =>
      api<ChatMessage>(`/conversations/${id}/messages/${messageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ body }),
        locale,
      }),
    onSuccess: (updated) => {
      setLiveMessages((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingMessageId(null);
      setEditingDraft('');
      qc.invalidateQueries({ queryKey: ['messages', id, locale] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) =>
      api<ChatMessage>(`/conversations/${id}/messages/${messageId}`, {
        method: 'DELETE',
        locale,
      }),
    onSuccess: (updated) => {
      setLiveMessages((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      qc.invalidateQueries({ queryKey: ['messages', id, locale] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: ({ messageId, pinned }: { messageId: string; pinned: boolean }) =>
      api<ChatMessage>(`/conversations/${id}/messages/${messageId}/pin`, {
        method: 'POST',
        body: JSON.stringify({ pinned }),
        locale,
      }),
    onSuccess: (updated) => {
      setLiveMessages((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      qc.invalidateQueries({ queryKey: ['messages', id, locale] });
    },
  });

  const seenMutation = useMutation({
    mutationFn: (messageId: string) =>
      api<{ seen: boolean }>(`/conversations/${id}/messages/${messageId}/seen`, {
        method: 'POST',
        locale,
      }),
  });

  const currentUsername = me?.username ?? localUsername;
  const currentUserId = me?.id;

  const messages = useMemo(() => {
    const merged = [...(data?.data ?? []), ...liveMessages, ...pendingMessages];
    const byId = new Map<string, ChatMessage | PendingMessage>();

    for (const msg of merged) {
      const key = 'clientId' in msg ? msg.clientId : msg.id;
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
    if (messages.length === 0) return;
    if (!shouldAutoScrollRef.current && !sendMutation.isPending) return;
    scrollToBottom(messages.length > 8 ? 'smooth' : 'auto');
  }, [messages, scrollToBottom, sendMutation.isPending]);

  useEffect(() => {
    const unseenIncoming = [...messages]
      .reverse()
      .find((msg) => {
        if (msg.deletedAt) return false;
        const isMineById = Boolean(currentUserId) && msg.senderId === currentUserId;
        const isMineByUsername =
          Boolean(currentUsername) && msg.sender.username === currentUsername;
        if (isMineById || isMineByUsername) return false;
        const seenByMe =
          (currentUserId ? msg.seenBy?.includes(currentUserId) : false) ||
          (currentUsername ? msg.seenBy?.includes(currentUsername) : false);
        return !seenByMe;
      });
    if (!unseenIncoming) return;
    if (seenSentRef.current.has(unseenIncoming.id)) return;
    seenSentRef.current.add(unseenIncoming.id);
    seenMutation.mutate(unseenIncoming.id);
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
    if (!trimmed) return;
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

    socketRef.current.emit('conversation:typing', { conversationId: id });
  }, [id, liveEnabled]);

  const handlePickFiles = useCallback(
    async (files: FileList | null, forcedType: 'image' | 'file' | 'video') => {
      if (!files?.length) return;
      for (const file of Array.from(files)) {
        const url = await fileToDataUrl(file);
        sendPayload({
          type: forcedType,
          body: file.name,
          attachment: {
            url,
            name: file.name,
            mimeType: file.type,
            size: file.size,
          },
          replyToId: replyTo?.id,
          replyToSnippet: replyTo ? messagePreview(replyTo) : undefined,
        });
      }
    },
    [replyTo, sendPayload],
  );

  const sendLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setComposerError('Location is not supported by this browser.');
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
      () => {
        setComposerError('Location permission denied.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [replyTo, sendPayload]);

  const startRecording = useCallback(async (mode: 'voice' | 'video') => {
    if (recordingMode !== 'none') return;
    setComposerError('');
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
        if (event.data.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(mediaChunksRef.current, {
          type: mode === 'voice' ? 'audio/webm' : 'video/webm',
        });
        const file = new File([blob], `${mode}-${Date.now()}.webm`, { type: blob.type });
        const url = await fileToDataUrl(file);
        const durationSec = Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000));
        sendPayload({
          type: mode,
          body: mode === 'voice' ? 'Voice message' : 'Video message',
          attachment: {
            url,
            name: file.name,
            mimeType: blob.type,
            size: blob.size,
            durationSec,
          },
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
  }, [recordingMode, replyTo, sendPayload]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
    for (const track of mediaStreamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
  }, []);

  const copyMessage = useCallback((msg: ChatMessage | PendingMessage) => {
    if (!navigator.clipboard) return;
    const text =
      msg.body ||
      msg.sticker ||
      (msg.location ? `${msg.location.lat}, ${msg.location.lng}` : '') ||
      msg.attachment?.url ||
      '';
    if (!text) return;
    navigator.clipboard.writeText(text);
  }, []);

  const renderMessageContent = useCallback((msg: ChatMessage | PendingMessage) => {
    if (msg.deletedAt) {
      return <p className="italic text-neutral-400">Message deleted</p>;
    }
    if (msg.replyToSnippet) {
      return (
        <p className="mb-2 rounded-lg border border-neutral-300/50 px-2 py-1 text-xs opacity-80">
          Replying to: {msg.replyToSnippet}
        </p>
      );
    }
    return null;
  }, []);

  useEffect(() => {
    return () => {
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
        typingDebounceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      for (const track of mediaStreamRef.current?.getTracks() ?? []) {
        track.stop();
      }
    };
  }, []);

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2 text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-block h-2 w-2 rounded-full',
              connectionState === 'online' && 'bg-emerald-500',
              connectionState === 'connecting' && 'bg-amber-400',
              connectionState === 'offline' && 'bg-neutral-300',
            )}
          />
          <span>{connectionState === 'online' ? 'Live' : connectionState === 'connecting' ? 'Reconnecting...' : 'Offline'}</span>
        </div>
        <button
          type="button"
          className={cn(
            'rounded-full border px-2 py-1 transition',
            liveEnabled
              ? 'border-neutral-800 bg-neutral-800 text-white'
              : 'border-neutral-300 bg-white text-neutral-600',
          )}
          onClick={() => {
            setLiveEnabled((prev) => {
              const next = !prev;
              setConnectionState(next ? 'connecting' : 'offline');
              return next;
            });
          }}
        >
          {liveEnabled ? 'Realtime on' : 'Realtime off'}
        </button>
      </div>
      {pinnedMessages.length > 0 && (
        <div className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-800">
          📌 Pinned: {messagePreview(pinnedMessages[pinnedMessages.length - 1])}
        </div>
      )}
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((msg) => {
          const pending = 'status' in msg ? msg.status : null;
          const pendingClientId = 'clientId' in msg ? msg.clientId : null;
          const isMine =
            (Boolean(currentUserId) && Boolean(msg.senderId)
              ? msg.senderId === currentUserId
              : false) ||
            (Boolean(currentUsername) && msg.sender?.username
              ? msg.sender.username === currentUsername
              : false);

          return (
            <div
              key={'clientId' in msg ? msg.clientId : msg.id}
              className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                  isMine ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-900',
                  pending === 'sending' && 'opacity-70',
                  pending === 'failed' && 'border border-red-300 bg-red-50 text-red-700',
                )}
              >
                {msg.pinned && <p className="mb-1 text-[10px] uppercase opacity-80">📌 pinned</p>}
                {renderMessageContent(msg)}
                {!msg.deletedAt && msg.type === 'text' && <p className="break-words">{msg.body}</p>}
                {!msg.deletedAt && msg.type === 'sticker' && (
                  <p className="text-3xl leading-none">{msg.sticker ?? '😀'}</p>
                )}
                {!msg.deletedAt && msg.type === 'image' && msg.attachment?.url && (
                  <Image
                    src={msg.attachment.url}
                    alt={msg.attachment.name ?? 'image'}
                    width={320}
                    height={224}
                    className="max-h-56 rounded-lg object-cover"
                  />
                )}
                {!msg.deletedAt && msg.type === 'video' && msg.attachment?.url && (
                  <video
                    controls
                    className="max-h-56 rounded-lg"
                    src={msg.attachment.url}
                  />
                )}
                {!msg.deletedAt && msg.type === 'voice' && msg.attachment?.url && (
                  <audio controls src={msg.attachment.url} className="max-w-full" />
                )}
                {!msg.deletedAt && msg.type === 'file' && msg.attachment?.url && (
                  <a
                    href={msg.attachment.url}
                    download={msg.attachment.name}
                    className="underline"
                  >
                    📎 {msg.attachment.name ?? 'Download file'}
                  </a>
                )}
                {!msg.deletedAt && msg.type === 'location' && msg.location && (
                  <a
                    href={`https://maps.google.com/?q=${msg.location.lat},${msg.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    📍 {msg.location.label ?? `${msg.location.lat.toFixed(4)}, ${msg.location.lng.toFixed(4)}`}
                  </a>
                )}
                <div
                  className={cn(
                    'mt-1 flex items-center justify-end gap-2 text-[10px]',
                    isMine ? 'text-neutral-300' : 'text-neutral-500',
                    pending === 'failed' && 'text-red-500',
                  )}
                >
                  {msg.editedAt && <span>edited</span>}
                  <span>{formatTime(msg.createdAt)}</span>
                  {isMine &&
                    msg.seenBy &&
                    msg.seenBy.some(
                      (user) => user !== currentUsername && user !== currentUserId,
                    ) && <span>seen</span>}
                  {pending === 'sending' && <span>sending...</span>}
                  {pending === 'failed' && (
                    <button
                      type="button"
                      className="underline"
                      onClick={() => pendingClientId && retryFailed(pendingClientId)}
                    >
                      retry
                    </button>
                  )}
                </div>
                {!msg.deletedAt && (
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                    <button
                      type="button"
                      className="underline"
                      onClick={() => setReplyTo(msg)}
                    >
                      reply
                    </button>
                    <button
                      type="button"
                      className="underline"
                      onClick={() => copyMessage(msg)}
                    >
                      copy
                    </button>
                    {!pendingClientId && (
                      <button
                        type="button"
                        className="underline"
                        onClick={() =>
                          pinMutation.mutate({ messageId: msg.id, pinned: !Boolean(msg.pinned) })
                        }
                      >
                        {msg.pinned ? 'unpin' : 'pin'}
                      </button>
                    )}
                    {!pendingClientId && isMine && msg.type === 'text' && (
                      <button
                        type="button"
                        className="underline"
                        onClick={() => {
                          setEditingMessageId(msg.id);
                          setEditingDraft(msg.body ?? '');
                        }}
                      >
                        edit
                      </button>
                    )}
                    {!pendingClientId && isMine && (
                      <button
                        type="button"
                        className="underline"
                        onClick={() => deleteMutation.mutate(msg.id)}
                      >
                        delete
                      </button>
                    )}
                  </div>
                )}
                {editingMessageId === msg.id && (
                  <div className="mt-2 flex gap-1">
                    <Input
                      value={editingDraft}
                      onChange={(event) => setEditingDraft(event.target.value)}
                      className="h-8 text-xs"
                    />
                    <Button
                      className="h-8 px-2 text-xs"
                      onClick={() =>
                        editMutation.mutate({
                          messageId: msg.id,
                          body: editingDraft.trim(),
                        })
                      }
                      disabled={!editingDraft.trim()}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        setEditingMessageId(null);
                        setEditingDraft('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {typingUsername && (
          <p className="text-xs text-neutral-400">{typingUsername} is typing...</p>
        )}
      </div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void handlePickFiles(event.target.files, 'image');
          event.target.value = '';
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          void handlePickFiles(event.target.files, 'file');
          event.target.value = '';
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void handlePickFiles(event.target.files, 'video');
          event.target.value = '';
        }}
      />
      <div className="border-t p-3">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs">
            <span className="truncate">Reply: {messagePreview(replyTo)}</span>
            <button type="button" onClick={() => setReplyTo(null)} className="underline">
              cancel
            </button>
          </div>
        )}
        {showStickerPicker && (
          <div className="mb-2 flex flex-wrap gap-2 rounded-lg border border-neutral-200 bg-white p-2">
            {STICKERS.map((sticker) => (
              <button
                key={sticker}
                type="button"
                className="rounded-md border px-2 py-1 text-xl"
                onClick={() => {
                  sendPayload({
                    type: 'sticker',
                    sticker,
                    body: `Sticker ${sticker}`,
                    replyToId: replyTo?.id,
                    replyToSnippet: replyTo ? messagePreview(replyTo) : undefined,
                  });
                  setShowStickerPicker(false);
                }}
              >
                {sticker}
              </button>
            ))}
          </div>
        )}
        {composerError && (
          <p className="mb-2 text-xs text-red-500">{composerError}</p>
        )}
        <div className="mb-2 flex flex-wrap gap-2">
          <Button variant="outline" className="h-8 px-2 text-xs" onClick={() => imageInputRef.current?.click()}>
            image
          </Button>
          <Button variant="outline" className="h-8 px-2 text-xs" onClick={() => fileInputRef.current?.click()}>
            attachment
          </Button>
          <Button variant="outline" className="h-8 px-2 text-xs" onClick={() => videoInputRef.current?.click()}>
            video file
          </Button>
          <Button variant="outline" className="h-8 px-2 text-xs" onClick={sendLocation}>
            location
          </Button>
          <Button
            variant={recordingMode === 'voice' ? 'default' : 'outline'}
            className="h-8 px-2 text-xs"
            onClick={() => {
              if (recordingMode === 'voice') {
                stopRecording();
                return;
              }
              void startRecording('voice');
            }}
          >
            {recordingMode === 'voice' ? 'stop voice' : 'voice'}
          </Button>
          <Button
            variant={recordingMode === 'video' ? 'default' : 'outline'}
            className="h-8 px-2 text-xs"
            onClick={() => {
              if (recordingMode === 'video') {
                stopRecording();
                return;
              }
              void startRecording('video');
            }}
          >
            {recordingMode === 'video' ? 'stop video msg' : 'video msg'}
          </Button>
          <Button
            variant="outline"
            className="h-8 px-2 text-xs"
            onClick={() => setShowStickerPicker((prev) => !prev)}
          >
            sticker
          </Button>
        </div>
        <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (e.target.value.trim()) {
              emitTyping();
            }
          }}
          placeholder={t('typeMessage')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendText();
            }
          }}
        />
          <Button onClick={sendText} disabled={!draft.trim() || sendMutation.isPending}>
          {t('send')}
        </Button>
        </div>
      </div>
    </div>
  );
}
