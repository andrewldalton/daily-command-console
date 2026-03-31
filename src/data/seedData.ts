import type { Task, DayEntry } from '../types';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function todayAt(hours: number, minutes: number = 0): string {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function daysAgoAt(n: number, hours: number, minutes: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function generateSeedData(): { tasks: Task[]; dayHistory: DayEntry[] } {
  const today = todayISO();

  const tasks: Task[] = [
    // Must-win tasks (3)
    {
      id: crypto.randomUUID(),
      dayId: today,
      title: 'Ship feature PR for auth module',
      category: 'must-win',
      priority: 'high',
      status: 'completed',
      source: 'manual',
      estimatedMinutes: 90,
      notes: 'Need to add unit tests before merging',
      deferredCount: 0,
      sortOrder: 0,
      completedAt: todayAt(10, 45),
      createdAt: todayAt(7, 0),
      updatedAt: todayAt(10, 45),
    },
    {
      id: crypto.randomUUID(),
      dayId: today,
      title: 'Client presentation at 2pm',
      category: 'must-win',
      priority: 'high',
      status: 'pending',
      source: 'manual',
      estimatedMinutes: 60,
      dueTime: '14:00',
      notes: 'Deck is in shared drive — review slides 8-12',
      deferredCount: 0,
      sortOrder: 1,
      createdAt: todayAt(7, 0),
      updatedAt: todayAt(7, 0),
    },
    {
      id: crypto.randomUUID(),
      dayId: today,
      title: 'Review Q1 budget forecast',
      category: 'must-win',
      priority: 'high',
      status: 'pending',
      source: 'carryover',
      estimatedMinutes: 45,
      deferredCount: 1,
      sortOrder: 2,
      createdAt: daysAgoAt(1, 8, 0),
      updatedAt: todayAt(7, 0),
    },

    // Work tasks (5)
    {
      id: crypto.randomUUID(),
      dayId: today,
      title: 'Code review: payments refactor',
      category: 'work',
      priority: 'medium',
      status: 'completed',
      source: 'manual',
      estimatedMinutes: 30,
      deferredCount: 0,
      sortOrder: 3,
      completedAt: todayAt(9, 15),
      createdAt: todayAt(7, 0),
      updatedAt: todayAt(9, 15),
    },
    {
      id: crypto.randomUUID(),
      dayId: today,
      title: 'Update API documentation',
      category: 'work',
      priority: 'medium',
      status: 'pending',
      source: 'manual',
      estimatedMinutes: 45,
      deferredCount: 0,
      sortOrder: 4,
      createdAt: todayAt(7, 0),
      updatedAt: todayAt(7, 0),
    },
    {
      id: crypto.randomUUID(),
      dayId: today,
      title: 'Fix flaky CI test in user-service',
      category: 'work',
      priority: 'high',
      status: 'pending',
      source: 'manual',
      notes: 'Timeout issue on the database seed step',
      deferredCount: 0,
      sortOrder: 5,
      createdAt: todayAt(7, 0),
      updatedAt: todayAt(7, 0),
    },
    {
      id: crypto.randomUUID(),
      dayId: today,
      title: 'Write sprint retro notes',
      category: 'work',
      priority: 'low',
      status: 'pending',
      source: 'manual',
      estimatedMinutes: 20,
      deferredCount: 0,
      sortOrder: 6,
      createdAt: todayAt(7, 0),
      updatedAt: todayAt(7, 0),
    },
    {
      id: crypto.randomUUID(),
      dayId: today,
      title: 'Respond to Slack thread on deployment plan',
      category: 'work',
      priority: 'medium',
      status: 'completed',
      source: 'manual',
      deferredCount: 0,
      sortOrder: 7,
      completedAt: todayAt(8, 30),
      createdAt: todayAt(7, 0),
      updatedAt: todayAt(8, 30),
    },

    // Personal tasks (4)
    {
      id: crypto.randomUUID(),
      dayId: today,
      title: 'Gym - chest and triceps',
      category: 'personal',
      priority: 'medium',
      status: 'completed',
      source: 'manual',
      estimatedMinutes: 60,
      deferredCount: 0,
      sortOrder: 8,
      completedAt: todayAt(6, 30),
      createdAt: todayAt(5, 30),
      updatedAt: todayAt(6, 30),
    },
    {
      id: crypto.randomUUID(),
      dayId: today,
      title: 'Call dentist for appointment',
      category: 'personal',
      priority: 'low',
      status: 'pending',
      source: 'carryover',
      deferredCount: 2,
      sortOrder: 9,
      createdAt: daysAgoAt(3, 8, 0),
      updatedAt: todayAt(7, 0),
    },
    {
      id: crypto.randomUUID(),
      dayId: today,
      title: 'Order new running shoes',
      category: 'personal',
      priority: 'low',
      status: 'pending',
      source: 'manual',
      notes: 'Nike Pegasus 41 — check for sale',
      deferredCount: 0,
      sortOrder: 10,
      createdAt: todayAt(7, 0),
      updatedAt: todayAt(7, 0),
    },
    {
      id: crypto.randomUUID(),
      dayId: today,
      title: 'Pick up dry cleaning',
      category: 'personal',
      priority: 'medium',
      status: 'pending',
      source: 'manual',
      deferredCount: 0,
      sortOrder: 11,
      createdAt: todayAt(7, 0),
      updatedAt: todayAt(7, 0),
    },

    // Follow-up tasks (3)
    {
      id: crypto.randomUUID(),
      dayId: today,
      title: 'Waiting on design assets from Sarah',
      category: 'follow-up',
      priority: 'medium',
      status: 'pending',
      source: 'manual',
      notes: 'She said end of day — check in after 4pm',
      deferredCount: 0,
      sortOrder: 12,
      createdAt: todayAt(7, 0),
      updatedAt: todayAt(7, 0),
    },
    {
      id: crypto.randomUUID(),
      dayId: today,
      title: 'Follow up with vendor on quote',
      category: 'follow-up',
      priority: 'medium',
      status: 'pending',
      source: 'manual',
      estimatedMinutes: 10,
      deferredCount: 0,
      sortOrder: 13,
      createdAt: todayAt(7, 0),
      updatedAt: todayAt(7, 0),
    },
    {
      id: crypto.randomUUID(),
      dayId: today,
      title: 'Check if DevOps merged infra ticket',
      category: 'follow-up',
      priority: 'low',
      status: 'pending',
      source: 'manual',
      deferredCount: 0,
      sortOrder: 14,
      createdAt: todayAt(7, 0),
      updatedAt: todayAt(7, 0),
    },
  ];

  // Generate 7 days of history
  const historyData: Array<{
    daysAgo: number;
    completed: number;
    total: number;
    score: number;
  }> = [
    { daysAgo: 1, completed: 10, total: 12, score: 83 },
    { daysAgo: 2, completed: 7, total: 10, score: 70 },
    { daysAgo: 3, completed: 13, total: 14, score: 93 },
    { daysAgo: 4, completed: 6, total: 10, score: 60 },
    { daysAgo: 5, completed: 9, total: 11, score: 82 },
    { daysAgo: 6, completed: 14, total: 16, score: 88 },
    { daysAgo: 7, completed: 7, total: 8, score: 88 },
  ];

  const dayHistory: DayEntry[] = historyData.map((h) => {
    const date = daysAgoISO(h.daysAgo);
    const historyTasks: Task[] = Array.from({ length: h.total }, (_, i) => ({
      id: crypto.randomUUID(),
      dayId: date,
      title: `Task ${i + 1}`,
      category: (['must-win', 'work', 'personal', 'follow-up'] as const)[i % 4],
      priority: (['high', 'medium', 'low'] as const)[i % 3],
      status: i < h.completed ? 'completed' as const : 'pending' as const,
      source: 'manual' as const,
      deferredCount: 0,
      sortOrder: i,
      completedAt: i < h.completed ? daysAgoAt(h.daysAgo, Math.min(9 + i, 23)) : undefined,
      createdAt: daysAgoAt(h.daysAgo, 7, 0),
      updatedAt: daysAgoAt(h.daysAgo, Math.min(9 + i, 23)),
    }));

    return {
      id: crypto.randomUUID(),
      date,
      tasks: historyTasks,
      score: h.score,
      totalTasks: h.total,
      completedTasks: h.completed,
      createdAt: daysAgoAt(h.daysAgo, 7, 0),
    };
  });

  return { tasks, dayHistory };
}
