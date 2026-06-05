import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const apiURL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3001/api/v1';
const apiRoot = path.resolve(__dirname, '../beancircle-api');

const isCI = !!process.env.CI;
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1';
/** Local dev usually already has the API on :3001 — only auto-start in CI or when explicitly requested. */
const shouldStartApi = isCI || process.env.PLAYWRIGHT_START_API === '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } }],
  webServer: skipWebServer
    ? undefined
    : [
        ...(shouldStartApi
          ? [
              {
                command: 'pnpm start:dev',
                cwd: apiRoot,
                url: apiURL,
                reuseExistingServer: !isCI,
                timeout: 180_000,
                env: {
                  ...process.env,
                  SMS_PROVIDER: process.env.SMS_PROVIDER ?? 'mock',
                },
              },
            ]
          : []),
        {
          command: 'pnpm dev',
          url: baseURL,
          reuseExistingServer: !isCI,
          timeout: 120_000,
        },
      ],
  metadata: { apiURL },
});
