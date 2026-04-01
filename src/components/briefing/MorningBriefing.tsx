import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Flame, Medal, Zap, RotateCcw, Ghost, BarChart3 } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useDayStore } from '../../store/dayStore';
import { useDailyInfoStore } from '../../store/dailyInfoStore';
import { useXpStore } from '../../store/xpStore';
import { getTodayDateCT } from '../../lib/utils';

const getTodayDateString = (): string => getTodayDateCT();

const formatHeaderDate = (): string => {
  const now = new Date();
  return now
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase();
};

const getStorageKey = (date: string): string => `dcc_briefing_${date}`;

function useWeekPerformance(): number {
  const history = useDayStore((s) => s.history);

  return useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const recentDays = history.filter((d) => {
      const dayDate = new Date(d.date);
      return dayDate >= sevenDaysAgo && dayDate <= today && d.totalTasks > 0;
    });

    if (recentDays.length === 0) return 0;

    const totalScore = recentDays.reduce((sum, d) => sum + d.score, 0);
    return Math.round(totalScore / recentDays.length);
  }, [history]);
}

interface IntelRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  index: number;
}

function IntelRow({ icon, label, value, sublabel, index }: IntelRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
      className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-b-0"
    >
      <div className="flex items-center gap-3">
        <span className="text-[#94a3b8]">{icon}</span>
        <span className="text-sm text-[#e2e8f0]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#e2e8f0]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {value}
        </span>
        {sublabel && (
          <span className="text-xs text-amber-400">{sublabel}</span>
        )}
      </div>
    </motion.div>
  );
}

export default function MorningBriefing() {
  const todayDate = getTodayDateString();

  const shouldShow = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 12) return false;
    try {
      return !localStorage.getItem(getStorageKey(todayDate));
    } catch {
      return false;
    }
  }, [todayDate]);

  const [visible, setVisible] = useState(shouldShow);

  const tasks = useTaskStore((s) => s.tasks);
  const today = useDayStore((s) => s.today);
  const weather = useDailyInfoStore((s) => s.weather);
  const quote = useDailyInfoStore((s) => s.quote);
  const bibleVerse = useDailyInfoStore((s) => s.bibleVerse);
  const totalXp = useXpStore((s) => s.totalXp);
  const currentRank = useXpStore((s) => s.currentRank);
  const currentStreak = useXpStore((s) => s.currentStreak);

  const weekPerformance = useWeekPerformance();

  const todayTasks = useMemo(() => {
    if (!today) return [];
    return tasks.filter((t) => t.dayId === today.id);
  }, [tasks, today]);

  const carryoverCount = useMemo(
    () => todayTasks.filter((t) => t.source === 'carryover' && t.status === 'pending').length,
    [todayTasks],
  );

  const ghostCount = useMemo(
    () => todayTasks.filter((t) => t.deferredCount >= 5).length,
    [todayTasks],
  );

  const handleDismiss = () => {
    try {
      localStorage.setItem(getStorageKey(todayDate), 'true');
    } catch {
      // Storage unavailable
    }
    setVisible(false);
  };

  if (!visible) return null;

  const intelRows: Omit<IntelRowProps, 'index'>[] = [
    {
      icon: <RotateCcw size={16} />,
      label: 'Tasks carried forward',
      value: carryoverCount,
    },
    {
      icon: <Ghost size={16} />,
      label: 'Ghost tasks',
      value: ghostCount,
      sublabel: ghostCount > 0 ? 'need decisions' : undefined,
    },
    {
      icon: <BarChart3 size={16} />,
      label: 'Week performance',
      value: `${weekPerformance}%`,
    },
    {
      icon: <Flame size={16} />,
      label: 'Current streak',
      value: `${currentStreak} days`,
    },
    {
      icon: <Medal size={16} />,
      label: 'Rank',
      value: currentRank,
    },
    {
      icon: <Zap size={16} />,
      label: 'Total XP',
      value: totalXp.toLocaleString(),
    },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="briefing-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(14, 17, 26, 0.96)',
            zIndex: 'var(--z-overlay)',
          }}
        >
          <motion.div
            key="briefing-card"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ zIndex: 'var(--z-modal)' }}
          >
            {/* Gradient stripe */}
            <div
              className="h-1"
              style={{
                background: 'linear-gradient(to right, #38bdf8, #a78bfa)',
              }}
            />

            <div className="bg-[#252d3d] p-6 space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-xl font-bold tracking-wide text-[#e2e8f0]">
                  {formatHeaderDate()}
                </h1>
                <p className="text-sm text-[#94a3b8] mt-1">Good morning, Andrew.</p>
              </div>

              {/* Intel Section */}
              <div className="space-y-0">
                <h2 className="text-xs font-semibold tracking-widest text-[#64748b] uppercase mb-2">
                  Intel
                </h2>
                <div className="bg-[#1e2433] rounded-lg px-4 py-1">
                  {intelRows.map((row, i) => (
                    <IntelRow key={row.label} {...row} index={i} />
                  ))}
                </div>
              </div>

              {/* Weather */}
              {weather && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-3 bg-[#1e2433] rounded-lg px-4 py-3"
                >
                  <Cloud size={18} className="text-[#94a3b8] shrink-0" />
                  <span className="text-sm text-[#e2e8f0]">
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {weather.current.temp}°F
                    </span>{' '}
                    {weather.current.condition} —{' '}
                    <span className="text-[#94a3b8]">
                      High{' '}
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {weather.high}°
                      </span>{' '}
                      Low{' '}
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {weather.low}°
                      </span>
                    </span>
                  </span>
                </motion.div>
              )}

              {/* Bible Verse */}
              {bibleVerse && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="space-y-1.5"
                >
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: 'italic',
                      color: '#d4a94e',
                      fontSize: '0.95rem',
                    }}
                  >
                    &ldquo;{bibleVerse.text}&rdquo;
                  </p>
                  <p
                    className="text-xs font-medium"
                    style={{ color: '#d4a94e', opacity: 0.8 }}
                  >
                    {bibleVerse.reference}
                  </p>
                </motion.div>
              )}

              {/* Quote of the Day */}
              {quote && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.48 }}
                  className="border-l-2 border-[#38bdf8] pl-4 py-1"
                >
                  <p className="text-sm text-[#e2e8f0] leading-relaxed italic">
                    &ldquo;{quote.text}&rdquo;
                  </p>
                  <p className="text-xs text-[#64748b] mt-1">— {quote.author}</p>
                </motion.div>
              )}

              {/* Dismiss Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={handleDismiss}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white tracking-wide cursor-pointer transition-opacity hover:opacity-90 active:opacity-80"
                style={{
                  background: 'linear-gradient(135deg, #38bdf8, #a78bfa)',
                }}
              >
                Start Your Day &rarr;
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
