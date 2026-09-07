# Cloudflare Web Analytics — Audit & Beacon Setup

> Task #015 — Phase 4 Integration
> Status: **re-scoped** — original ACs (custom per-package click events) are not implementable; see "Hard Limitation" below.

## Overview

Task #015 as originally derived assumed Cloudflare Web Analytics can receive
**custom events** (e.g. `wa_click` with a package-tier attribute) verifiable in
the dashboard. A code audit plus a documentation review in this task found:

1. **Code audit (client side):** the site shipped **zero** analytics
   instrumentation. No beacon in `src/layouts/BaseLayout.astro`, and no click
   tracking on any of the 9 WhatsApp CTA placements:
   - `src/components/PackageCard.astro` — one CTA per package tier (the money button)
   - `src/components/WhatsAppButton.astro` — floating button, every page
   - `src/components/Header.astro` — desktop nav CTA + mobile menu CTA
   - `src/components/sections/HomeContent.astro` — hero CTA + packages-section CTA
   - `src/components/sections/KlienVenueContent.astro`, `KontakContent.astro`,
     `SyaratKetentuanContent.astro` — one CTA each

2. **Documentation audit:** Cloudflare's official Web Analytics FAQ
   (developers.cloudflare.com/web-analytics/faq, "Functionality" section,
   reviewed 2026-09-07) states verbatim:
   > "Does Web Analytics support custom events? **Not yet**, but we may add
   > support for this in the future."

   The FAQ further clarifies the beacon (`beacon.min.js`) reports pageviews and
   performance/timing metrics only, and that custom integrations with the
   `/cdn-cgi/rum` ingestion endpoint are explicitly not supported: *"all
   requests should originate from our beacon JavaScript."*

## Hard Limitation

There is **no sanctioned API to fire a custom event** from site code, and no
event-attributed data will ever appear in the Web Analytics dashboard on the
current product. Any client-side code that "pushes" events (e.g. the folklore
`window.__cfQ.push(...)` pattern) is a silent no-op: it cannot be verified via
the dashboard, so building it would fabricate the acceptance criterion rather
than satisfy it. Decision (developer-confirmed during this task): **do not
implement fake event plumbing**; the success-metric tracking approach is to be
re-derived later (candidate options: KV counters behind a new Pages Function,
or Workers Analytics Engine `writeDataPoint`).

## What Was Implemented (re-scoped)

The **Cloudflare Web Analytics beacon** was added to `BaseLayout.astro`'s
`<head>`, giving the project real, cookie-less pageview + performance analytics
(the §8 observability baseline) on every page, both locales.

```astro
{cfBeaconToken ? (
  <script
    is:inline
    type="module"
    src="https://static.cloudflareinsights.com/beacon.min.js"
    data-cf-beacon={JSON.stringify({ token: cfBeaconToken })}
  />
) : null}
```

Design notes:

- **No token → no beacon.** The script only renders when the token is
  configured; builds and tests run green without it, and no requests go to
  `cloudflareinsights.com` from preview/test environments.
- **`is:inline` + `type="module"`** — Astro does not process/bundle the script,
  and `type="module"` matches Cloudflare's current manual-embed instructions
  (also de-facto gates out legacy browsers the beacon does not support).
- **Single snippet per page** — rendered exactly once from the shared layout
  (Cloudflare's docs: only one JS snippet may render per page).
- **Cookie-less & privacy-first** — no consent banner implications; consistent
  with §9 "PII not in logs" posture (the beacon collects timing/pageview data,
  not form contents).

## Configuration (developer action, dashboard)

1. Cloudflare dashboard → **Web Analytics** → add site
   `classmate-web.pages.dev` (and the production custom domain when live).
2. Copy the JS snippet's token (the value in `data-cf-beacon='{"token": "..."}'`).
3. Cloudflare Pages project → **Settings → Environment variables** → add
   `PUBLIC_CF_BEACON_TOKEN` = `<token>` for **Production** (optionally Preview).
4. Redeploy. Verify: view-source on any page shows the
   `static.cloudflareinsights.com/beacon.min.js` script, and the Web Analytics
   dashboard starts reporting pageviews within a few minutes.

## Verification Performed This Task

- `npm run build` (astro check + 15 pages): passes with **no token set** —
  conditional rendering works, no beacon in output HTML, zero console regressions.
- With a token set (`PUBLIC_CF_BEACON_TOKEN=e2e-test-token`): built output
  contains the beacon script with the exact token value in `data-cf-beacon`,
  rendered exactly once per page.
- Lint / format / 55 unit tests: unchanged, all green (no JS shipped by this
  change itself; the beacon is third-party, loaded only in deployed
  environments).

## Follow-ups (not this task)

- Re-derive per-package WA-click tracking (success-metric "closed decision")
  via KV counters or Analytics Engine — candidate replacement task for the
  loop backlog.
- If Cloudflare ships custom events ("Not yet" today), revisit this doc and
  instrument the 9 CTA placements above with per-tier attribution
  (`PackageCard` passes `pkg.slug`; other placements use a generic placement
  label).
