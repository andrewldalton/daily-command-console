interface Env {
  DB: D1Database;
  KV: KVNamespace;
  AUTH_PASSWORD: string;
}

export const onRequest: PagesFunction<Env>[] = [
  async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);

    // Allow auth endpoints through without checking
    if (url.pathname === '/api/auth/login' || url.pathname === '/api/auth/check') {
      return context.next();
    }

    // Check for auth token in cookie
    const cookie = request.headers.get('Cookie') || '';
    const tokenMatch = cookie.match(/dcc_token=([^;]+)/);
    const token = tokenMatch?.[1];

    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate token from KV
    const session = await env.KV.get(`session:${token}`);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return context.next();
  },
];
