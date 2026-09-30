import { expect, test } from '@playwright/test';

// Task #019 AC #2 — WhatsApp CTA core flow. knowledge.md §4 names this suite
// as one of the three E2E core flows. Asserts the *link contract*, not a live
// WhatsApp network call: every package tier renders a wa.me CTA whose
// pre-filled text is unique per tier (knowledge.md §7 / site-config.ts
// buildWhatsAppLink() is the single source of the phone number).
//
// Locale note: like smoke.spec.ts, only the ID routes are exercised — the
// language-switch spec covers ID↔EN behavior, and route parity is Task
// #020's job.

const WA_PHONE = '628992400880';

test.describe('WhatsApp CTA per package tier', () => {
  test('layanan page renders one distinct pre-filled wa.me link per package tier', async ({
    page,
  }) => {
    await page.goto('/layanan');

    // PackageCard CTA = "Tanya Paket Ini" (the 4 per-tier CTAs on this page;
    // header + FAB use generic greeting texts, covered separately below).
    const ctaLinks = page.getByRole('link', { name: 'Tanya Paket Ini' });
    await expect(ctaLinks).toHaveCount(4);

    // Extract the pre-filled ?text= payloads and assert all four differ.
    const texts: string[] = [];
    for (let i = 0; i < 4; i++) {
      const href = await ctaLinks.nth(i).getAttribute('href');
      expect(href, `CTA ${i} must be a wa.me link`).toContain(`https://wa.me/${WA_PHONE}`);
      const text = new URL(href as string).searchParams.get('text');
      expect(text, `CTA ${i} must carry a pre-filled message`).toBeTruthy();
      texts.push(text as string);
    }
    expect(new Set(texts).size, 'pre-filled messages must differ per package').toBe(4);
  });

  test('each pre-filled message names its own package (no crossed wiring)', async ({ page }) => {
    await page.goto('/layanan');

    const expectedFragments = ['Activity Only', '25 Peserta', '50 Peserta', '100 Peserta'];

    // Scope to PackageCard: each card anchors a wa.me CTA and carries an h3
    // tier name. (Header/FAB also match "wa.me" but sit outside .card.)
    const cards = page.locator('.card', { has: page.locator('a[href*="wa.me"]') });
    await expect(cards).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      const cardTitle = await cards.nth(i).locator('h3').innerText();
      const cardHref = await cards.nth(i).locator('a[href*="wa.me"]').getAttribute('href');
      const text = new URL(cardHref as string).searchParams.get('text') ?? '';

      const match = expectedFragments.find((f) => cardTitle.includes(f));
      expect(match, `card title "${cardTitle}" must map to a known tier`).toBeTruthy();
      expect(text, `pre-filled message of "${cardTitle}" must mention its own package`).toContain(
        match as string,
      );
    }
  });

  test('header + floating WhatsApp CTAs link to the shared business number', async ({ page }) => {
    await page.goto('/');

    // Header CTA (desktop) — no pre-filled text, bare wa.me deep link.
    const headerCta = page.locator('header a[href*="wa.me"]').first();
    await expect(headerCta).toHaveAttribute('href', new RegExp(`^https://wa\\.me/${WA_PHONE}$`));

    // Floating action button — aria-labelled, number + locale greeting.
    const fab = page.locator('a[class*="fixed bottom-5"]');
    await expect(fab).toHaveAttribute('href', new RegExp(`^https://wa\\.me/${WA_PHONE}\\?text=`));
  });

  test('wa.me links are safe to open in a new context (rel=noopener)', async ({ page }) => {
    await page.goto('/layanan');

    const waLinks = page.locator('a[href*="wa.me"]');
    const count = await waLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(waLinks.nth(i)).toHaveAttribute('target', '_blank');
      await expect(waLinks.nth(i)).toHaveAttribute('rel', /noopener/);
    }
  });
});
