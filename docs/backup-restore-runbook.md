# Ticker Backup & Restore Runbook (Incident Procedure)

> Task #026 — Phase 7 Deployment (Server variant)

## Overview

The running-header (ticker) messages live in a **single Cloudflare KV key**,
`ticker:messages`, inside the KV namespace bound as `CLASSMATE_KV`
(`knowledge.md` §5). The key holds a JSON array of `TickerMessage` objects
(`id`, `text_id`, `text_en`, `active`, `priority`, `updated_at`).

Because the whole ticker is one key, a restore is a **single-key overwrite** —
not a per-message merge. There is no partial restore: whatever you write
replaces the entire current ticker state.

This runbook is the counterpart of `docs/rollback-procedure.md`:

| Incident | Correct procedure |
|---|---|
| Bad **code / build** went live | `docs/rollback-procedure.md` (revert the deployment) |
| Bad or **lost ticker content** | **This runbook** (restore from the backup snapshot) |
| Lost admin access | Cloudflare Zero Trust dashboard (Access), not this runbook |

A rollback **never** touches KV data, and a restore **never** touches code,
assets, or deployments. They are independent — see the "does not affect" table
in `docs/rollback-procedure.md`.

## What a Restore Does and Does NOT Affect

| Affected (overwritten) | NOT affected (untouched) |
|---|---|
| KV key `ticker:messages` in the `CLASSMATE_KV` namespace | All site code, assets, and the active deployment |
| The ticker shown in the running header (client-side, via `GET /api/ticker`) | Cloudflare Access applications & policies |
| | Other KV keys in the namespace (there are none today, but the restore only ever writes one key) |
| | Git history, the backup file itself, and the backup workflow |

## Prerequisites

- **`wrangler` authenticated against the account that owns the namespace.**
  Verify with `npx wrangler whoami` — the account ID must match the
  `[[kv_namespaces]] id` in `wrangler.toml`
  (`87b5fe2bd58c4bb38e82008bfac5cd50`). If the ID in `wrangler.toml` is
  wrong or the account differs, you are writing to the wrong namespace —
  stop and reconcile first.
- **A backup snapshot file** — `backups/ticker-messages.json` in this repo
  (committed by the daily workflow, see below). Pick the revision you want
  with `git log --oneline -- backups/ticker-messages.json`.
- **jq** (only for the capture/validation steps) and **curl**.
- **The host to verify against** — staging: `classmate-web-staging.pages.dev`;
  production: `classmate.co.id` (⚠️ see §Known pitfalls — the production domain
  was **not reachable** from the execution environment on 2026-10-21).

## Where the Backup Comes From

`.github/workflows/backup-ticker.yml` runs daily at 02:00 WIB (`0 19 * * *`
UTC) and can also be triggered manually (`workflow_dispatch`). It:

1. `curl`s the protected export endpoint
   `GET /api/admin/ticker-export` with the Access **Service Token** headers
   (`CF-Access-Client-Id` / `CF-Access-Client-Secret`, stored as repository
   secrets), and
2. extracts the `data` field with `jq -r '.data'` into
   `backups/ticker-messages.json`, and
3. commits that file **only if it changed** (idempotent — no empty commits).

The export endpoint returns the **envelope** `{ data, error }`, where `data`
is the parsed KV value (`functions/api/admin/ticker-export.ts`). The workflow's
`jq -r '.data'` therefore re-serialises the messages in jq's canonical
pretty-printed form (2-space indent, LF, trailing newline).

Two consequences worth knowing:

- The committed file is the **canonical jq-formatted array**, not a literal copy
  of whatever bytes sit in KV. When the stored value is itself jq-formatted
  (the current state) the two are byte-identical; if a message was saved from
  `/admin` — which stores compact `JSON.stringify` output — the stored value is
  compact JSON while the committed file is pretty-printed. The two are then
  **JSON-equivalent, not byte-identical**, and JSON equivalence is all the
  restore needs.
- Because `wrangler kv key put --path <file>` writes the file **byte for byte**,
  restoring straight from a CRLF working-tree copy would store CRLF bytes. See
  §Known pitfalls #4.

The workflow keeps **only the latest snapshot** — there is no per-date archive
history. If the ticker changes and the workflow fails before committing, the
last committed snapshot is your restore point.

## Restore Procedure

> Steps 1–3 are read-only. Step 4 is the only mutating step.

### Step 1 — Confirm the incident and the current state

```bash
# What does the site serve right now?
curl -s "https://<host>/api/ticker?cb=$(date +%s)" | jq .
# What is actually in the namespace?
npx wrangler kv key list --binding=CLASSMATE_KV --remote
```

Record what you found. If the key is **absent** from the key list, the ticker
is empty and the site is silently falling back to the static defaults in
`src/data/ticker-defaults.ts` — the site still renders, which is exactly why
this failure can go unnoticed.

### Step 2 — Choose the snapshot

```bash
git log --oneline -- backups/ticker-messages.json
git show <commit>:backups/ticker-messages.json > .scratch/restore-source.json
```

Pick the newest snapshot that predates the incident.

> ⚠️ **Do not restore straight from the working-tree copy on Windows.** This repo
> is checked out with `core.autocrlf=true`, so `backups/ticker-messages.json` on
> disk is **CRLF (948 bytes)** while the committed blob is **LF (922 bytes)**.
> `wrangler kv key put --path` writes the file byte for byte, so the CRLF copy
> would be stored verbatim — and the byte-level check in Step 5 would then
> report a mismatch on a perfectly healthy restore (verified 2026-10-21, see
> §Known pitfalls #4). Materialise the file from git, or strip the CRs:
>
> ```bash
> git show <commit>:backups/ticker-messages.json > .scratch/restore-source.json   # always LF
> # or, from the working tree:
> tr -d '\r' < backups/ticker-messages.json > .scratch/restore-source.json
> ```

### Step 3 — Validate the snapshot BEFORE writing

```bash
# Must be a JSON array
jq -e 'type == "array"' .scratch/restore-source.json > /dev/null && echo "shape OK"

# Must respect the domain rules in knowledge.md §7: 1–10 stored, ≤3 active
jq -e 'length >= 1 and length <= 10' .scratch/restore-source.json > /dev/null && echo "count OK"
jq -e '[.[] | select(.active == true)] | length <= 3' .scratch/restore-source.json > /dev/null && echo "active-count OK"

# Every entry must carry the fields the app requires
jq -e 'all(.[]; has("id") and has("text_id") and has("text_en")
           and has("active") and has("priority"))' .scratch/restore-source.json > /dev/null && echo "fields OK"
```

If any check fails, the snapshot is corrupt or incompatible — **do not write
it**. Fall back to an older snapshot.

### Step 4 — Restore (the only mutating step)

```bash
# Normalise line endings first — the write below stores the file byte for byte,
# and a CRLF source would make Step 5's byte comparison report a false mismatch.
tr -d '\r' < .scratch/restore-source.json > .scratch/restore-source-lf.json

npx wrangler kv key put "ticker:messages" \
  --path .scratch/restore-source-lf.json \
  --binding=CLASSMATE_KV --remote
```

- `--remote` is **mandatory**. Without it `wrangler` writes to the local dev
  store (`.wrangler/state/v3/kv`) and the live site never changes — and the
  command still reports success.
- `--binding=CLASSMATE_KV` resolves the namespace ID from `wrangler.toml`.
  To be unambiguous, use `--namespace-id 87b5fe2bd58c4bb38e82008bfac5cd50`
  instead.
- **No Cloudflare Access token is needed for the write** — `wrangler`
  authenticates with your account. The Access Service Token is only used by
  the *backup workflow* to read the export endpoint.
- **Dashboard alternative** (no CLI): Cloudflare dashboard → Workers & Pages →
  KV → `classmate-web-staging` → Settings → KV Values → Add key →
  name `ticker:messages`, value = the file's contents → Save.

### Step 5 — Verify

```bash
# 1. The stored value matches the snapshot, byte for byte
npx wrangler kv key get "ticker:messages" --binding=CLASSMATE_KV --remote > .scratch/kv-after.json
cmp .scratch/restore-source-lf.json .scratch/kv-after.json && echo "KV matches snapshot (byte-exact)"

# 1b. If that reports a mismatch, check whether it is only line endings.
#     JSON-equivalence is what the site actually needs:
jq -S -c . .scratch/restore-source.json | tr -d '\r' > .scratch/a.json
jq -S -c . .scratch/kv-after.json     | tr -d '\r' > .scratch/b.json
cmp .scratch/a.json .scratch/b.json && echo "KV matches snapshot (content-equal)"

# 2. The API serves the restored messages
curl -s "https://<host>/api/ticker?cb=$(date +%s)" | jq .
```

`cmp` compares **bytes**. A snapshot restored from a CRLF source differs in line
endings only — run check 1b before declaring the restore failed.

The `?cb=<timestamp>` query string is a **cache buster**. `GET /api/ticker`
is served with `Cache-Control: public, max-age=60`, so a plain request can
return the pre-restore value for up to a minute. Without the cache buster a
failed verification can look like a failed restore.

### Step 6 — Post-restore checklist

- [ ] `npx wrangler kv key list --binding=CLASSMATE_KV --remote` shows `ticker:messages`
- [ ] `GET /api/ticker` returns the restored messages (200, `application/json`)
- [ ] `GET /api/health` returns `{"status":"ok","kv_reachable":true}`
- [ ] The running header on the site shows the expected message text
- [ ] `GET /api/admin/ticker-export` still returns 401 **without** a Service
      Token (the restore must not have opened the admin surface)
- [ ] The daily backup workflow still passes on its next run (it will commit a
      new snapshot only if the content differs)

## Reverting a Bad Restore

If you restored the wrong snapshot, restore the correct one — the operation is
idempotent and overwrites the whole key, so there is no partial state to clean
up. Re-run Steps 2–5 with a different snapshot.

## Known Pitfalls (found during the 2026-10-21 drill)

1. **KV is eventually consistent (~60 s).** A write is visible in one region
   before others. The API may briefly serve the old value; poll for up to
   ~90 s before declaring the restore failed. Do not "fix" it by writing again.
2. **The edge cache adds up to 60 s on top of that.** Always use the
   `?cb=` cache buster when verifying, and prefer a plain (non-cache-busted)
   request for the final "the visitor sees it" check, after the cache TTL has
   expired.
3. **`wrangler kv key put` without `--remote` silently writes to the local
   dev store.** This is the single most likely way to "restore" and see no
   change.
4. **CRLF vs LF — both directions.**
   - *Capture side:* `jq` on Windows emits CRLF; the workflow's
     `ubuntu-latest` runner emits LF. A locally captured snapshot therefore
     differs from a workflow-committed one by line endings only — JSON parsing
     and the restore are unaffected, but the git diff is noisy. Normalize with
     `jq -r '.data' file.json | tr -d '\r' > backups/ticker-messages.json`
     before committing a locally captured snapshot.
   - *Checkout side:* the repo is cloned with `core.autocrlf=true`, so
     `backups/ticker-messages.json` **on disk is CRLF (948 bytes)** even though
     the committed blob is LF (922 bytes). Verified 2026-10-21: `wrangler kv key
     put --path` stores the file's bytes verbatim, so restoring from the
     working-tree copy stores CRLF and makes Step 5's byte-level `cmp` report a
     mismatch on a healthy restore. Materialise the file from git (`git show
     <commit>:backups/ticker-messages.json > ...`) or strip the CRs first —
     Step 4 now does the strip for you.
5. **The backup workflow targets the production domain**
   (`https://classmate.co.id/api/admin/ticker-export`). That domain did not
   resolve/reach from the execution environment on 2026-10-21, so the
   scheduled workflow cannot currently populate a snapshot on its own — the
   committed `backups/ticker-messages.json` was captured manually with
   `wrangler kv key get`, which returns the identical bytes. Reconcile the
   workflow target before relying on the automated path.
6. **A restore is a full overwrite.** There is no merge and no per-message
   delete. If you only want to change one message, edit it in `/admin`
   (which saves the whole array) rather than restoring.

## Drill Record — 2026-10-21 (staging)

Executed end-to-end against the staging namespace and site
(`classmate-web-staging.pages.dev`, namespace `87b5fe2b…`). Full transcript in
`changelog.md`, Task #026 entry.

| # | Step | Command | Result |
|---|---|---|---|
| 0 | Baseline | `wrangler kv key list --binding=CLASSMATE_KV --remote` | `[]` — key absent, site served `{"data":[],"error":null}` from static defaults |
| 1 | Seed | `wrangler kv key put "ticker:messages" --path <seed> --binding=CLASSMATE_KV --remote` | 3 messages stored; `GET /api/ticker` → 3 messages |
| 2 | Capture | `wrangler kv key get … \| jq -r '.data'` | `backups/ticker-messages.json` — 922 bytes, **byte-identical** to the stored KV value |
| 3 | Simulate loss | `wrangler kv key delete "ticker:messages" --binding=CLASSMATE_KV --remote` | key list `[]`; `GET /api/ticker` → `{"data":[],"error":null}` |
| 4 | Restore | `wrangler kv key put "ticker:messages" --path backups/ticker-messages.json --binding=CLASSMATE_KV --remote` | key written |
| 5 | Verify | `GET /api/ticker?cb=…` | **exact match with the snapshot on the first poll (t+0.1 s)** — 3 messages, `error: null` |
| 6 | Confirm storage | `wrangler kv key get …` | 922 bytes, byte-exact match with the snapshot |
| 7 | Health | `GET /api/health` | `{"status":"ok","kv_reachable":true}` |
| 8 | Admin surface | `GET /api/admin/ticker-export` and `POST /api/admin/ticker` without credentials | `401` both — the restore did not open the admin surface |
| 9 | CRLF probe | restore from a CRLF copy of the same snapshot | KV stored **948 CRLF bytes**; Step 5's byte-level `cmp` reported a mismatch although the JSON was equivalent → pitfall #4, Step 2 and Step 5 corrected |
| 10 | Restore canonical | `wrangler kv key put … --path <LF snapshot>` | KV back to **922 bytes, byte-identical to the committed blob**; `GET /api/ticker` → 3 messages, `/api/health` → ok |

The drill seeded the ticker with the site's own default messages
(`src/data/ticker-defaults.ts`) so that the visible running header on staging
was **unchanged** by the test — the drill exercised the mechanism without
changing what a visitor sees.

## Related Documents

- `docs/rollback-procedure.md` — deployment rollback (the other half of the
  incident response path)
- `docs/release-process.md` — release tagging and redeploy
- `docs/access-setup.md` — Cloudflare Access applications and the Service
  Token used by the backup workflow
- `knowledge.md` §5 (API & data contracts), §7 (domain rules), §8 (backup
  strategy, RPO/RTO)
