import { create } from 'zustand';
import type { Task } from '../types';
import { useDayStore } from './dayStore';
import { useXpStore } from './xpStore';
import { api } from '../lib/api';
import { getTodayDateCT } from '../lib/utils';
import { showXPToast } from '../components/ui/XPToast';
import { triggerBig3Celebration } from '../components/ui/Big3Celebration';
import { checkBig3Complete } from './xpStore';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'deferredCount' | 'sortOrder' | 'status'> & Partial<Pick<Task, 'deferredCount' | 'sortOrder' | 'status'>>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  deferTask: (id: string) => void;
  commitGhostTask: (id: string) => void;
  killGhostTask: (id: string) => void;
  delegateGhostTask: (id: string, delegateTo: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  importTasks: (ocrTasks: Array<{ title: string; category?: Task['category']; priority?: Task['priority'] }>, dayId: string) => void;
  loadTasks: () => void;
  carryForwardTasks: () => void;
  getTasksByCategory: (category: Task['category']) => Task[];
}

const STORAGE_KEY = 'dcc_tasks';
const LAST_DATE_KEY = 'dcc_last_date';

const getTodayDateString = (): string => {
  return getTodayDateCT();
};

// localStorage as fast cache
const persistLocal = (tasks: Task[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch {}
};
const loadLocal = (): Task[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

// Fire-and-forget API sync (don't block UI)
const syncToApi = {
  create: (task: Task) => {
    api.createTask(task).catch(() => {});
  },
  update: (id: string, updates: Partial<Task>) => {
    api.updateTask(id, updates).catch(() => {});
  },
  delete: (id: string) => {
    api.deleteTask(id).catch(() => {});
  },
  bulkImport: (tasks: Array<{ title: string; category?: string; priority?: string }>, dayId: string) => {
    api.importTasks(tasks, dayId).catch(() => {});
  },
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,

  addTask: (taskData) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      status: taskData.status ?? 'pending',
      deferredCount: taskData.deferredCount ?? 0,
      sortOrder: taskData.sortOrder ?? get().tasks.length,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const tasks = [...state.tasks, newTask];
      persistLocal(tasks);
      return { tasks };
    });
    syncToApi.create(newTask);
    useDayStore.getState().updateScore();
  },

  updateTask: (id, updates) => {
    set((state) => {
      const tasks = state.tasks.map((task) =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      );
      persistLocal(tasks);
      return { tasks };
    });
    syncToApi.update(id, updates);
  },

  deleteTask: (id) => {
    set((state) => {
      const tasks = state.tasks.filter((task) => task.id !== id);
      persistLocal(tasks);
      return { tasks };
    });
    syncToApi.delete(id);
    useDayStore.getState().updateScore();
  },

  completeTask: (id) => {
    const now = new Date().toISOString();
    const task = get().tasks.find((t) => t.id === id);
    set((state) => {
      const tasks = state.tasks.map((t) =>
        t.id === id
          ? { ...t, status: 'completed' as const, completedAt: now, updatedAt: now }
          : t
      );
      persistLocal(tasks);
      return { tasks };
    });
    syncToApi.update(id, { status: 'completed', completedAt: now });
    useDayStore.getState().updateScore();

    // Award XP for completing the task
    if (task) {
      const allTasks = get().tasks; // already updated
      useXpStore.getState().awardXP(task.category, task.dayId, allTasks);

      // Show XP toast
      const xpStore = useXpStore.getState();
      const baseXp = { 'must-win': 50, work: 30, personal: 20, 'follow-up': 25 }[task.category] ?? 0;
      const multiplier = xpStore.getMultiplier(task.dayId);
      showXPToast({
        xp: Math.round(baseXp * multiplier),
        color: { 'must-win': '#f472b6', work: '#38bdf8', personal: '#a78bfa', 'follow-up': '#fbbf24' }[task.category],
        multiplier: multiplier > 1 ? multiplier : undefined,
      });

      // Check if Big 3 just completed
      if (task.category === 'must-win' && checkBig3Complete(allTasks, task.dayId)) {
        triggerBig3Celebration();
        showXPToast({ xp: 0, label: 'Big 3 Complete — 2× XP Activated', color: '#fbbf24' });
      }
    }
  },

  deferTask: (id) => {
    const now = new Date().toISOString();
    const task = get().tasks.find((t) => t.id === id);
    const newCount = (task?.deferredCount ?? 0) + 1;
    set((state) => {
      const tasks = state.tasks.map((t) =>
        t.id === id
          ? { ...t, status: 'deferred' as const, deferredCount: newCount, updatedAt: now }
          : t
      );
      persistLocal(tasks);
      return { tasks };
    });
    syncToApi.update(id, { status: 'deferred', deferredCount: newCount });
    useDayStore.getState().updateScore();
  },

  commitGhostTask: (id) => {
    // Pin to must-win category, reset deferred count
    const now = new Date().toISOString();
    set((state) => {
      const tasks = state.tasks.map((t) =>
        t.id === id
          ? { ...t, category: 'must-win' as const, deferredCount: 0, status: 'pending' as const, priority: 'high' as const, updatedAt: now }
          : t
      );
      persistLocal(tasks);
      return { tasks };
    });
    syncToApi.update(id, { category: 'must-win', deferredCount: 0, status: 'pending', priority: 'high' });
  },

  killGhostTask: (id) => {
    // Remove the task entirely (send to graveyard)
    set((state) => {
      const tasks = state.tasks.filter((t) => t.id !== id);
      persistLocal(tasks);
      return { tasks };
    });
    syncToApi.delete(id);
    useDayStore.getState().updateScore();
    useXpStore.getState().penalizeGhostTask();
  },

  delegateGhostTask: (id, delegateTo) => {
    // Mark as completed with delegation note
    const now = new Date().toISOString();
    set((state) => {
      const tasks = state.tasks.map((t) =>
        t.id === id
          ? { ...t, status: 'completed' as const, completedAt: now, notes: `Delegated to ${delegateTo}`, updatedAt: now }
          : t
      );
      persistLocal(tasks);
      return { tasks };
    });
    syncToApi.update(id, { status: 'completed', completedAt: now, notes: `Delegated to ${delegateTo}` });
    useDayStore.getState().updateScore();
  },

  reorderTasks: (reorderedTasks) => {
    const now = new Date().toISOString();
    const reorderedMap = new Map(
      reorderedTasks.map((task, index) => [
        task.id,
        { ...task, sortOrder: index, updatedAt: now },
      ])
    );
    set((state) => {
      const tasks = state.tasks.map((task) =>
        reorderedMap.has(task.id) ? reorderedMap.get(task.id)! : task
      );
      persistLocal(tasks);
      return { tasks };
    });
  },

  importTasks: (ocrTasks, dayId) => {
    const now = new Date().toISOString();
    const currentLength = get().tasks.length;
    const newTasks: Task[] = ocrTasks.map((item, index) => ({
      id: crypto.randomUUID(),
      dayId,
      title: item.title,
      category: item.category ?? 'work',
      priority: item.priority ?? 'medium',
      status: 'pending' as const,
      source: 'notebook' as const,
      deferredCount: 0,
      sortOrder: currentLength + index,
      createdAt: now,
      updatedAt: now,
    }));
    set((state) => {
      const tasks = [...state.tasks, ...newTasks];
      persistLocal(tasks);
      return { tasks };
    });
    // Sync each to API
    newTasks.forEach((t) => syncToApi.create(t));
    useDayStore.getState().updateScore();
  },

  loadTasks: async () => {
    set({ loading: true });

    // Load from localStorage first (instant)
    const localTasks = loadLocal();
    if (localTasks.length > 0) {
      set({ tasks: localTasks, loading: false });
    }

    // Then fetch from API (source of truth) and merge
    try {
      const apiTasks = await api.getTasks();
      if (Array.isArray(apiTasks) && apiTasks.length > 0) {
        // Convert DB snake_case to camelCase
        const normalized: Task[] = apiTasks.map((t: any) => ({
          id: t.id,
          dayId: t.day_id || t.dayId || '',
          title: t.title || '',
          category: t.category || 'work',
          priority: t.priority || 'medium',
          status: t.status || 'pending',
          source: t.source || 'manual',
          estimatedMinutes: t.estimated_minutes || t.estimatedMinutes,
          dueTime: t.due_time || t.dueTime,
          notes: t.notes,
          deferredCount: t.deferred_count ?? t.deferredCount ?? 0,
          sortOrder: t.sort_order ?? t.sortOrder ?? 0,
          completedAt: t.completed_at || t.completedAt,
          createdAt: t.created_at || t.createdAt || new Date().toISOString(),
          updatedAt: t.updated_at || t.updatedAt || new Date().toISOString(),
        }));
        set({ tasks: normalized, loading: false });
        persistLocal(normalized);
      } else if (localTasks.length > 0) {
        // API is empty but we have local tasks — push them up
        localTasks.forEach((t) => syncToApi.create(t));
      }
    } catch {
      // API unavailable — use local cache (already set above)
    }

    set({ loading: false });

    // Auto carry-forward on new day
    const todayDate = getTodayDateString();
    const lastDate = localStorage.getItem(LAST_DATE_KEY);
    if (lastDate && lastDate !== todayDate) {
      get().carryForwardTasks();
    }
    localStorage.setItem(LAST_DATE_KEY, todayDate);
  },

  carryForwardTasks: () => {
    const today = useDayStore.getState().today;
    if (!today) return;

    const allTasks = get().tasks;
    const incompletePreviousTasks = allTasks.filter(
      (t) =>
        t.dayId !== today.id &&
        (t.status === 'pending' || t.status === 'deferred')
    );

    if (incompletePreviousTasks.length === 0) return;

    const now = new Date().toISOString();
    const currentLength = allTasks.length;

    const carriedTasks: Task[] = incompletePreviousTasks.map((task, index) => ({
      id: crypto.randomUUID(),
      dayId: today.id,
      title: task.title,
      category: task.category,
      priority: task.priority,
      status: 'pending' as const,
      source: 'carryover' as const,
      estimatedMinutes: task.estimatedMinutes,
      dueTime: task.dueTime,
      notes: task.notes,
      deferredCount: task.deferredCount + 1,
      sortOrder: currentLength + index,
      createdAt: now,
      updatedAt: now,
    }));

    const updatedOriginals = allTasks.map((task) => {
      const isCarried = incompletePreviousTasks.some((t) => t.id === task.id);
      if (isCarried) {
        return { ...task, status: 'deferred' as const, updatedAt: now };
      }
      return task;
    });

    const finalTasks = [...updatedOriginals, ...carriedTasks];
    set({ tasks: finalTasks });
    persistLocal(finalTasks);

    // Sync carried tasks to API
    carriedTasks.forEach((t) => syncToApi.create(t));
    incompletePreviousTasks.forEach((t) =>
      syncToApi.update(t.id, { status: 'deferred' })
    );

    useDayStore.getState().updateScore();
  },

  getTasksByCategory: (category) => {
    return get().tasks.filter((task) => task.category === category);
  },
}));
