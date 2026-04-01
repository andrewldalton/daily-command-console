import { useMemo } from "react";
import { motion } from "framer-motion";

type RiskLevel = "safe" | "warning" | "danger" | "critical";

export interface StreakRiskState {
  isAtRisk: boolean;
  level: RiskLevel;
  tasksNeeded: number;
  message: string | null;
}

interface StreakRiskIndicatorProps {
  currentStreak: number;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
}

function getTimeBasedLevel(): Exclude<RiskLevel, "safe"> {
  const hour = new Date().getHours();
  if (hour < 12) return "warning";
  if (hour < 18) return "danger";
  return "critical";
}

export function useStreakRisk({
  currentStreak,
  completionRate,
  totalTasks,
  completedTasks,
}: StreakRiskIndicatorProps): StreakRiskState {
  return useMemo(() => {
    if (completionRate >= 50 || currentStreak === 0) {
      return {
        isAtRisk: false,
        level: "safe" as const,
        tasksNeeded: 0,
        message: null,
      };
    }

    const tasksNeeded = Math.ceil(totalTasks * 0.5) - completedTasks;
    const level = getTimeBasedLevel();

    let message: string | null = null;
    switch (level) {
      case "warning":
        message = "Streak at risk";
        break;
      case "danger":
        message = "Streak at risk";
        break;
      case "critical":
        message = `${tasksNeeded} to save streak`;
        break;
    }

    return { isAtRisk: true, level, tasksNeeded, message };
  }, [currentStreak, completionRate, totalTasks, completedTasks]);
}

const pulseVariants = {
  slow: {
    opacity: [1, 0.4, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
  },
  fast: {
    opacity: [1, 0.3, 1],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

export function StreakRiskBadge({ risk }: { risk: StreakRiskState }) {
  if (risk.level === "safe") return null;

  if (risk.level === "warning") {
    return (
      <motion.span
        className="inline-block h-2 w-2 rounded-full bg-amber-400"
        variants={pulseVariants}
        animate="slow"
        title="Streak at risk"
      />
    );
  }

  if (risk.level === "danger") {
    return (
      <motion.span
        className="inline-flex items-center text-xs font-medium text-amber-400"
        variants={pulseVariants}
        animate="slow"
      >
        at risk
      </motion.span>
    );
  }

  // critical
  return (
    <motion.span
      className="inline-flex items-center text-xs font-semibold text-red-400"
      variants={pulseVariants}
      animate="fast"
      style={{ textShadow: "0 0 8px rgba(239, 68, 68, 0.5)" }}
    >
      {risk.message}
    </motion.span>
  );
}

export default StreakRiskBadge;
