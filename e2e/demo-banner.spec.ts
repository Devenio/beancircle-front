import { expect, test, type Locator, type Page } from '@playwright/test';

async function box(locator: Locator) {
  const handle = await locator.elementHandle();
  if (!handle) throw new Error('element not found');
  const rect = await handle.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height };
  });
  return rect;
}

async function injectFakeSession(page: Page, origin: string) {
  await page.context().addCookies([{ name: 'bc_session', value: '1', url: origin }]);
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'e2e-access');
    localStorage.setItem('refreshToken', 'e2e-refresh');
    localStorage.setItem(
      'beancircle-auth',
      JSON.stringify({
        state: {
          user: {
            id: 'e2e-user',
            username: 'e2e',
            name: 'E2E User',
            avatarUrl: null,
            role: 'USER',
            needsOnboarding: false,
          },
        },
        version: 0,
      }),
    );
  });
}

function assertNoOverlap(
  a: { top: number; bottom: number; left: number; right: number },
  b: { top: number; bottom: number; left: number; right: number },
  label: string,
) {
  const overlapX = a.left < b.right && a.right > b.left;
  const overlapY = a.top < b.bottom && a.bottom > b.top;
  expect(overlapX && overlapY, label).toBeFalsy();
}

test.describe('Demo banner layout', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const locale of ['en', 'fa'] as const) {
    test(`${locale} login: banner reserves space and does not cover buttons`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/login`);
      const banner = page.getByTestId('demo-banner');
      await expect(banner).toBeVisible();

      const bannerBox = await box(banner);
      expect(bannerBox.top).toBeGreaterThanOrEqual(0);
      expect(bannerBox.height).toBeGreaterThan(8);

      const continueBtn = page.getByRole('button', { name: /continue|ادامه/i }).first();
      await expect(continueBtn).toBeVisible();
      const btnBox = await box(continueBtn);
      expect(btnBox.top, 'login controls sit below the banner').toBeGreaterThanOrEqual(
        bannerBox.bottom - 1,
      );
      assertNoOverlap(bannerBox, btnBox, 'banner must not overlap login buttons');

      const google = page.getByRole('link', { name: /google|گوگل/i }).first();
      await expect(google).toBeVisible();
      const googleBox = await box(google);
      expect(googleBox.bottom).toBeLessThanOrEqual(844 + 1);
      assertNoOverlap(bannerBox, googleBox, 'banner must not overlap Google auth');
    });
  }

  test('client feed: banner does not overlap sticky header or bottom nav', async ({
    page,
    baseURL,
  }) => {
    await injectFakeSession(page, baseURL ?? 'http://localhost:3000');
    await page.goto('/en/feed');

    const banner = page.getByTestId('demo-banner');
    await expect(banner).toBeVisible();
    const bannerBox = await box(banner);

    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    const headerBox = await box(header);
    expect(headerBox.top, 'feed header sits below the banner').toBeGreaterThanOrEqual(
      bannerBox.bottom - 1,
    );
    assertNoOverlap(bannerBox, headerBox, 'banner must not overlap feed header');

    const nav = page.locator('nav, [class*="bottom"]').filter({ has: page.getByRole('link') }).last();
    const home = page.getByRole('link', { name: /home|خانه/i }).first();
    const navTarget = (await home.count()) ? home : nav;
    await expect(navTarget).toBeVisible();
    const navBox = await box(navTarget);
    expect(navBox.top).toBeGreaterThan(bannerBox.bottom);
    assertNoOverlap(bannerBox, navBox, 'banner must not overlap bottom nav');
    expect(navBox.bottom).toBeLessThanOrEqual(844 + 8);
  });
});
