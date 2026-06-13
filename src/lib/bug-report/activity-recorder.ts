/**
 * Session-activity recorder — a lightweight, dependency-free "session replay".
 *
 * Keeps a rolling 2-minute timeline of taps, scrolls, route changes, and
 * network requests so the support team can reconstruct what the user did right
 * before reporting. Coordinates are recorded as viewport fractions (not pixels)
 * and element targets as CSS-ish paths, so no PII or content text is captured.
 *
 * This is intentionally a drop-in seam: to upgrade to full visual replay,
 * swap `installActivityRecorder` for rrweb's `record()` and serialise its
 * events in `getReplay()` — the consumer contract (a JSON blob) is unchanged.
 */

export type ActivityEvent =
  | { t: number; type: 'tap'; x: number; y: number; target: string }
  | { t: number; type: 'scroll'; y: number }
  | { t: number; type: 'route'; url: string }
  | { t: number; type: 'net'; method: string; url: string; status: number; ms: number }
  | { t: number; type: 'resize'; w: number; h: number };

const WINDOW_MS = 2 * 60 * 1000; // last 2 minutes
const MAX_EVENTS = 800;
const events: ActivityEvent[] = [];
let installed = false;
let lastScrollAt = 0;

function record(e: ActivityEvent) {
  events.push(e);
  const cutoff = Date.now() - WINDOW_MS;
  // Trim by age, then hard-cap by count.
  let i = 0;
  while (i < events.length && events[i].t < cutoff) i++;
  if (i > 0) events.splice(0, i);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
}

/** A short, non-identifying descriptor of an element: tag#id.class[role]. */
function describe(el: EventTarget | null): string {
  if (!(el instanceof Element)) return 'unknown';
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const role = el.getAttribute('role');
  const testid = el.getAttribute('data-testid');
  const cls =
    typeof el.className === 'string' && el.className
      ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
      : '';
  return `${tag}${id}${cls}${role ? `[${role}]` : ''}${
    testid ? `{${testid}}` : ''
  }`.slice(0, 120);
}

/** Snapshot of the recorded timeline, oldest first. */
export function getReplay(): { recordedAt: number; windowMs: number; events: ActivityEvent[] } {
  return { recordedAt: Date.now(), windowMs: WINDOW_MS, events: events.slice() };
}

/** Manually log a network event (used by the API client wrapper if desired). */
export function recordNetwork(method: string, url: string, status: number, ms: number) {
  record({ t: Date.now(), type: 'net', method, url, status, ms });
}

export function installActivityRecorder() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener(
    'pointerdown',
    (e) => {
      record({
        t: Date.now(),
        type: 'tap',
        x: +(e.clientX / window.innerWidth).toFixed(3),
        y: +(e.clientY / window.innerHeight).toFixed(3),
        target: describe(e.target),
      });
    },
    { capture: true, passive: true },
  );

  window.addEventListener(
    'scroll',
    () => {
      const now = Date.now();
      if (now - lastScrollAt < 250) return; // throttle
      lastScrollAt = now;
      record({ t: now, type: 'scroll', y: Math.round(window.scrollY) });
    },
    { capture: true, passive: true },
  );

  window.addEventListener('resize', () => {
    record({
      t: Date.now(),
      type: 'resize',
      w: window.innerWidth,
      h: window.innerHeight,
    });
  });

  // SPA route changes: patch history + listen to popstate.
  const emitRoute = () => record({ t: Date.now(), type: 'route', url: location.pathname + location.search });
  const origPush = history.pushState.bind(history);
  const origReplace = history.replaceState.bind(history);
  history.pushState = (...args) => {
    origPush(...args);
    emitRoute();
  };
  history.replaceState = (...args) => {
    origReplace(...args);
    emitRoute();
  };
  window.addEventListener('popstate', emitRoute);
  emitRoute(); // initial
}
