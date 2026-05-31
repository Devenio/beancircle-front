import type { ChatMessage, ChatMessageType, MessageDeliveryStatus, PendingMessage } from './types';

const URL_REGEX = /https?:\/\/[^\s]+/gi;

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    if (last?.date === dateKey) {
      last.items.push(msg);
    } else {
      groups.push({ date: msg.createdAt, items: [msg] });
    }
  }
  return groups;
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
