import { create } from 'zustand';
import type { Task } from '../types';

/* ── Rank definitions ── */
export interface Rank {
  name: string;
  threshold: number;
}

export const RANKS: Rank[] = [
  { name: 'Recruit', threshold: 0 },
  { name: 'Closer', threshold: 500 },
  { name: 'Operator', threshold: 1500 },
  { name: 'Commander', threshold: 4000 },
  { name: 'War Chief', threshold: 8000 },
  { name: 'Legend', threshold: 15000 },
];

/* ── XP per category ── */
const XP_BY_CATEGORY: Record<Task['category'], number> = {
  'must-win': 50,
  work: 30,
  personal: 20,
  'follow-up': 25,
};

const GHOST_PENALTY = 10;

/* ── Streak multiplier tiers ── */
function getStreakMultiplier(streak: number): number {
  if (streak >= 14) return 3;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

/* ── Rank from XP ── */
function getRankForXp(xp: number): Rank {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.threshold) rank = r;
  }
  return rank;
}

function getNextRank(xp: number): Rank | null {
  for (const r of RANKS) {
    if (xp < r.threshold) return r;
  }
  return null;
}

/* ── Helper: check if all Big 3 (must-win) tasks are completed for a day ── */
export function checkBig3Complete(tasks: Task[], dayId: string): boolean {
  const big3 = tasks.filter((t) => t.dayId === dayId && t.category === 'must-win');
  if (big3.length === 0) return false;
  return big3.every((t) => t.status === 'completed');
}

/* ── Types ── */
interface XpHistoryEntry {
  date: string;
  xpEarned: number;
  tasksCompleted: number;
}

interface LevelUpState {
  pending: boolean;
  newRank: string | null;
}

interface XpState {
  totalXp: number;
  currentRank: string;
  currentStreak: number;
  bestStreak: number;
  levelUp: LevelUpState;
  xpHistory: XpHistoryEntry[];
  /** Tracks which dayIds had Big 3 multiplier applied */
  big3Days: string[];

  awardXP: (category: Task['category'], dayId: string, tasks?: Task[]) => void;
  checkStreak: (completionPercentage: number, date: string) => void;
  penalizeGhostTask: () => void;
  dismissLevelUp: () => void;
  getMultiplier: (dayId: string) => number;
}

const STORAGE_KEY = 'dcc_xp';

/* ── localStorage helpers ── */
function loadState(): Partial<XpState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function persistState(state: XpState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        totalXp: state.totalXp,
        currentRank: state.currentRank,
        currentStreak: state.currentStreak,
        bestStreak: state.bestStreak,
        levelUp: state.levelUp,
        xpHistory: state.xpHistory,
        big3Days: state.big3Days,
      })
    );
  } catch {
    // storage unavailable
  }
}

const saved = loadState();

export const useXpStore = create<XpState>((set, get) => ({
  totalXp: saved.totalXp ?? 0,
  currentRank: saved.currentRank ?? 'Recruit',
  currentStreak: saved.currentStreak ?? 0,
  bestStreak: saved.bestStreak ?? 0,
  levelUp: saved.levelUp ?? { pending: false, newRank: null },
  xpHistory: saved.xpHistory ?? [],
  big3Days: (saved as any).big3Days ?? [],

  awardXP: (category, dayId, tasks) => {
    set((state) => {
      const baseXp = XP_BY_CATEGORY[category] ?? 0;

      // Streak multiplier
      const streakMult = getStreakMultiplier(state.currentStreak);

      // Big 3 multiplier: if tasks provided, check live; otherwise check recorded
      let big3Mult = 1;
      if (tasks && checkBig3Complete(tasks, dayId)) {
        big3Mult = 2;
      } else if (state.big3Days.includes(dayId)) {
        big3Mult = 2;
      }

      const earnedXp = Math.round(baseXp * streakMult * big3Mult);
      const newTotal = state.totalXp + earnedXp;

      // Check for rank up
      const oldRank = getRankForXp(state.totalXp);
      const newRank = getRankForXp(newTotal);
      const didRankUp = newRank.name !== oldRank.name;

      // Update history for today
      const todayDate = dayId;
      const existingIdx = state.xpHistory.findIndex((h) => h.date === todayDate);
      const updatedHistory = [...state.xpHistory];
      if (existingIdx >= 0) {
        updatedHistory[existingIdx] = {
          ...updatedHistory[existingIdx],
          xpEarned: updatedHistory[existingIdx].xpEarned + earnedXp,
          tasksCompleted: updatedHistory[existingIdx].tasksCompleted + 1,
        };
      } else {
        updatedHistory.push({
          date: todayDate,
          xpEarned: earnedXp,
          tasksCompleted: 1,
        });
      }

      // Track Big 3 days
      let updatedBig3Days = state.big3Days;
      if (big3Mult === 2 && !state.big3Days.includes(dayId)) {
        updatedBig3Days = [...state.big3Days, dayId];
      }

      const newState = {
        totalXp: newTotal,
        currentRank: newRank.name,
        levelUp: didRankUp
          ? { pending: true, newRank: newRank.name }
          : state.levelUp,
        xpHistory: updatedHistory,
        big3Days: updatedBig3Days,
      };

      persistState({ ...state, ...newState });
      return newState;
    });
  },

  checkStreak: (completionPercentage, date) => {
    set((state) => {
      const meetsThreshold = completionPercentage >= 50;

      // Determine if this is a consecutive day
      const lastEntry = state.xpHistory[state.xpHistory.length - 1];
      const isConsecutive = (() => {
        if (!lastEntry) return true;
        const lastDate = new Date(lastEntry.date);
        const thisDate = new Date(date);
        const diffMs = thisDate.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        return diffDays <= 1;
      })();

      let newStreak: number;
      if (meetsThreshold && isConsecutive) {
        newStreak = state.currentStreak + 1;
      } else if (meetsThreshold) {
        newStreak = 1;
      } else {
        newStreak = 0;
      }

      const newBest = Math.max(state.bestStreak, newStreak);

      const newState = {
        currentStreak: newStreak,
        bestStreak: newBest,
      };

      persistState({ ...state, ...newState });
      return newState;
    });
  },

  penalizeGhostTask: () => {
    set((state) => {
      const newTotal = Math.max(0, state.totalXp - GHOST_PENALTY);
      const newRank = getRankForXp(newTotal);

      const newState = {
        totalXp: newTotal,
        currentRank: newRank.name,
      };

      persistState({ ...state, ...newState });
      return newState;
    });
  },

  dismissLevelUp: () => {
    set((state) => {
      const newState = {
        levelUp: { pending: false, newRank: null },
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  getMultiplier: (dayId) => {
    const state = get();
    const streakMult = getStreakMultiplier(state.currentStreak);
    const big3Mult = state.big3Days.includes(dayId) ? 2 : 1;
    return streakMult * big3Mult;
  },
}));

/* ── Exported helpers for external use ── */
export { getRankForXp, getNextRank, getStreakMultiplier, RANKS as RankList };
