import {
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
    return MOCK_CONVERSATIONS as T;
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
    return {
      data: MOCK_MESSAGES[messagesMatch[1]] ?? [],
      nextCursor: null,
    } as T;
  }
  if (messagesMatch && method === 'POST') {
    const body = parseBody(options.body);
    return {
      id: `mock-msg-${Date.now()}`,
      body: String(body.body ?? ''),
      sender: { id: MOCK_CURRENT_USER.id, username: MOCK_CURRENT_USER.username },
      createdAt: new Date().toISOString(),
    } as T;
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
