// GET /api/ticker — public, no auth (knowledge.md §5 API & Data Contracts).
// Reads the single KV key "ticker:messages" and returns it as-is. If the key
// doesn't exist yet (fresh deploy, before an admin has ever saved), returns
// an empty array rather than an error — the frontend ticker component
// already has its own server-rendered defaults to fall back to.

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

const ALLOWED_ORIGIN_SUFFIX = '.pages.dev'; // tighten to the real custom domain once purchased

function corsHeaders(origin: string | null): HeadersInit {
  const allowed =
    origin && (origin.endsWith(ALLOWED_ORIGIN_SUFFIX) || origin.includes('localhost'));
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowed ? origin! : '',
    'Cache-Control': 'public, max-age=60', // knowledge.md §6.3 — short edge cache
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('Origin');

  // Fail fast if the KV binding is missing from the environment.
  if (!env.CLASSMATE_KV) {
    return new Response(
      JSON.stringify({
        data: null,
        error: {
          code: 'kv_binding_missing',
          message: 'KV binding CLASSMATE_KV is not configured.',
        },
      }),
      { status: 500, headers: corsHeaders(origin) },
    );
  }

  try {
    const raw = await env.CLASSMATE_KV.get('ticker:messages');
    const data: TickerMessage[] = raw ? JSON.parse(raw) : [];
    return new Response(JSON.stringify({ data, error: null }), {
      status: 200,
      headers: corsHeaders(origin),
    });
  } catch (err) {
    // Log error for debugging but don't expose details to client
    console.error('Failed to read ticker messages:', err);
    return new Response(
      JSON.stringify({
        data: null,
        error: { code: 'ticker_read_failed', message: 'Could not read ticker messages.' },
      }),
      { status: 500, headers: corsHeaders(origin) },
    );
  }
};
