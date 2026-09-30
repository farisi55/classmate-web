import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Bilingual route-parity checker (knowledge.md hard constraint: all 7 pages
 * exist in both ID and /en). One source of truth for route discovery, shared
 * by three consumers: this CLI (CI gate, exit non-zero on asymmetry), the
 * Vitest unit tests (scripts/check-route-parity.test.ts), and the Playwright
 * E2E spec (e2e/route-parity.spec.ts, which verifies the *served* routes).
 */

/** Pages root, relative to the project root (Astro default). */
export const PAGES_DIR = 'src/pages';

/** Single-locale exception: admin dashboard has no /en mirror by design. */
export const LOCALE_EXCLUDED_DIRS = ['admin'];

/**
 * Recursively collect `.astro` page files under `dir`, returned as POSIX
 * paths relative to `dir` (e.g. `en/aktivitas.astro`). Non-`.astro` files
 * and the `en/` sibling subtree are handled by the caller splitting on the
 * leading `en/` segment.
 */
export async function collectPageFiles(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = base === dir ? entry.name : `${base}/${entry.name}`;
    // `rel` is relative to PAGES_DIR's parent? No — callers pass dir=PAGES_DIR
    // and base=segment path under it, so `rel` stays relative to PAGES_DIR.
    if (entry.isDirectory()) {
      files.push(...(await collectPageFiles(join(dir, entry.name), rel)));
    } else if (entry.name.endsWith('.astro')) {
      files.push(rel);
    }
  }
  return files;
}

/**
 * Convert a page file path (relative to src/pages, POSIX) to its URL route:
 * `index.astro` → `/`, `foo.astro` → `/foo`, `a/b/index.astro` → `/a/b`.
 */
export function fileToRoute(relPath) {
  const withoutExt = relPath.replace(/\.astro$/, '');
  const withoutIndex = withoutExt.replace(/(^|\/)index$/, '$1').replace(/\/$/, '');
  return `/${withoutIndex}`;
}

/**
 * Pure parity check over two file lists (paths relative to src/pages).
 * Returns violation messages — empty array means the route sets are
 * symmetric. The `en/` subtree is the EN side; everything else (minus
 * LOCALE_EXCLUDED_DIRS) is the ID side.
 */
export function checkParity(idFiles, enFiles) {
  const violations = [];
  const enSet = new Set(enFiles);
  const idSet = new Set(idFiles);

  for (const file of idFiles) {
    const counterpart = `en/${file}`;
    if (!enSet.has(counterpart)) {
      violations.push(
        `missing EN counterpart for src/pages/${file} (expected src/pages/${counterpart})`,
      );
    }
  }
  for (const file of enFiles) {
    const counterpart = file.replace(/^en\//, '');
    if (!idSet.has(counterpart)) {
      violations.push(
        `missing ID counterpart for src/pages/${file} (expected src/pages/${counterpart})`,
      );
    }
  }
  return violations;
}

/**
 * Split collected page files into { idFiles, enFiles } applying the
 * locale-exclusion rule (admin/ and any other single-locale directory is
 * checked against neither side).
 */
export function splitLocales(files) {
  const idFiles = [];
  const enFiles = [];
  for (const file of files) {
    if (file.startsWith('en/')) {
      enFiles.push(file);
    } else if (!LOCALE_EXCLUDED_DIRS.some((dir) => file.startsWith(`${dir}/`))) {
      idFiles.push(file);
    }
  }
  return { idFiles, enFiles };
}

// ---------------------------------------------------------------------------
// CLI entry point — runs only when invoked directly (not on import by the
// Vitest unit tests or the Playwright spec, which reuse the exports above).
// ---------------------------------------------------------------------------
export async function main() {
  const files = await collectPageFiles(PAGES_DIR);
  const { idFiles, enFiles } = splitLocales(files);
  const violations = checkParity(idFiles, enFiles);

  if (violations.length > 0) {
    console.error(`Route parity check FAILED — ${violations.length} violation(s):`);
    for (const v of violations) console.error(`  - ${v}`);
    return 1;
  }
  // no-console allows warn/error; success path reports via error-stream-free
  // warn channel so CI logs stay parseable while keeping the rule satisfied.
  console.warn(
    `Route parity check OK — ${idFiles.length} ID route(s), ${enFiles.length} EN route(s), fully mirrored.`,
  );
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exit(await main());
}
