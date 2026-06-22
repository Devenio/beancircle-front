import { api } from './client';

export type DesignType = 'menu' | 'welcome';

/** Metadata for one coded design, mirrored from the API registry. */
export type RegisteredDesign = {
  key: string;
  name: string;
  type: DesignType;
  description?: string;
  previewImageUrl?: string;
  enabled: boolean;
};

export type DesignAccessRow = {
  cafeId: string;
  name: string;
  slug: string | null;
  grantedAt: string;
};

export type CafeDesignSelection = {
  selectedMenuDesignKey: string | null;
  selectedWelcomeDesignKey: string | null;
  resolved: {
    menu: { key: string; selectedKey: string | null; fellBack: boolean };
    welcome: { key: string; selectedKey: string | null; fellBack: boolean };
  };
};

export type CafeAvailableDesigns = {
  menu: RegisteredDesign[];
  welcome: RegisteredDesign[];
  selection: CafeDesignSelection;
};

// ---------- Admin (layer 2) ----------

export const adminListDesigns = (type?: DesignType, locale?: string) =>
  api<RegisteredDesign[]>(
    `/super-admin/designs${type ? `?type=${type}` : ''}`,
    { locale },
  );

export const adminDesignAccess = (key: string, locale?: string) =>
  api<DesignAccessRow[]>(`/super-admin/designs/${key}/access`, { locale });

export const adminGrantDesignAccess = (key: string, cafeIds: string[]) =>
  api<DesignAccessRow[]>(`/super-admin/designs/${key}/access`, {
    method: 'POST',
    body: JSON.stringify({ cafeIds }),
  });

export const adminRevokeDesignAccess = (key: string, cafeId: string) =>
  api<DesignAccessRow[]>(`/super-admin/designs/${key}/access/${cafeId}`, {
    method: 'DELETE',
  });

// ---------- Cafe owner (layer 3) ----------

export const cafeAvailableDesigns = (cafeId: string, locale?: string) =>
  api<CafeAvailableDesigns>(`/cafe-os/cafes/${cafeId}/designs`, { locale });

export const cafeSetDesignSelection = (
  cafeId: string,
  payload: {
    menuDesignKey?: string | null;
    welcomeDesignKey?: string | null;
  },
) =>
  api<CafeDesignSelection>(`/cafe-os/cafes/${cafeId}/designs/selection`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
