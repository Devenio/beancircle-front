import {
  type MockChatMessage,
  MOCK_CAFES,
  MOCK_CITIES,
  MOCK_COMMENTS,
  MOCK_CONVERSATIONS,
  MOCK_CURRENT_USER,
  MOCK_MESSAGES,
  MOCK_NOTIFICATIONS,
  MOCK_POSTS,
  MOCK_USERS,
} from './mock-data';

type RequestOptions = RequestInit & { locale?: string };

function parseBody(body?: BodyInit | null): Record<string, unknown> {
  if (!body || typeof body !== 'string') return {};
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function notFound(path: string): never {
  throw new Error(`Mock API: no handler for ${path}`);
}

/** user ids blocked by the mock current user */
const mockBlockedUserIds = new Set<string>();
/** message ids hidden for the mock current user only */
const mockHiddenMessageIds = new Set<string>();
/** conversation ids hidden for the mock current user only */
const mockHiddenConversationIds = new Set<string>();

function findConversationMessage(conversationId: string, messageId: string) {
  const list = MOCK_MESSAGES[conversationId] ?? [];
  const message = list.find((item) => item.id === messageId);
  return { list, message };
}

function getConversationPreview(message: MockChatMessage): string {
  if (message.deletedAt) return 'Message deleted';
  if (message.type === 'sticker') return `Sticker ${message.sticker ?? ''}`.trim();
  if (message.type === 'location') return message.location?.label ?? 'Location';
  if (message.type === 'image') return `Image${message.attachment?.name ? `: ${message.attachment.name}` : ''}`;
  if (message.type === 'video') return `Video${message.attachment?.name ? `: ${message.attachment.name}` : ''}`;
  if (message.type === 'voice') return 'Voice message';
  if (message.type === 'file') return `File${message.attachment?.name ? `: ${message.attachment.name}` : ''}`;
  return message.body ?? '';
}

export async function handleMockRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const [pathname, query = ''] = path.split('?');
  const params = new URLSearchParams(query);

  // Auth
  if (pathname === '/auth/otp/request' && method === 'POST') {
    return { message: 'OTP sent (mock)', code: '123456' } as T;
  }
  if (pathname === '/auth/otp/verify' && method === 'POST') {
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: MOCK_CURRENT_USER,
    } as T;
  }
  if (pathname === '/auth/refresh' && method === 'POST') {
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    } as T;
  }
  if (pathname === '/auth/logout' && method === 'POST') {
    return undefined as T;
  }

  // Feed & posts
  if (pathname === '/posts/feed' && method === 'GET') {
    return { data: MOCK_POSTS, nextCursor: null } as T;
  }
  const postMatch = pathname.match(/^\/posts\/([^/]+)$/);
  if (postMatch && method === 'GET') {
    const post = MOCK_POSTS.find((p) => p.id === postMatch[1]);
    if (!post) notFound(path);
    return post as T;
  }
  const postCommentsMatch = pathname.match(/^\/posts\/([^/]+)\/comments$/);
  if (postCommentsMatch && method === 'GET') {
    return (MOCK_COMMENTS[postCommentsMatch[1]] ?? []) as T;
  }
  if (postCommentsMatch && method === 'POST') {
    const body = parseBody(options.body);
    return {
      id: `mock-comment-${Date.now()}`,
      body: String(body.body ?? ''),
      author: { username: MOCK_CURRENT_USER.username },
    } as T;
  }
  const postSaveMatch = pathname.match(/^\/posts\/([^/]+)\/save$/);
  if (postSaveMatch && (method === 'POST' || method === 'DELETE')) {
    return { saved: method === 'POST' } as T;
  }

  // Likes
  const likeMatch = pathname.match(/^\/likes\/posts\/([^/]+)$/);
  if (likeMatch && (method === 'POST' || method === 'DELETE')) {
    return { liked: method === 'POST' } as T;
  }

  // Users
  if (pathname === '/users/me' && method === 'GET') {
    return { username: MOCK_CURRENT_USER.username } as T;
  }
  if (pathname === '/users/cities' && method === 'GET') {
    return MOCK_CITIES as T;
  }
  const userProfileMatch = pathname.match(/^\/users\/([^/]+)$/);
  if (userProfileMatch && method === 'GET') {
    const username = userProfileMatch[1];
    const profile = Object.values(MOCK_USERS).find((u) => u.username === username);
    if (!profile) notFound(path);
    return {
      ...profile,
      isFollowing: username === 'sara',
      isSelf: username === MOCK_CURRENT_USER.username,
    } as T;
  }
  const userFollowMatch = pathname.match(/^\/users\/([^/]+)\/follow$/);
  if (userFollowMatch && (method === 'POST' || method === 'DELETE')) {
    return { following: method === 'POST' } as T;
  }
  const blockStatusMatch = pathname.match(/^\/users\/([^/]+)\/block-status$/);
  if (blockStatusMatch && method === 'GET') {
    const userId = blockStatusMatch[1];
    const blockedByYou = mockBlockedUserIds.has(userId);
    return {
      blocked: blockedByYou,
      blockedByYou,
      blockedByPeer: false,
    } as T;
  }
  const blockUserMatch = pathname.match(/^\/users\/([^/]+)\/block$/);
  if (blockUserMatch && method === 'POST') {
    mockBlockedUserIds.add(blockUserMatch[1]);
    return { blocked: true } as T;
  }
  if (blockUserMatch && method === 'DELETE') {
    mockBlockedUserIds.delete(blockUserMatch[1]);
    return { blocked: false } as T;
  }

  // Search
  if (pathname === '/search' && method === 'GET') {
    const q = (params.get('q') ?? '').toLowerCase();
    const users = Object.values(MOCK_USERS).filter(
      (u) =>
        u.username?.includes(q) ||
        u.name.toLowerCase().includes(q),
    );
    const cafes = Object.values(MOCK_CAFES).filter((c) =>
      c.name.toLowerCase().includes(q),
    );
    return { users, cafes } as T;
  }

  // Conversations
  if (pathname === '/conversations' && method === 'GET') {
    return MOCK_CONVERSATIONS.filter((c) => !mockHiddenConversationIds.has(c.id)) as T;
  }
  if (pathname === '/conversations' && method === 'POST') {
    const body = parseBody(options.body);
    const participantId = String(body.participantId ?? '');
    const other = Object.values(MOCK_USERS).find((u) => u.id === participantId);
    const existing = MOCK_CONVERSATIONS.find((c) => c.otherMember?.id === participantId);
    if (existing) return { id: existing.id } as T;
    return {
      id: `mock-conv-${Date.now()}`,
      otherMember: other,
    } as T;
  }
  const messagesMatch = pathname.match(/^\/conversations\/([^/]+)\/messages$/);
  if (messagesMatch && method === 'GET') {
    const conversationMessages = (MOCK_MESSAGES[messagesMatch[1]] ?? []).filter(
      (m) => !mockHiddenMessageIds.has(m.id),
    );
    return {
      data: [...conversationMessages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
      nextCursor: null,
    } as T;
  }
  if (messagesMatch && method === 'DELETE') {
    const conversationId = messagesMatch[1];
    const body = parseBody(options.body);
    const forEveryone = Boolean(body.forEveryone);
    if (forEveryone) {
      const list = MOCK_MESSAGES[conversationId] ?? [];
      const now = new Date().toISOString();
      for (const message of list) {
        message.body = '';
        message.deletedAt = now;
      }
      mockHiddenConversationIds.add(conversationId);
    } else {
      mockHiddenConversationIds.add(conversationId);
    }
    return { conversationId, scope: forEveryone ? 'everyone' : 'me', deleted: true } as T;
  }
  if (messagesMatch && method === 'POST') {
    const conversationId = messagesMatch[1];
    const conversation = MOCK_CONVERSATIONS.find((item) => item.id === conversationId);
    const peerId = conversation?.otherMember?.id;
    if (peerId && mockBlockedUserIds.has(peerId)) {
      throw new Error('Cannot message this user');
    }
    const body = parseBody(options.body);
    const list = (MOCK_MESSAGES[conversationId] ??= []);
    const message: MockChatMessage = {
      id: `mock-msg-${Date.now()}`,
      body: String(body.body ?? ''),
      sender: { id: MOCK_CURRENT_USER.id, username: MOCK_CURRENT_USER.username },
      createdAt: new Date().toISOString(),
      type:
        typeof body.type === 'string'
          ? (body.type as MockChatMessage['type'])
          : 'text',
      attachment:
        typeof body.attachment === 'object' && body.attachment
          ? (body.attachment as MockChatMessage['attachment'])
          : undefined,
      location:
        typeof body.location === 'object' && body.location
          ? (body.location as MockChatMessage['location'])
          : undefined,
      sticker: typeof body.sticker === 'string' ? body.sticker : undefined,
      replyToId: typeof body.replyToId === 'string' ? body.replyToId : undefined,
      replyToSnippet:
        typeof body.replyToSnippet === 'string' ? body.replyToSnippet : undefined,
      pinned: Boolean(body.pinned),
      seenBy: [MOCK_CURRENT_USER.username],
    };

    list.push(message);
    if (conversation) {
      conversation.updatedAt = message.createdAt;
      conversation.lastMessage = {
        body: getConversationPreview(message),
        type: message.type,
        createdAt: message.createdAt,
        senderId: message.sender.id,
      };
    }
    return message as T;
  }

  const messageItemMatch = pathname.match(/^\/conversations\/([^/]+)\/messages\/([^/]+)$/);
  if (messageItemMatch && method === 'PATCH') {
    const body = parseBody(options.body);
    const conversationId = messageItemMatch[1];
    const messageId = messageItemMatch[2];
    const { message } = findConversationMessage(conversationId, messageId);
    if (!message) notFound(path);

    if (typeof body.body === 'string') {
      message.body = body.body;
      message.editedAt = new Date().toISOString();
    }
    if (typeof body.pinned === 'boolean') {
      message.pinned = body.pinned;
    }
    return message as T;
  }

  if (messageItemMatch && method === 'DELETE') {
    const conversationId = messageItemMatch[1];
    const messageId = messageItemMatch[2];
    const body = parseBody(options.body);
    const forEveryone = Boolean(body.forEveryone);
    const { message } = findConversationMessage(conversationId, messageId);
    if (!message) notFound(path);
    if (forEveryone) {
      message.body = '';
      message.deletedAt = new Date().toISOString();
      return message as T;
    }
    mockHiddenMessageIds.add(messageId);
    return { conversationId, messageId, scope: 'me' } as T;
  }

  const seenMatch = pathname.match(/^\/conversations\/([^/]+)\/messages\/([^/]+)\/seen$/);
  if (seenMatch && method === 'POST') {
    const conversationId = seenMatch[1];
    const messageId = seenMatch[2];
    const { message } = findConversationMessage(conversationId, messageId);
    if (!message) notFound(path);
    if (!message.seenBy) {
      message.seenBy = [];
    }
    if (!message.seenBy.includes(MOCK_CURRENT_USER.username)) {
      message.seenBy.push(MOCK_CURRENT_USER.username);
    }
    return { seen: true } as T;
  }

  const pinMatch = pathname.match(/^\/conversations\/([^/]+)\/messages\/([^/]+)\/pin$/);
  if (pinMatch && method === 'POST') {
    const conversationId = pinMatch[1];
    const messageId = pinMatch[2];
    const body = parseBody(options.body);
    const { message } = findConversationMessage(conversationId, messageId);
    if (!message) notFound(path);
    message.pinned = typeof body.pinned === 'boolean' ? body.pinned : !message.pinned;
    return message as T;
  }

  // Notifications
  if (pathname === '/notifications' && method === 'GET') {
    return { data: MOCK_NOTIFICATIONS, nextCursor: null } as T;
  }

  // Cafes
  const cafeMatch = pathname.match(/^\/cafes\/([^/]+)$/);
  if (cafeMatch && method === 'GET') {
    const cafe = Object.values(MOCK_CAFES).find((c) => c.id === cafeMatch[1]);
    if (!cafe) notFound(path);
    return cafe as T;
  }
  const cafeFollowMatch = pathname.match(/^\/cafes\/([^/]+)\/follow$/);
  if (cafeFollowMatch && (method === 'POST' || method === 'DELETE')) {
    return { following: method === 'POST' } as T;
  }
  const cafeCheckinMatch = pathname.match(/^\/cafes\/([^/]+)\/checkins$/);
  if (cafeCheckinMatch && method === 'POST') {
    return { id: `mock-checkin-${Date.now()}` } as T;
  }

  // Reviews
  const reviewMatch = pathname.match(/^\/reviews\/cafes\/([^/]+)$/);
  if (reviewMatch && method === 'POST') {
    return { id: `mock-review-${Date.now()}` } as T;
  }

  // Gifts
  if (pathname === '/gifts' && method === 'POST') {
    return { id: 'mock-gift-1', voucherCode: 'MOCK-COFFEE-123' } as T;
  }
  const voucherMatch = pathname.match(/^\/gifts\/([^/]+)\/voucher$/);
  if (voucherMatch && method === 'GET') {
    return { qrDataUrl: 'data:image/png;base64,mock' } as T;
  }

  notFound(`${method} ${pathname}`);
}
