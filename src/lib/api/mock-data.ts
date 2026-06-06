const COFFEE_IMG =
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800';
const LATTE_IMG =
  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800';
const CAFE_IMG =
  'https://images.unsplash.com/photo-1501339847305-ac686a4a7afb?w=800';

export const MOCK_CURRENT_USER = {
  id: 'mock-user-nima',
  username: 'nima',
  name: 'Nima',
  avatarUrl: null as string | null,
  role: 'USER',
  needsOnboarding: false,
};

export const MOCK_USERS = {
  nima: {
    id: 'mock-user-nima',
    username: 'nima',
    name: 'Nima',
    bio: 'Coffee lover in Fardis',
    avatarUrl: null as string | null,
    followersCount: 128,
    followingCount: 42,
    postsCount: 3,
    role: 'USER',
  },
  sara: {
    id: 'mock-user-sara',
    username: 'sara',
    name: 'Sara',
    bio: 'Espresso enthusiast',
    avatarUrl: null as string | null,
    followersCount: 256,
    followingCount: 89,
    postsCount: 5,
    role: 'USER',
  },
  admin: {
    id: 'mock-user-admin',
    username: 'admin',
    name: 'Admin',
    bio: 'Bean Circle team',
    avatarUrl: null as string | null,
    followersCount: 512,
    followingCount: 12,
    postsCount: 2,
    role: 'ADMIN',
  },
};

export const MOCK_CITIES = [
  { id: 'mock-city-fardis', name: 'Fardis', slug: 'fardis' },
  { id: 'mock-city-karaj', name: 'Karaj', slug: 'karaj' },
  { id: 'mock-city-tehran', name: 'Tehran', slug: 'tehran' },
];

export const MOCK_CAFES = {
  beanCircle: {
    id: 'mock-cafe-bean-circle',
    name: 'Bean Circle Cafe',
    address: 'Fardis, Alborz',
    avgRating: 4.7,
    isFollowing: true,
    photos: [{ url: CAFE_IMG }],
    reviews: [
      {
        body: 'Best flat white in Fardis!',
        rating: 5,
        author: { username: 'sara' },
      },
      {
        body: 'Cozy spot for remote work.',
        rating: 4,
        author: { username: 'admin' },
      },
    ],
  },
  roastery: {
    id: 'mock-cafe-roastery',
    name: 'Fardis Roastery',
    address: 'Fardis Main St',
    avgRating: 4.5,
    isFollowing: false,
    photos: [{ url: COFFEE_IMG }],
    reviews: [
      {
        body: 'Fresh beans every morning.',
        rating: 5,
        author: { username: 'nima' },
      },
    ],
  },
  cornerBrew: {
    id: 'mock-cafe-corner-brew',
    name: 'Corner Brew',
    address: 'Fardis Park Ave',
    avgRating: 4.2,
    isFollowing: false,
    photos: [{ url: LATTE_IMG }],
    reviews: [],
  },
};

export const MOCK_POSTS = [
  {
    id: 'mock-post-1',
    type: 'PHOTO_TEXT',
    caption: 'Morning ritual ☕',
    photos: [{ url: COFFEE_IMG }],
    author: MOCK_USERS.nima,
    cafe: { id: MOCK_CAFES.beanCircle.id, name: MOCK_CAFES.beanCircle.name },
    _count: { likes: 24, comments: 3 },
    liked: false,
    saved: false,
  },
  {
    id: 'mock-post-2',
    type: 'PHOTO_TEXT',
    caption: 'New seasonal blend at the roastery',
    photos: [{ url: LATTE_IMG }],
    author: MOCK_USERS.sara,
    cafe: { id: MOCK_CAFES.roastery.id, name: MOCK_CAFES.roastery.name },
    _count: { likes: 56, comments: 8 },
    liked: true,
    saved: false,
  },
  {
    id: 'mock-post-3',
    type: 'PHOTO_TEXT',
    caption: 'Weekend vibes at Corner Brew',
    photos: [{ url: CAFE_IMG }],
    author: MOCK_USERS.admin,
    cafe: { id: MOCK_CAFES.cornerBrew.id, name: MOCK_CAFES.cornerBrew.name },
    _count: { likes: 12, comments: 1 },
    liked: false,
    saved: true,
  },
];

export const MOCK_COMMENTS: Record<
  string,
  { id: string; body: string; author: { username?: string } }[]
> = {
  'mock-post-1': [
    { id: 'mock-comment-1', body: 'Looks amazing!', author: { username: 'sara' } },
    { id: 'mock-comment-2', body: 'Need to try this place', author: { username: 'admin' } },
  ],
  'mock-post-2': [
    { id: 'mock-comment-3', body: 'On my list!', author: { username: 'nima' } },
  ],
};

export type MockMessageType =
  | 'text'
  | 'image'
  | 'file'
  | 'location'
  | 'voice'
  | 'video'
  | 'sticker';

export type MockConversation = {
  id: string;
  updatedAt?: string;
  otherMember: (typeof MOCK_USERS)[keyof typeof MOCK_USERS];
  unreadCount?: number;
  lastReadMessageId?: string | null;
  lastReadAt?: string | null;
  lastMessage?: {
    body?: string;
    type?: MockMessageType;
    createdAt?: string;
    senderId?: string;
  };
};

export const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: 'mock-conv-1',
    updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    otherMember: MOCK_USERS.sara,
    unreadCount: 0,
    lastReadMessageId: 'mock-msg-3',
    lastMessage: {
      body: 'See you at Bean Circle tomorrow?',
      type: 'text',
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      senderId: MOCK_USERS.sara.id,
    },
  },
  {
    id: 'mock-conv-2',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    otherMember: MOCK_USERS.admin,
    unreadCount: 0,
    lastReadMessageId: 'mock-msg-4',
    lastMessage: {
      body: 'Welcome to Bean Circle!',
      type: 'text',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      senderId: MOCK_USERS.admin.id,
    },
  },
];

export type MockMessageAttachment = {
  url: string;
  name?: string;
  mimeType?: string;
  size?: number;
  durationSec?: number;
};

export type MockMessageLocation = {
  lat: number;
  lng: number;
  label?: string;
};

export type MockChatMessage = {
  id: string;
  body?: string;
  sender: { id: string; username?: string };
  createdAt: string;
  type: MockMessageType;
  attachment?: MockMessageAttachment;
  location?: MockMessageLocation;
  sticker?: string;
  replyToId?: string;
  replyToSnippet?: string;
  editedAt?: string;
  deletedAt?: string;
  seenBy?: string[];
  pinned?: boolean;
};

export const MOCK_MESSAGES: Record<
  string,
  MockChatMessage[]
> = {
  'mock-conv-1': [
    {
      id: 'mock-msg-1',
      body: 'Hey! Have you tried the new blend?',
      sender: { id: MOCK_USERS.sara.id, username: 'sara' },
      createdAt: '2026-05-30T10:00:00.000Z',
      type: 'text',
      seenBy: ['sara', 'nima'],
    },
    {
      id: 'mock-msg-2',
      body: 'Not yet — planning to go tomorrow.',
      sender: { id: MOCK_USERS.nima.id, username: 'nima' },
      createdAt: '2026-05-30T10:05:00.000Z',
      type: 'text',
      seenBy: ['nima', 'sara'],
    },
    {
      id: 'mock-msg-3',
      body: 'See you at Bean Circle tomorrow?',
      sender: { id: MOCK_USERS.sara.id, username: 'sara' },
      createdAt: '2026-05-30T10:06:00.000Z',
      type: 'text',
      pinned: true,
      seenBy: ['sara'],
    },
  ],
  'mock-conv-2': [
    {
      id: 'mock-msg-4',
      body: 'Welcome to Bean Circle!',
      sender: { id: MOCK_USERS.admin.id, username: 'admin' },
      createdAt: '2026-05-29T08:00:00.000Z',
      type: 'text',
      seenBy: ['admin', 'nima'],
    },
  ],
};

export const MOCK_NOTIFICATIONS = [
  {
    id: 'mock-notif-1',
    type: 'NEW_LIKE',
    actor: { username: 'sara', avatarUrl: null },
    createdAt: '2026-05-30T12:00:00.000Z',
  },
  {
    id: 'mock-notif-2',
    type: 'NEW_FOLLOWER',
    actor: { username: 'admin', avatarUrl: null },
    createdAt: '2026-05-30T09:30:00.000Z',
  },
  {
    id: 'mock-notif-3',
    type: 'NEW_COMMENT',
    actor: { username: 'sara', avatarUrl: null },
    createdAt: '2026-05-29T18:00:00.000Z',
  },
];
