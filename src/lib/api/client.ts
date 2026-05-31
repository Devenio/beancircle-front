const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

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

export function getGoogleAuthUrl() {
  return `${API_URL.replace('/api/v1', '')}/api/v1/auth/google`;
}
