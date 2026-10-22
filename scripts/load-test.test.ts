import { describe, expect, it } from 'vitest';

// Unit tests for the load-test harness (Task #024). Only the pure, deterministic
// helpers are covered here — latency math, aggregation and CLI parsing — so the
// suite is isolated (no network, no timers, no shared state). The network path
// itself (`runLoad`) is verified by actually running the harness against the
// staging deployment, not by a mock.

import {
  DEFAULT_TIMEOUT_MS,
  parseArgs,
  percentile,
  summarizeLatencies,
  summarizeRun,
} from './load-test.mjs';

describe('percentile', () => {
  it('returns null for an empty sample set', () => {
    expect(percentile([], 95)).toBeNull();
  });

  it('returns the only sample for a single-element set', () => {
    expect(percentile([42], 50)).toBe(42);
    expect(percentile([42], 99)).toBe(42);
  });

  it('clamps to min/max at the 0 and 100 bounds', () => {
    expect(percentile([1, 2, 3], 0)).toBe(1);
    expect(percentile([1, 2, 3], 100)).toBe(3);
  });

  it('uses nearest-rank so a reported percentile is an observed value', () => {
    const samples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentile(samples, 50)).toBe(5);
    expect(percentile(samples, 90)).toBe(9);
    expect(percentile(samples, 95)).toBe(10);
    expect(percentile(samples, 99)).toBe(10);
  });
});

describe('summarizeLatencies', () => {
  it('reports nulls for an empty sample set', () => {
    const stats = summarizeLatencies([]);
    expect(stats.count).toBe(0);
    expect(stats.min).toBeNull();
    expect(stats.mean).toBeNull();
    expect(stats.p95).toBeNull();
    expect(stats.max).toBeNull();
  });

  it('computes count/min/mean/max and percentiles from raw samples', () => {
    const stats = summarizeLatencies([40, 10, 30, 20]); // unsorted on purpose
    expect(stats.count).toBe(4);
    expect(stats.min).toBe(10);
    expect(stats.mean).toBe(25);
    expect(stats.max).toBe(40);
    expect(stats.p50).toBe(20);
    expect(stats.p90).toBe(40);
    expect(stats.p95).toBe(40);
    expect(stats.p99).toBe(40);
  });
});

describe('summarizeRun', () => {
  const targets = {
    '/api/ticker': {
      ok: 100,
      errors: 0,
      samples: [1, 2],
      statusCounts: { '200': 100 },
      errorSamples: [],
    },
    '/': {
      ok: 90,
      errors: 10,
      samples: [3],
      statusCounts: { '200': 90, '500': 10 },
      errorSamples: ['http:500'],
    },
  };

  it('computes per-target error rate and throughput', () => {
    const { targets: perTarget } = summarizeRun(targets, 10);
    expect(perTarget['/api/ticker'].requests).toBe(100);
    expect(perTarget['/api/ticker'].errorRate).toBe(0);
    expect(perTarget['/api/ticker'].requestsPerSecond).toBe(10);
    expect(perTarget['/'].requests).toBe(100);
    expect(perTarget['/'].errorRate).toBe(10);
    expect(perTarget['/'].requestsPerSecond).toBe(10);
  });

  it('aggregates overall totals across targets', () => {
    const { overall } = summarizeRun(targets, 10);
    expect(overall.requests).toBe(200);
    expect(overall.ok).toBe(190);
    expect(overall.errors).toBe(10);
    expect(overall.errorRate).toBe(5);
    expect(overall.requestsPerSecond).toBe(20);
  });

  it('reports a null error rate rather than dividing by zero when nothing ran', () => {
    const empty = {
      '/api/ticker': { ok: 0, errors: 0, samples: [], statusCounts: {}, errorSamples: [] },
    };
    const { overall } = summarizeRun(empty, 0);
    expect(overall.errorRate).toBeNull();
    expect(overall.requestsPerSecond).toBe(0);
  });
});

describe('parseArgs', () => {
  it('applies defaults and splits comma-separated targets', () => {
    const options = parseArgs([
      '--base-url',
      'https://example.pages.dev',
      '--targets',
      '/api/ticker,/',
    ]);
    expect(options.baseUrl).toBe('https://example.pages.dev');
    expect(options.targets).toEqual(['/api/ticker', '/']);
    expect(options.vu).toBe(10);
    expect(options.durationSeconds).toBe(60);
    expect(options.timeoutMs).toBe(DEFAULT_TIMEOUT_MS);
    expect(options.label).toBe('load-test');
  });

  it('accepts explicit values and the --flag=value form', () => {
    const options = parseArgs([
      '--base-url=https://example.pages.dev/',
      '--vu',
      '50',
      '--duration',
      '120',
      '--timeout',
      '5000',
      '--label',
      'stage2',
    ]);
    expect(options.baseUrl).toBe('https://example.pages.dev'); // trailing slash stripped
    expect(options.vu).toBe(50);
    expect(options.durationSeconds).toBe(120);
    expect(options.timeoutMs).toBe(5000);
    expect(options.label).toBe('stage2');
  });

  it('normalizes target paths that lack a leading slash (Git Bash workaround)', () => {
    const options = parseArgs(['--base-url', 'https://x.pages.dev', '--targets', 'api/ticker,en']);
    expect(options.targets).toEqual(['/api/ticker', '/en']);
  });

  it('rejects a missing base URL', () => {
    expect(() => parseArgs([])).toThrow(/--base-url/);
  });

  it('rejects a non-positive VU or duration', () => {
    expect(() => parseArgs(['--base-url', 'https://x.pages.dev', '--vu', '0'])).toThrow(/--vu/);
    expect(() => parseArgs(['--base-url', 'https://x.pages.dev', '--duration', '0'])).toThrow(
      /--duration/,
    );
  });
});
