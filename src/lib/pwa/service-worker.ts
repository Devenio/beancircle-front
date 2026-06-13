/**
 * Service-worker registration + update detection.
 *
 * The worker itself lives at `public/sw.js` (also used for Web Push). Here we
 * register it, surface when a new version is waiting, and provide a way to
 * activate that version on the user's command.
 */
import { trackPwaEvent } from './analytics';

const SW_URL = '/sw.js';

export interface SwHandlers {
  /** A new worker is installed and waiting to take over. */
  onWaiting?: (worker: ServiceWorker) => void;
  /** The controlling worker changed (i.e. an update activated). */
  onControllerChange?: () => void;
  /** Registration succeeded. */
  onReady?: (registration: ServiceWorkerRegistration) => void;
}

export function isServiceWorkerSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

let registration: ServiceWorkerRegistration | null = null;
let registering: Promise<ServiceWorkerRegistration | null> | null = null;

export function getRegistration(): ServiceWorkerRegistration | null {
  return registration;
}

export async function registerServiceWorker(
  handlers: SwHandlers = {},
): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) return null;
  if (registering) return registering;

  registering = (async () => {
    try {
      const reg = await navigator.serviceWorker.register(SW_URL, {
        scope: '/',
        updateViaCache: 'none',
      });
      registration = reg;
      handlers.onReady?.(reg);
      trackPwaEvent('sw_registered');

      // A worker was already waiting when we loaded (previous tab installed it).
      if (reg.waiting && navigator.serviceWorker.controller) {
        handlers.onWaiting?.(reg.waiting);
      }

      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            // An update finished installing while an old worker is in control.
            handlers.onWaiting?.(installing);
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        handlers.onControllerChange?.();
      });

      // Proactively check for a new deploy when the app regains focus.
      const checkForUpdate = () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      };
      document.addEventListener('visibilitychange', checkForUpdate);

      return reg;
    } catch {
      return null;
    }
  })();

  return registering;
}

/** Tell a waiting worker to activate; the page reloads on controllerchange. */
export function activateUpdate(worker: ServiceWorker | null | undefined): void {
  (worker ?? registration?.waiting)?.postMessage({ type: 'SKIP_WAITING' });
}
