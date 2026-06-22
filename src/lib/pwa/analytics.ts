/**
 * PWA analytics hooks. Every event is
 *   1. pushed to `window.dataLayer` (picked up by GTM / GA4 if present),
 *   2. dispatched as a `pwa:analytics` CustomEvent (so any in-app listener,
 *      product analytics SDK, or test harness can subscribe), and
 *   3. sent to Mixpanel via `mixpanelTrack` (no-op if not initialised).
 */
import { getDisplayMode, getPlatformInfo } from './platform';
import { mixpanelTrack } from '@/lib/analytics/mixpanel';

export type PwaEvent =
  | 'install_page_view'
  | 'install_button_click'
  | 'install_prompt_shown'
  | 'install_accepted'
  | 'install_dismissed'
  | 'install_completed'
  | 'install_unsupported'
  | 'banner_shown'
  | 'banner_dismissed'
  | 'standalone_launch'
  | 'sw_registered'
  | 'update_prompt_shown'
  | 'update_accepted'
  | 'update_dismissed'
  | 'offline'
  | 'online';

export type PwaEventProps = Record<string, string | number | boolean | undefined>;

interface DataLayerWindow extends Window {
  dataLayer?: Array<Record<string, unknown>>;
}

/** Platform context attached to every event for segmentation. */
function context(): PwaEventProps {
  const info = getPlatformInfo();
  return {
    platform: info.platform,
    browser: info.browser,
    display_mode: getDisplayMode(),
    install_method: info.installMethod,
  };
}

export function trackPwaEvent(event: PwaEvent, props: PwaEventProps = {}): void {
  if (typeof window === 'undefined') return;

  const detail = { event: `pwa_${event}`, ...context(), ...props };

  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(detail);

  window.dispatchEvent(new CustomEvent('pwa:analytics', { detail }));
  mixpanelTrack(detail.event, detail);

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[pwa:analytics]', detail);
  }
}
