// POST /api/admin/ticker — writes the "ticker:messages" KV key.
// Auth is NOT implemented here: this path must be placed behind Cloudflare
// Access at the Cloudflare dashboard level (Zero Trust → Access → Applications
// → protect /admin/* and /api/admin/*), per knowledge.md §3 architectural
// decision "Cloudflare Access over custom auth". This handler still checks
// for the Access JWT header as a defense-in-depth belt-and-braces guard —
// it does NOT verify the signature itself (that's what Access is for); a
// request with no Access JWT at all could only reach here if Access wasn't
// configured, in which case we fail closed.

interface Env {
  CLASSMATE_KV: KVNamespace;
}

interface TickerMessage {
  id: string;
  text_id: string;
  text_en: string;
  active: boolean;
  priority: number;
  updated_at?: string;
}

function jsonError(code: string, message: string, status: number): Response {
  return new Response(JSON.stringify({ data: null, error: { code, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isValidMessage(m: unknown): m is TickerMessage {
  if (typeof m !== 'object' || m === null) return false;
  const msg = m as Record<string, unknown>;
  return (
    typeof msg.id === 'string' &&
    typeof msg.text_id === 'string' &&
    typeof msg.text_en === 'string' &&
    typeof msg.active === 'boolean' &&
    typeof msg.priority === 'number'
  );
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Fail closed if Cloudflare Access hasn't been put in front of this route.
  if (!request.headers.get('Cf-Access-Jwt-Assertion')) {
    return jsonError('unauthorized', 'This endpoint must be placed behind Cloudflare Access.', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('invalid_json', 'Request body must be valid JSON.', 400);
  }

  const data = (body as { data?: unknown[] })?.data;
  if (!Array.isArray(data) || data.length === 0 || data.length > 10 || !data.every(isValidMessage)) {
    return jsonError('invalid_payload', 'Expected { data: TickerMessage[] } with 1-10 valid entries.', 400);
  }

  const withTimestamp: TickerMessage[] = data.map((m) => ({ ...m, updated_at: new Date().toISOString() }));

  try {
    // Idempotent full overwrite (knowledge.md §7 domain rule) — safe to retry.
    await env.CLASSMATE_KV.put('ticker:messages', JSON.stringify(withTimestamp));
    return new Response(JSON.stringify({ data: withTimestamp, error: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return jsonError('ticker_write_failed', 'Could not save ticker messages.', 500);
  }
};
