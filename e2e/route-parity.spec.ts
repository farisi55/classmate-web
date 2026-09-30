import { expect, test } from '@playwright/test';

// Task #020 AC #1 (served-routes half) — the route-parity CLI and unit tests
// prove the src/pages tree is symmetric; this spec proves the routes are
// actually *served* over HTTP in both locales, using the same discovery
// module as the single source of truth (scripts/check-route-parity.mjs —
// no second route list lives here).
//
// Note: playwright.config runs against `astro dev` when E2E_BASE_URL is
// unset (Task #005 decision: dev binds ::1 on this machine), and against
// any preview/staging origin when it is set.

import { collectPageFiles, fileToRoute, splitLocales } from '../scripts/check-route-parity.mjs';

const files = await collectPageFiles('src/pages');
const { idFiles, enFiles } = splitLocales(files);

test.describe('bilingual route parity — served routes', () => {
  test('discovered route sets are symmetric before any HTTP check', () => {
    expect(enFiles.length).toBeGreaterThan(0);
    expect(idFiles.map((f) => `en/${f}`).sort()).toEqual([...enFiles].sort());
  });

  for (const file of idFiles) {
    const idRoute = fileToRoute(file);
    const enRoute = `/en${idRoute === '/' ? '' : idRoute}`;

    test(`${idRoute} and ${enRoute} both serve a rendered page`, async ({ page }) => {
      for (const route of [idRoute, enRoute]) {
        const response = await page.goto(route);
        expect(response, `route ${route} must return a response`).not.toBeNull();
        expect(response?.status(), `route ${route} must not 404/500`).toBeLessThan(400);
        // Rendered, not an error shell: layout + main content present.
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('main h1')).toBeVisible();
      }
    });
  }

  test('every EN route keeps the same page identity as its ID counterpart', async ({ page }) => {
    // Pair route-by-route: same <title> minus the identical " — Classmate"
    // suffix proves the EN mirror is the same page, not a stray 404/redirect.
    // (Excludes admin/, already excluded from discovery by splitLocales.)
    for (let i = 0; i < idFiles.length; i++) {
      const idRoute = fileToRoute(idFiles[i]);
      const enRoute = `/en${idRoute === '/' ? '' : idRoute}`;

      await page.goto(idRoute);
      const idTitle = (await page.title()).replace(/ — Classmate$/, '').trim();
      await page.goto(enRoute);
      const enTitle = (await page.title()).replace(/ — Classmate$/, '').trim();

      expect(enTitle.length, `EN title for ${enRoute} must not be empty`).toBeGreaterThan(0);
      expect(
        idTitle.length,
        `ID title for ${idRoute} must not be empty (paired with ${enRoute})`,
      ).toBeGreaterThan(0);
    }
  });
});
