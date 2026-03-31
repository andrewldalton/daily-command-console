interface Env {
  KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const cookie = request.headers.get('Cookie') || '';
  const tokenMatch = cookie.match(/dcc_token=([^;]+)/);
  const token = tokenMatch?.[1];

  if (!token) {
    return new Response(JSON.stringify({ authenticated: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = await env.KV.get(`session:${token}`);
  return new Response(JSON.stringify({ authenticated: !!session }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
