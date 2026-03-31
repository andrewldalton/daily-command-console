interface Env {
  DB: D1Database;
}

// PUT /api/tasks/:id
export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const id = params.id as string;
  const updates = await request.json() as any;
  const now = new Date().toISOString();

  // Build dynamic SET clause from provided fields
  const fields: string[] = [];
  const values: any[] = [];

  const fieldMap: Record<string, string> = {
    title: 'title', category: 'category', priority: 'priority',
    status: 'status', source: 'source', notes: 'notes',
    estimatedMinutes: 'estimated_minutes', dueTime: 'due_time',
    deferredCount: 'deferred_count', sortOrder: 'sort_order',
    completedAt: 'completed_at',
  };

  for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
    if (updates[jsKey] !== undefined) {
      fields.push(`${dbKey} = ?`);
      values.push(updates[jsKey]);
    }
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  if (fields.length > 1) {
    await env.DB.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }

  return Response.json({ success: true });
};

// DELETE /api/tasks/:id
export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const id = params.id as string;
  await env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
  return Response.json({ success: true });
};
