interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const row = await env.DB.prepare('SELECT * FROM user_xp WHERE id = ?').bind('default').first();

  if (!row) {
    return Response.json({
      totalXp: 0,
      currentRank: 'Recruit',
      currentStreak: 0,
      bestStreak: 0,
      big3Days: [],
      xpHistory: [],
    });
  }

  return Response.json({
    totalXp: row.total_xp ?? 0,
    currentRank: row.current_rank ?? 'Recruit',
    currentStreak: row.current_streak ?? 0,
    bestStreak: row.best_streak ?? 0,
    big3Days: JSON.parse((row.big3_days as string) || '[]'),
    xpHistory: JSON.parse((row.xp_history as string) || '[]'),
  });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json() as any;

  const { totalXp, currentRank, currentStreak, bestStreak, big3Days, xpHistory } = body;

  await env.DB.prepare(
    `INSERT INTO user_xp (id, total_xp, current_rank, current_streak, best_streak, big3_days, xp_history, updated_at)
     VALUES ('default', ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       total_xp = excluded.total_xp,
       current_rank = excluded.current_rank,
       current_streak = excluded.current_streak,
       best_streak = excluded.best_streak,
       big3_days = excluded.big3_days,
       xp_history = excluded.xp_history,
       updated_at = excluded.updated_at`
  )
    .bind(
      totalXp ?? 0,
      currentRank ?? 'Recruit',
      currentStreak ?? 0,
      bestStreak ?? 0,
      JSON.stringify(big3Days ?? []),
      JSON.stringify(xpHistory ?? []),
      new Date().toISOString()
    )
    .run();

  return Response.json({ ok: true });
};
