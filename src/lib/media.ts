import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

/** Plain, JSON-serializable shape (no methods/class instances) — needed
 * because activityImages() ends up as a prop on a React island
 * (ActivityExplorer.tsx), and Astro only serializes plain data across that
 * boundary, not the full ImageMetadata object. */
export interface OptimizedImage {
  src: string;
  width: number;
  height: number;
}

/**
 * Build-time image resolution for local assets, replacing the old R2-based
 * plan (see knowledge.md §3 decision — superseded: R2 removed, images now
 * ship as part of the static build via astro:assets, same reasoning as the
 * existing Content Collections-over-CMS decision: infrequently-changing
 * media is safer versioned in git than in a separate storage service).
 *
 * `import.meta.glob` calls must stay static (Vite requirement) so every
 * data file that needs images asks this one module, rather than each data
 * file writing its own glob. Filenames follow the convention documented in
 * ASSET_MANIFEST.md — nothing here breaks if a folder is still empty; every
 * lookup falls back to [] / null the same way the old `images: []` did.
 */

const activityImageModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/activities/*.{jpg,jpeg,png,webp}',
  { eager: true },
);

// PNG/JPG/WebP only — Astro's built-in image service (Sharp) doesn't
// process SVG through astro:assets the same way, so it's intentionally
// excluded here to keep every result a real ImageMetadata object. Ask for
// transparent PNG exports if a logo only exists as SVG (see
// ASSET_MANIFEST.md).
const clientLogoModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/logos/clients/*.{jpg,jpeg,png,webp}',
  { eager: true },
);

const venueLogoModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/logos/venues/*.{jpg,jpeg,png,webp}',
  { eager: true },
);

const heroImageModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/hero/*.{jpg,jpeg,png,webp}',
  { eager: true },
);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Images for one activity, e.g. `activity-{slug}-1.webp`,
 * `activity-{slug}-2.webp`, ... (ASSET_MANIFEST.md naming convention).
 * Sorted so `-1` renders before `-2`. Returns `[]` when no photos have been
 * added yet for that slug — the UI already has a placeholder state for that.
 * Runs every match through getImage() so activity photos get the same
 * automatic WebP conversion + resize as the hero/logo images that go
 * through <Image />, even though these end up rendered by a React island
 * (ActivityExplorer.tsx) rather than an Astro component.
 */
export async function activityImages(slug: string): Promise<OptimizedImage[]> {
  const matches = Object.entries(activityImageModules)
    .filter(([path]) => path.includes(`/activity-${slug}-`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, mod]) => mod.default);

  const optimized = await Promise.all(
    matches.map((img) => getImage({ src: img, format: 'webp', width: 1600 })),
  );
  return optimized.map((o) => ({
    src: o.src,
    width: o.attributes.width as number,
    height: o.attributes.height as number,
  }));
}

/**
 * Logo for one client, matched by `client-{slugified-name}.{ext}`
 * (ASSET_MANIFEST.md). Returns `null` until supplied — callers already
 * render a text wordmark fallback in that case.
 */
export function clientLogo(name: string): ImageMetadata | null {
  const match = Object.entries(clientLogoModules).find(([path]) =>
    path.includes(`/client-${slugify(name)}.`),
  );
  return match?.[1].default ?? null;
}

/** Logo for one venue, matched by `venue-{slugified-name}.{ext}`. */
export function venueLogo(name: string): ImageMetadata | null {
  const match = Object.entries(venueLogoModules).find(([path]) =>
    path.includes(`/venue-${slugify(name)}.`),
  );
  return match?.[1].default ?? null;
}

/**
 * The single homepage hero collage image (ASSET_MANIFEST.md:
 * `hero-collage.webp`). Whichever file is dropped into `src/assets/hero/`
 * first is used — returns `null` until one exists, so HomeContent.astro can
 * fall back to its current placeholder.
 */
export function heroImage(): ImageMetadata | null {
  return Object.values(heroImageModules)[0]?.default ?? null;
}
