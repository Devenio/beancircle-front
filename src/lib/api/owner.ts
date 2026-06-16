import { api } from './client';

export type OwnerCafe = {
  role: 'OWNER' | 'MANAGER' | 'STAFF' | 'MODERATOR';
  cafe: {
    id: string;
    name: string;
    address: string;
    isPartner: boolean;
    isVerified: boolean;
    photos?: { url: string }[];
    city?: { id: string; name: string } | null;
  };
};

export type UnclaimedCafe = {
  id: string;
  name: string;
  address: string;
  photos?: { url: string }[];
  city?: { id: string; name: string } | null;
};

export const listOwnerCafes = (locale?: string) =>
  api<OwnerCafe[]>('/owner/cafes', { locale });

export const listUnclaimedCafes = (q: string, locale?: string) =>
  api<UnclaimedCafe[]>(
    `/owner/cafes/unclaimed${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    { locale },
  );

export const claimCafe = (
  cafeId: string,
  body: { message?: string; phone?: string },
  locale?: string,
) =>
  api(`/owner/cafes/${cafeId}/claim`, {
    method: 'POST',
    body: JSON.stringify(body),
    locale,
  });
