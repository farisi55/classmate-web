# Two-Stage Load Test Results — Task #024

Phase 7 (Deployment, Server variant) load baseline for the Classmate staging
deployment, executed 2026-10-16. The reusable harness lives at
`scripts/load-test.mjs`; unit tests at `scripts/load-test.test.ts`.

> **Read §5 first if you only read one section.** The staging deployment stopped
> routing `/api/*` to its Pages Functions partway through this session, which
> invalidates the second execution (Run B) and leaves `/api/health` returning
> `200` with the site's HTML. That is an environment incident, not a code defect,
> and it is documented with evidence in §5.

## 1. Target environment

| Item | Value |
| --- | --- |
| Edge target | `https://classmate-web-staging.pages.dev` (staging alias) |
| Platform | Cloudflare Pages + Pages Functions (V8 isolate) `pages-worker--21387479-production`, KV binding `CLASSMATE_KV` |
| Deployment | `6273e437-744f-4b5c-83b3-d86d82ee0826` — Production stage, branch `main`, source commit `8de5096` |
| Edge endpoints exercised | `GET /api/ticker` (KV-backed function) and `GET /` (static HTML, 15-page Astro build) |
| Local target | `http://127.0.0.1:8788` — `wrangler pages dev dist --kv CLASSMATE_KV`, where `/api/ticker` is guaranteed to be the Function |
| Load generator | Single developer workstation (Windows, Node 24), single network path |
| Date | 2026-10-16 |

## 2. Method

- Harness: `scripts/load-test.mjs` — dependency-free (Node built-in `fetch`), so no
  new library enters `knowledge.md` §2.
- Concurrency: exactly `vu` in-flight requests at all times (`vu` async workers,
  each issuing one request at a time) — independent of the runtime's internal pool.
- Timeout: explicit 10 000 ms per request (`AbortSignal.timeout`); a timeout counts
  as an error, never a hang.
- **Cache bypass (worst case):** every request sends `Cache-Control: no-cache`, so
  nothing is served from edge cache — each request reaches the origin/function path.
- **Redirects are not followed** (`redirect: 'manual'`), so a `3xx` surfaces as a
  non-2xx error instead of being silently collapsed into the target's `200`.
- Latency: the full response body is drained before the sample is recorded, so the
  value is the complete client-observed time.
- Percentiles: nearest-rank over all samples in the window (a reported P95 is
  always an actually observed latency).
- Each target is driven for the full duration sequentially, so every target gets a
  clean measurement at the stated VU count.

### 2.1 Which execution counts

| Execution | Target | Valid? | Role |
| --- | --- | --- | --- |
| **Run A** | edge, 10 VU/60 s then 50 VU/120 s | **Yes** | Primary AC evidence (§3, §4) |
| Run B | edge, same settings | **No** | Environment incident record (§5) — `/api/ticker` did not reach the Function |
| Local run | `127.0.0.1:8788`, 10 VU/60 s then 50 VU/120 s | Yes, for the Function code | Independent confirmation that the endpoint handles both stages with zero errors (§6) |

## 3. Stage 1 — Smoke (10 VU / 60 s per target)

### Run A — edge, start `2026-10-16T09:14:36.902Z`, 120.03 s total

| Target | Requests | Errors | Error rate | Throughput | p50 | p90 | **p95** | **p99** | max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /api/ticker` (Function) | 44 913 | 0 | 0 % | 374.19 rps | 11.79 | 18.88 | **22.43 ms** | **34.63 ms** | 370.40 ms |
| `GET /` (static) | 29 205 | 0 | 0 % | 243.32 rps | 18.27 | 27.63 | **32.32 ms** | **46.81 ms** | 1 523.39 ms |
| **Overall** | **74 118** | **0** | **0 %** | **617.51 rps** | — | — | — | — | — |

### Local run — `127.0.0.1:8788`, start `2026-10-16T09:50:27.938Z`, 60.06 s

| Target | Requests | Errors | Error rate | Throughput | p50 | p90 | **p95** | **p99** | max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /api/ticker` (Function) | 13 515 | 0 | 0 % | 225.04 rps | 37.34 | 76.46 | **91.29 ms** | **142.10 ms** | 423.20 ms |

Every response in both Stage 1 runs was HTTP `200`. Latency columns in ms.

## 4. Stage 2 — Capacity (50 VU / 120 s per target)

VU floor per the template rule: `max(initial ≈10, 6-month target <100 × 10% ≈ 10)`
with a floor of 50 → **50 VU** (`simple_mode: false`, so Stage 2 is mandatory).

### Run A — edge, start `2026-10-16T09:16:37.215Z`, 240.09 s total

| Target | Requests | Errors | Error rate | Throughput | p50 | p90 | **p95** | **p99** | max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /api/ticker` (Function) | 286 510 | 0 | 0 % | 1 193.36 rps | 16.65 | 34.86 | **44.13 ms** | **74.30 ms** | 427.20 ms |
| `GET /` (static) | 84 063 | 0 | 0 % | 350.13 rps | 59.27 | 97.42 | **122.90 ms** | **324.63 ms** | 6 968.61 ms |
| **Overall** | **370 573** | **0** | **0 %** | **1 543.49 rps** | — | — | — | — | — |

### Local run — `127.0.0.1:8788`, start `2026-10-16T09:51:28.376Z`, 120.19 s

| Target | Requests | Errors | Error rate | Throughput | p50 | p90 | **p95** | **p99** | max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /api/ticker` (Function) | 12 858 | 0 | 0 % | 106.98 rps | 453.53 | 595.52 | **665.39 ms** | **818.71 ms** | 1 120.98 ms |

Every response in both Stage 2 runs was HTTP `200`. Latency columns in ms.

**Zero `4xx`/`5xx`, zero timeouts and zero network errors** across every run —
444 691 (Run A) + 26 373 (local) + 186 543 (Run B) = **657 607 requests**. Run B is
included because its errors are real even though its measurement is not (§5).

### 4.1 Reading the local numbers correctly

The local figures are a **correctness** confirmation, not a capacity figure: the
same machine serves the Function *and* generates the load, so the two compete for
one CPU. That is why local throughput *falls* from 225.04 rps (10 VU) to
106.98 rps (50 VU) while p95 rises from 91.29 ms to 665.39 ms — adding concurrency
adds contention, not capacity. The local Stage 2 p95 (665.39 ms) therefore does
**not** meet the `knowledge.md` §8 target of P95 < 300 ms and is not evidence
either way about the deployed service; it is evidence that the endpoint returns
`200` for every request at 50 VU for 2 minutes. The edge Run A P95 (22.43 ms and
44.13 ms) is where that target is actually assessed.

## 5. Environment incident — the staging project stopped serving `/api/*`

Mid-session the staging deployment began answering `/api/*` with the static site,
and the second execution (Run B) therefore did not reach the ticker Function.

**Evidence**

1. `pagesFunctionsInvocationsAdaptiveGroups` for the account, hour buckets
   `2026-10-16T07:00Z → 11:00Z`:
   `pages-worker--21387479-production` → **332 762 requests, 0 errors, all in the
   `09:00Z` bucket**, and **none after** (plus a single `07:00Z` request).
2. That count matches Run A plus the warm-up probes almost exactly:
   `/api/ticker` = 44 913 (Stage 1) + 286 510 (Stage 2) = **331 423**, plus 1 081
   probe requests = 332 504 ≈ 332 762. So **Run A's endpoint requests are the
   invocations**.
3. Run B issued **89 539** requests to `/api/ticker`, which do **not** appear in the
   metric — Run B served the static fallback, not the Function.
4. Since ~09:20Z, `GET /api/health` and `GET /api/ticker` both return `200`,
   `Content-Type: text/html`, **23 807 bytes** — the site's home page. An arbitrary
   unknown path (`/this-path-does-not-exist-xyz`) returns the identical
   `200` + 23 807-byte home page, so the project is answering unknown paths with a
   static fallback rather than routing `/api/*` to Functions.
5. Excluded causes: the deployment is unchanged (`6273e437`, 17 h old, no new
   deployment); single-request latency to the deployment stayed healthy
   (~12–20 ms connect, ~45–75 ms TTFB including a fresh TLS handshake); no `429` or
   `Retry-After` headers; local TCP state was clean (`TIME_WAIT` = 87).

**Why it matters — a monitoring hazard**

`GET /api/health` returns **`200` while the API is unreachable**. Any monitor that
checks the status code alone reports the service healthy while every `/api/*` route
is serving HTML. The health check should be validated on its body/schema, not on the
status code. Recorded as a follow-up (§8).

**Not a caching bug.** Before the incident was understood, staging `/api/ticker`
returned `Cache-Control: public, max-age=0, must-revalidate`, which looks like a
contradiction of the `public, max-age=60` the handler sets. It is the same incident:
`max-age=0, must-revalidate` is the static-asset header. The Function's own
`Cache-Control: public, max-age=60` is confirmed on the local instance (§7), so no
caching defect exists in `functions/api/ticker.ts`.

**Cause:** not determined from available tooling. It coincides exactly with this
load test's Function traffic, and `knowledge.md` §8's free-tier context makes a
request-allowance mechanism a plausible explanation, but the observed invocation
count (332 762) is well above the documented 100 000/day Workers + Pages Functions
allowance, so that is a hypothesis to confirm against the account's plan and the
dashboard's Functions counter — not a conclusion. Left as a follow-up.

## 6. Acceptance criteria

- [x] **Stage 1 (10 VU / 60 s) error rate 0 %** against `/api/ticker` and a static
      page. Run A: 0 errors / 74 118 requests, `/api/ticker` at 374.19 rps and `/`
      at 243.32 rps. Local run: 0 errors / 13 515 requests at the Function.
- [x] **Stage 2 (≥ 50 VU / ≥ 2 min) with P95/P99 recorded.** Run A at 50 VU for
      120 s per target: `/api/ticker` P95 **44.13 ms** / P99 **74.30 ms**,
      `/` P95 **122.90 ms** / P99 **324.63 ms**. Local run (Function only):
      P95 665.39 ms / P99 818.71 ms, 0 errors.
- [~] **Stage 2: endpoint-layer memory at end ≤ 120 % of start — re-scoped to N/A
      (developer-approved, 2026-10-16).** The endpoint layer is a Cloudflare Pages
      Function and its isolate memory is not observable — verified live, not assumed:
  - The Pages dataset `pagesFunctionsInvocationsAdaptiveGroups` exists and accepts a
    query, but has **no memory quantile** — `quantiles { memoryUsageBytesP50 }`
    returns `unknown field "memoryUsageBytesP50"`.
  - `workersInvocationsAdaptive`, the dataset the Cloudflare docs name for memory,
    does not include the Pages script — it returns only the unrelated Workers `games`
    and `portfolio-setyorini`.
  - Cloudflare enforces a hard **128 MB per isolate** cap and recycles isolates; a
    Pages Function has no persistent process whose RSS could be sampled. The
    template's start-vs-end memory check is a long-running-server criterion with no
    counterpart for this shape — the same reasoning already applied to the SIGTERM
    graceful-drain criterion in the task list.
- [~] **Stage 2: zero `5xx` during a deploy simulated mid-test — N/A by the AC's own
      condition.** The clause reads "if a deploy is simulated concurrently"; none was
      simulated (deliberately — redeploying staging mid-run risks leaving the
      environment in a partial state for no additional signal at this scale).
      Independently, zero `5xx` were observed anywhere.

## 7. Reproduce

```bash
# 1. Harness unit tests (pure helpers: percentiles, aggregation, arg parsing)
npm run test

# 2. Edge Stage 1 — smoke
npm run test:load -- --base-url https://classmate-web-staging.pages.dev --vu 10 --duration 60 --label stage1

# 3. Edge Stage 2 — capacity
npm run test:load -- --base-url https://classmate-web-staging.pages.dev --vu 50 --duration 120 --label stage2

# 4. Local Function measurement (guaranteed routing to functions/api/ticker.ts)
npm run build
npx wrangler pages dev dist --kv CLASSMATE_KV --port 8788 --ip 127.0.0.1
npm run test:load -- --base-url http://127.0.0.1:8788 --vu 10  --duration 60  --targets=api/ticker --label local-stage1
npm run test:load -- --base-url http://127.0.0.1:8788 --vu 50  --duration 120 --targets=api/ticker --label local-stage2
```

The harness writes the machine-readable JSON report to stdout and a one-line human
summary per target to stderr; it exits non-zero if any request errored.

Windows/Git Bash notes: MSYS rewrites a bare `/api/ticker` argument into a Windows
path, so pass extra targets as `--targets=api/ticker,en` (the leading slash is
normalized back on) or export `MSYS_NO_PATHCONV=1`. `wrangler pages dev` leaves
`workerd` child processes running if only the port listener is stopped — kill the
supervisor PID to release the port.

**Before trusting an edge run, confirm it reached the Function** — the staging
fallback answers `/api/*` with `200` and HTML, so a run can look green while testing
the wrong thing:

```bash
curl -s -o /dev/null -w '%{content_type}\n' https://classmate-web-staging.pages.dev/api/health
# expect: application/json   —  text/html means you are hitting the static fallback
```

## 8. Follow-ups (not part of Task #024)

- **Investigate why the staging project stopped routing `/api/*` to its Functions**
  and confirm the account's plan/request allowance in the Cloudflare dashboard before
  spending further load-test volume against it.
- **Make the health check fail loudly:** `GET /api/health` currently returns `200`
  with HTML when the API is unreachable, so a status-only monitor reports healthy.
  Validate the body/schema, and consider an alert rule.
- Re-run the edge stages once `/api/*` is routed again, and treat a single run's
  throughput as a lower bound rather than a capacity figure.
- Measure the cached static path if a production-realistic HTML/asset profile is
  wanted — a `--bypass-cache` flag would let the same harness record both profiles.
- Revisit the endpoint-memory clause if Cloudflare starts exposing isolate memory for
  Pages Functions.
- Whether the staging project should get a Cloudflare Access application or be removed
  after Phase 7 is still open (flagged in Task #023).

## 9. References

- Workers metrics — Memory usage chart, 128 MB per-isolate limit:
  <https://developers.cloudflare.com/workers/observability/metrics-and-analytics/>
- Memory usage metrics via `workersInvocationsAdaptive`
  (`quantiles.memoryUsageBytesP50 … P999`), 2026-06-30:
  <https://developers.cloudflare.com/changelog/post/2026-06-30-memory-usage-metrics/>
- Pages Functions pricing / daily request allowance:
  <https://developers.cloudflare.com/pages/functions/pricing/>
- Performance constraint (P95 < 300 ms) and staging definition: `knowledge.md` §8.
