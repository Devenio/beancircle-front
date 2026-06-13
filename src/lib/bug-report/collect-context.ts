/**
 * Gathers automatic debug context for a bug report: device, app, navigation,
 * network, and performance metrics. All values are non-sensitive; the backend
 * additionally PII-scrubs everything before persisting.
 */

import { getLogs } from './console-buffer';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0';
const APP_BUILD = process.env.NEXT_PUBLIC_APP_BUILD ?? 'dev';
const API_ENV =
  process.env.NEXT_PUBLIC_API_URL?.includes('localhost') ?? true
    ? 'local'
    : 'production';

type NavigatorWithMemory = Navigator & {
  deviceMemory?: number;
  connection?: { effectiveType?: string; type?: string; downlink?: number };
};
type PerfWithMemory = Performance & {
  memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
};

export type CollectedContext = {
  route: string;
  deviceInfo: Record<string, unknown>;
  appInfo: Record<string, unknown>;
  metadata: Record<string, unknown>;
  logs: ReturnType<typeof getLogs>;
};

function networkType(): string {
  const nav = navigator as NavigatorWithMemory;
  return nav.connection?.effectiveType ?? nav.connection?.type ?? 'unknown';
}

function memoryUsage(): Record<string, number> | undefined {
  const mem = (performance as PerfWithMemory).memory;
  if (!mem) return undefined;
  return {
    usedMb: Math.round(mem.usedJSHeapSize / 1048576),
    totalMb: Math.round(mem.totalJSHeapSize / 1048576),
  };
}

function navTimings(): Record<string, number> | undefined {
  const [nav] = performance.getEntriesByType(
    'navigation',
  ) as PerformanceNavigationTiming[];
  if (!nav) return undefined;
  return {
    domInteractiveMs: Math.round(nav.domInteractive),
    domCompleteMs: Math.round(nav.domComplete),
    loadEventMs: Math.round(nav.loadEventEnd),
  };
}

export function collectContext(extra?: {
  userId?: string | null;
}): CollectedContext {
  const route =
    typeof location !== 'undefined' ? location.pathname + location.search : '';

  const deviceInfo: Record<string, unknown> = {
    model: navigator.userAgent,
    platform: navigator.platform,
    os: inferOs(),
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    pixelRatio: window.devicePixelRatio,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    deviceMemoryGb: (navigator as NavigatorWithMemory).deviceMemory,
    cores: navigator.hardwareConcurrency,
    online: navigator.onLine,
  };

  const appInfo: Record<string, unknown> = {
    appVersion: APP_VERSION,
    build: APP_BUILD,
    apiEnv: API_ENV,
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    dir: document.documentElement.dir || 'ltr',
  };

  const metadata: Record<string, unknown> = {
    route,
    referrer: document.referrer || null,
    networkType: networkType(),
    downlinkMbps: (navigator as NavigatorWithMemory).connection?.downlink,
    memory: memoryUsage(),
    timings: navTimings(),
    userId: extra?.userId ?? null,
    capturedAt: new Date().toISOString(),
  };

  return { route, deviceInfo, appInfo, metadata, logs: getLogs() };
}

function inferOs(): string {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac os/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'unknown';
}
