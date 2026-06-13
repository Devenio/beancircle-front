/**
 * Holds the deferred `beforeinstallprompt` event (Chromium only). The event can
 * only be used once and must be triggered from a user gesture, so we stash it
 * here when the browser fires it and replay it on demand from a click handler.
 */
import { trackPwaEvent } from './analytics';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function setDeferredPrompt(event: BeforeInstallPromptEvent | null): void {
  deferredPrompt = event;
}

export function hasDeferredPrompt(): boolean {
  return deferredPrompt !== null;
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

/** Show the native install prompt. Returns the user's choice (or 'unavailable'). */
export async function showInstallPrompt(): Promise<InstallOutcome> {
  if (!deferredPrompt) return 'unavailable';

  trackPwaEvent('install_prompt_shown');
  const event = deferredPrompt;
  // The event is single-use — clear it before awaiting so a double-click can't
  // re-trigger a consumed prompt.
  deferredPrompt = null;

  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    trackPwaEvent(outcome === 'accepted' ? 'install_accepted' : 'install_dismissed');
    return outcome;
  } catch {
    return 'unavailable';
  }
}
