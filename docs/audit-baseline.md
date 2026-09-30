# Audit Baseline — Environment & Security

**Generated:** 2026-09-03  
**Task:** Task #001 — Environment Audit & Security Baseline  
**Phase:** Phase 1 — Foundation  
**Shape:** fullstack  
**Simple mode:** false

## .gitignore Update

The following patterns were added to `.gitignore` to prevent secrets and sensitive files from being committed:

- `.env`
- `.env.production`
- `.dev.vars`
- `*.pem`
- `*.key`
- `*.p12`
- `secrets/`

## Secret/Token Hardcoded Scan

A comprehensive grep was performed across the codebase (`src/`, `functions/`, root config files) for patterns indicating hardcoded secrets, tokens, or credentials:

- Patterns searched: `CF_ACCESS`, `client_secret`, `api_key`, `secret`, `password`, `access_token`
- File types inspected: `.ts`, `.js`, `.mjs`, `.json`, config files
- **Result: ZERO findings** — no hardcoded secrets or tokens detected in the codebase.

This confirms the project already follows the security baseline of keeping sensitive configuration out of source code. All secrets are managed through:

- Cloudflare Pages encrypted environment variables (`CLASSMATE_KV` binding in `wrangler.toml`)
- GitHub Actions repository secrets (`CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`)
- Cloudflare Access (JWT browser login + Service Token for automation)

## KV Binding Confirmation

`wrangler.toml` contains the required KV namespace binding:

```toml
[[kv_namespaces]]
binding = "CLASSMATE_KV"
id = "87b5fe2bd58c4bb38e82008bfac5cd50"
```

This binding is used by the application endpoints (`/api/ticker`, `/api/health`, `/api/admin/ticker`, `/api/admin/ticker-export`) to read/write ticker messages.

## Anti-Patterns Check

Per `knowledge.md` §9 — Sensitive / High-Blast-Radius Code:

1. **`POST` handler di `functions/api/admin/ticker.ts`** — full overwrite seluruh pesan ticker; payload yang salah/tidak lengkap menggantikan semua pesan existing tanpa safety-net partial-update *(documented, no code change needed)*

2. **`activityImages()` / `clientLogo()` / `venueLogo()` di `src/lib/media.ts`** — kesalahan penamaan file (tidak cocok konvensi `activity-{slug}-N.ext` / `client-{slug}.ext`) gagal secara diam-diam (mengembalikan array/`null` kosong, bukan error) — foto/logo yang salah nama akan hilang tanpa pesan kesalahan apa pun *(documented, no code change needed)*

---

## XSS / Output Encoding Audit (Task #017, 2026-09-30)

Grep over `src/`, `functions/` for `set:html`, `dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`, `new Function`:

- **`set:html`: 1 match** — `src/layouts/BaseLayout.astro` JSON-LD `<script type="application/ld+json">`. Safe: payload is compile-time literal `LocalBusiness` data (never user/KV input), and `JSON.stringify(...).replace(/</g, '\\u003c')` now escapes `<` so no `</script>` breakout is possible even if a literal later contains markup characters. Scoped `eslint-disable` in the file's frontmatter documents the rationale; `astro/no-set-html-directive` is re-enabled as `error` (was temporarily `off` since Task #003) so any *new* `set:html` fails lint.
- **`dangerouslySetInnerHTML` / `innerHTML` / `insertAdjacentHTML` / `document.write` / `eval` / `new Function`: 0 matches.**
- **Ticker rendering (admin-written KV data)** — the AC's risk case: server-rendered default passes through Astro `{expr}` (auto-escaped); client rotation sets `textEl.textContent = …` (text node, not HTML); admin form uses React controlled inputs (React-escaped). No raw HTML injection path.

**Conclusion:** Environment audit complete. No hardcoded secrets detected. `.gitignore` updated to protect sensitive files. KV binding confirmed operational. XSS audit: one documented-safe `set:html`, zero unsafe sinks. Project proceeds to subsequent tasks with security baseline established.

---

## Test Coverage Verification (Task #018, 2026-09-30)

`npm run test:coverage` (Vitest v8, scope `functions/**` + `src/lib/**` per knowledge §4):

| File | Lines | Branches | Status |
|---|---|---|---|
| `functions/api/health.ts` | 100% (9/9) | 100% (4/4) | ≥70% ✓ |
| `functions/api/ticker.ts` | **62% (8/13)** | **33% (3/9)** | **BELOW 70% — technical debt (see below)** |
| `functions/api/admin/ticker-export.ts` | 100% (12/12) | 100% (8/8) | ≥70% ✓ |
| `functions/api/admin/ticker.ts` | 95% (19/20) | 100% (19/19) | ≥70% ✓ |
| `src/lib/media.ts` | 100% (19/19) | 83% (5/6) | ≥70% ✓ |
| `src/lib/types.ts` | n/a (type-only) | n/a | no executable code |
| **Aggregate `functions/`** | **89% (48/54)** | **85% (34/40)** | **≥70% ✓** |
| **Aggregate `src/lib/`** | **100% (19/19)** | **83% (5/6)** | **≥70% ✓** |
| **All files** | **92% stmts / 92% lines** | **85% branches** | **100% functions** |

**AC met:** both `functions/` and `src/lib/` aggregates are ≥70%.

### Technical debt (explicit, per AC — not silently skipped)

1. **`functions/api/ticker.ts` (GET /api/ticker) — 62% lines / 33% branches, below the 70% target.** Uncovered: lines 49–51 (KV read success path) and 58–59 (read-failure error path) — the public ticker endpoint has no dedicated happy-path/error-path unit test (only its KV-binding guard is exercised via `health.test.ts`). Debt: add `ticker.test.ts` covering success + KV-failure responses.
2. **`src/lib/media.ts` branch coverage 83%** — single uncovered branch (line 115) in path matching; above the line target, recorded for completeness.
3. **Historical:** `npm audit` pre-existing advisories tracked below.

## Dependency CVE Status (Task #018 gate, updated 2026-09-30)

- Before task: **10 vulnerabilities (3 moderate, 6 high, 1 critical)** — grown since Task #007's 6 (new advisories published against the pinned Astro 4.x tree).
- `npm audit fix` (non-breaking, lockfile-only) applied: **reduced to 5 (2 moderate, 2 high, 1 critical)** — fixed `brace-expansion` (high), `fast-uri` (high), `devalue` (moderate), others within semver ranges. All 67 tests + build green after the bump.
- **Remaining 5: `astro <=7.2.7` (critical), `sharp <=0.35.x` (high), `esbuild <=0.24.2` (moderate) — fixable only via `astro@7.3.5`, a breaking major that conflicts with knowledge.md §2 (`Astro 4.x`).** Runtime exposure analysis: this project is `output: 'static'` — Astro never runs in production; the advisories target the dev server, SSR/middleware/server-islands/adapter, and the build-time image pipeline (local + ephemeral CI runners). Production runtime (Cloudflare Pages static assets + Pages Functions) is unaffected. **Known deviation — remediation requires a dedicated Astro 4→7 migration task; not resolvable inside a verification task.**

## Security Headers & CSP (Task #018 gate fix, 2026-09-30)

`scripts/generate-headers.mjs` runs after every `astro build` and writes `dist/_headers` (Cloudflare Pages header rules): HSTS, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and a strict Content-Security-Policy with **sha256 hashes for every inline script/style** — no `unsafe-inline`/`unsafe-eval` anywhere. Google Fonts origins (global.css `@import`) and the Web Analytics beacon origin are allowlisted (knowledge §6/§8). Unit-tested (`scripts/generate-headers.test.ts`); verified live against `wrangler pages dev dist` with headless Chromium across 6 pages: **0 CSP violations, 0 page errors**.