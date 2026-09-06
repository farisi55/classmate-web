import { describe, it, expect, vi } from 'vitest';

// Minimal KV namespace mock that satisfies the KVNamespace shape used in the
// handler signature — enough for the paths under test.
function makeKV(readResult: string | Error) {
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
      NonNullable<typeof import('./health').onRequestGet>[0]
    >;

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

  it('returns 500 with clear error when KV binding is missing', async () => {
    const request = new Request('https://example.com/api/health');
    const ctx = {
      request,
      env: { CLASSMATE_KV: undefined as unknown as KVNamespace },
    } as Parameters<NonNullable<typeof import('./health').onRequestGet>[0]>;

    const handler = (await import('./health')).onRequestGet;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      data: null,
      error: { code: 'kv_binding_missing', message: 'KV binding CLASSMATE_KV is not configured.' },
    });
  });
});

// --- GET /api/ticker ---
describe('GET /api/ticker', () => {
  it('returns 500 with clear error when KV binding is missing', async () => {
    const env = { CLASSMATE_KV: undefined as unknown as KVNamespace };
    const request = new Request('https://example.com/api/ticker');
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestGet>[0]
    >;

    const handler = (await import('./ticker')).onRequestGet;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      data: null,
      error: { code: 'kv_binding_missing', message: 'KV binding CLASSMATE_KV is not configured.' },
    });
  });

  it('does not expose internal file paths or stack traces in binding-missing error', async () => {
    const env = { CLASSMATE_KV: undefined as unknown as KVNamespace };
    const request = new Request('https://example.com/api/ticker');
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestGet>[0]
    >;

    const handler = (await import('./ticker')).onRequestGet;
    const response = await handler(ctx);
    const body = await response.json();

    expect(body.error.code).toBe('kv_binding_missing');
    expect(body.error.message).not.toMatch(/\b[C-Z]:\/|\/src\b|\/functions\b|\.ts\b/i);
    expect(Object.keys(body)).toEqual(['data', 'error']);
  });
});

// --- POST /api/admin/ticker ---
describe('POST /api/admin/ticker', () => {
  it('returns 500 with clear error when KV binding is missing (before any other validation)', async () => {
    const env = { CLASSMATE_KV: undefined as unknown as KVNamespace };
    const request = new Request('https://example.com/api/admin/ticker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cf-Access-Jwt-Assertion': 'fake-jwt' },
      body: JSON.stringify({
        data: [{ id: 'x', text_id: 'hi', text_en: 'hi', active: true, priority: 1 }],
      }),
    });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./admin/ticker').onRequestPost>[0]
    >;

    const handler = (await import('./admin/ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      data: null,
      error: { code: 'kv_binding_missing', message: 'KV binding CLASSMATE_KV is not configured.' },
    });
  });
});
