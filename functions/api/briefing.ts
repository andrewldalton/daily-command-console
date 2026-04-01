interface Env {
  DB: D1Database;
}

// GET /api/briefing — check if today's briefing was dismissed
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  const row = await env.DB.prepare('SELECT briefing_dismissed FROM days WHERE date = ?').bind(today).first();
  return Response.json({ dismissed: row?.briefing_dismissed === 1 });
};

// POST /api/briefing — mark today's briefing as dismissed
export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  await env.DB.prepare('UPDATE days SET briefing_dismissed = 1 WHERE date = ?').bind(today).run();
  return Response.json({ ok: true });
};
