interface Env {
  DB: D1Database;
}

// GET /api/days — get day history
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const days = await env.DB.prepare('SELECT * FROM days ORDER BY date DESC LIMIT 30').all();
  return Response.json(days.results ?? []);
};

// POST /api/days — create or update a day entry
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const day = await request.json() as any;
  const now = new Date().toISOString();
  const id = day.id || crypto.randomUUID();

  await env.DB.prepare(
    `INSERT OR REPLACE INTO days (id, date, image_url, ocr_text, score, total_tasks, completed_tasks, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, day.date, day.imageUrl || null, day.ocrText || null,
    day.score || 0, day.totalTasks || 0, day.completedTasks || 0,
    day.createdAt || now
  ).run();

  return Response.json({ id, success: true });
};
