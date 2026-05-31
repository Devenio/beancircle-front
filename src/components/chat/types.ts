export type ChatMessageType =
  | 'text'
  | 'image'
  | 'file'
  | 'location'
  | 'voice'
  | 'video'
  | 'sticker';

export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'seen' | 'failed';

export type ChatMember = {
  id: string;
  username?: string;
  name?: string;
  avatarUrl?: string | null;
};

export type ChatMessage = {
  id: string;
  senderId?: string;
  body?: string;
  sender: ChatMember;
  createdAt: string;
  type: ChatMessageType;
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

export type PendingMessage = ChatMessage & {
  clientId: string;
  status: 'sending' | 'failed';
};

export type MessagePayload = {
  body?: string;
  type: ChatMessageType;
  attachment?: ChatMessage['attachment'];
  location?: ChatMessage['location'];
  sticker?: string;
  replyToId?: string;
  replyToSnippet?: string;
};

export type Conversation = {
  id: string;
  updatedAt?: string;
  otherMember?: ChatMember;
  lastMessage?: {
    body?: string;
    type?: ChatMessageType;
    createdAt?: string;
    senderId?: string;
  };
};

export type MessageReaction = {
  emoji: string;
  userId: string;
};

export type ConnectionState = 'offline' | 'connecting' | 'online';
