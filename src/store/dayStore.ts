import { create } from 'zustand';
import type { DayEntry } from '../types';
import { useTaskStore } from './taskStore';

interface DayState {
  today: DayEntry | null;
  history: DayEntry[];
  loading: boolean;
  initializeToday: () => void;
  saveDay: (day: DayEntry) => void;
  loadHistory: () => void;
  getDayByDate: (date: string) => DayEntry | undefined;
  updateScore: () => void;
}

const STORAGE_KEY = 'dcc_days';

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const persistDays = (days: DayEntry[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
  } catch {
    // Storage full or unavailable
  }
};

const loadDaysFromStorage = (): DayEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const useDayStore = create<DayState>((set, get) => ({
  today: null,
  history: [],
  loading: false,

  initializeToday: () => {
    set({ loading: true });
    const days = loadDaysFromStorage();
    const todayDate = getTodayDateString();
    let todayEntry = days.find((d) => d.date === todayDate);

    if (!todayEntry) {
      todayEntry = {
        id: crypto.randomUUID(),
        date: todayDate,
        tasks: [],
        score: 0,
        totalTasks: 0,
        completedTasks: 0,
        createdAt: new Date().toISOString(),
      };
      days.push(todayEntry);
      persistDays(days);
    }

    set({
      today: todayEntry,
      history: days,
      loading: false,
    });
  },

  saveDay: (day) => {
    set((state) => {
      const existingIndex = state.history.findIndex((d) => d.id === day.id);
      let history: DayEntry[];
      if (existingIndex >= 0) {
        history = state.history.map((d, i) => (i === existingIndex ? day : d));
      } else {
        history = [...state.history, day];
      }
      persistDays(history);

      const isToday = day.date === getTodayDateString();
      return {
        history,
        today: isToday ? day : state.today,
      };
    });
  },

  loadHistory: () => {
    set({ loading: true });
    const days = loadDaysFromStorage();
    const todayDate = getTodayDateString();
    const todayEntry = days.find((d) => d.date === todayDate) ?? null;
    set({ history: days, today: todayEntry, loading: false });
  },

  getDayByDate: (date) => {
    return get().history.find((d) => d.date === date);
  },

  updateScore: () => {
    set((state) => {
      if (!state.today) return state;

      const allTasks = useTaskStore.getState().tasks;
      const todayTasks = allTasks.filter((t) => t.dayId === state.today!.id);
      const totalTasks = todayTasks.length;
      const completedTasks = todayTasks.filter(
        (t) => t.status === 'completed'
      ).length;
      const score =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const updatedToday: DayEntry = {
        ...state.today,
        totalTasks,
        completedTasks,
        score,
      };

      const history = state.history.map((d) =>
        d.id === updatedToday.id ? updatedToday : d
      );
      persistDays(history);

      return { today: updatedToday, history };
    });
  },
}));
