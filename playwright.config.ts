import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config (knowledge.md §4: Playwright E2E tooling lands in
 * Phase 1; full suites for activity filter, WA click, and language switch
 * are written in Task #019, Phase 6).
 *
 * Base URL override contract: set E2E_BASE_URL to point the same config at a
 * preview/remote deployment (CI, staging smoke). When unset, tests run
 * against a locally spawned Astro dev server on port 4321.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4321';
const useLocalServer = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: useLocalServer
    ? {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
