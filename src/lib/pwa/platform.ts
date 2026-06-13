/**
 * Platform, browser and display-mode detection for the PWA install experience.
 * Everything here is SSR-safe — on the server it returns neutral `unknown`
 * values so it can be imported anywhere without guarding.
 */

export type Platform =
  | 'android'
  | 'ios'
  | 'ipados'
  | 'windows'
  | 'macos'
  | 'linux'
  | 'unknown';

export type Browser =
  | 'chrome'
  | 'edge'
  | 'samsung'
  | 'firefox'
  | 'safari'
  | 'opera'
  | 'unknown';

export type DisplayMode = 'standalone' | 'minimal-ui' | 'fullscreen' | 'browser';

/** How the user should be guided to install on their platform/browser. */
export type InstallMethod = 'prompt' | 'ios-share' | 'desktop-menu' | 'unsupported';

export interface PlatformInfo {
  platform: Platform;
  browser: Browser;
  isMobile: boolean;
  isDesktop: boolean;
  /** iPhone, iPad and iPod (i.e. WebKit-on-iOS install rules apply). */
  isIOS: boolean;
  isAndroid: boolean;
  /** Browsers that fire `beforeinstallprompt` (Chromium family). */
  supportsInstallPrompt: boolean;
  installMethod: InstallMethod;
  /** Human label for UI copy, e.g. "iPhone", "Windows". */
  deviceLabel: string;
}

const SERVER_INFO: PlatformInfo = {
  platform: 'unknown',
  browser: 'unknown',
  isMobile: false,
  isDesktop: false,
  isIOS: false,
  isAndroid: false,
  supportsInstallPrompt: false,
  installMethod: 'unsupported',
  deviceLabel: '',
};

function detectPlatform(ua: string, nav: Navigator): Platform {
  const touch = nav.maxTouchPoints ?? 0;
  // iPadOS 13+ masquerades as desktop Safari ("Macintosh") but has touch.
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && touch > 1)) return 'ipados';
  if (/iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Windows|Win64|Win32/.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/.test(ua)) return 'macos';
  if (/Linux|X11|CrOS/.test(ua)) return 'linux';
  return 'unknown';
}

function detectBrowser(ua: string): Browser {
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  if (/Edg\//.test(ua)) return 'edge';
  if (/OPR\/|Opera/.test(ua)) return 'opera';
  if (/Firefox\/|FxiOS/.test(ua)) return 'firefox';
  // Chrome must be checked after Edge/Opera/Samsung (they all include "Chrome").
  if (/Chrome\/|CriOS|Chromium/.test(ua)) return 'chrome';
  if (/Safari\//.test(ua)) return 'safari';
  return 'unknown';
}

const DEVICE_LABELS: Record<Platform, string> = {
  android: 'Android',
  ios: 'iPhone',
  ipados: 'iPad',
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  unknown: '',
};

/** Read the current platform/browser. Recomputed each call (cheap). */
export function getPlatformInfo(): PlatformInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return SERVER_INFO;
  }

  const ua = navigator.userAgent;
  const platform = detectPlatform(ua, navigator);
  const browser = detectBrowser(ua);

  const isIOS = platform === 'ios' || platform === 'ipados';
  const isAndroid = platform === 'android';
  const isMobile = isIOS || isAndroid;
  const isDesktop = !isMobile && platform !== 'unknown';

  // beforeinstallprompt is a Chromium feature; never fires in Safari/Firefox or
  // on iOS WebKit (all browsers on iOS are WebKit under the hood).
  const isChromium =
    !isIOS &&
    (browser === 'chrome' ||
      browser === 'edge' ||
      browser === 'samsung' ||
      browser === 'opera');
  const supportsInstallPrompt = isChromium;

  let installMethod: InstallMethod;
  if (isIOS) {
    // Only Safari (WebKit) on iOS can Add to Home Screen.
    installMethod = browser === 'safari' || browser === 'unknown' ? 'ios-share' : 'unsupported';
  } else if (supportsInstallPrompt) {
    installMethod = 'prompt';
  } else if (isDesktop && (browser === 'chrome' || browser === 'edge')) {
    installMethod = 'desktop-menu';
  } else {
    installMethod = 'unsupported';
  }

  return {
    platform,
    browser,
    isMobile,
    isDesktop,
    isIOS,
    isAndroid,
    supportsInstallPrompt,
    installMethod,
    deviceLabel: DEVICE_LABELS[platform],
  };
}

/** Current display mode — "standalone" means the app is installed/launched as PWA. */
export function getDisplayMode(): DisplayMode {
  if (typeof window === 'undefined') return 'browser';
  for (const mode of ['fullscreen', 'standalone', 'minimal-ui'] as const) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) return mode;
  }
  return 'browser';
}

/** True when running as an installed app (covers iOS Safari's legacy flag). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const navStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return (
    getDisplayMode() !== 'browser' ||
    navStandalone === true ||
    document.referrer.startsWith('android-app://')
  );
}
