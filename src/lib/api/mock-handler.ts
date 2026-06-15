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
  MOCK_NEARBY_PEOPLE,
  MOCK_SETTINGS,
  getMockFriendRequests,
  getMockFriendships,
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

/** In-memory onboarding state for mock mode (resets on full reload). */
const mockOnboarding = {
  currentStep: 'welcome',
  completedSteps: [] as string[],
  skippedSteps: [] as string[],
  stepTimings: {} as Record<string, number>,
  completedAt: null as string | null,
  interests: [] as string[],
  avatar: null as Record<string, unknown> | null,
};

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
  const readMatch = pathname.match(/^\/conversations\/([^/]+)\/read$/);
  if (readMatch && method === 'POST') {
    const conversationId = readMatch[1];
    const body = parseBody(options.body);
    const conv = MOCK_CONVERSATIONS.find((item) => item.id === conversationId);
    const list = MOCK_MESSAGES[conversationId] ?? [];
    const messageId = typeof body.lastMessageId === 'string' ? body.lastMessageId : '';
    const target = messageId
      ? list.find((item) => item.id === messageId)
      : list[list.length - 1];
    if (conv) {
      conv.lastReadMessageId = target?.id ?? null;
      conv.lastReadAt = target?.createdAt ?? new Date().toISOString();
      conv.unreadCount = 0;
    }
    return {
      conversationId,
      unreadCount: 0,
      lastReadMessageId: conv?.lastReadMessageId ?? null,
    } as T;
  }
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
    const pinned =
      typeof body.pinned === 'boolean' ? body.pinned : !message.pinned;
    message.pinned = pinned;
    return { ...message, pinned } as T;
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

  // Settings
  if (pathname === '/settings' && method === 'GET') {
    return MOCK_SETTINGS as T;
  }
  if (pathname === '/settings' && method === 'PATCH') {
    const body = parseBody(options.body);
    Object.assign(MOCK_SETTINGS, body);
    MOCK_SETTINGS.updatedAt = new Date().toISOString();
    return MOCK_SETTINGS as T;
  }
  if (pathname === '/settings/blocked' && method === 'GET') {
    return [] as T;
  }
  if (pathname === '/settings/muted' && method === 'GET') {
    return [] as T;
  }

  // Location
  if (pathname === '/users/location' && method === 'POST') {
    return { ok: true, distanceVisibility: 'approximate' } as T;
  }
  if (pathname === '/users/me/location' && method === 'GET') {
    return { visibility: 'approximate', hasLocation: true, cityName: 'Fardis' } as T;
  }

  // Discover people
  if (pathname === '/discover/nearby' && method === 'GET') {
    return {
      items: MOCK_NEARBY_PEOPLE.map(({ lat: _lat, lng: _lng, ...p }) => p),
      nextCursor: null,
      hasMore: false,
    } as T;
  }
  if (pathname === '/discover/suggestions' && method === 'GET') {
    return {
      items: MOCK_NEARBY_PEOPLE.slice(0, 2).map((p) => ({
        id: p.id,
        name: p.name,
        username: p.username,
        avatarUrl: p.avatarUrl,
        sharedInterests: p.sharedInterests,
        reason: 'mutual_friends',
        score: 0.8,
        lastActive: p.lastActive,
        relationship: p.relationship,
      })),
      nextCursor: null,
      hasMore: false,
    } as T;
  }
  if (pathname === '/discover/map' && method === 'GET') {
    return {
      pins: MOCK_NEARBY_PEOPLE.map(({ lat, lng, ...rest }) => ({ lat, lng, ...rest })),
      center: { lat: 35.724, lng: 50.991 },
    } as T;
  }
  if (pathname === '/discover/sections' && method === 'GET') {
    const cafes = Object.values(MOCK_CAFES);
    return {
      trending: cafes,
      recommended: cafes.slice(0, 2),
      new: cafes.slice(1),
      hiddenGems: [cafes[2]],
    } as T;
  }
  if (pathname === '/discover' && method === 'GET') {
    return Object.values(MOCK_CAFES) as T;
  }

  // Friends
  if (pathname === '/friends/requests' && method === 'GET') {
    const incoming = getMockFriendRequests()
      .filter((r) => r.receiverId === MOCK_CURRENT_USER.id && r.status === 'PENDING')
      .map((r) => ({
        ...r,
        sender: Object.values(MOCK_USERS).find((u) => u.id === r.senderId),
      }));
    return { incoming, outgoing: [] } as T;
  }
  if (pathname === '/friends/status' && method === 'GET') {
    const userId = params.get('userId') ?? '';
    if (getMockFriendships().has(userId)) return 'friends' as T;
    const pending = getMockFriendRequests().find(
      (r) =>
        r.status === 'PENDING' &&
        ((r.senderId === MOCK_CURRENT_USER.id && r.receiverId === userId) ||
          (r.receiverId === MOCK_CURRENT_USER.id && r.senderId === userId)),
    );
    if (pending?.senderId === MOCK_CURRENT_USER.id) return 'pending_out' as T;
    if (pending) return 'pending_in' as T;
    return 'none' as T;
  }
  if (pathname === '/friends/request' && method === 'POST') {
    return { id: `mock-fr-${Date.now()}`, status: 'PENDING' } as T;
  }
  if (pathname === '/friends/accept' && method === 'POST') {
    return { ok: true } as T;
  }
  if (pathname === '/friends/reject' && method === 'POST') {
    return { ok: true } as T;
  }
  if (pathname === '/friends/list' && method === 'GET') {
    return { items: [], nextCursor: null, hasMore: false } as T;
  }

  // Onboarding
  if (pathname === '/onboarding/me' && method === 'GET') {
    const links = MOCK_CURRENT_USER as { bio?: string; favoriteCoffee?: string };
    const signals = [
      !!MOCK_CURRENT_USER.name,
      !!links.bio,
      !!MOCK_CURRENT_USER.avatarUrl || !!mockOnboarding.avatar,
      !!links.favoriteCoffee,
      false,
      true,
      mockOnboarding.interests.length > 0,
    ];
    const filled = signals.filter(Boolean).length;
    return {
      progress: {
        userId: MOCK_CURRENT_USER.id,
        currentStep: mockOnboarding.currentStep,
        completedSteps: mockOnboarding.completedSteps,
        skippedSteps: mockOnboarding.skippedSteps,
        stepTimings: mockOnboarding.stepTimings,
        startedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        completedAt: mockOnboarding.completedAt,
      },
      avatar: mockOnboarding.avatar,
      interests: mockOnboarding.interests,
      completion: {
        filled,
        total: signals.length,
        percent: Math.round((filled / signals.length) * 100),
      },
    } as T;
  }
  if (pathname === '/onboarding/me' && method === 'PATCH') {
    const body = parseBody(options.body);
    if (typeof body.currentStep === 'string') mockOnboarding.currentStep = body.currentStep;
    if (typeof body.completeStep === 'string' && !mockOnboarding.completedSteps.includes(body.completeStep))
      mockOnboarding.completedSteps.push(body.completeStep);
    if (typeof body.skipStep === 'string' && !mockOnboarding.skippedSteps.includes(body.skipStep))
      mockOnboarding.skippedSteps.push(body.skipStep);
    if (body.stepTimings && typeof body.stepTimings === 'object')
      Object.assign(mockOnboarding.stepTimings, body.stepTimings);
    return { ...mockOnboarding, userId: MOCK_CURRENT_USER.id } as T;
  }
  if (pathname === '/onboarding/complete' && method === 'POST') {
    mockOnboarding.completedAt = new Date().toISOString();
    return { completed: true, badge: 'FIRST_SIP' } as T;
  }
  if (pathname === '/onboarding/interests' && method === 'PUT') {
    const body = parseBody(options.body);
    mockOnboarding.interests = Array.isArray(body.interests) ? (body.interests as string[]) : [];
    return { interests: mockOnboarding.interests } as T;
  }
  if (pathname === '/onboarding/avatar' && method === 'GET') {
    return mockOnboarding.avatar as T;
  }
  if (pathname === '/onboarding/avatar' && method === 'PUT') {
    mockOnboarding.avatar = parseBody(options.body);
    return mockOnboarding.avatar as T;
  }
  if (pathname === '/onboarding/events' && method === 'POST') {
    return { tracked: true } as T;
  }
  if (pathname === '/growth/referrals/me' && method === 'GET') {
    return {
      code: 'BEAN1234',
      total: 0,
      pointsEarned: 0,
      referrals: [],
    } as T;
  }

  notFound(`${method} ${pathname}`);
}
