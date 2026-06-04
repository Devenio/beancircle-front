import type { APIRequestContext, Page } from '@playwright/test';

const apiURL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3001/api/v1';

export const TEST_PHONE = process.env.PLAYWRIGHT_TEST_PHONE ?? '+989120000000';
export const TEST_OTP = '123456';

export async function loginViaApi(request: APIRequestContext) {
  await request.post(`${apiURL}/auth/otp/request`, {
    data: { phone: TEST_PHONE },
  });
  const verify = await request.post(`${apiURL}/auth/otp/verify`, {
    data: { phone: TEST_PHONE, code: TEST_OTP },
  });
  if (!verify.ok()) {
    throw new Error(`OTP verify failed: ${verify.status()} ${await verify.text()}`);
  }
  return verify.json() as Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string };
  }>;
}

export async function injectSession(page: Page, tokens: {
  accessToken: string;
  refreshToken: string;
  user: { id: string; username?: string | null; name?: string | null };
}) {
  await page.addInitScript(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem(
        'beancircle-auth',
        JSON.stringify({ state: { user }, version: 0 }),
      );
    },
    { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: tokens.user },
  );
}

export async function fetchSettings(request: APIRequestContext, accessToken: string) {
  const res = await request.get(`${apiURL}/settings`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok()) throw new Error(`GET settings failed: ${res.status()}`);
  return res.json();
}
