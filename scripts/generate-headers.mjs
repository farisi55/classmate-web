// Generate dist/_headers after `astro build`: Cloudflare Pages headers file with
// security headers + a strict Content-Security-Policy whose script-src/style-src
// use sha256 hashes for every inline <script>/<style> the build emitted, so the
// CSP never needs 'unsafe-inline'/'unsafe-eval' (Phase 6 security gate, knowledge §9).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Recursively list every *.html file under dir (empty array when dir is missing). */
export function findHtmlFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findHtmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** True when a <script> tag's attributes mark it executable (not a JSON-LD/data block). */
function isExecutableScript(attrs) {
  if (/\bsrc\s*=/.test(attrs)) return false; // external script — covered by script-src origin
  const type = attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/);
  if (!type) return true; // classic script, no type
  return (
    type[1] === 'module' || type[1] === 'text/javascript' || type[1] === 'application/javascript'
  );
}

/** Extract executable inline script bodies and inline style blocks from one HTML document. */
export function collectInlineBodies(html) {
  const scripts = [];
  const styles = [];
  const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = scriptRe.exec(html)) !== null) {
    if (isExecutableScript(m[1]) && m[2].trim() !== '') scripts.push(m[2]);
  }
  const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  while ((m = styleRe.exec(html)) !== null) {
    if (m[1].trim() !== '') styles.push(m[1]);
  }
  return { scripts, styles };
}

/** Format a body as a CSP source expression: 'sha256-<base64 digest>'. */
export function cspHash(body) {
  return "'sha256-" + createHash('sha256').update(body, 'utf8').digest('base64') + "'";
}

/** Build the full _headers file content for a set of HTML documents. */
export function buildHeadersContent(htmlDocs) {
  const scriptHashes = new Set();
  const styleHashes = new Set();
  for (const html of htmlDocs) {
    const { scripts, styles } = collectInlineBodies(html);
    for (const s of scripts) scriptHashes.add(cspHash(s));
    for (const s of styles) styleHashes.add(cspHash(s));
  }

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    // static.cloudflareinsights.com: Web Analytics beacon, present only when
    // PUBLIC_CF_BEACON_TOKEN is set (knowledge §8) — allowed unconditionally so
    // builds with and without the token share one CSP.
    [
      'script-src',
      "'self'",
      'https://static.cloudflareinsights.com',
      ...[...scriptHashes].sort(),
    ].join(' '),
    // fonts.googleapis.com: Google Fonts @import in src/styles/global.css
    // (Fredoka/Baloo 2, knowledge §6); fonts.gstatic.com serves the font files.
    ['style-src', "'self'", 'https://fonts.googleapis.com', ...[...styleHashes].sort()].join(' '),
    "img-src 'self' data:",
    "font-src 'self' https://fonts.gstatic.com",
    [
      'connect-src',
      "'self'",
      'https://static.cloudflareinsights.com',
      'https://cloudflareinsights.com',
      'https://*.cloudflareinsights.com',
    ].join(' '),
    "manifest-src 'self'",
    "worker-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');

  // includeSubDomains intentionally omitted: subdomain inventory unknown (see task notes).
  return [
    '/*',
    '  Strict-Transport-Security: max-age=31536000',
    '  X-Frame-Options: DENY',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()',
    `  Content-Security-Policy: ${csp}`,
    '',
  ].join('\n');
}

/** CLI entry: hash every HTML file in dist/ and write dist/_headers. */
function main() {
  const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  const files = findHtmlFiles(distDir);
  if (files.length === 0) {
    console.error('generate-headers: no HTML files found in dist/ — run astro build first.');
    process.exit(1);
  }
  const docs = files.map((f) => readFileSync(f, 'utf8'));
  const content = buildHeadersContent(docs);
  writeFileSync(join(distDir, '_headers'), content, 'utf8');
  process.stdout.write(`generate-headers: wrote dist/_headers for ${files.length} pages\n`);
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main();
}
