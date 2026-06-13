'use client';

import { useEffect, useRef } from 'react';
import { registerServiceWorker } from '@/lib/pwa/service-worker';
import { setDeferredPrompt, type BeforeInstallPromptEvent } from '@/lib/pwa/install';
import { trackPwaEvent } from '@/lib/pwa/analytics';
import { isStandalone } from '@/lib/pwa/platform';
import { usePwaStore } from '@/stores/pwa-store';
import { InstallBanner } from '@/components/pwa/install-banner';
import { PwaToaster } from '@/components/pwa/pwa-toaster';

/**
 * Single owner of all PWA browser wiring: service-worker registration + update
 * detection, the `beforeinstallprompt`/`appinstalled` lifecycle, and
 * online/offline status. Renders the global update/offline toaster and the
 * smart install banner. Mount once, high in the tree.
 */
export function PwaProvider() {
  const store = usePwaStore;
  const refreshing = useRef(false);

  useEffect(() => {
    const {
      setCanInstall,
      setInstalled,
      setOnline,
      setUpdateReady,
    } = store.getState();

    // ── Standalone / installed detection ──────────────────────────────────
    if (isStandalone()) {
      setInstalled(true);
      trackPwaEvent('standalone_launch');
    }

    // ── Service worker + update flow ──────────────────────────────────────
    const hadController =
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      navigator.serviceWorker.controller != null;

    void registerServiceWorker({
      onWaiting: () => {
        setUpdateReady(true);
        trackPwaEvent('update_prompt_shown');
      },
      onControllerChange: () => {
        // Reload to pick up the activated worker — but skip the very first
        // activation (no prior controller) so first visits don't flash-reload.
        if (!hadController || refreshing.current) return;
        refreshing.current = true;
        window.location.reload();
      },
    });

    // ── Install prompt lifecycle ──────────────────────────────────────────
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault(); // stop Chrome's default mini-infobar
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setInstalled(true);
      trackPwaEvent('install_completed');
    };

    // ── Network status ────────────────────────────────────────────────────
    setOnline(navigator.onLine);
    const onOnline = () => {
      setOnline(true);
      trackPwaEvent('online');
    };
    const onOffline = () => {
      setOnline(false);
      trackPwaEvent('offline');
    };

    // ── Display-mode changes (installed while open / launched standalone) ──
    const standaloneMql = window.matchMedia('(display-mode: standalone)');
    const onDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) setInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    standaloneMql.addEventListener('change', onDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      standaloneMql.removeEventListener('change', onDisplayModeChange);
    };
  }, [store]);

  return (
    <>
      <PwaToaster />
      <InstallBanner />
    </>
  );
}
