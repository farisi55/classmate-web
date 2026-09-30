import { describe, expect, it } from 'vitest';

// Unit tests for the route-parity checker (Task #020 AC #1): route discovery,
// file→route conversion, exclusion rule, parity logic, and the CLI contract —
// including a negative test proving the CLI exits non-zero when a page has no
// /en mirror. The E2E spec (route-parity.spec.ts) reuses these exports and
// verifies the *served* routes over HTTP.

import {
  LOCALE_EXCLUDED_DIRS,
  checkParity,
  collectPageFiles,
  fileToRoute,
  main,
  splitLocales,
} from './check-route-parity.mjs';

describe('fileToRoute', () => {
  it('converts index.astro to the root route', () => {
    expect(fileToRoute('index.astro')).toBe('/');
  });

  it('converts a flat page file to its route', () => {
    expect(fileToRoute('aktivitas.astro')).toBe('/aktivitas');
  });

  it('converts a nested page file to its route', () => {
    expect(fileToRoute('en/klien-venue.astro')).toBe('/en/klien-venue');
  });

  it('converts nested index.astro to a directory route (no trailing slash)', () => {
    expect(fileToRoute('en/sub/index.astro')).toBe('/en/sub');
  });
});

describe('splitLocales', () => {
  it('splits en/ files from ID files', () => {
    const { idFiles, enFiles } = splitLocales(['index.astro', 'en/index.astro', 'kontak.astro']);
    expect(idFiles).toEqual(['index.astro', 'kontak.astro']);
    expect(enFiles).toEqual(['en/index.astro']);
  });

  it('excludes admin/ from both sides (single-locale by design)', () => {
    const { idFiles, enFiles } = splitLocales([
      'admin/index.astro',
      'index.astro',
      'en/index.astro',
    ]);
    expect(idFiles).toEqual(['index.astro']);
    expect(enFiles).toEqual(['en/index.astro']);
    expect(LOCALE_EXCLUDED_DIRS).toContain('admin');
  });
});

describe('checkParity', () => {
  it('returns no violations for symmetric route sets', () => {
    const idFiles = ['index.astro', 'aktivitas.astro'];
    const enFiles = ['en/index.astro', 'en/aktivitas.astro'];
    expect(checkParity(idFiles, enFiles)).toEqual([]);
  });

  it('flags ID pages without an EN counterpart', () => {
    const violations = checkParity(['tentang.astro', 'baru.astro'], ['en/tentang.astro']);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('baru.astro');
    expect(violations[0]).toContain('missing EN counterpart');
  });

  it('flags EN pages without an ID counterpart', () => {
    const violations = checkParity(['tentang.astro'], ['en/tentang.astro', 'en/eksperimen.astro']);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('en/eksperimen.astro');
    expect(violations[0]).toContain('missing ID counterpart');
  });

  it('flags both directions at once with no false positives', () => {
    const violations = checkParity(['a.astro', 'b.astro'], ['en/a.astro', 'en/c.astro']);
    expect(violations).toHaveLength(2);
  });
});

describe('collectPageFiles (real src/pages tree)', () => {
  it('discovers all current pages including the en/ subtree', async () => {
    const files = await collectPageFiles('src/pages');

    // 8 ID-side .astro files (7 public pages + admin) + 7 EN mirrors = 15.
    expect(files).toHaveLength(15);

    const { idFiles, enFiles } = splitLocales(files);
    // admin/ is excluded from the ID side by splitLocales → 7 remain.
    expect(idFiles).toHaveLength(7);
    expect(enFiles).toHaveLength(7);
    expect(idFiles).not.toContain('admin/index.astro');

    // admin/ exclusion must not create a false violation.
    expect(checkParity(idFiles, enFiles)).toEqual([]);
  });
});

describe('CLI main()', () => {
  it('returns 0 (exit zero) for the current symmetric route tree', async () => {
    const exitCode = await main();
    expect(exitCode).toBe(0);
  });

  it('returns 1 (exit non-zero) when a page lacks its /en mirror', async () => {
    // Create an asymmetric ID page, run main(), assert 1, clean up. Proves
    // the CI gate fails (AC #1) without needing a separate CI run to test.
    const stray = 'src/pages/zz-parity-fixture.astro';
    const { writeFile, rm } = await import('node:fs/promises');
    await writeFile(stray, '---\n---\n<slot />', 'utf8');
    try {
      const exitCode = await main();
      expect(exitCode).toBe(1);
    } finally {
      await rm(stray);
    }
  });
});
