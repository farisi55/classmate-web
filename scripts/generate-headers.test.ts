// Unit tests for the dist/_headers generator: hashing, extraction rules, and
// the no-'unsafe-inline' guarantee of the emitted Content-Security-Policy.
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import {
  buildHeadersContent,
  cspHash,
  collectInlineBodies,
  findHtmlFiles,
} from './generate-headers.mjs';

const expectedHash = (body: string) =>
  "'sha256-" + createHash('sha256').update(body, 'utf8').digest('base64') + "'";

describe('cspHash', () => {
  it('formats a sha256 base64 digest as a CSP source expression', () => {
    expect(cspHash('console.log(1)')).toBe(expectedHash('console.log(1)'));
  });
});

describe('collectInlineBodies', () => {
  it('extracts executable inline module scripts', () => {
    const html = '<html><script type="module">const a = 1;</script></html>';
    expect(collectInlineBodies(html).scripts).toEqual(['const a = 1;']);
  });

  it('extracts classic scripts without a type attribute', () => {
    const html = '<script>var b = 2;</script>';
    expect(collectInlineBodies(html).scripts).toEqual(['var b = 2;']);
  });

  it('skips JSON-LD data blocks and external scripts', () => {
    const html =
      '<script type="application/ld+json">{"a":1}</script>' +
      '<script type="module" src="/_astro/chunk.js"></script>';
    expect(collectInlineBodies(html).scripts).toEqual([]);
  });

  it('extracts inline style blocks', () => {
    const html = '<style>.x { color: red }</style>';
    expect(collectInlineBodies(html).styles).toEqual(['.x { color: red }']);
  });
});

describe('buildHeadersContent', () => {
  it('emits every required security header', () => {
    const out = buildHeadersContent(['<script type="module">x()</script>']);
    expect(out).toContain('Strict-Transport-Security: max-age=31536000');
    expect(out).toContain('X-Frame-Options: DENY');
    expect(out).toContain('X-Content-Type-Options: nosniff');
    expect(out).toContain('Referrer-Policy: strict-origin-when-cross-origin');
    expect(out).toContain('Permissions-Policy:');
    expect(out).toContain('Content-Security-Policy:');
  });

  it('contains no unsafe-inline or unsafe-eval anywhere in the CSP', () => {
    const out = buildHeadersContent([
      '<script type="module">a()</script><style>.b{color:red}</style>',
    ]);
    expect(out).not.toContain('unsafe-inline');
    expect(out).not.toContain('unsafe-eval');
  });

  it('hashes each unique inline script and style into the CSP', () => {
    const out = buildHeadersContent([
      '<script type="module">a()</script><style>.b{color:red}</style>',
      '<script type="module">a()</script>', // duplicate body must not duplicate the hash
    ]);
    expect(out).toContain(cspHash('a()'));
    expect(out).toContain(cspHash('.b{color:red}'));
    expect(out.split(cspHash('a()'))).toHaveLength(2); // exactly one occurrence
  });

  it('covers scripts and styles from every page passed in', () => {
    const out = buildHeadersContent([
      '<script type="module">first()</script>',
      '<script type="module">second()</script>',
    ]);
    expect(out).toContain(cspHash('first()'));
    expect(out).toContain(cspHash('second()'));
  });

  it('allows the Google Fonts origins used by global.css (knowledge §6)', () => {
    const out = buildHeadersContent(['<html></html>']);
    expect(out).toContain("style-src 'self' https://fonts.googleapis.com");
    expect(out).toContain("font-src 'self' https://fonts.gstatic.com");
  });
});

describe('findHtmlFiles', () => {
  it('returns an empty list for a missing directory', () => {
    expect(findHtmlFiles('definitely-not-a-real-dir-xyz')).toEqual([]);
  });
});
