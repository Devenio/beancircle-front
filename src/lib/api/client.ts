import { fetchMock, isMockMode } from './mock';

/**
 * Resolve the API base URL.
 *
 * In the browser we use the *same origin* the page was served from (the Next
 * dev server proxies `/api/v1/*` to the backend — see `next.config.ts`
 * rewrites). This is what lets the app work unchanged on localhost, a LAN IP,
 * or a phone over a tunnel: there is no hardcoded `localhost` baked into the
 * client bundle and no HTTPS→HTTP mixed-content problem. Set
 * `NEXT_PUBLIC_API_URL` only when the API lives on a different origin (e.g.
 * production with a separate API host).
 */
function resolveApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') return `${window.location.origin}/api/v1`;
  // SSR / build time: reach the backend directly.
  const target = process.env.API_PROXY_TARGET ?? 'http://localhost:3002';
  return `${target}/api/v1`;
}

const API_URL = resolveApiUrl();

type RequestOptions = RequestInit & { locale?: string };

async function refreshTokens(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  return true;
}

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (isMockMode()) {
    return fetchMock<T>(path, options);
  }

  const { locale, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (locale) headers['Accept-Language'] = locale;

  let res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && typeof window !== 'undefined') {
    const ok = await refreshTokens();
    if (ok) {
      headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
      res = await fetch(`${API_URL}${path}`, { ...init, headers });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.message;
    const text = Array.isArray(message)
      ? message.join(', ')
      : typeof message === 'string'
        ? message
        : `HTTP ${res.status}`;
    throw new Error(text);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Authenticated fetch returning a Blob — used for QR/file downloads. */
export async function apiBlob(path: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(`${API_URL}${path}`, { headers });
  if (res.status === 401 && typeof window !== 'undefined') {
    const ok = await refreshTokens();
    if (ok) {
      headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
      res = await fetch(`${API_URL}${path}`, { headers });
    }
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

export function getGoogleAuthUrl() {
  return `${API_URL.replace('/api/v1', '')}/api/v1/auth/google`;
}
