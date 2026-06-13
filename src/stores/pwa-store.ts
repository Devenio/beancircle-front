import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** How long a banner dismissal is respected before we may show it again. */
export const BANNER_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type PwaState = {
  /** A native install prompt has been captured and not yet consumed. */
  canInstall: boolean;
  /** Running as an installed/standalone app. */
  isInstalled: boolean;
  /** Live network status. */
  isOnline: boolean;
  /** A new service-worker version is waiting to activate. */
  updateReady: boolean;

  /** Persisted: epoch ms of the last smart-banner dismissal. */
  bannerDismissedAt: number | null;
  /** Persisted: outcome of the last native install prompt. */
  lastPromptOutcome: 'accepted' | 'dismissed' | null;

  setCanInstall: (value: boolean) => void;
  setInstalled: (value: boolean) => void;
  setOnline: (value: boolean) => void;
  setUpdateReady: (value: boolean) => void;
  setLastPromptOutcome: (value: 'accepted' | 'dismissed') => void;
  dismissBanner: () => void;
};

export const usePwaStore = create<PwaState>()(
  persist(
    (set) => ({
      canInstall: false,
      isInstalled: false,
      isOnline: true,
      updateReady: false,
      bannerDismissedAt: null,
      lastPromptOutcome: null,

      setCanInstall: (value) => set({ canInstall: value }),
      setInstalled: (value) => set({ isInstalled: value }),
      setOnline: (value) => set({ isOnline: value }),
      setUpdateReady: (value) => set({ updateReady: value }),
      setLastPromptOutcome: (value) => set({ lastPromptOutcome: value }),
      dismissBanner: () => set({ bannerDismissedAt: Date.now() }),
    }),
    {
      name: 'bc-pwa',
      // Only persist the user's banner preference + last outcome; runtime flags
      // (canInstall, isOnline, …) are derived fresh on each load.
      partialize: (state) => ({
        bannerDismissedAt: state.bannerDismissedAt,
        lastPromptOutcome: state.lastPromptOutcome,
      }),
    },
  ),
);

/** Was the banner dismissed within the cooldown window? */
export function isBannerDismissed(dismissedAt: number | null): boolean {
  if (!dismissedAt) return false;
  return Date.now() - dismissedAt < BANNER_COOLDOWN_MS;
}
