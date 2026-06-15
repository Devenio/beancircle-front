/**
 * Onboarding analytics. Mirrors `src/lib/pwa/analytics.ts`: every event is
 *   1. pushed to `window.dataLayer` (GTM / GA4 if present),
 *   2. dispatched as a `pwa:analytics` CustomEvent (in-app listeners / tests), and
 *   3. for step lifecycle events, mirrored to the backend funnel table via
 *      `POST /onboarding/events` (fire-and-forget).
 * Safe no-op on the server.
 */
import { trackOnboardingServerEvent } from '@/lib/api/onboarding';

export type OnboardingEvent =
  | 'onboarding_started'
  | 'onboarding_step_viewed'
  | 'onboarding_step_skipped'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'onboarding_abandoned';

export type EventProps = Record<string, string | number | boolean | undefined>;

interface DataLayerWindow extends Window {
  dataLayer?: Array<Record<string, unknown>>;
}

export function trackOnboarding(event: OnboardingEvent, props: EventProps = {}): void {
  if (typeof window === 'undefined') return;

  const detail = { event, ...props };
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(detail);
  window.dispatchEvent(new CustomEvent('pwa:analytics', { detail }));

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[onboarding:analytics]', detail);
  }
}

/** Server-mirror for step lifecycle (viewed/skipped/completed) + time spent. */
export function mirrorStepEvent(
  step: string,
  type: 'viewed' | 'skipped' | 'completed',
  locale: string,
  timeSpentMs?: number,
): void {
  void trackOnboardingServerEvent({ step, type, timeSpentMs }, locale);
}
