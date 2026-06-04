import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VisibilityOption = 'everyone' | 'contacts' | 'nobody';

export type ActiveSession = {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  location?: string;
  loginAt: string;
  current?: boolean;
};

export type SettingsState = {
  // Privacy
  lastSeenVisibility: VisibilityOption;
  onlineStatusVisibility: VisibilityOption;
  readReceipts: boolean;
  profileVisibility: VisibilityOption;
  // Notifications
  pushNotifications: boolean;
  messageNotifications: boolean;
  mentionNotifications: boolean;
  groupNotifications: boolean;
  marketingNotifications: boolean;
  emailNotifications: boolean;
  notificationSound: boolean;
  notificationVibration: boolean;
  // Appearance
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  messageDensity: 'compact' | 'comfortable' | 'spacious';
  chatWallpaper: string;
  // Chat
  autoDownloadMedia: 'wifi' | 'always' | 'never';
  mediaQuality: 'standard' | 'high';
  saveDrafts: boolean;
  linkPreviews: boolean;
  typingIndicators: boolean;
  // Storage
  autoCleanupDays: number;
  // Security sessions (demo until API)
  sessions: ActiveSession[];
  // Actions
  set: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  revokeSession: (id: string) => void;
  clearCache: () => void;
};

const defaultSessions: ActiveSession[] = [
  {
    id: 'current',
    deviceName: 'This device',
    browser: 'Chrome',
    os: 'Windows',
    loginAt: new Date().toISOString(),
    current: true,
  },
];

function applyAppearance(accent: string, fontSize: SettingsState['fontSize']) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--settings-accent', accent);
  document.documentElement.dataset.fontSize = fontSize;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      lastSeenVisibility: 'everyone',
      onlineStatusVisibility: 'everyone',
      readReceipts: true,
      profileVisibility: 'everyone',
      pushNotifications: true,
      messageNotifications: true,
      mentionNotifications: true,
      groupNotifications: true,
      marketingNotifications: false,
      emailNotifications: true,
      notificationSound: true,
      notificationVibration: true,
      accentColor: 'oklch(0.55 0.2 145)',
      fontSize: 'medium',
      messageDensity: 'comfortable',
      chatWallpaper: 'default',
      autoDownloadMedia: 'wifi',
      mediaQuality: 'high',
      saveDrafts: true,
      linkPreviews: true,
      typingIndicators: true,
      autoCleanupDays: 30,
      sessions: defaultSessions,
      set: (key, value) => {
        set({ [key]: value } as Partial<SettingsState>);
        if (key === 'accentColor' || key === 'fontSize') {
          const s = get();
          applyAppearance(
            key === 'accentColor' ? (value as string) : s.accentColor,
            key === 'fontSize' ? (value as SettingsState['fontSize']) : s.fontSize,
          );
        }
      },
      revokeSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
      clearCache: () => {
        if (typeof window === 'undefined') return;
        const keysToKeep = ['accessToken', 'refreshToken', 'beancircle-auth', 'beancircle-settings'];
        Object.keys(localStorage).forEach((key) => {
          if (!keysToKeep.some((k) => key.startsWith(k))) {
            localStorage.removeItem(key);
          }
        });
      },
    }),
    {
      name: 'beancircle-settings',
      onRehydrateStorage: () => (state) => {
        if (state) applyAppearance(state.accentColor, state.fontSize);
      },
    },
  ),
);

export const ACCENT_PRESETS = [
  { id: 'bean', value: 'oklch(0.55 0.2 145)', labelKey: 'accentBean' },
  { id: 'coral', value: 'oklch(0.62 0.2 25)', labelKey: 'accentCoral' },
  { id: 'ocean', value: 'oklch(0.55 0.18 250)', labelKey: 'accentOcean' },
  { id: 'grape', value: 'oklch(0.52 0.22 300)', labelKey: 'accentGrape' },
  { id: 'amber', value: 'oklch(0.72 0.16 75)', labelKey: 'accentAmber' },
] as const;

export function estimateStorageUsage() {
  if (typeof window === 'undefined') {
    return { total: 0, cache: 0, images: 0, videos: 0, files: 0 };
  }
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const val = localStorage.getItem(key) ?? '';
    total += key.length + val.length;
  }
  const cache = Math.round(total * 0.35);
  const images = Math.round(total * 0.4);
  const videos = Math.round(total * 0.1);
  const files = total - cache - images - videos;
  return { total: total * 2, cache: cache * 2, images: images * 2, videos: videos * 2, files: Math.max(0, files * 2) };
}
