/**
 * Real client storage metrics and cleanup helpers. Replaces the previous
 * fabricated estimate (which multiplied localStorage size by fixed ratios).
 */

export type StorageEstimate = {
  supported: boolean;
  usage: number;
  quota: number;
  appData: number;
  cachedMedia: number;
  available: number;
};

const AUTH_KEYS = ['accessToken', 'refreshToken', 'beancircle-auth'];

/** Approximate localStorage footprint in bytes (UTF-16 ≈ 2 bytes/char). */
function localStorageBytes(): number {
  if (typeof localStorage === 'undefined') return 0;
  let bytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    bytes += (key.length + (localStorage.getItem(key)?.length ?? 0)) * 2;
  }
  return bytes;
}

export async function getStorageEstimate(): Promise<StorageEstimate> {
  const appData = localStorageBytes();
  if (
    typeof navigator === 'undefined' ||
    !navigator.storage?.estimate
  ) {
    return {
      supported: false,
      usage: appData,
      quota: 0,
      appData,
      cachedMedia: 0,
      available: 0,
    };
  }
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  // The browser's reported usage already includes localStorage, Cache API and
  // IndexedDB. Everything beyond our app's localStorage is cached media/files.
  const cachedMedia = Math.max(0, usage - appData);
  return {
    supported: true,
    usage,
    quota,
    appData,
    cachedMedia,
    available: Math.max(0, quota - usage),
  };
}

/** Clears non-essential localStorage (drafts, preferences, offline data). */
export function clearAppCache() {
  if (typeof localStorage === 'undefined') return;
  for (const key of Object.keys(localStorage)) {
    if (!AUTH_KEYS.some((k) => key.startsWith(k))) localStorage.removeItem(key);
  }
}

/** Deletes downloaded media held in the Cache API (and IndexedDB stores). */
export async function removeDownloads() {
  if (typeof caches !== 'undefined') {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
