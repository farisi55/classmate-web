import { expect, test, type Page } from '@playwright/test';

// Task #019 AC #1 — Activity Explorer core flow. knowledge.md §4 names this
// suite as one of the three E2E core flows. Covers: tab filtering narrows
// the card grid to the matching category, and the gallery modal opens for an
// activity that has photos. Hydration note: the explorer is a client:visible
// React island (Astro), so Playwright auto-waits for the tabs to attach.
//
// Fixture note: the only committed activity photos are the Task #011 test
// fixtures (`activity-art-party-{1,2,3}.png`, which match no real slug, kept
// for media.test.ts) plus the Task #019 `activity-slime-experience-{1,2}.png`
// fixtures, which match the real "Slime Experience" slug so the gallery
// branch is exercisable. Real photos, once dropped into src/assets/activities/, replace the fixtures without test changes (the
// selector is data-driven, not file-driven).

// Wait for the Activity Explorer island to hydrate: Astro keeps an
// `astro-island[ssr]` attribute on each island until its client entry has
// run, so the absence of that attribute proves the tab/card buttons carry
// real React onClick handlers (a click before hydration only moves DOM
// focus — the handler is silently swallowed).
async function explorerHydrated(page: Page) {
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'), null, {
    timeout: 15_000,
  });
}

test.describe('Activity Explorer — filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/aktivitas');
    await explorerHydrated(page);
  });

  test('shows all activities under the default "Semua" tab', async ({ page }) => {
    const tabs = page.getByRole('tablist', { name: 'Filter aktivitas' });
    await expect(tabs).toBeVisible();

    const panel = page.getByRole('tabpanel');
    const cards = panel.locator(':scope > button');
    await expect(cards).toHaveCount(38); // 10 inti + 28 kelas lainnya (knowledge §7)
  });

  test('filtering by "Aktivitas Inti" narrows the grid to core activities only', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Aktivitas Inti' }).click();

    const panel = page.getByRole('tabpanel');
    const cards = panel.locator(':scope > button');
    await expect(cards).toHaveCount(10);

    // Every remaining card must be labelled as a core activity.
    const eyebrows = panel.locator('span.eyebrow');
    const total = await eyebrows.count();
    expect(total).toBe(10);
    for (let i = 0; i < total; i++) {
      await expect(eyebrows.nth(i)).toHaveText('Aktivitas Inti');
    }
  });

  test('filtering by "Kelas Lainnya" narrows the grid to other classes only', async ({ page }) => {
    await page.getByRole('tab', { name: 'Kelas Lainnya' }).click();

    const panel = page.getByRole('tabpanel');
    const cards = panel.locator(':scope > button');
    await expect(cards).toHaveCount(28);

    // knowledge.md §7: kelas-lainnya must be visually/structurally distinct —
    // every card carries the min-participants marker.
    const minBadges = panel.locator('p:has-text("Min. peserta:")');
    const total = await minBadges.count();
    expect(total).toBe(28);
    for (let i = 0; i < total; i++) {
      await expect(minBadges.nth(i)).toContainText('20');
    }
  });

  test('switching between tabs updates results each time (no stale grid)', async ({ page }) => {
    const panel = page.getByRole('tabpanel');
    const cards = panel.locator(':scope > button');

    await page.getByRole('tab', { name: 'Aktivitas Inti' }).click();
    await expect(cards).toHaveCount(10);

    await page.getByRole('tab', { name: 'Kelas Lainnya' }).click();
    await expect(cards).toHaveCount(28);

    await page.getByRole('tab', { name: 'Semua', exact: true }).click();
    await expect(cards).toHaveCount(38);
  });
});

test.describe('Activity Explorer — gallery modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/aktivitas');
    await explorerHydrated(page);
  });

  test('modal opens for an activity with photos, showing gallery + details', async ({ page }) => {
    // "Slime Experience" is the one real slug with committed fixture photos
    // (activity-slime-experience-{1,2}.png, Task #019). Its card is rendered
    // by the island; locate it by its visible heading.
    const cardButton = page.locator('button', {
      has: page.getByRole('heading', { name: 'Slime Experience' }),
    });
    await cardButton.first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Gallery images render (fixture-backed), not the "documentation coming
    // soon" placeholder state.
    const images = dialog.locator('img');
    await expect(images.first()).toBeVisible();
    await expect(images).toHaveCount(2); // fixture count for this slug

    // Details content inside the modal.
    await expect(dialog.locator('h3')).toContainText('Slime Experience');
    await expect(dialog.locator('ul').first()).toBeVisible();
  });

  test('modal closes via the close button and Escape, returning focus to the trigger', async ({
    page,
  }) => {
    const cardButton = page.locator('button', {
      has: page.getByRole('heading', { name: 'Slime Experience' }),
    });
    await cardButton.first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Escape path (a11y behavior from Task #016).
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(cardButton.first()).toBeFocused();

    // Re-open, then close via the button (aria-label from ui-strings).
    await cardButton.first().click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Tutup' }).click();
    await expect(dialog).toBeHidden();
    await expect(cardButton.first()).toBeFocused();
  });

  test('modal opens for a photo-less activity showing the placeholder state', async ({ page }) => {
    // Pick a kelas-lainnya entry (no fixture photos): "Slime Experience" is an
    // inti activity with no fixtures; use "Sport" from kelas lainnya instead.
    const cardButton = page.locator('button', {
      has: page.getByRole('heading', { name: 'Sport' }),
    });
    await cardButton.first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Placeholder state per knowledge.md §9 missing-asset fallback policy.
    await expect(dialog).toContainText('Foto dokumentasi menyusul');
    await expect(dialog.locator('img')).toHaveCount(0);
  });
});
