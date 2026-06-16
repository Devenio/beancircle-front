'use client';

import { useSettingsApi } from '@/hooks/use-settings-api';

/**
 * Loads the user's settings once for the authenticated app and applies the
 * appearance preferences (accent color, font size, message density, chat
 * wallpaper) to <html>. Rendering nothing, it just guarantees the appearance
 * is applied app-wide instead of only after visiting the Settings screens.
 */
export function AppearanceBootstrap() {
  useSettingsApi();
  return null;
}
