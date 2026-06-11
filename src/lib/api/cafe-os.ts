import { api } from './client';

// ---------- Types ----------

export type CafeRole = 'OWNER' | 'MANAGER' | 'STAFF' | 'MODERATOR';
export type MenuTheme =
  | 'MINIMAL'
  | 'MODERN'
  | 'LUXURY'
  | 'DARK'
  | 'VINTAGE'
  | 'NEON'
  | 'CUSTOM';
export type QrKind = 'MENU' | 'TABLE' | 'ENTRANCE' | 'EVENT';
export type LoyaltyKind = 'STAMP_CARD' | 'VISIT_COUNT' | 'BIRTHDAY' | 'VIP';
export type AnnouncementKind = 'ANNOUNCEMENT' | 'PROMOTION' | 'DISCOUNT';

export type MiniUser = {
  id: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
};

export type OpeningHours = Record<
  string,
  { open: string; close: string; closed?: boolean }
>;

export type CafeProfile = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  socialLinks: Record<string, string> | null;
  openingHours: OpeningHours | null;
  wifiName: string | null;
  wifiPassword: string | null;
  followerCount: number;
  avgRating: number;
  reviewCount: number;
  photos: { id: string; url: string; kind?: string }[];
  city?: { id: string; name: string } | null;
  menu?: { id: string; slug: string; isPublished: boolean; theme: MenuTheme } | null;
  _count?: { followers: number; checkins: number; reviews: number };
};

export type MyCafe = {
  role: CafeRole;
  joinedAt: string;
  cafe: CafeProfile & { menu?: { slug: string; isPublished: boolean } | null };
};

export type StaffMember = {
  id: string;
  role: CafeRole;
  createdAt: string;
  user: MiniUser;
};

export type StaffInvite = {
  id: string;
  role: CafeRole;
  createdAt: string;
  invitee?: MiniUser;
  inviter?: MiniUser;
  cafe?: { id: string; name: string; logoUrl: string | null; address: string };
};

export type CafeTable = {
  id: string;
  name: string;
  order: number;
  qrCode: { id: string; code: string; scanCount: number } | null;
};

export type QrCodeRow = {
  id: string;
  kind: QrKind;
  code: string;
  label: string | null;
  scanCount: number;
  createdAt: string;
  table?: { id: string; name: string } | null;
  eventId?: string | null;
};

export type CafeCustomer = {
  id: string;
  firstVisitAt: string;
  lastVisitAt: string;
  visitCount: number;
  scanCount: number;
  isVip: boolean;
  notes: string | null;
  user: MiniUser & { dateOfBirth?: string | null };
};

export type TimelineEntry = {
  type: 'checkin' | 'scan' | 'review' | 'rsvp' | 'loyalty';
  at: string;
  label: string;
  meta?: Record<string, unknown>;
};

export type LoyaltyProgram = {
  id: string;
  kind: LoyaltyKind;
  title: string;
  description: string | null;
  goal: number;
  rewardLabel: string;
  isActive: boolean;
  _count?: { progress: number };
};

export type LoyaltyProgressRow = {
  id: string;
  progress: number;
  completedAt: string | null;
  redeemedAt: string | null;
  user: MiniUser;
};

export type ConsumerLoyaltyProgram = LoyaltyProgram & {
  my:
    | { progress: number; completed: boolean }
    | { eligible: boolean };
};

export type Announcement = {
  id: string;
  kind: AnnouncementKind;
  title: string;
  body: string;
  imageUrl: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  status: 'draft' | 'scheduled' | 'published';
};

export type DashboardData = {
  cafe: {
    id: string;
    name: string;
    followerCount: number;
    avgRating: number;
    reviewCount: number;
  };
  today: {
    visitors: number;
    qrScans: number;
    newCustomers: number;
    returningCustomers: number;
  };
  followers: number;
  activePromotions: Announcement[];
  popularItems: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    viewCount: number;
    category: { name: string };
  }[];
  upcomingEvents: {
    id: string;
    title: string;
    startsAt: string;
    _count: { rsvps: number };
  }[];
  revenue: null;
};

export type AnalyticsData = {
  range: '7d' | '30d' | '90d';
  series: { date: string; visitors: number; qrScans: number; followers: number }[];
  totals: {
    visitors: number;
    uniqueVisitors: number;
    qrScans: number;
    newFollowers: number;
    customers: number;
    returningCustomers: number;
    returningRate: number;
    activeCustomers: number;
  };
  topItems: { id: string; name: string; viewCount: number }[];
  events: { id: string; title: string; startsAt: string; attendance: number }[];
};

export type AuditLogEntry = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  actor: MiniUser | null;
};

export type CafeEvent = {
  id: string;
  title: string;
  description: string;
  type: string;
  startsAt: string;
  endsAt: string;
  capacity: number | null;
  locationLabel: string | null;
  coverUrl: string | null;
  host?: MiniUser | null;
  _count?: { rsvps: number };
};

// ---------- Cafe & staff ----------

export const cafeOsApi = {
  createCafe: (body: {
    name: string;
    address: string;
    cityId: string;
    lat?: number;
    lng?: number;
    description?: string;
    logoUrl?: string;
  }) =>
    api<CafeProfile>('/cafe-os/cafes', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  myCafes: () => api<MyCafe[]>('/cafe-os/cafes'),

  getCafe: (cafeId: string) => api<CafeProfile>(`/cafe-os/cafes/${cafeId}`),

  updateCafe: (cafeId: string, body: Record<string, unknown>) =>
    api<CafeProfile>(`/cafe-os/cafes/${cafeId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  // Staff
  staff: (cafeId: string) =>
    api<{ staff: StaffMember[]; pendingInvites: StaffInvite[] }>(
      `/cafe-os/cafes/${cafeId}/staff`,
    ),
  inviteStaff: (cafeId: string, body: { username: string; role: CafeRole }) =>
    api<StaffInvite>(`/cafe-os/cafes/${cafeId}/staff/invite`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  cancelInvite: (cafeId: string, inviteId: string) =>
    api(`/cafe-os/cafes/${cafeId}/staff/invites/${inviteId}`, {
      method: 'DELETE',
    }),
  updateStaffRole: (cafeId: string, staffId: string, role: CafeRole) =>
    api<StaffMember>(`/cafe-os/cafes/${cafeId}/staff/${staffId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  removeStaff: (cafeId: string, staffId: string) =>
    api(`/cafe-os/cafes/${cafeId}/staff/${staffId}`, { method: 'DELETE' }),
  myInvites: () => api<StaffInvite[]>('/cafe-os/invites'),
  respondInvite: (inviteId: string, accept: boolean) =>
    api(`/cafe-os/invites/${inviteId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ accept }),
    }),

  auditLog: (cafeId: string, cursor?: string) =>
    api<{ data: AuditLogEntry[]; nextCursor: string | null }>(
      `/cafe-os/cafes/${cafeId}/audit-log${cursor ? `?cursor=${cursor}` : ''}`,
    ),

  // Dashboard & analytics
  dashboard: (cafeId: string) =>
    api<DashboardData>(`/cafe-os/cafes/${cafeId}/dashboard`),
  analytics: (cafeId: string, range: '7d' | '30d' | '90d') =>
    api<AnalyticsData>(`/cafe-os/cafes/${cafeId}/analytics?range=${range}`),

  // Menu builder
  menu: (cafeId: string) =>
    api<import('@/components/cafe-menu/types').CafeMenuData>(
      `/cafe-os/cafes/${cafeId}/menu`,
    ),
  updateMenuSettings: (cafeId: string, body: Record<string, unknown>) =>
    api(`/cafe-os/cafes/${cafeId}/menu`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  createMenuCategory: (cafeId: string, name: string) =>
    api<{ id: string; name: string; order: number }>(
      `/cafe-os/cafes/${cafeId}/menu/categories`,
      { method: 'POST', body: JSON.stringify({ name }) },
    ),
  updateMenuCategory: (cafeId: string, categoryId: string, name: string) =>
    api(`/cafe-os/cafes/${cafeId}/menu/categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  deleteMenuCategory: (cafeId: string, categoryId: string) =>
    api(`/cafe-os/cafes/${cafeId}/menu/categories/${categoryId}`, {
      method: 'DELETE',
    }),
  reorderMenuCategories: (cafeId: string, ids: string[]) =>
    api(`/cafe-os/cafes/${cafeId}/menu/categories/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    }),
  createMenuItem: (cafeId: string, categoryId: string, body: Record<string, unknown>) =>
    api<{ id: string }>(
      `/cafe-os/cafes/${cafeId}/menu/categories/${categoryId}/items`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  updateMenuItem: (cafeId: string, itemId: string, body: Record<string, unknown>) =>
    api(`/cafe-os/cafes/${cafeId}/menu/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteMenuItem: (cafeId: string, itemId: string) =>
    api(`/cafe-os/cafes/${cafeId}/menu/items/${itemId}`, { method: 'DELETE' }),
  reorderMenuItems: (cafeId: string, categoryId: string, ids: string[]) =>
    api(`/cafe-os/cafes/${cafeId}/menu/categories/${categoryId}/items/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    }),

  // Tables
  tables: (cafeId: string) => api<CafeTable[]>(`/cafe-os/cafes/${cafeId}/tables`),
  createTable: (cafeId: string, name: string) =>
    api<CafeTable>(`/cafe-os/cafes/${cafeId}/tables`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  renameTable: (cafeId: string, tableId: string, name: string) =>
    api<CafeTable>(`/cafe-os/cafes/${cafeId}/tables/${tableId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  deleteTable: (cafeId: string, tableId: string) =>
    api(`/cafe-os/cafes/${cafeId}/tables/${tableId}`, { method: 'DELETE' }),
  reorderTables: (cafeId: string, ids: string[]) =>
    api<CafeTable[]>(`/cafe-os/cafes/${cafeId}/tables/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    }),

  // QR
  qrCodes: (cafeId: string) => api<QrCodeRow[]>(`/cafe-os/cafes/${cafeId}/qr`),
  createQr: (cafeId: string, body: { kind: QrKind; label?: string; eventId?: string }) =>
    api<QrCodeRow>(`/cafe-os/cafes/${cafeId}/qr`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteQr: (cafeId: string, qrId: string) =>
    api(`/cafe-os/cafes/${cafeId}/qr/${qrId}`, { method: 'DELETE' }),
  qrData: (cafeId: string, qrId: string) =>
    api<{ qr: QrCodeRow; url: string; qrDataUrl: string }>(
      `/cafe-os/cafes/${cafeId}/qr/${qrId}/data`,
    ),

  // CRM
  customers: (
    cafeId: string,
    params: { q?: string; sort?: 'recent' | 'visits'; cursor?: string } = {},
  ) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.sort) qs.set('sort', params.sort);
    if (params.cursor) qs.set('cursor', params.cursor);
    const tail = qs.toString() ? `?${qs.toString()}` : '';
    return api<{
      data: CafeCustomer[];
      nextCursor: string | null;
      totals: { customers: number; vips: number };
    }>(`/cafe-os/cafes/${cafeId}/customers${tail}`);
  },
  customerDetail: (cafeId: string, customerId: string) =>
    api<{
      customer: CafeCustomer;
      loyalty: (LoyaltyProgressRow & { program: LoyaltyProgram })[];
      timeline: TimelineEntry[];
    }>(`/cafe-os/cafes/${cafeId}/customers/${customerId}`),
  updateCustomer: (
    cafeId: string,
    customerId: string,
    body: { notes?: string; isVip?: boolean },
  ) =>
    api<CafeCustomer>(`/cafe-os/cafes/${cafeId}/customers/${customerId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  // Loyalty
  loyaltyPrograms: (cafeId: string) =>
    api<LoyaltyProgram[]>(`/cafe-os/cafes/${cafeId}/loyalty`),
  createLoyalty: (cafeId: string, body: Record<string, unknown>) =>
    api<LoyaltyProgram>(`/cafe-os/cafes/${cafeId}/loyalty`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateLoyalty: (cafeId: string, programId: string, body: Record<string, unknown>) =>
    api<LoyaltyProgram>(`/cafe-os/cafes/${cafeId}/loyalty/${programId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteLoyalty: (cafeId: string, programId: string) =>
    api(`/cafe-os/cafes/${cafeId}/loyalty/${programId}`, { method: 'DELETE' }),
  loyaltyProgress: (cafeId: string, programId: string) =>
    api<{ program: LoyaltyProgram; progress: LoyaltyProgressRow[] }>(
      `/cafe-os/cafes/${cafeId}/loyalty/${programId}/progress`,
    ),
  redeemLoyalty: (cafeId: string, programId: string, userId: string) =>
    api(`/cafe-os/cafes/${cafeId}/loyalty/${programId}/redeem`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  // Marketing
  announcements: (cafeId: string) =>
    api<{ reach: number; data: Announcement[] }>(
      `/cafe-os/cafes/${cafeId}/announcements`,
    ),
  createAnnouncement: (cafeId: string, body: Record<string, unknown>) =>
    api<Announcement>(`/cafe-os/cafes/${cafeId}/announcements`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateAnnouncement: (cafeId: string, id: string, body: Record<string, unknown>) =>
    api<Announcement>(`/cafe-os/cafes/${cafeId}/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteAnnouncement: (cafeId: string, id: string) =>
    api(`/cafe-os/cafes/${cafeId}/announcements/${id}`, { method: 'DELETE' }),

  // Events
  events: (cafeId: string) => api<CafeEvent[]>(`/cafe-os/cafes/${cafeId}/events`),
  createEvent: (cafeId: string, body: Record<string, unknown>) =>
    api<CafeEvent>(`/cafe-os/cafes/${cafeId}/events`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  eventRsvps: (cafeId: string, eventId: string) =>
    api<{ id: string; status: string; user: MiniUser }[]>(
      `/cafe-os/cafes/${cafeId}/events/${eventId}/rsvps`,
    ),
};

// ---------- Consumer-side ----------

export type MyLoyaltyCard = {
  id: string;
  progress: number;
  completedAt: string | null;
  redeemedAt: string | null;
  program: {
    id: string;
    kind: LoyaltyKind;
    title: string;
    goal: number;
    rewardLabel: string;
  };
  cafe: { id: string; name: string; logoUrl: string | null; slug: string | null };
};

export const cafeConsumerApi = {
  announcements: (cafeId: string) =>
    api<Announcement[]>(`/cafes/${cafeId}/announcements`),
  loyalty: (cafeId: string) =>
    api<ConsumerLoyaltyProgram[]>(`/cafes/${cafeId}/loyalty`),
  myLoyalty: () => api<MyLoyaltyCard[]>('/cafes/loyalty/mine'),
};
