import { expect, test } from '@playwright/test';

// Placeholder smoke test (Task #005 AC): proves the Playwright runner boots
// against the Astro dev server and the default-locale (ID) home route
// renders. Core-flow suites (activity filter, WA click, language switch)
// are written in Task #019, Phase 6.
test('home page renders for the default (ID) locale', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Beranda — Classmate/);
  await expect(page.locator('main h1')).toBeVisible();
});
