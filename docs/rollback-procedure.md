# Rollback Procedure — Cloudflare Pages (Incident Runbook)

> Task #022 — Phase 7 Deployment (Server variant)

## Overview

Cloudflare Pages **rollback** instantly reverts the project to a previous
**production** deployment. Per the official Cloudflare documentation
(`developers.cloudflare.com/pages/configuration/rollbacks`, last updated
2026-04-21):

- Any **successfully built production deployment** is a valid rollback target
- After rolling back, you may still roll back to deployments **newer** than the
  current one (rolling "forward" again is the same action)
- **Preview deployments are NOT valid rollback targets** — only deployments of
  the production branch (`main` for this project) count
- The production deployment changes **instantly** on confirmation — no rebuild,
  no waiting, no downtime window

This matches the RTO design in `knowledge.md` §8: rollback is a 1-click action,
target well under 1 hour (this runbook targets <10 minutes end-to-end including
verification).

## What Rollback Does and Does NOT Affect

| Affected (reverted) | NOT affected (untouched) |
|---|---|
| Static pages & assets (HTML, images, `_astro/`, `_headers` incl. CSP) | **KV data** (`ticker:messages`) — ticker content is storage, not deployment |
| Pages Functions code (`/api/*` handlers) | Cloudflare Access applications & policies (Zero Trust config) |
| The site's active production deployment pointer | DNS records, custom domains, TLS certificates |
| | GitHub Actions backup workflow & repo secrets |
| | Cloudflare Web Analytics configuration |

Practical consequence: **a rollback never destroys ticker data or admin
access.** If the incident is bad ticker *content* (not bad code), do **not**
rollback — fix the content via `POST /api/admin/ticker` or restore from
`backups/ticker-messages.json` (Task #026 runbook).

## When to Use This Runbook

- A production deployment broke rendering, routing, or an API endpoint
- A bad build (missing asset, broken CSP header, failed Function) went live
- **Not for:** bad ticker content (KV fix), DNS problems (registrar/Zero Trust
  config), or Access lockout (Zero Trust dashboard)

Estimated time: **<10 minutes** (rollback itself is instant; budget the rest for
verification).

## Prerequisites

- Cloudflare dashboard access to the account that hosts the Pages project
  (⚠️ see `docs/release-process.md` §Deferred Verification — as of 2026-10-15 the
  project is NOT visible from the wrangler-logged-in account
  `26c246cbc90a170778d9db754e035e1c`; use the correct account)
- At least **two** successful production (`main`) deployments exist — the older
  one is the rollback target. Check with `wrangler pages deployment list
  --project-name <project>` or the dashboard **Deployments** tab
- Note the target deployment's **commit SHA** and **timestamp** before starting
  so you can prove afterwards which version is live

## Step-by-Step Rollback (Dashboard)

> There is **no CLI rollback for Pages**: `wrangler` 4.151.0 offers only
> `pages deployment list | create | tail | delete` (verified 2026-10-15), and
> the official docs present rollback as a dashboard action only. The REST API
> can *list* deployments
> (`GET /accounts/{account_id}/pages/projects/{project_name}/deployments`) but
> exposes no rollback method. **The dashboard is the supported rollback path.**

1. **Record start time** (for the <10-minute budget): `date` or stopwatch
2. Log in to **dash.cloudflare.com** with the account that owns the project
3. **Workers & Pages** → select the project (production site of
   `github.com/farisi55/classmate-web`)
4. Open the **Deployments** tab
5. In the **All deployments** list, find the **previous production deployment**:
   - Branch/stage shows production (built from `main`)
   - Confirm its **commit SHA** matches the release/known-good commit
     (compare with `git rev-parse <tag>` — tags are pushed to origin, see
     `docs/release-process.md`)
6. Click the **⋯ (three-dotted) actions menu** on that deployment →
   **Rollback to this deployment**
7. **Confirm** in the dialog — production changes instantly
8. Immediately **request the homepage** (e.g. `curl -sS -o /dev/null -w "%{http_code}"
   https://<site-domain>/`) to confirm the site keeps serving during/right after
   the switch — Pages serves the previous build atomically at the edge, no
   downtime window is expected

## Post-Rollback Verification Checklist

Run all checks; each must pass before declaring the incident resolved:

- [ ] Homepage `https://<site-domain>/` returns **200** and renders the expected
      (old) content — spot-check one section that differed in the bad deploy
- [ ] One Indonesian route **and** one `/en/` route load (e.g. `/tentang/` and
      `/en/tentang/`)
- [ ] `GET /api/health` returns **200** with `{ "status": "ok",
      "kv_reachable": true }`
- [ ] `GET /api/ticker` returns the ticker payload (`{ data, error }` envelope)
- [ ] `/admin` shows the Cloudflare Access login (auth layer intact)
- [ ] Security headers still present: `curl -sSI https://<site-domain>/` shows
      `strict-transport-security`, `x-frame-options`, `x-content-type-options`,
      `referrer-policy`, `permissions-policy` and the CSP header
      (`dist/_headers` ships with the deployment being served)
- [ ] **Record end time** — total elapsed from step 1 must be **<10 minutes**
- [ ] Record the now-live deployment's commit SHA (dashboard) — must equal the
      target chosen in step 5

## Rolling Forward Again

Once the problem is fixed, return to the newest deployment the same way
(⋯ → **Rollback to this deployment** on the newest entry — allowed even when it
is newer than the current one), or simply push the fix to `main` and let the
Git integration build a fresh production deployment. See
`docs/release-process.md` for the forward-fix path.

## Fallback When No Valid Rollback Target Exists

If the only good state is older than the deployment history (or a deployment was
deleted — `wrangler pages deployment delete` exists, and old deployments can be
auto-expired), rebuild the known-good tree instead:

```bash
git fetch --tags
git checkout <known-good-tag>        # e.g. v1.0.0
git revert <bad-commit> --no-edit   # or branch from the tag
# open PR → merge to main → Git integration rebuilds production
```

This path is slower (full build) but still well under 10 minutes for this
site; the tag→deployment mapping is documented in `docs/release-process.md`.

## Deferred Live Test (re-scoped 2026-10-15, developer-approved)

AC1 of Task #022 ("rollback tested once in the dashboard, <10 minutes, site
online throughout") could **not** be executed from the authoring environment:
the Cloudflare Pages project is not reachable from the authenticated wrangler
account (same blocker and evidence as Task #021,
`docs/release-process.md` §Deferred Verification). Re-scope approved by the
developer via question tool (precedent: Task #015).

**Pending manual steps for the developer:**

1. From the correct Cloudflare account, perform the rollback drill above once on
   production (ideally between quiet hours; the drill itself is instant and
   reversible via "rolling forward" again)
2. Use the Post-Rollback Verification Checklist as the drill script; record
   start/end timestamps and the deployment SHAs (before → target → after)
3. Append the drill result (pass + measured duration) as a short follow-up note
   in `changelog.md` under Task #022 or as a new dated note in this file
4. If the drill reveals anything site-specific that differs from this runbook
   (e.g. extra verification steps), update this document in the same commit

## Related Documents

- `docs/release-process.md` — version tagging, tag ↔ deployment mapping,
  redeploy procedure (Task #021)
- `docs/backup-restore-runbook.md` — ticker data restore (Task #026, planned)
- `knowledge.md` §8 — RTO (<1 hour) / RPO (~24 hours), build pipeline design
- Cloudflare docs: `developers.cloudflare.com/pages/configuration/rollbacks`
  (source for the dashboard steps above)
