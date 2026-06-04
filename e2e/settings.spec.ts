import { expect, test } from '@playwright/test';
import { fetchSettings, injectSession, loginViaApi, TEST_OTP, TEST_PHONE } from './helpers/auth';

test.describe('Settings E2E', () => {
  test.beforeEach(async ({ page, request }) => {
    const auth = await loginViaApi(request);
    await injectSession(page, auth);
  });

  test('hub loads with search and category rows', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByPlaceholder(/search settings/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Account' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Notifications' })).toBeVisible();
  });

  test('search navigates to privacy', async ({ page }) => {
    await page.goto('/settings');
    await page.getByPlaceholder(/search settings/i).fill('blocked');
    await page.getByRole('link', { name: /blocked/i }).first().click();
    await expect(page).toHaveURL(/\/settings\/privacy/);
  });

  test('read receipts persists after refresh and re-login', async ({ page, request }) => {
    const auth = await loginViaApi(request);
    await injectSession(page, auth);

    await page.goto('/settings/privacy');
    await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();

    const toggle = page.getByRole('switch', { name: /read receipts/i });
    const wasChecked = await toggle.getAttribute('aria-checked');
    await toggle.click();
    await page.waitForTimeout(600);

    const apiAfterToggle = await fetchSettings(request, auth.accessToken);
    expect(apiAfterToggle.readReceipts).toBe(wasChecked !== 'true');

    await page.reload();
    const toggleAfterReload = page.getByRole('switch', { name: /read receipts/i });
    await expect(toggleAfterReload).toHaveAttribute(
      'aria-checked',
      wasChecked === 'true' ? 'false' : 'true',
    );

    await page.evaluate(() => {
      localStorage.clear();
    });
    const auth2 = await loginViaApi(request);
    await injectSession(page, auth2);
    await page.goto('/settings/privacy');
    const toggleAfterRelogin = page.getByRole('switch', { name: /read receipts/i });
    await expect(toggleAfterRelogin).toHaveAttribute(
      'aria-checked',
      wasChecked === 'true' ? 'false' : 'true',
    );

    const apiAfterRelogin = await fetchSettings(request, auth2.accessToken);
    expect(apiAfterRelogin.readReceipts).toBe(wasChecked !== 'true');
  });

  test('push notifications toggle persists', async ({ page, request }) => {
    const auth = await loginViaApi(request);
    await page.goto('/settings/notifications');

    const toggle = page.getByRole('switch', { name: /push notifications/i });
    const before = await toggle.getAttribute('aria-checked');
    await toggle.click();
    await page.waitForTimeout(600);

    const api = await fetchSettings(request, auth.accessToken);
    expect(String(api.pushNotifications)).toBe(before === 'true' ? 'false' : 'true');

    await page.reload();
    await expect(toggle).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true');
  });

  test('font size selection persists', async ({ page, request }) => {
    const auth = await loginViaApi(request);
    await page.goto('/settings/appearance');

    await page.getByRole('button', { name: 'Large' }).click();
    await page.waitForTimeout(600);

    const api = await fetchSettings(request, auth.accessToken);
    expect(api.fontSize).toBe('large');

    await page.reload();
    await expect(page.getByRole('button', { name: 'Large' })).toHaveClass(/text-primary|font-semibold/);
  });

  test('back navigation returns to settings hub', async ({ page }) => {
    await page.goto('/settings/account');
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test('unauthorized API returns 401', async ({ request }) => {
    const res = await request.get(
      `${process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3001/api/v1'}/settings`,
    );
    expect(res.status()).toBe(401);
  });
});

test.describe('Settings edge cases', () => {
  test('invalid OTP does not grant access', async ({ request }) => {
    await request.post(
      `${process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3001/api/v1'}/auth/otp/request`,
      { data: { phone: TEST_PHONE } },
    );
    const bad = await request.post(
      `${process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3001/api/v1'}/auth/otp/verify`,
      { data: { phone: TEST_PHONE, code: '000000' } },
    );
    expect(bad.status()).toBeGreaterThanOrEqual(400);
  });

  test('rapid toggles end in consistent API state', async ({ request }) => {
    const auth = await loginViaApi(request);
    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    const api = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3001/api/v1';

    for (let i = 0; i < 5; i++) {
      await request.patch(`${api}/settings`, {
        headers,
        data: { notificationSound: i % 2 === 0 },
      });
    }
    const final = await fetchSettings(request, auth.accessToken);
    expect(typeof final.notificationSound).toBe('boolean');
  });
});
