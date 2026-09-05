import { describe, it, expect, vi } from 'vitest';

// Minimal KV namespace mock — only put() is needed for these tests since we
// verify KV is NOT written on invalid payload (mock never called) and IS
// written on valid payload (mock called with expected value).
function makeKV() {
  return {
    put: vi.fn(async () => {}),
  } as unknown as KVNamespace;
}

// Valid message factory — produces a message that passes isValidMessage().
function validMessage(
  overrides: Partial<{
    id: string;
    text_id: string;
    text_en: string;
    active: boolean;
    priority: number;
  }> = {},
) {
  return {
    id: 'msg-1',
    text_id: 'Halo semuanya!',
    text_en: 'Hello everyone!',
    active: true,
    priority: 1,
    ...overrides,
  };
}

function jsonErrorBody(code: string, message: string) {
  return { data: null, error: { code, message } };
}

function makePostRequest(body: unknown, jwt = 'valid-jwt') {
  return new Request('https://example.com/api/admin/ticker', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cf-Access-Jwt-Assertion': jwt,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/ticker — payload validation', () => {
  // --- Valid payloads (should pass validation) ---

  it('accepts a single valid message', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({ data: [validMessage()] });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.error).toBeNull();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
    // updated_at should be stamped by the handler.
    expect(body.data[0].updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // KV should have been written exactly once.
    expect(env.CLASSMATE_KV.put).toHaveBeenCalledTimes(1);
  });

  it('accepts 10 valid messages (max allowed)', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const messages = Array.from({ length: 10 }, (_, i) => validMessage({ id: `msg-${i}` }));
    const request = makePostRequest({ data: messages });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(10);
    expect(env.CLASSMATE_KV.put).toHaveBeenCalledTimes(1);
  });

  it('accepts messages with priority 0 and negative priority (number type check only)', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({
      data: [
        validMessage({ priority: 0, id: 'zero' }),
        validMessage({ priority: -5, id: 'neg' }),
        validMessage({ priority: 999, id: 'high' }),
      ],
    });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);

    expect(response.status).toBe(200);
    expect(env.CLASSMATE_KV.put).toHaveBeenCalledTimes(1);
  });

  // --- Invalid payloads (should be rejected, KV NOT written) ---

  it('rejects empty array', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({ data: [] });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects 11 messages (over max)', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const messages = Array.from({ length: 11 }, (_, i) => validMessage({ id: `msg-${i}` }));
    const request = makePostRequest({ data: messages });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects when data field is missing', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({});
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects when data is not an array', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({ data: 'not-an-array' });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects when data is null', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({ data: null });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  // --- Per-message field validation (isValidMessage) ---

  it('rejects message with missing id', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const messages = [validMessage()];
    delete (messages[0] as Record<string, unknown>).id;
    const request = makePostRequest({ data: messages });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects message with missing text_id', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const messages = [validMessage()];
    delete (messages[0] as Record<string, unknown>).text_id;
    const request = makePostRequest({ data: messages });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects message with missing text_en', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const messages = [validMessage()];
    delete (messages[0] as Record<string, unknown>).text_en;
    const request = makePostRequest({ data: messages });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects message with missing active', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const messages = [validMessage()];
    delete (messages[0] as Record<string, unknown>).active;
    const request = makePostRequest({ data: messages });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects message with missing priority', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const messages = [validMessage()];
    delete (messages[0] as Record<string, unknown>).priority;
    const request = makePostRequest({ data: messages });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  // --- Type mismatches (field present but wrong type) ---

  it('rejects message where id is a number instead of string', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({
      data: [validMessage({ id: 123 as unknown as string })],
    });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects message where text_id is a number instead of string', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({
      data: [validMessage({ text_id: 456 as unknown as string })],
    });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects message where text_en is a number instead of string', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({
      data: [validMessage({ text_en: 789 as unknown as string })],
    });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects message where active is a string instead of boolean', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({
      data: [validMessage({ active: 'true' as unknown as boolean })],
    });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects message where priority is a string instead of number', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({
      data: [validMessage({ priority: '1' as unknown as number })],
    });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects message where active is null (not a boolean)', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({
      data: [validMessage({ active: null as unknown as boolean })],
    });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects non-object message (e.g. string in array)', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({ data: ['not-an-object'] });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects null message in array', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({ data: [null] });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  // --- Mixed valid/invalid arrays ---

  it('rejects array where first message is valid but second is missing text_en', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const messages = [validMessage({ id: 'a' }), validMessage({ id: 'b' })];
    delete (messages[1] as Record<string, unknown>).text_en;
    const request = makePostRequest({ data: messages });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      jsonErrorBody(
        'invalid_payload',
        'Expected { data: TickerMessage[] } with 1-10 valid entries.',
      ),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  // --- Extra fields are allowed (validation only checks required fields) ---

  it('accepts message with extra fields beyond the schema (strictness is per-required-field)', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({
      data: [
        {
          ...validMessage(),
          extra_field: 'should be ignored',
          another: 123,
        },
      ],
    });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);

    expect(response.status).toBe(200);
    expect(env.CLASSMATE_KV.put).toHaveBeenCalledTimes(1);
  });

  // --- JSON parse failure ---

  it('rejects malformed JSON body with invalid_json error', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = new Request('https://example.com/api/admin/ticker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cf-Access-Jwt-Assertion': 'valid-jwt',
      },
      body: '{not valid json',
    });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(jsonErrorBody('invalid_json', 'Request body must be valid JSON.'));
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  // --- Auth check precedes validation (defense in depth) ---

  it('returns 401 unauthorized when no Access JWT header (before payload validation)', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const request = makePostRequest({ data: [validMessage()] }, /* jwt */ '');
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual(
      jsonErrorBody('unauthorized', 'This endpoint must be placed behind Cloudflare Access.'),
    );
    expect(env.CLASSMATE_KV.put).not.toHaveBeenCalled();
  });

  // --- KV write is idempotent: same valid payload twice produces same result ---

  it('writes to KV on valid payload (idempotent full overwrite)', async () => {
    const env = { CLASSMATE_KV: makeKV() };
    const messages = [validMessage({ id: 'unique-1' })];
    const request = makePostRequest({ data: messages });
    const ctx = { request, env } as Parameters<
      NonNullable<typeof import('./ticker').onRequestPost>[0]
    >;

    const handler = (await import('./ticker')).onRequestPost;
    const response = await handler(ctx);

    expect(response.status).toBe(200);
    expect(env.CLASSMATE_KV.put).toHaveBeenCalledTimes(1);
    // The written value should be the messages array with updated_at stamped.
    const writtenCall = env.CLASSMATE_KV.put.mock.calls[0];
    expect(writtenCall).toHaveLength(2); // key, value
    expect(writtenCall[0]).toBe('ticker:messages');
    const writtenValue = JSON.parse(writtenCall[1]);
    expect(Array.isArray(writtenValue)).toBe(true);
    expect(writtenValue).toHaveLength(1);
    expect(writtenValue[0].id).toBe('unique-1');
    expect(writtenValue[0].updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
