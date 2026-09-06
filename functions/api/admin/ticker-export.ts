// GET /api/admin/ticker-export — reads the raw KV "ticker:messages" value as-is
// for backup automation (Task #014). Auth is NOT implemented here: this path
// must be placed behind Cloudflare Access with Service Token auth at the
// Cloudflare dashboard level (Zero Trust → Access → Applications → Service Auth),
// per knowledge.md §3 architectural decision "Cloudflare Access Service Token
// via Access Application terpisah". This handler still checks for the Access
// Service Token headers as a defense-in-depth guard — it does NOT verify the
// credentials itself (that's what Access is for); a request without Service
// Token headers could only reach here if Access wasn't configured, in which
// case we fail closed.

interface Env {
  CLASSMATE_KV: KVNamespace;
}

function jsonError(code: string, message: string, status: number): Response {
  return new Response(JSON.stringify({ data: null, error: { code, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  // Fail closed if Cloudflare Access hasn't been put in front of this route.
  // Service Token uses different headers than JWT browser auth.
  if (
    !request.headers.get('CF-Access-Client-Id') ||
    !request.headers.get('CF-Access-Client-Secret')
  ) {
    return jsonError(
      'unauthorized',
      'This endpoint must be placed behind Cloudflare Access Service Token.',
      401,
    );
  }

  // Fail fast if the KV binding is missing from the environment.
  if (!env.CLASSMATE_KV) {
    return jsonError('kv_binding_missing', 'KV binding CLASSMATE_KV is not configured.', 500);
  }

  try {
    const raw = await env.CLASSMATE_KV.get('ticker:messages');
    const data = raw ? JSON.parse(raw) : [];
    return new Response(JSON.stringify({ data, error: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // Log error for debugging but don't expose details to client
    console.error('Failed to read ticker messages for export:', err);
    return jsonError('ticker_read_failed', 'Could not read ticker messages.', 500);
  }
};
