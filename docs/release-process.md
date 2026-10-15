# Release Process — Version Tagging & Redeploy

> Task #021 — Phase 7 Deployment (Server variant)

## Overview

This document describes how Classmate Indonesia releases are versioned with git
tags, how tags map to Cloudflare Pages deployments, and how to redeploy a
previous version. Versioning follows the lightweight semver strategy in
`knowledge.md` §7: `package.json` is the single source of truth for the version,
and git tags mirror it as `vX.Y.Z`.

## Versioning Rules

- **Source of truth:** `package.json` `"version"` field (currently `1.0.0`)
- **Tag format:** `vX.Y.Z` (e.g. `v1.0.0`), lightweight-or-annotated release tag
  created on the commit being released
- **When to bump:** patch for fixes/content, minor for features, major for
  breaking redesigns — bump `package.json` in the same task/PR that carries the
  change, then tag after merge
- **Tag scope:** tags are created on the `dev` branch state (this loop never
  touches `main`; promoting `dev` → `main` is a separate manual PR). The tagged
  commit is an ancestor of any later `dev` state, so a tag always identifies an
  exact, recoverable tree

## Creating a Release Tag

```bash
# 1. Confirm package.json version matches the release you intend
node -p "require('./package.json').version"    # e.g. 1.0.0

# 2. Create the annotated tag on the exact commit to release
git tag -a v1.0.0 -m "Release v1.0.0 — <summary of state>"

# 3. Push the tag to origin so it is visible to the team and to deployment tooling
git push origin v1.0.0

# 4. Verify
git tag --list          # v1.0.0 present
git show v1.0.0 --stat  # commit + tree match expectations
```

## How Tags Map to Cloudflare Pages Deployments

- Cloudflare Pages Git integration builds on **branch pushes**, not on tag
  pushes: push to the production branch (`main`) → production deployment;
  push to any other branch / PR → preview deployment
- Therefore a tag identifies the *commit* of a release; the corresponding
  deployment is the Pages deployment whose **commit SHA** equals the tag's
  commit (`git rev-parse v1.0.0`)
- **Verify a tag is deployed:** Cloudflare Dashboard → Workers & Pages →
  `classmate-web` → **Deployments** → open the deployment → compare its commit
  SHA with `git rev-parse vX.Y.Z`. Via API:
  `GET /accounts/{account_id}/pages/projects/classmate-web/deployments` and
  match `result[].deployment_trigger.metadata.commit_hash`

## Redeploy a Previous Version (<10 minutes target)

Two supported paths, in preference order:

1. **Dashboard redeploy/rollback (preferred, target <10 minutes):**
   1. Cloudflare Dashboard → Workers & Pages → `classmate-web` → **Deployments**
   2. Locate the deployment whose commit SHA matches the previous release tag
   3. Click **… → Rollback to this deployment** (immediate, site stays online —
      Cloudflare serves the previous build's assets atomically, no downtime)
   4. Record start/end timestamps; total elapsed must be <10 minutes
   5. Verify the live site: `GET /api/health` → `{ status: "ok" }` and a spot
      check of the homepage
2. **Git revert + push:** if the exact deployment entry is no longer listed,
   revert to the tag's tree and push so Pages rebuilds it:
   `git revert <bad-commit>` (or `git checkout v1.0.0 -- .`) → commit → PR →
   merge. Build time dominates; still well under 10 minutes for this site

A dedicated rollback runbook (step-by-step for incidents, including rollback of
a full release rather than a single deployment) is planned in
`docs/rollback-procedure.md` (Task #022).

## Deferred Verification (re-scoped 2026-10-15, developer-approved)

The two acceptance criteria of Task #021 that require **live dashboard access**
were re-scoped to the developer during execution (explicit approval via
question tool, precedent: Task #015 re-scope). Reason: from the executing
environment the project's Cloudflare Pages project is **not reachable** —
findings verified 2026-10-15:

| Check | Result |
|---|---|
| `wrangler whoami` | authenticated to account `26c246cbc90a170778d9db754e035e1c` (`pages:write` scope) |
| `GET /accounts/26c246…/pages/projects` | `total_count: 0` — no Pages projects on this account |
| `wrangler pages deployment list --project-name classmate-web` | error `8000007: Project not found` |
| `https://classmate-web.pages.dev` (site URL in `astro.config.mjs`) | HTTP 200 but serves an unrelated site: `<title>Classmate Test - Your Study Companion</title>` |
| `https://classmate.co.id` (custom domain, backup target) | DNS does not resolve from the executing environment |

**Pending manual steps for the developer (from the correct Cloudflare account):**

1. Confirm which Cloudflare account hosts the project, then
   `wrangler login` to it (or export `CLOUDFLARE_API_TOKEN` with Pages read
   + write scopes)
2. Create/confirm the release tag deployment: verify the production (or
   preview) deployment SHA matches `git rev-parse v1.0.0`
3. Run the redeploy-from-previous-tag timing test once (target <10 minutes,
   site online throughout) and record the result in `changelog.md` Task #021
   notes or a follow-up entry
4. Reconcile `astro.config.mjs` `site:` URL and `docs/web-analytics.md`
   references if the real deployment URL differs from
   `classmate-web.pages.dev`
5. Confirm DNS for `classmate.co.id` (used by the daily backup workflow)

## Related Documents

- `docs/rollback-procedure.md` — incident rollback runbook (Task #022, planned)
- `docs/access-setup.md` — Cloudflare Access auth for admin/backup endpoints
- `knowledge.md` §7 / §8 — versioning strategy, build pipeline, RTO/RPO
