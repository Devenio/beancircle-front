import fs from 'node:fs';
import path from 'node:path';
import type { APIRequestContext, Page } from '@playwright/test';

const apiURL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3001/api/v1';
const appOrigin = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const CACHE_PATH = path.join(__dirname, '.auth-cache.json');

export const TEST_OTP = '123456';

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username?: string | null;
    name?: string | null;
    avatarUrl?: string | null;
    role?: string;
    needsOnboarding?: boolean;
  };
};

type AuthCache = Record<string, { refreshToken: string }>;

export const TEST_PHONE = process.env.PLAYWRIGHT_TEST_PHONE ?? '+989120000000';

function readCache(): AuthCache {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')) as AuthCache;
  } catch {
    return {};
  }
}

function writeCacheEntry(phone: string, refreshToken: string) {
  const cache = readCache();
  cache[phone] = { refreshToken };
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function refreshSession(
  request: APIRequestContext,
  phone: string,
  refreshToken: string,
): Promise<AuthSession | null> {
  const res = await request.post(`${apiURL}/auth/refresh`, {
    data: { refreshToken },
  });
  if (!res.ok()) return null;
  const session = (await res.json()) as AuthSession;
  writeCacheEntry(phone, session.refreshToken);
  return session;
}

export async function loginViaApi(request: APIRequestContext): Promise<AuthSession> {
  return loginWithPhone(request, TEST_PHONE);
}

export async function loginWithPhone(
  request: APIRequestContext,
  phone: string,
): Promise<AuthSession> {
  const cached = readCache()[phone];
  if (cached?.refreshToken) {
    const refreshed = await refreshSession(request, phone, cached.refreshToken);
    if (refreshed) return refreshed;
  }

  await request.post(`${apiURL}/auth/otp/request`, {
    data: { phone },
  });
  const verify = await request.post(`${apiURL}/auth/otp/verify`, {
    data: { phone, code: TEST_OTP },
  });
  if (!verify.ok()) {
    throw new Error(`OTP verify failed: ${verify.status()} ${await verify.text()}`);
  }
  const session = (await verify.json()) as AuthSession;
  writeCacheEntry(phone, session.refreshToken);
  return session;
}

export async function injectSession(page: Page, tokens: AuthSession) {
  await page.context().addCookies([
    {
      name: 'bc_session',
      value: '1',
      url: appOrigin,
    },
  ]);

  await page.addInitScript(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem(
        'beancircle-auth',
        JSON.stringify({ state: { user }, version: 0 }),
      );

      const hideDevOverlay = () => {
        const id = 'playwright-hide-dev-overlay';
        if (document.getElementById(id)) return;
        const style = document.createElement('style');
        style.id = id;
        style.textContent =
          'nextjs-portal,[data-nextjs-dev-overlay]{display:none!important;pointer-events:none!important}';
        document.documentElement.appendChild(style);
      };
      hideDevOverlay();
      document.addEventListener('DOMContentLoaded', hideDevOverlay);
    },
    {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: tokens.user.id,
        username: tokens.user.username ?? null,
        name: tokens.user.name ?? null,
        avatarUrl: tokens.user.avatarUrl ?? null,
        role: tokens.user.role ?? 'USER',
        needsOnboarding: tokens.user.needsOnboarding ?? false,
      },
    },
  );
}

export async function fetchSettings(request: APIRequestContext, accessToken: string) {
  const res = await request.get(`${apiURL}/settings`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok()) throw new Error(`GET settings failed: ${res.status()}`);
  return res.json();
}
