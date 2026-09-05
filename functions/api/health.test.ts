import { describe, it, expect, vi } from 'vitest';

// Minimal KV namespace mock that satisfies the KVNamespace shape used in the
// handler signature — enough for the two paths under test.
function makeKV(
  readResult: Parameters<KVNamespace['get']>[1] extends undefined ? 'ok' | Error : string | Error,
) {
  return {
    get: vi.fn(async () => {
      if (readResult instanceof Error) throw readResult;
      return readResult;
    }),
  } as unknown as KVNamespace;
}

describe('GET /api/health', () => {
  it('returns 200 with { status: "ok", kv_reachable: true } when KV is reachable', async () => {
    const env = { CLASSMATE_KV: makeKV('[]') };
    const request = new Request('https://example.com/api/health');
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./health').onRequestGet>
    >[0];

    const handler = (await import('./health')).onRequestGet;
    const response = await handler(ctx);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const body = await response.json();
    expect(body).toEqual({ status: 'ok', kv_reachable: true });
  });

  it('returns 200 with { status: "degraded", kv_reachable: false } when KV is unreachable', async () => {
    const env = { CLASSMATE_KV: makeKV(new Error('KV connection refused')) };
    const request = new Request('https://example.com/api/health');
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./health').onRequestGet>[0]
    >;

    const handler = (await import('./health')).onRequestGet;
    const response = await handler(ctx);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const body = await response.json();
    expect(body).toEqual({ status: 'degraded', kv_reachable: false });
  });

  it('does not expose internal error details in degraded response', async () => {
    const env = { CLASSMATE_KV: makeKV(new Error('failed to connect to 10.0.0.4:8080')) };
    const request = new Request('https://example.com/api/health');
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./health').onRequestGet>[0]
    >;

    const handler = (await import('./health')).onRequestGet;
    const response = await handler(ctx);
    const body = await response.json();

    // Error shapes must not leak internal details — only the public envelope.
    expect(Object.keys(body)).toEqual(['status', 'kv_reachable']);
    expect(body).not.toHaveProperty('error');
    expect(body).not.toHaveProperty('stack');
    expect(body).not.toHaveProperty('message');
  });
});
