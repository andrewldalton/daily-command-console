interface Env {
  DB: D1Database;
}

// GET /api/tasks — get all tasks for today (or query param date)
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const dayId = url.searchParams.get('dayId');

  let tasks;
  if (dayId) {
    tasks = await env.DB.prepare('SELECT * FROM tasks WHERE day_id = ? ORDER BY sort_order ASC').bind(dayId).all();
  } else {
    tasks = await env.DB.prepare('SELECT * FROM tasks ORDER BY sort_order ASC').all();
  }

  return Response.json(tasks.results ?? []);
};

// POST /api/tasks — create a task
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const task = await request.json() as any;
  const now = new Date().toISOString();
  const id = task.id || crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO tasks (id, day_id, title, category, priority, status, source, estimated_minutes, due_time, notes, deferred_count, sort_order, completed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    task.dayId || task.day_id || '',
    task.title || '',
    task.category || 'work',
    task.priority || 'medium',
    task.status || 'pending',
    task.source || 'manual',
    task.estimatedMinutes || task.estimated_minutes || null,
    task.dueTime || task.due_time || null,
    task.notes || null,
    task.deferredCount || task.deferred_count || 0,
    task.sortOrder || task.sort_order || 0,
    task.completedAt || task.completed_at || null,
    task.createdAt || task.created_at || now,
    now
  ).run();

  return Response.json({ id, success: true });
};
