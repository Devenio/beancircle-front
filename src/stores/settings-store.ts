/**
 * Settings are owned by the API (see `useSettingsApi`). This module now only
 * holds the shared visibility type and the accent presets used by the
 * appearance screen — the old Zustand persist store and the fabricated storage
 * estimator were removed once everything moved to the backend.
 */

export type VisibilityOption = 'everyone' | 'contacts' | 'nobody';

export const ACCENT_PRESETS = [
  { id: 'bean', value: 'oklch(0.55 0.2 145)', labelKey: 'accentBean' },
  { id: 'coral', value: 'oklch(0.62 0.2 25)', labelKey: 'accentCoral' },
  { id: 'ocean', value: 'oklch(0.55 0.18 250)', labelKey: 'accentOcean' },
  { id: 'grape', value: 'oklch(0.52 0.22 300)', labelKey: 'accentGrape' },
  { id: 'amber', value: 'oklch(0.72 0.16 75)', labelKey: 'accentAmber' },
] as const;
