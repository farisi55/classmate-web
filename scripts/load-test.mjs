// Two-stage load-test harness (Task #024, Phase 7 — Deployment, Server variant).
//
// Deliberately dependency-free: it uses Node's built-in global `fetch`, so no
// new library enters knowledge.md §2 (simplicity guard — one call site). The
// same shape as the other scripts/ helpers: pure, exported functions that the
// Vitest suite exercises (scripts/load-test.test.ts), plus a CLI entry point
// that runs only when invoked directly.
//
// Concurrency model: `vu` async workers per target, each issuing one request at
// a time, so in-flight requests == vu exactly — independent of the runtime's
// internal connection pool. Every request carries an explicit timeout.
//
// Usage:
//   node scripts/load-test.mjs --base-url <url> --vu 50 --duration 120 \
//     --targets /api/ticker,/ --label stage2 [--timeout 10000]
//
// Windows/Git Bash: MSYS path conversion rewrites a bare `/api/ticker` argument
// into a Windows path. Pass targets as `--targets=api/ticker,` (a leading slash
// is normalized back on) or export MSYS_NO_PATHCONV=1 first.

import { pathToFileURL } from 'node:url';

/** Default per-request timeout in milliseconds — every outbound call is bounded. */
export const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * @typedef {object} Accumulator
 * @property {number} ok Successful (2xx) requests.
 * @property {number} errors Failed requests (non-2xx, timeout or network).
 * @property {number[]} samples Client-observed latency per successful request.
 * @property {Record<string, number>} statusCounts Error keys → count.
 * @property {string[]} errorSamples First few error keys, for diagnosis.
 */

/**
 * @typedef {object} LatencyStats
 * @property {number} count
 * @property {number|null} min
 * @property {number|null} mean
 * @property {number|null} max
 * @property {number|null} p50
 * @property {number|null} p90
 * @property {number|null} p95
 * @property {number|null} p99
 */

/**
 * @typedef {object} TargetStats
 * @property {number} requests
 * @property {number} ok
 * @property {number} errors
 * @property {number|null} errorRate
 * @property {number} requestsPerSecond
 * @property {Record<string, number>} statusCounts
 * @property {string[]} errorSamples
 * @property {LatencyStats} latencyMs
 */

/**
 * @typedef {object} RunSummary
 * @property {Record<string, TargetStats>} targets
 * @property {{requests: number, ok: number, errors: number, errorRate: number|null, requestsPerSecond: number}} overall
 */

/** Round to two decimals for stable, readable millisecond values. */
function round2(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Nearest-rank percentile over an ascending-sorted sample array — returns null
 * for an empty array. Nearest-rank (not interpolation) is used so a reported
 * P95 is always an actually observed latency.
 */
export function percentile(sortedAscending, p) {
  if (sortedAscending.length === 0) return null;
  if (p <= 0) return round2(sortedAscending[0]);
  if (p >= 100) return round2(sortedAscending[sortedAscending.length - 1]);
  const rank = Math.ceil((p / 100) * sortedAscending.length);
  return round2(sortedAscending[rank - 1]);
}

/**
 * Build latency statistics (count/min/mean/percentiles/max) from raw samples.
 * The percentiles are spelled out as literal keys (not built from a loop) so
 * consumers keep precise types under `astro check`.
 */
export function summarizeLatencies(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, value) => acc + value, 0);
  return {
    count: sorted.length,
    min: sorted.length ? round2(sorted[0]) : null,
    mean: sorted.length ? round2(sum / sorted.length) : null,
    max: sorted.length ? round2(sorted[sorted.length - 1]) : null,
    p50: percentile(sorted, 50),
    p90: percentile(sorted, 90),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

/**
 * Aggregate raw per-target accumulators into the reported shape: request
 * counts, error rate, throughput, status distribution and latency summary.
 */
export function summarizeRun(targets, elapsedSeconds) {
  /** @type {Record<string, TargetStats>} */
  const perTarget = {};
  for (const [path, acc] of Object.entries(targets)) {
    const requests = acc.ok + acc.errors;
    perTarget[path] = {
      requests,
      ok: acc.ok,
      errors: acc.errors,
      errorRate: requests === 0 ? null : round2((acc.errors / requests) * 100),
      requestsPerSecond: elapsedSeconds > 0 ? round2(requests / elapsedSeconds) : 0,
      statusCounts: acc.statusCounts,
      errorSamples: acc.errorSamples,
      latencyMs: summarizeLatencies(acc.samples),
    };
  }

  const totals = Object.values(targets).reduce(
    (acc, t) => ({
      requests: acc.requests + t.ok + t.errors,
      ok: acc.ok + t.ok,
      errors: acc.errors + t.errors,
    }),
    { requests: 0, ok: 0, errors: 0 },
  );

  return {
    targets: perTarget,
    overall: {
      requests: totals.requests,
      ok: totals.ok,
      errors: totals.errors,
      errorRate: totals.requests === 0 ? null : round2((totals.errors / totals.requests) * 100),
      requestsPerSecond: elapsedSeconds > 0 ? round2(totals.requests / elapsedSeconds) : 0,
    },
  };
}

/** Parse `--flag value` / `--flag=value` CLI arguments into a validated options object. */
export function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const eq = token.indexOf('=');
    if (eq !== -1) {
      flags[token.slice(2, eq)] = token.slice(eq + 1);
    } else {
      const next = argv[i + 1];
      flags[token.slice(2)] = next !== undefined && !next.startsWith('--') ? argv[++i] : 'true';
    }
  }

  const baseUrl = flags['base-url'];
  if (!baseUrl) throw new Error('Missing required --base-url <url>');

  const vu = Number(flags.vu ?? 10);
  const duration = Number(flags.duration ?? 60);
  const timeout = Number(flags.timeout ?? DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(vu) || vu < 1) throw new Error('--vu must be a positive number');
  if (!Number.isFinite(duration) || duration < 1)
    throw new Error('--duration must be a positive number of seconds');
  if (!Number.isFinite(timeout) || timeout < 1)
    throw new Error('--timeout must be a positive number of milliseconds');

  // Targets are always absolute URL paths. Leading-slash normalization lets the
  // Windows/Git-Bash invocation `--targets=api/ticker` work, which is the
  // workaround for MSYS path conversion mangling a bare `/api/ticker` argument
  // into `C:/Program Files/Git/api/ticker`.
  const targets = (flags.targets ?? '/api/ticker,/')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('/') ? t : `/${t}`));
  if (targets.length === 0) throw new Error('--targets must list at least one path');

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    targets,
    vu,
    durationSeconds: duration,
    timeoutMs: timeout,
    label: flags.label ?? 'load-test',
  };
}

/**
 * Drive `vu` concurrent workers against one path until the deadline, recording
 * status codes, error samples and client-observed latencies (full response
 * body read, so the number reflects what a real client waits for).
 */
async function runTarget(base, path, options) {
  const { vu, durationMs, timeoutMs } = options;
  const url = `${base}${path}`;
  const deadline = Date.now() + durationMs;
  /** @type {Accumulator} */
  const acc = {
    ok: 0,
    errors: 0,
    samples: [],
    statusCounts: {},
    errorSamples: [],
  };

  // Errors are keyed `kind:detail` (e.g. `http:500`, `network:getaddrinfo ...`)
  // so a failed run is diagnosable from the JSON alone, not just a bare count.
  const recordError = (kind, detail) => {
    acc.errors++;
    const key = detail ? `${kind}:${detail}` : kind;
    acc.statusCounts[key] = (acc.statusCounts[key] ?? 0) + 1;
    if (acc.errorSamples.length < 10) acc.errorSamples.push(key);
  };

  const worker = async () => {
    while (Date.now() < deadline) {
      const started = performance.now();
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(timeoutMs),
          headers: { 'cache-control': 'no-cache' },
          // Do not follow redirects: measuring exactly the requested URL keeps a
          // 3xx visible as a non-2xx error instead of silently collapsing it into
          // the redirect target's 200.
          redirect: 'manual',
        });
        await response.text(); // drain the body so latency includes the full response
        const elapsed = performance.now() - started;
        if (response.ok) {
          acc.ok++;
          acc.samples.push(elapsed);
          acc.statusCounts[String(response.status)] =
            (acc.statusCounts[String(response.status)] ?? 0) + 1;
        } else {
          recordError('http', String(response.status));
        }
      } catch (err) {
        const isTimeout = err && err.name === 'TimeoutError';
        const message = String(err && err.message ? err.message : err)
          .replace(/\s+/g, ' ')
          .slice(0, 160);
        recordError(isTimeout ? 'timeout' : 'network', message);
      }
    }
  };

  await Promise.all(Array.from({ length: vu }, () => worker()));
  return acc;
}

/** Run one stage against every target and return the full machine-readable report. */
export async function runLoad({ baseUrl, targets, vu, durationSeconds, timeoutMs, label }) {
  const startedAt = new Date();
  const stageStart = performance.now();
  /** @type {Record<string, Accumulator>} */
  const accumulators = {};
  for (const path of targets) {
    accumulators[path] = await runTarget(baseUrl, path, {
      vu,
      durationMs: durationSeconds * 1000,
      timeoutMs,
    });
  }
  const elapsedSeconds = (performance.now() - stageStart) / 1000;
  /** @type {RunSummary} */
  const summary = summarizeRun(accumulators, elapsedSeconds);

  return {
    label,
    baseUrl,
    vu,
    durationSeconds,
    timeoutMs,
    startedAt: startedAt.toISOString(),
    elapsedSeconds: round2(elapsedSeconds),
    ...summary,
  };
}

/** CLI entry point — runs the requested stage, prints JSON, exits non-zero on any error. */
export async function main(argv) {
  const options = parseArgs(argv);
  const result = await runLoad(options);

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  for (const [path, stats] of Object.entries(result.targets)) {
    console.warn(
      `[${result.label}] ${path} — ${stats.requests} req in ${result.elapsedSeconds}s ` +
        `(${stats.requestsPerSecond} rps), errors ${stats.errors} (${stats.errorRate ?? 0}%), ` +
        `p95 ${stats.latencyMs.p95}ms, p99 ${stats.latencyMs.p99}ms`,
    );
  }
  return result.overall.errors === 0 ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`load-test failed: ${err.message}`);
      process.exit(2);
    },
  );
}
