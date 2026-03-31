import { create } from 'zustand';
import type { Task } from '../types';
import { useDayStore } from './dayStore';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'deferredCount' | 'sortOrder' | 'status'> & Partial<Pick<Task, 'deferredCount' | 'sortOrder' | 'status'>>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  deferTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  importTasks: (ocrTasks: Array<{ title: string; category?: Task['category']; priority?: Task['priority'] }>, dayId: string) => void;
  loadTasks: () => void;
  carryForwardTasks: () => void;
  getTasksByCategory: (category: Task['category']) => Task[];
}

const STORAGE_KEY = 'dcc_tasks';
const LAST_DATE_KEY = 'dcc_last_date';

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const persistTasks = (tasks: Task[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Storage full or unavailable
  }
};

const loadTasksFromStorage = (): Task[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
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
      persistTasks(tasks);
      return { tasks };
    });
    useDayStore.getState().updateScore();
  },

  updateTask: (id, updates) => {
    set((state) => {
      const tasks = state.tasks.map((task) =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      );
      persistTasks(tasks);
      return { tasks };
    });
  },

  deleteTask: (id) => {
    set((state) => {
      const tasks = state.tasks.filter((task) => task.id !== id);
      persistTasks(tasks);
      return { tasks };
    });
    useDayStore.getState().updateScore();
  },

  completeTask: (id) => {
    set((state) => {
      const now = new Date().toISOString();
      const tasks = state.tasks.map((task) =>
        task.id === id
          ? { ...task, status: 'completed' as const, completedAt: now, updatedAt: now }
          : task
      );
      persistTasks(tasks);
      return { tasks };
    });
    useDayStore.getState().updateScore();
  },

  deferTask: (id) => {
    set((state) => {
      const now = new Date().toISOString();
      const tasks = state.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              status: 'deferred' as const,
              deferredCount: task.deferredCount + 1,
              updatedAt: now,
            }
          : task
      );
      persistTasks(tasks);
      return { tasks };
    });
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
      persistTasks(tasks);
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
      persistTasks(tasks);
      return { tasks };
    });
    useDayStore.getState().updateScore();
  },

  loadTasks: () => {
    set({ loading: true });
    const tasks = loadTasksFromStorage();
    set({ tasks, loading: false });

    // Auto carry-forward: check if this is a new day
    const todayDate = getTodayDateString();
    const lastDate = localStorage.getItem(LAST_DATE_KEY);

    if (lastDate && lastDate !== todayDate) {
      // New day detected — carry forward incomplete tasks once
      get().carryForwardTasks();
    }

    // Always update the stored date
    localStorage.setItem(LAST_DATE_KEY, todayDate);
  },

  carryForwardTasks: () => {
    const today = useDayStore.getState().today;
    if (!today) return;

    const allTasks = get().tasks;

    // Find incomplete tasks from previous days (not today's dayId)
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

    // Mark original tasks as deferred so they don't get carried again
    const updatedOriginals = allTasks.map((task) => {
      const isCarried = incompletePreviousTasks.some((t) => t.id === task.id);
      if (isCarried) {
        return {
          ...task,
          status: 'deferred' as const,
          updatedAt: now,
        };
      }
      return task;
    });

    const finalTasks = [...updatedOriginals, ...carriedTasks];
    set({ tasks: finalTasks });
    persistTasks(finalTasks);
    useDayStore.getState().updateScore();
  },

  getTasksByCategory: (category) => {
    return get().tasks.filter((task) => task.category === category);
  },
}));
