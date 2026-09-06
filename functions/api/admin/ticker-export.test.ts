import { describe, it, expect, vi } from 'vitest';

// KV namespace mock with get() method
function makeKV(mockData: string | null = null) {
  return {
    get: vi.fn(async () => mockData),
  } as unknown as KVNamespace;
}

function jsonErrorBody(code: string, message: string) {
  return { data: null, error: { code, message } };
}

function makeGetRequest(
  clientId: string | null = 'test-client-id',
  clientSecret: string | null = 'test-client-secret',
) {
  const headers: Record<string, string> = {};
  if (clientId) headers['CF-Access-Client-Id'] = clientId;
  if (clientSecret) headers['CF-Access-Client-Secret'] = clientSecret;

  return new Request('https://example.com/api/admin/ticker-export', {
    method: 'GET',
    headers,
  });
}

describe('GET /api/admin/ticker-export', () => {
  // --- Success cases ---

  it('returns KV data as-is when key exists', async () => {
    const mockTickerData = [
      { id: 'promo-1', text_id: 'Promosi 1', text_en: 'Promotion 1', active: true, priority: 1 },
      { id: 'promo-2', text_id: 'Promosi 2', text_en: 'Promotion 2', active: false, priority: 2 },
    ];
    const env = { CLASSMATE_KV: makeKV(JSON.stringify(mockTickerData)) };
    const request = makeGetRequest();
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker-export').onRequestGet>[0]
    >;

    const handler = (await import('./ticker-export')).onRequestGet;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: mockTickerData, error: null });
    expect(env.CLASSMATE_KV.get).toHaveBeenCalledTimes(1);
    expect(env.CLASSMATE_KV.get).toHaveBeenCalledWith('ticker:messages');
  });

  it('returns empty array when KV key does not exist', async () => {
    const env = { CLASSMATE_KV: makeKV(null) };
    const request = makeGetRequest();
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker-export').onRequestGet>[0]
    >;

    const handler = (await import('./ticker-export')).onRequestGet;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: [], error: null });
    expect(env.CLASSMATE_KV.get).toHaveBeenCalledTimes(1);
  });

  it('returns data even with invalid JSON in KV (should not happen, but handles gracefully)', async () => {
    const env = { CLASSMATE_KV: makeKV('not valid json') };
    const request = makeGetRequest();
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker-export').onRequestGet>[0]
    >;

    const handler = (await import('./ticker-export')).onRequestGet;
    const response = await handler(ctx);
    const body = await response.json();

    // JSON.parse error should result in 500 error response
    expect(response.status).toBe(500);
    expect(body).toEqual(jsonErrorBody('ticker_read_failed', 'Could not read ticker messages.'));
    expect(env.CLASSMATE_KV.get).toHaveBeenCalledTimes(1);
  });

  // --- Access Service Token auth ---

  it('rejects request without CF-Access-Client-Id header', async () => {
    const env = { CLASSMATE_KV: makeKV('[]') };
    const request = makeGetRequest(null, 'secret'); // No client ID
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker-export').onRequestGet>[0]
    >;

    const handler = (await import('./ticker-export')).onRequestGet;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual(
      jsonErrorBody(
        'unauthorized',
        'This endpoint must be placed behind Cloudflare Access Service Token.',
      ),
    );
    expect(env.CLASSMATE_KV.get).not.toHaveBeenCalled();
  });

  it('rejects request without CF-Access-Client-Secret header', async () => {
    const env = { CLASSMATE_KV: makeKV('[]') };
    const request = makeGetRequest('client-id', null); // No client secret
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker-export').onRequestGet>[0]
    >;

    const handler = (await import('./ticker-export')).onRequestGet;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual(
      jsonErrorBody(
        'unauthorized',
        'This endpoint must be placed behind Cloudflare Access Service Token.',
      ),
    );
    expect(env.CLASSMATE_KV.get).not.toHaveBeenCalled();
  });

  it('rejects request without any Access headers', async () => {
    const env = { CLASSMATE_KV: makeKV('[]') };
    const request = makeGetRequest(null, null); // No headers at all
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker-export').onRequestGet>[0]
    >;

    const handler = (await import('./ticker-export')).onRequestGet;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual(
      jsonErrorBody(
        'unauthorized',
        'This endpoint must be placed behind Cloudflare Access Service Token.',
      ),
    );
    expect(env.CLASSMATE_KV.get).not.toHaveBeenCalled();
  });

  // --- KV binding missing ---

  it('returns 500 when CLASSMATE_KV binding is missing', async () => {
    const env = { CLASSMATE_KV: undefined as unknown as KVNamespace };
    const request = makeGetRequest();
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker-export').onRequestGet>[0]
    >;

    const handler = (await import('./ticker-export')).onRequestGet;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual(
      jsonErrorBody('kv_binding_missing', 'KV binding CLASSMATE_KV is not configured.'),
    );
  });

  // --- KV read failure ---

  it('handles KV.get() throwing an error', async () => {
    const kv = makeKV();
    vi.mocked(kv.get).mockRejectedValueOnce(new Error('KV timeout'));
    const env = { CLASSMATE_KV: kv };
    const request = makeGetRequest();
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker-export').onRequestGet>[0]
    >;

    const handler = (await import('./ticker-export')).onRequestGet;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual(jsonErrorBody('ticker_read_failed', 'Could not read ticker messages.'));
    expect(env.CLASSMATE_KV.get).toHaveBeenCalledTimes(1);
  });

  // --- Auth check precedes KV binding check (defense in depth) ---

  it('checks Access headers before checking KV binding', async () => {
    // Even with missing KV binding, should fail with 401 first if no auth headers
    const env = { CLASSMATE_KV: undefined as unknown as KVNamespace };
    const request = makeGetRequest(null, null); // No auth headers
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker-export').onRequestGet>[0]
    >;

    const handler = (await import('./ticker-export')).onRequestGet;
    const response = await handler(ctx);
    const body = await response.json();

    // Should be 401 (unauthorized), not 500 (kv_binding_missing)
    expect(response.status).toBe(401);
    expect(body).toEqual(
      jsonErrorBody(
        'unauthorized',
        'This endpoint must be placed behind Cloudflare Access Service Token.',
      ),
    );
  });
});
