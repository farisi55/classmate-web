// GET /api/health — public, no auth (knowledge.md §5 API & Data Contracts).
// Returns { status, kv_reachable } — a lightweight liveness probe that also
// confirms the KV binding is reachable. Intentionally does not expose internal
// details: no request_id (per knowledge.md §5 design decision), no stack traces.

interface Env {
  CLASSMATE_KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  let kv_reachable = false;

  try {
    // Probe KV with a cheap read on a well-known key. Use a short TTL so the
    // result is not cached forever if KV recovers after being down.
    await env.CLASSMATE_KV.get('ticker:messages');
    kv_reachable = true;
  } catch {
    // KV unreachable — degrade gracefully, still return 200 (not 500) so
    // monitors can distinguish "app alive, backend degraded" from crash.
  }

  const status = kv_reachable ? 'ok' : 'degraded';

  return new Response(JSON.stringify({ status, kv_reachable }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
