interface Env {
  DB: D1Database;
  KV: KVNamespace;
  AUTH_PASSWORD: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { password } = await request.json() as { password: string };

  // Check password (stored as env var)
  const correctPassword = env.AUTH_PASSWORD || 'commandconsole2026';

  if (password !== correctPassword) {
    return new Response(JSON.stringify({ error: 'Wrong password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generate session token
  const token = crypto.randomUUID() + '-' + crypto.randomUUID();

  // Store session in KV (expires in 365 days)
  await env.KV.put(`session:${token}`, JSON.stringify({
    createdAt: new Date().toISOString(),
    ip: request.headers.get('CF-Connecting-IP') || 'unknown',
    userAgent: request.headers.get('User-Agent') || 'unknown',
  }), { expirationTtl: 365 * 24 * 60 * 60 });

  // Save IP as trusted device
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const deviceId = crypto.randomUUID();

  try {
    await env.DB.prepare(
      `INSERT OR REPLACE INTO trusted_devices (id, ip_address, user_agent, trusted_at, last_seen) VALUES (?, ?, ?, ?, ?)`
    ).bind(
      deviceId,
      ip,
      request.headers.get('User-Agent') || '',
      new Date().toISOString(),
      new Date().toISOString()
    ).run();
  } catch (e) {
    // Table might not exist yet, that's OK
  }

  // Set cookie (HttpOnly, Secure, 1 year expiry)
  const cookieValue = `dcc_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${365 * 24 * 60 * 60}`;

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieValue,
    },
  });
};
