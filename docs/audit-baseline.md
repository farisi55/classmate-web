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