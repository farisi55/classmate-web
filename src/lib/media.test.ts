import { describe, it, expect, vi } from 'vitest';

// Mock astro:assets — in Vitest's Node environment, import.meta.glob returns
// raw path strings (not ImageMetadata), and getImage() has no real pipeline.
vi.mock('astro:assets', () => ({
  getImage: vi.fn(async (opts: { src: unknown; format: string; width: number }) => {
    const src = typeof opts.src === 'string' ? opts.src : (opts.src as { src: string }).src;
    return {
      src,
      attributes: { width: opts.width, height: Math.round(opts.width * 0.75) },
    };
  }),
}));

// NOTE: This test depends on fixture files in src/assets/ following the
// ASSET_MANIFEST.md naming convention.  The fixture files are tiny 1x1 PNG
// placeholders used ONLY for testing the glob-matching and sorting logic.
// When real activity photos / logos are added, they replace these fixtures.
// See asset-manifest.md for the naming convention.

import { activityImages, clientLogo, venueLogo, heroImage } from './media';

// ---------------------------------------------------------------------------
// activityImages()
// ---------------------------------------------------------------------------
describe('activityImages', () => {
  it('returns images matching the given slug, sorted numerically', async () => {
    const images = await activityImages('art-party');

    expect(images).toHaveLength(3);
    expect(images[0].src).toContain('activity-art-party-1');
    expect(images[1].src).toContain('activity-art-party-2');
    expect(images[2].src).toContain('activity-art-party-3');
  });

  it('returns OptimizedImage objects with src, width, height', async () => {
    const images = await activityImages('art-party');

    for (const img of images) {
      expect(typeof img.src).toBe('string');
      expect(typeof img.width).toBe('number');
      expect(typeof img.height).toBe('number');
    }
  });

  it('returns an empty array when no images match the slug', async () => {
    const images = await activityImages('nonexistent-activity');

    expect(images).toEqual([]);
  });

  it('returns an empty array for empty slug', async () => {
    const images = await activityImages('');

    expect(images).toEqual([]);
  });

  it('does not return images for a slug that has no matching files', async () => {
    // "painting" has no fixture files → empty result, not a throw
    const images = await activityImages('painting');

    expect(images).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// clientLogo()
// ---------------------------------------------------------------------------
describe('clientLogo', () => {
  it('returns a matching logo when the slugified name matches a file', () => {
    const logo = clientLogo('Acme Corp');

    expect(logo).not.toBeNull();
    expect(String(logo)).toContain('client-acme-corp');
  });

  it('slugifies multi-word names correctly', () => {
    const logo = clientLogo('Global Events');

    expect(logo).not.toBeNull();
    expect(String(logo)).toContain('client-global-events');
  });

  it('returns null when no logo matches', () => {
    const logo = clientLogo('Unknown Company');

    expect(logo).toBeNull();
  });

  it('returns null for an empty string', () => {
    const logo = clientLogo('');

    expect(logo).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// venueLogo()
// ---------------------------------------------------------------------------
describe('venueLogo', () => {
  it('returns a matching logo when the slugified name matches a file', () => {
    const logo = venueLogo('Grand Hall');

    expect(logo).not.toBeNull();
    expect(String(logo)).toContain('venue-grand-hall');
  });

  it('returns null when no venue logo matches', () => {
    const logo = venueLogo('Nonexistent Venue');

    expect(logo).toBeNull();
  });

  it('returns null for an empty string', () => {
    const logo = venueLogo('');

    expect(logo).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// heroImage()
// ---------------------------------------------------------------------------
describe('heroImage', () => {
  it('returns the first hero image when one exists', () => {
    const hero = heroImage();

    expect(hero).not.toBeNull();
    expect(String(hero)).toContain('hero-collage');
  });
});
