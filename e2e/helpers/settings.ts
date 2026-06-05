import type { Page } from '@playwright/test';

export const E2E_LOCALE = process.env.PLAYWRIGHT_LOCALE ?? 'en';

export const SETTINGS_HUB_HEADING = 'Settings';
export const SETTINGS_SEARCH_PLACEHOLDER = /search settings/i;

/** Build a locale-aware settings path, e.g. `/en/settings/privacy`. */
export function settingsPath(subpath = '') {
  const normalized = subpath.replace(/^\//, '').replace(/^settings\/?/, '');
  return normalized ? `/${E2E_LOCALE}/settings/${normalized}` : `/${E2E_LOCALE}/settings`;
}

export function settingsUrlPattern(subpath = '') {
  const normalized = subpath.replace(/^\//, '').replace(/^settings\/?/, '');
  if (!normalized) return new RegExp(`/${E2E_LOCALE}/settings/?$`);
  return new RegExp(`/${E2E_LOCALE}/settings/${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
}

export async function gotoSettings(page: Page, subpath = '') {
  await page.goto(settingsPath(subpath));
  await page.waitForLoadState('domcontentloaded');
}

export async function waitForSettingsHub(page: Page) {
  await page.getByRole('heading', { name: SETTINGS_HUB_HEADING, level: 1 }).waitFor();
  await page.getByPlaceholder(SETTINGS_SEARCH_PLACEHOLDER).waitFor();
}

export async function waitForSettingsPatch(page: Page) {
  await page.waitForResponse(
    (res) =>
      /\/api\/v1\/settings\/?$/.test(new URL(res.url()).pathname) &&
      res.request().method() === 'PATCH' &&
      res.ok(),
    { timeout: 15_000 },
  );
}
