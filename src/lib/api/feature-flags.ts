import { api } from './client';

export type FlagMap = Record<string, boolean>;

/** Effective feature-flag map for the front-end, optionally scoped to a cafe. */
export function getFeatureFlags(cafeId?: string, locale?: string) {
  const qs = cafeId ? `?cafeId=${encodeURIComponent(cafeId)}` : '';
  return api<FlagMap>(`/feature-flags${qs}`, { locale });
}
