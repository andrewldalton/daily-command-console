interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const today = new Date().toISOString().split('T')[0];

  // Get or create today's day entry
  let day = await env.DB.prepare('SELECT * FROM days WHERE date = ?').bind(today).first();
  if (!day) {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO days (id, date, score, total_tasks, completed_tasks, created_at) VALUES (?, ?, 0, 0, 0, ?)'
    ).bind(id, today, new Date().toISOString()).run();
    day = { id, date: today, score: 0, total_tasks: 0, completed_tasks: 0, created_at: new Date().toISOString() };
  }

  // Get all tasks
  const tasks = await env.DB.prepare('SELECT * FROM tasks ORDER BY sort_order ASC').all();

  // Get history
  const history = await env.DB.prepare('SELECT * FROM days ORDER BY date DESC LIMIT 14').all();

  return Response.json({
    today: day,
    tasks: tasks.results ?? [],
    history: history.results ?? [],
  });
};
