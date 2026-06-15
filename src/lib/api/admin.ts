import { api } from './client';

// ---------- Types ----------

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export type Page<T> = { data: T[]; nextCursor: string | null };

export type AdminUser = {
  id: string;
  username: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  suspendedUntil: string | null;
  bannedAt: string | null;
  cityId: string | null;
  createdAt: string;
  lastSeenAt: string | null;
};

export type AdminCafe = {
  id: string;
  name: string;
  slug: string | null;
  address: string;
  avgRating: number;
  followerCount: number;
  reviewCount: number;
  isPartner: boolean;
  createdAt: string;
  city: { id: string; name: string } | null;
};

export type FlagOverride = {
  cafeId: string;
  cafeName: string;
  enabled: boolean;
};

export type AdminFlag = {
  key: string;
  label: string;
  description: string | null;
  category: string;
  enabledGlobal: boolean;
  overrides: FlagOverride[];
};

export type AnalyticsOverview = {
  totals: {
    users: number;
    cafes: number;
    posts: number;
    reviews: number;
    checkins: number;
    gifts: number;
  };
  period: { days: number; newUsers: number; newCafes: number; newCheckins: number };
  activity: { dau: number; moderatedUsers: number };
};

export type TimeseriesPoint = { date: string; count: number };
export type TopCafe = {
  id: string;
  name: string;
  avgRating: number;
  followerCount: number;
  reviewCount: number;
  city: { name: string } | null;
};
export type RoleCount = { role: string; count: number };

export type TemplateItem = {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  calories?: number | null;
  ingredients?: string[];
  allergens?: string[];
  prepTimeMin?: number | null;
  imageUrl?: string | null;
  order?: number;
  isAvailable?: boolean;
};
export type TemplateCategory = {
  id?: string;
  name: string;
  order?: number;
  items?: TemplateItem[];
};
export type MenuThemeName =
  | 'MINIMAL'
  | 'MODERN'
  | 'LUXURY'
  | 'DARK'
  | 'VINTAGE'
  | 'NEON'
  | 'CUSTOM';
export type MenuTemplate = {
  id: string;
  name: string;
  description: string | null;
  previewImageUrl: string | null;
  welcomeTitle: string | null;
  welcomeMessage: string | null;
  accentColor: string;
  theme: MenuThemeName;
  themeConfig: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  _count?: { categories: number; assignments: number };
  categories?: TemplateCategory[];
};

export type TemplateAssignment = {
  cafeId: string;
  name: string;
  slug: string | null;
  assignedAt: string;
  active: boolean;
  published: boolean;
};

export type FileTemplateSummary = {
  key: string;
  file: string;
  valid: boolean;
  error: string | null;
  name: string | null;
  description: string | null;
  theme: MenuThemeName | null;
  accentColor: string | null;
  categoryCount: number;
  itemCount: number;
  fileUpdatedAt: string;
  imported: boolean;
  importedId: string | null;
  importedAt: string | null;
  stale: boolean;
};

export type AuditEntry = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  meta: unknown;
  createdAt: string;
  actor: { id: string; username: string | null; name: string | null } | null;
};

const opts = (locale?: string) => ({ locale });

// ---------- Feature flags ----------

export const adminListFlags = (locale?: string) =>
  api<AdminFlag[]>('/super-admin/feature-flags', opts(locale));

export const adminSetFlag = (key: string, enabled: boolean) =>
  api<unknown>(`/super-admin/feature-flags/${key}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });

export const adminSetCafeFlag = (
  key: string,
  cafeId: string,
  enabled: boolean | null,
) =>
  api<unknown>(`/super-admin/feature-flags/${key}/cafes/${cafeId}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });

// ---------- Users ----------

export const adminListUsers = (params: {
  q?: string;
  role?: UserRole;
  status?: UserStatus;
  cursor?: string;
  locale?: string;
}) => {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.role) sp.set('role', params.role);
  if (params.status) sp.set('status', params.status);
  if (params.cursor) sp.set('cursor', params.cursor);
  const qs = sp.toString();
  return api<Page<AdminUser>>(
    `/super-admin/users${qs ? `?${qs}` : ''}`,
    opts(params.locale),
  );
};

export const adminUserDetail = (id: string, locale?: string) =>
  api<AdminUser & Record<string, unknown>>(
    `/super-admin/users/${id}`,
    opts(locale),
  );

export const adminSetUserRole = (id: string, role: UserRole) =>
  api<AdminUser>(`/super-admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });

export const adminSetUserStatus = (
  id: string,
  payload: { status: UserStatus; note?: string; suspendedUntil?: string },
) =>
  api<AdminUser>(`/super-admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const adminDeleteUser = (id: string) =>
  api<{ deleted: boolean }>(`/super-admin/users/${id}`, { method: 'DELETE' });

// ---------- Cafes ----------

export const adminListCafes = (params: {
  q?: string;
  cursor?: string;
  locale?: string;
}) => {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.cursor) sp.set('cursor', params.cursor);
  const qs = sp.toString();
  return api<Page<AdminCafe>>(
    `/super-admin/cafes${qs ? `?${qs}` : ''}`,
    opts(params.locale),
  );
};

export const adminUpdateCafe = (
  id: string,
  payload: Partial<Pick<AdminCafe, 'name' | 'isPartner'>> & {
    description?: string;
    phone?: string;
    email?: string;
    website?: string;
  },
) =>
  api<AdminCafe>(`/super-admin/cafes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const adminDeleteCafe = (id: string) =>
  api<{ deleted: boolean }>(`/super-admin/cafes/${id}`, { method: 'DELETE' });

// ---------- Menu templates ----------

export const adminListTemplates = (locale?: string) =>
  api<MenuTemplate[]>('/super-admin/menu-templates', opts(locale));

export const adminGetTemplate = (id: string, locale?: string) =>
  api<MenuTemplate>(`/super-admin/menu-templates/${id}`, opts(locale));

export const adminCreateTemplate = (payload: Partial<MenuTemplate>) =>
  api<MenuTemplate>('/super-admin/menu-templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const adminUpdateTemplate = (id: string, payload: Partial<MenuTemplate>) =>
  api<MenuTemplate>(`/super-admin/menu-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const adminDeleteTemplate = (id: string) =>
  api<{ deleted: boolean }>(`/super-admin/menu-templates/${id}`, {
    method: 'DELETE',
  });

export const adminApplyTemplate = (
  cafeId: string,
  templateId: string,
  payload: { slug?: string; publish?: boolean; includeContent?: boolean } = {},
) =>
  api<unknown>(
    `/super-admin/cafes/${cafeId}/menu/apply-template/${templateId}`,
    { method: 'POST', body: JSON.stringify(payload) },
  );

export const adminTemplateAssignments = (id: string, locale?: string) =>
  api<TemplateAssignment[]>(
    `/super-admin/menu-templates/${id}/assignments`,
    opts(locale),
  );

export const adminAssignTemplate = (id: string, cafeIds: string[]) =>
  api<TemplateAssignment[]>(`/super-admin/menu-templates/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ cafeIds }),
  });

export const adminUnassignTemplate = (id: string, cafeId: string) =>
  api<TemplateAssignment[]>(
    `/super-admin/menu-templates/${id}/assign/${cafeId}`,
    { method: 'DELETE' },
  );

// ---------- File templates (drop-in project folder) ----------

export const adminListFileTemplates = (locale?: string) =>
  api<FileTemplateSummary[]>('/super-admin/menu-templates/files', opts(locale));

export const adminGetFileTemplate = (key: string, locale?: string) =>
  api<MenuTemplate>(`/super-admin/menu-templates/files/${key}`, opts(locale));

export const adminImportFileTemplate = (key: string) =>
  api<MenuTemplate>(`/super-admin/menu-templates/files/${key}/import`, {
    method: 'POST',
  });

export const adminImportAllFileTemplates = () =>
  api<{ key: string; ok: boolean; id?: string; error?: string }[]>(
    '/super-admin/menu-templates/files/import-all',
    { method: 'POST' },
  );

export const adminImportAndAssignFileTemplate = (
  key: string,
  cafeIds: string[],
) =>
  api<{ template: MenuTemplate; assignments: TemplateAssignment[] }>(
    `/super-admin/menu-templates/files/${key}/assign`,
    { method: 'POST', body: JSON.stringify({ cafeIds }) },
  );

// ---------- Analytics ----------

export const adminAnalyticsOverview = (days = 30, locale?: string) =>
  api<AnalyticsOverview>(
    `/super-admin/analytics/overview?days=${days}`,
    opts(locale),
  );

export const adminTimeseries = (metric: string, days = 30, locale?: string) =>
  api<TimeseriesPoint[]>(
    `/super-admin/analytics/timeseries?metric=${metric}&days=${days}`,
    opts(locale),
  );

export const adminTopCafes = (limit = 10, locale?: string) =>
  api<TopCafe[]>(`/super-admin/analytics/top-cafes?limit=${limit}`, opts(locale));

export const adminUsersByRole = (locale?: string) =>
  api<RoleCount[]>('/super-admin/analytics/users-by-role', opts(locale));

// ---------- Audit ----------

export const adminAuditLog = (cursor?: string, locale?: string) =>
  api<Page<AuditEntry>>(
    `/super-admin/audit${cursor ? `?cursor=${cursor}` : ''}`,
    opts(locale),
  );
