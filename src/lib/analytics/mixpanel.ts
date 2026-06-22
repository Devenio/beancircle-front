import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

let initialized = false;

export function initMixpanel(): void {
  if (initialized || typeof window === 'undefined' || !MIXPANEL_TOKEN) return;

  mixpanel.init(MIXPANEL_TOKEN, {
    track_pageview: false,
    persistence: 'localStorage',
    ip: false,
  });
  initialized = true;
}

export function mixpanelTrack(
  event: string,
  props?: Record<string, string | number | boolean | undefined>,
): void {
  if (!initialized || typeof window === 'undefined') return;
  mixpanel.track(event, props ?? {});
}

export function mixpanelIdentify(userId: string): void {
  if (!initialized || typeof window === 'undefined') return;
  mixpanel.identify(userId);
}

export function mixpanelPeopleSet(
  props: Record<string, string | number | boolean | undefined>,
): void {
  if (!initialized || typeof window === 'undefined') return;
  mixpanel.people.set(props);
}

export function mixpanelReset(): void {
  if (!initialized || typeof window === 'undefined') return;
  mixpanel.reset();
}
