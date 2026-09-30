import { expect, test } from '@playwright/test';

// Task #019 AC #3 — language switch core flow. knowledge.md §4 names this
// suite as one of the three E2E core flows. The LanguageSwitcher swaps only
// the locale prefix on the current path (LanguageSwitcher.astro), so the
// page identity must survive the switch; content (html lang, h1 copy) must
// change with it.
//
// Route set mirrors the 7 static pages × ID/EN (knowledge.md hard
// constraint; exhaustive parity itself is Task #020's job — here we prove
// the *switch* behavior on a representative route).

const ROUTES = [
  '/',
  '/layanan',
  '/aktivitas',
  '/klien-venue',
  '/tentang',
  '/kontak',
  '/syarat-ketentuan',
] as const;

// Distinct h1 identity per ID route — the EN h1 differs in wording (except
// /tentang, whose tagline is intentionally identical in both languages per
// TentangContent.astro), so matching the actual copy proves content changed.
const H1_IDENTITY: Record<(typeof ROUTES)[number], RegExp> = {
  '/': /Dari ulang tahun anak|From kids birthdays/,
  '/layanan': /Paket Art Party 2026|Art Party Packages/,
  '/aktivitas': /Aktivitas & Kelas Kami|Our Activities & Classes/,
  '/klien-venue': /Klien & Venue Partner|Our Clients & Venue Partners/,
  '/tentang': /A Celebration of Love and Togetherness/,
  '/kontak': /Ngobrol Dulu|Let's Talk/,
  '/syarat-ketentuan': /Syarat & Ketentuan|Terms & Policies/,
};

test.describe('language switch ID ↔ EN', () => {
  for (const route of ROUTES) {
    test(`switching locale on ${route} keeps the same page and swaps content`, async ({ page }) => {
      await page.goto(route);

      // Sanity: landed on the ID route with Indonesian content.
      await expect(page.locator('html')).toHaveAttribute('lang', 'id');
      await expect(page.locator('main h1')).toContainText(H1_IDENTITY[route]);

      // Switch ID → EN via the header switcher.
      await page.getByRole('link', { name: 'EN', exact: true }).first().click();
      await expect(page).toHaveURL(new RegExp(`/en${route === '/' ? '/?' : route}/?$`));
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('main h1')).toContainText(H1_IDENTITY[route]);

      // Switch back EN → ID: same page, original content restored.
      await page.getByRole('link', { name: 'ID', exact: true }).first().click();
      await expect(page).toHaveURL(new RegExp(`${route === '/' ? '/?' : route}/?$`));
      await expect(page.locator('html')).toHaveAttribute('lang', 'id');
      await expect(page.locator('main h1')).toContainText(H1_IDENTITY[route]);
    });
  }

  test('EN routes land directly with English content and switch back', async ({ page }) => {
    await page.goto('/en/aktivitas');

    await expect(page).toHaveURL(/\/en\/aktivitas\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main h1')).toContainText(H1_IDENTITY['/aktivitas']);

    await page.getByRole('link', { name: 'ID', exact: true }).first().click();
    await expect(page).toHaveURL(/\/aktivitas\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
  });

  test('document title mirrors the active locale on switched routes', async ({ page }) => {
    await page.goto('/kontak');
    await expect(page).toHaveTitle(/Kontak — Classmate/);

    await page.getByRole('link', { name: 'EN', exact: true }).first().click();
    await expect(page).toHaveTitle(/Contact — Classmate/);
  });

  test('nav links preserve the active locale (EN page links stay under /en)', async ({ page }) => {
    await page.goto('/en/layanan');

    // Header desktop nav: every link must carry the /en prefix.
    const navLinks = page.locator('header nav[aria-label="Main"] a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(navLinks.nth(i)).toHaveAttribute('href', /^\/en\//);
    }
  });
});
