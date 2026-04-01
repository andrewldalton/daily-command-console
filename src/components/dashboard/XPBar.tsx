import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Target,
  Crosshair,
  Crown,
  Swords,
  Trophy,
  Flame,
} from 'lucide-react';
import { useXpStore, RANKS, getStreakMultiplier } from '../../store/xpStore';
import type { LucideIcon } from 'lucide-react';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { useStreakRisk, StreakRiskBadge } from '../ui/StreakRiskIndicator';
import { useTaskStore } from '../../store/taskStore';
import { useDayStore } from '../../store/dayStore';

/* ── Rank icon map ── */
const RANK_ICONS: Record<string, LucideIcon> = {
  Recruit: Shield,
  Closer: Target,
  Operator: Crosshair,
  Commander: Crown,
  'War Chief': Swords,
  Legend: Trophy,
};

export default function XPBar() {
  const totalXp = useXpStore((s) => s.totalXp);
  const currentRank = useXpStore((s) => s.currentRank);
  const currentStreak = useXpStore((s) => s.currentStreak);
  const tasks = useTaskStore((s) => s.tasks);
  const today = useDayStore((s) => s.today);

  const { total: taskTotal, completed: taskCompleted, completionRate } = useMemo(() => {
    if (!today) return { total: 0, completed: 0, completionRate: 0 };
    const todayTasks = tasks.filter(task => task.dayId === today.id);
    const totalCount = todayTasks.length;
    const completedCount = todayTasks.filter(task => task.status === 'completed').length;
    return { total: totalCount, completed: completedCount, completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0 };
  }, [tasks, today]);

  const streakRisk = useStreakRisk({
    currentStreak,
    completionRate,
    totalTasks: taskTotal,
    completedTasks: taskCompleted,
  });

  const { nextRank, progressPercent, nextThreshold } =
    useMemo(() => {
      const currentIdx = RANKS.findIndex((r) => r.name === currentRank);
      const current = RANKS[currentIdx] ?? RANKS[0];
      const next = RANKS[currentIdx + 1] ?? null;

      if (!next) {
        return {
          nextRank: null,
          progressPercent: 100,
          nextThreshold: current.threshold,
        };
      }

      const rangeXp = next.threshold - current.threshold;
      const progressXp = totalXp - current.threshold;
      const pct = Math.min(100, Math.max(0, (progressXp / rangeXp) * 100));

      return {
        nextRank: next,
        progressPercent: pct,
        nextThreshold: next.threshold,
      };
    }, [totalXp, currentRank]);

  const streakMult = getStreakMultiplier(currentStreak);
  const RankIcon = RANK_ICONS[currentRank] ?? Shield;

  return (
    <motion.div
      className="bg-[#252d3d]/60 border border-white/[0.06] rounded-lg px-4 py-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Desktop: single row | Mobile: stacked */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Rank badge + title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(167,139,250,0.12))',
              border: '1px solid rgba(56,189,248,0.2)',
            }}
          >
            <RankIcon className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <span className="text-sm font-semibold text-[#38bdf8] tracking-wide">
            {currentRank}
          </span>
        </div>

        {/* XP progress bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider">
              {nextRank ? <><AnimatedNumber value={totalXp} className="inline" /> / {nextThreshold.toLocaleString()} XP</> : <><AnimatedNumber value={totalXp} className="inline" /> XP — Max Rank</>}
            </span>
            {nextRank && (
              <span className="text-[10px] font-medium text-[#64748b]">
                {nextRank.name}
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #38bdf8, #a78bfa)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </div>

        {/* Streak counter */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Flame
              className="w-4 h-4"
              style={{
                color: currentStreak > 0 ? '#fbbf24' : '#475569',
              }}
            />
            <span
              className="text-sm font-semibold tabular-nums"
              style={{
                color: currentStreak > 0 ? '#fbbf24' : '#475569',
              }}
            >
              {currentStreak}d
            </span>
            <StreakRiskBadge risk={streakRisk} />
          </div>

          {/* Streak multiplier pill */}
          {streakMult > 1 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                color: '#fbbf24',
                backgroundColor: 'rgba(251,191,36,0.12)',
                border: '1px solid rgba(251,191,36,0.2)',
              }}
            >
              {streakMult}x
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
