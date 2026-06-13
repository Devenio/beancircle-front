'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  getDisplayMode,
  getPlatformInfo,
  isStandalone,
  type DisplayMode,
  type PlatformInfo,
} from '@/lib/pwa/platform';
import { showInstallPrompt, type InstallOutcome } from '@/lib/pwa/install';
import { activateUpdate } from '@/lib/pwa/service-worker';
import { trackPwaEvent } from '@/lib/pwa/analytics';
import { usePwaStore } from '@/stores/pwa-store';

/**
 * Platform/browser info via an external store, so the server renders a neutral
 * snapshot and the client swaps in real `navigator`-derived values after
 * hydration — no setState-in-effect, no hydration mismatch. Re-emits when the
 * display mode changes (e.g. the app is installed while open).
 */
type PlatformSnapshot = { info: PlatformInfo; displayMode: DisplayMode; mounted: boolean };

const SERVER_SNAPSHOT: PlatformSnapshot = {
  info: getPlatformInfo(),
  displayMode: 'browser',
  mounted: false,
};

let clientSnapshot: PlatformSnapshot | null = null;

function getClientSnapshot(): PlatformSnapshot {
  if (!clientSnapshot) {
    clientSnapshot = { info: getPlatformInfo(), displayMode: getDisplayMode(), mounted: true };
  }
  return clientSnapshot;
}

function subscribePlatform(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mqls = (['standalone', 'minimal-ui', 'fullscreen'] as const).map((m) =>
    window.matchMedia(`(display-mode: ${m})`),
  );
  const handler = () => {
    clientSnapshot = { info: getPlatformInfo(), displayMode: getDisplayMode(), mounted: true };
    onChange();
  };
  mqls.forEach((mql) => mql.addEventListener('change', handler));
  return () => mqls.forEach((mql) => mql.removeEventListener('change', handler));
}

export function usePlatformInfo(): PlatformSnapshot {
  return useSyncExternalStore(subscribePlatform, getClientSnapshot, () => SERVER_SNAPSHOT);
}

/** Live online/offline status, mirrored from the PWA store. */
export function useOnlineStatus(): boolean {
  return usePwaStore((s) => s.isOnline);
}

export interface InstallState {
  /** Native prompt available (Chromium) and app not installed. */
  canPrompt: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  info: PlatformInfo;
  mounted: boolean;
  /** Trigger the native prompt; resolves with the user's choice. */
  promptInstall: () => Promise<InstallOutcome>;
}

export function useInstallState(): InstallState {
  const { info, mounted } = usePlatformInfo();
  const canInstall = usePwaStore((s) => s.canInstall);
  const isInstalled = usePwaStore((s) => s.isInstalled);
  const setLastPromptOutcome = usePwaStore((s) => s.setLastPromptOutcome);
  const setCanInstall = usePwaStore((s) => s.setCanInstall);

  const promptInstall = useCallback(async () => {
    const outcome = await showInstallPrompt();
    if (outcome !== 'unavailable') {
      setLastPromptOutcome(outcome);
      setCanInstall(false); // the deferred event is single-use
    }
    return outcome;
  }, [setLastPromptOutcome, setCanInstall]);

  return {
    canPrompt: canInstall && !isInstalled,
    isInstalled: isInstalled || (mounted && isStandalone()),
    isStandalone: mounted && isStandalone(),
    info,
    mounted,
    promptInstall,
  };
}

export interface PwaUpdate {
  updateReady: boolean;
  applyUpdate: () => void;
  dismiss: () => void;
}

export function usePwaUpdate(): PwaUpdate {
  const updateReady = usePwaStore((s) => s.updateReady);
  const setUpdateReady = usePwaStore((s) => s.setUpdateReady);

  const applyUpdate = useCallback(() => {
    trackPwaEvent('update_accepted');
    activateUpdate(undefined); // falls back to registration.waiting
    // The page reloads on `controllerchange` (wired in PwaProvider).
  }, []);

  const dismiss = useCallback(() => {
    trackPwaEvent('update_dismissed');
    setUpdateReady(false);
  }, [setUpdateReady]);

  return { updateReady, applyUpdate, dismiss };
}
