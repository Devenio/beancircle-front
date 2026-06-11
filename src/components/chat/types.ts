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

export type ReactionGroup = {
  emoji: string;
  count: number;
  userIds: string[];
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
  imageUrl?: string;
  location?: { lat: number; lng: number; label?: string };
  sticker?: string;
  replyToId?: string;
  replyToSnippet?: string;
  forwardedFromId?: string;
  forwardedFromName?: string;
  editedAt?: string;
  deletedAt?: string;
  pinned?: boolean;
  spoiler?: boolean;
  seenBy?: string[];
  reactions?: ReactionGroup[];
  /** Client-only: shared layout id while optimistic send resolves */
  sendLayoutId?: string;
  /** Client-only: play a one-time enter animation (e.g. incoming socket message) */
  enterAnimate?: boolean;
};

export type PendingMessage = ChatMessage & {
  clientId: string;
  status: 'sending' | 'failed';
};

export type MessagePayload = {
  body?: string;
  type: ChatMessageType;
  attachment?: ChatMessage['attachment'];
  imageUrl?: string;
  location?: ChatMessage['location'];
  sticker?: string;
  replyToId?: string;
  replyToSnippet?: string;
  spoiler?: boolean;
};

export type Conversation = {
  id: string;
  updatedAt?: string;
  createdAt?: string;
  otherMember?: ChatMember;
  lastMessage?: ChatMessage;
  unreadCount?: number;
  muted?: boolean;
  pinned?: boolean;
  lastReadAt?: string | null;
  lastReadMessageId?: string | null;
};

export type MessageReaction = {
  emoji: string;
  userId: string;
};

export type ConnectionState = 'offline' | 'connecting' | 'online';

export type BlockStatus = {
  blocked: boolean;
  blockedByYou: boolean;
  blockedByPeer: boolean;
};
