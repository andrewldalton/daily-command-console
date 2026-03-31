interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { tasks, dayId } = await request.json() as { tasks: any[], dayId: string };
  const now = new Date().toISOString();

  const stmt = env.DB.prepare(
    `INSERT INTO tasks (id, day_id, title, category, priority, status, source, deferred_count, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const batch = tasks.map((t: any, i: number) => {
    return stmt.bind(
      crypto.randomUUID(), dayId, t.title, t.category || 'work',
      t.priority || 'medium', 'pending', t.source || 'notebook',
      0, i, now, now
    );
  });

  await env.DB.batch(batch);
  return Response.json({ success: true, count: tasks.length });
};
