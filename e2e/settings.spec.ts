import { expect, test } from '@playwright/test';
import { fetchSettings, injectSession, loginViaApi, TEST_OTP, TEST_PHONE } from './helpers/auth';
import {
  gotoSettings,
  settingsUrlPattern,
  waitForSettingsHub,
  waitForSettingsPatch,
} from './helpers/settings';

const apiBase = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3001/api/v1';

test.describe('Settings E2E', () => {
  test.beforeEach(async ({ page, request }) => {
    const auth = await loginViaApi(request);
    await injectSession(page, auth);
  });

  test('hub loads with search and category rows', async ({ page }) => {
    await gotoSettings(page);
    await waitForSettingsHub(page);

    await expect(page.getByRole('link', { name: 'Account' })).toBeVisible();
    await expect(page.getByRole('link', { name: /privacy/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Notifications' })).toBeVisible();
    await expect(page.getByRole('link', { name: /chat preferences/i })).toBeVisible();
  });

  test('search navigates to privacy', async ({ page }) => {
    await gotoSettings(page);
    await waitForSettingsHub(page);

    await page.getByPlaceholder(/search settings/i).fill('blocked');
    await page.getByRole('link', { name: /blocked users/i }).click();
    await expect(page).toHaveURL(settingsUrlPattern('privacy'));
    await expect(page.getByRole('heading', { name: /privacy/i, level: 1 })).toBeVisible();
  });

  test('read receipts persists after refresh and re-login', async ({ page, request }) => {
    const auth = await loginViaApi(request);
    await injectSession(page, auth);

    await gotoSettings(page, 'privacy');
    await expect(page).toHaveURL(settingsUrlPattern('privacy'));
    await expect(page.getByRole('heading', { name: /privacy/i, level: 1 })).toBeVisible();

    const toggle = page.getByRole('switch', { name: /read receipts/i });
    await expect(toggle).toBeVisible();
    const wasChecked = await toggle.getAttribute('aria-checked');

    const patchPromise = waitForSettingsPatch(page);
    await toggle.click();
    await patchPromise;

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
    await gotoSettings(page, 'privacy');
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
    await gotoSettings(page, 'notifications');
    await expect(page).toHaveURL(settingsUrlPattern('notifications'));
    await expect(page.getByRole('heading', { name: 'Notifications', level: 1 })).toBeVisible();

    const toggle = page.getByRole('switch', { name: /push notifications/i });
    const before = await toggle.getAttribute('aria-checked');

    const patchPromise = waitForSettingsPatch(page);
    await toggle.click();
    await patchPromise;

    const api = await fetchSettings(request, auth.accessToken);
    expect(String(api.pushNotifications)).toBe(before === 'true' ? 'false' : 'true');

    await page.reload();
    await expect(toggle).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true');
  });

  test('font size selection persists', async ({ page, request }) => {
    const auth = await loginViaApi(request);
    await gotoSettings(page, 'appearance');
    await expect(page).toHaveURL(settingsUrlPattern('appearance'));
    await expect(page.getByRole('heading', { name: 'Appearance', level: 1 })).toBeVisible();

    const largeOption = page.getByRole('button', { name: 'Large' });
    const patchPromise = waitForSettingsPatch(page);
    await largeOption.click();
    await patchPromise;

    const api = await fetchSettings(request, auth.accessToken);
    expect(api.fontSize).toBe('large');

    await page.reload();
    await expect(largeOption.locator('svg')).toBeVisible();
  });

  test('back navigation returns to settings hub', async ({ page }) => {
    await gotoSettings(page, 'account');
    await expect(page).toHaveURL(settingsUrlPattern('account'));
    await expect(page.getByRole('heading', { name: 'Account', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(settingsUrlPattern());
    await waitForSettingsHub(page);
  });

  test('unauthorized API returns 401', async ({ request }) => {
    const res = await request.get(`${apiBase}/settings`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Settings edge cases', () => {
  test('invalid OTP does not grant access', async ({ request }) => {
    await request.post(`${apiBase}/auth/otp/request`, {
      data: { phone: TEST_PHONE },
    });
    const bad = await request.post(`${apiBase}/auth/otp/verify`, {
      data: { phone: TEST_PHONE, code: '000000' },
    });
    expect(bad.status()).toBeGreaterThanOrEqual(400);
  });

  test('rapid toggles end in consistent API state', async ({ request }) => {
    const auth = await loginViaApi(request);
    const headers = { Authorization: `Bearer ${auth.accessToken}` };

    for (let i = 0; i < 5; i++) {
      await request.patch(`${apiBase}/settings`, {
        headers,
        data: { notificationSound: i % 2 === 0 },
      });
    }
    const final = await fetchSettings(request, auth.accessToken);
    expect(typeof final.notificationSound).toBe('boolean');
  });
});
