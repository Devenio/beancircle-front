import type { ChatMessage, ChatMessageType, MessageDeliveryStatus, PendingMessage } from './types';

const URL_REGEX = /https?:\/\/[^\s]+/gi;

/** Messages from the same sender within this window are visually grouped. */
export const GROUP_TIME_THRESHOLD_MS = 3 * 60 * 1000;

export type MessageSenderGroup = {
  senderId: string;
  isMine: boolean;
  messages: (ChatMessage | PendingMessage)[];
};

export type MessageDateGroup = {
  date: string;
  senderGroups: MessageSenderGroup[];
};

export type PresenceStatusTone = 'typing' | 'online' | 'offline';

/** Maps presence state to a translation key + optional params (messages namespace). */
export function resolvePresenceStatus(
  opts: {
    online?: boolean;
    typingUsername?: string | null;
    lastSeenAt?: string | null;
    lastSeenHidden?: boolean;
    locale?: string;
  },
): { tone: PresenceStatusTone; key: string; params?: Record<string, string | number> } {
  if (opts.typingUsername) {
    return { tone: 'typing', key: 'typing', params: { name: opts.typingUsername } };
  }
  if (opts.online) {
    return { tone: 'online', key: 'online' };
  }

  const lastSeenKey = formatLastSeen(opts.lastSeenAt, opts.lastSeenHidden, opts.locale);
  if (lastSeenKey === 'recently') return { tone: 'offline', key: 'lastSeenRecently' };
  if (lastSeenKey === 'just_now') return { tone: 'offline', key: 'lastSeenJustNow' };
  if (lastSeenKey === 'yesterday') return { tone: 'offline', key: 'lastSeenYesterday' };
  if (lastSeenKey?.startsWith('today:')) {
    return {
      tone: 'offline',
      key: 'lastSeenToday',
      params: { time: lastSeenKey.split(':')[1] ?? '' },
    };
  }
  if (lastSeenKey?.endsWith('m')) {
    return {
      tone: 'offline',
      key: 'lastSeenMinutes',
      params: { count: parseInt(lastSeenKey, 10) || 0 },
    };
  }
  if (lastSeenKey) {
    return { tone: 'offline', key: 'lastSeenDate', params: { date: lastSeenKey } };
  }
  return { tone: 'offline', key: 'lastSeenRecently' };
}

export function formatLastSeen(
  lastSeenAt: string | null | undefined,
  hidden?: boolean,
  locale?: string,
): string | null {
  if (hidden) return 'recently';
  if (!lastSeenAt) return null;

  const date = new Date(lastSeenAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'just_now';
  if (diffMin < 60) return `${diffMin}m`;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const timeStr = date.toLocaleTimeString(locale ?? undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (date.toDateString() === today.toDateString()) return `today:${timeStr}`;
  if (date.toDateString() === yesterday.toDateString()) return 'yesterday';
  return date.toLocaleDateString(locale ?? undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Short label for conversation list rows (today → time, else date). */
export function formatConversationTimestamp(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) {
    return formatTime(iso);
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatDateLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function messagePreview(message: Pick<ChatMessage, 'body' | 'type' | 'sticker' | 'location' | 'attachment' | 'deletedAt'>): string {
  if (message.deletedAt) return 'Message deleted';
  if (message.type === 'sticker') return `Sticker ${message.sticker ?? ''}`.trim();
  if (message.type === 'location') return message.location?.label ?? 'Location';
  if (message.type === 'voice') return 'Voice message';
  if (message.type === 'video') return 'Video message';
  if (message.type === 'image') return message.attachment?.name ?? 'Photo';
  if (message.type === 'file') return message.attachment?.name ?? 'File';
  return message.body ?? '';
}

export function extractUrls(text?: string): string[] {
  if (!text) return [];
  return [...text.matchAll(URL_REGEX)].map((match) => match[0]);
}

export function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds?: number) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function isMineMessage(
  msg: ChatMessage | PendingMessage,
  currentUserId?: string,
  currentUsername?: string | null,
) {
  if (currentUserId && msg.senderId === currentUserId) return true;
  if (currentUsername && msg.sender?.username === currentUsername) return true;
  return false;
}

export function getDeliveryStatus(
  msg: ChatMessage | PendingMessage,
  currentUserId?: string,
  currentUsername?: string | null,
  peerId?: string,
): MessageDeliveryStatus | null {
  if ('status' in msg) {
    if (msg.status === 'sending') return 'sending';
    if (msg.status === 'failed') return 'failed';
  }
  if (!isMineMessage(msg, currentUserId, currentUsername)) return null;

  const seenByOthers = (msg.seenBy ?? []).some(
    (id) => id !== currentUserId && id !== currentUsername,
  );
  if (seenByOthers) return 'seen';
  if (peerId && (msg.seenBy ?? []).includes(peerId)) return 'delivered';
  return 'sent';
}

export function groupMessagesByDate(messages: (ChatMessage | PendingMessage)[]) {
  const groups: { date: string; items: (ChatMessage | PendingMessage)[] }[] = [];
  for (const msg of messages) {
    const dateKey = new Date(msg.createdAt).toDateString();
    const last = groups[groups.length - 1];
    if (last && new Date(last.date).toDateString() === dateKey) {
      last.items.push(msg);
    } else {
      groups.push({ date: dateKey, items: [msg] });
    }
  }
  return groups;
}

export function groupMessagesBySenderAndDate(
  messages: (ChatMessage | PendingMessage)[],
  currentUserId?: string,
  currentUsername?: string | null,
): MessageDateGroup[] {
  return groupMessagesByDate(messages).map(({ date, items }) => {
    const senderGroups: MessageSenderGroup[] = [];

    for (const msg of items) {
      const isMine = isMineMessage(msg, currentUserId, currentUsername);
      const senderId = msg.sender.id ?? msg.senderId ?? 'unknown';
      const last = senderGroups[senderGroups.length - 1];
      const prevMsg = last?.messages[last.messages.length - 1];
      const withinWindow =
        prevMsg &&
        new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() <
          GROUP_TIME_THRESHOLD_MS;

      if (last && last.senderId === senderId && last.isMine === isMine && withinWindow) {
        last.messages.push(msg);
      } else {
        senderGroups.push({ senderId, isMine, messages: [msg] });
      }
    }

    return { date, senderGroups };
  });
}

export function getGroupPosition(
  index: number,
  total: number,
): 'single' | 'first' | 'middle' | 'last' {
  if (total === 1) return 'single';
  if (index === 0) return 'first';
  if (index === total - 1) return 'last';
  return 'middle';
}

export function renderMentionParts(text: string) {
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((part, index) =>
    part.startsWith('@') ? { type: 'mention' as const, value: part, key: index } : { type: 'text' as const, value: part, key: index },
  );
}

export function conversationSortKey(conv: { updatedAt?: string; lastMessage?: { createdAt?: string } }) {
  return new Date(conv.updatedAt ?? conv.lastMessage?.createdAt ?? 0).getTime();
}

export function previewFromLastMessage(lastMessage?: {
  body?: string;
  type?: ChatMessageType;
}): string {
  if (!lastMessage) return 'No messages yet';
  return messagePreview({
    body: lastMessage.body,
    type: lastMessage.type ?? 'text',
  });
}
