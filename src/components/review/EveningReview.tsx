import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  Check,
  ArrowRight,
  Trash2,
  Trophy,
  Sparkles,
  X,
  BookOpen,
} from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useDayStore } from '../../store/dayStore';
import { useDailyInfoStore } from '../../store/dailyInfoStore';
import type { Task } from '../../types';

type ReviewStep = 'intro' | 'triage' | 'reflection' | 'score';

const CATEGORY_COLORS: Record<Task['category'], string> = {
  'must-win': '#f472b6',
  work: '#38bdf8',
  personal: '#a78bfa',
  'follow-up': '#fbbf24',
};

const CATEGORY_LABELS: Record<Task['category'], string> = {
  'must-win': 'Big 3',
  work: 'Blitz',
  personal: 'Personal',
  'follow-up': 'Follow-Up',
};

/* ── Confetti burst (simple CSS-driven particles) ── */
function ConfettiBurst() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    angle: (i / 24) * 360,
    distance: 60 + Math.random() * 80,
    size: 4 + Math.random() * 4,
    color: ['#38bdf8', '#a3e635', '#f472b6', '#fbbf24', '#a78bfa'][
      Math.floor(Math.random() * 5)
    ],
    delay: Math.random() * 0.2,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: '50%',
            top: '50%',
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            opacity: 0,
            scale: 0.3,
          }}
          transition={{
            duration: 0.8,
            delay: 0.3 + p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

/* ── Score Ring (large, celebration-style) ── */
function ScoreRevealRing({ percentage }: { percentage: number }) {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 80 ? '#a3e635' : percentage >= 50 ? '#fbbf24' : '#f472b6';

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <ConfettiBurst />
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <filter id="score-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
          filter="url(#score-glow)"
        />
      </svg>
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4, type: 'spring' }}
      >
        <span
          className="font-mono text-5xl font-bold"
          style={{ color, textShadow: `0 0 30px ${color}40` }}
        >
          {percentage}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-widest text-[#64748b] mt-1">
          Execution Score
        </span>
      </motion.div>
    </div>
  );
}

/* ── Main Evening Review Component ── */
export default function EveningReview() {
  const tasks = useTaskStore((s) => s.tasks);
  const { completeTask, deleteTask, deferTask } = useTaskStore();
  const today = useDayStore((s) => s.today);
  const updateScore = useDayStore((s) => s.updateScore);
  const bibleVerse = useDailyInfoStore((s) => s.bibleVerse);

  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState<ReviewStep>('intro');
  const [reflection, setReflection] = useState('');
  const [triageActions, setTriageActions] = useState<
    Record<string, 'complete' | 'tomorrow' | 'drop'>
  >({});

  // Check if it's review time (10:30 PM+)
  const isReviewTime = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    return hour > 22 || (hour === 22 && minute >= 30);
  }, []);

  // Check for un-reviewed day (haven't done review today)
  const reviewDoneKey = `dcc_review_${today?.date}`;
  const alreadyReviewed = useMemo(() => {
    try {
      return localStorage.getItem(reviewDoneKey) === 'done';
    } catch {
      return false;
    }
  }, [reviewDoneKey]);

  // Today's remaining tasks
  const remainingTasks = useMemo(() => {
    if (!today) return [];
    return tasks.filter(
      (t) => t.dayId === today.id && t.status !== 'completed'
    );
  }, [tasks, today]);

  const completedTasks = useMemo(() => {
    if (!today) return [];
    return tasks.filter(
      (t) => t.dayId === today.id && t.status === 'completed'
    );
  }, [tasks, today]);

  const totalTodayTasks = useMemo(() => {
    if (!today) return 0;
    return tasks.filter((t) => t.dayId === today.id).length;
  }, [tasks, today]);

  // Show banner only after 8 PM, with remaining tasks, and not yet reviewed
  const showBanner =
    isReviewTime && !alreadyReviewed && !dismissed && !isOpen && totalTodayTasks > 0;

  const handleStartReview = () => {
    setIsOpen(true);
    setStep('intro');
    setTriageActions({});
    setReflection('');
  };

  const handleTriageAction = (
    taskId: string,
    action: 'complete' | 'tomorrow' | 'drop'
  ) => {
    setTriageActions((prev) => ({ ...prev, [taskId]: action }));
  };

  const handleApplyTriage = () => {
    Object.entries(triageActions).forEach(([taskId, action]) => {
      if (action === 'complete') {
        completeTask(taskId);
      } else if (action === 'tomorrow') {
        deferTask(taskId);
      } else if (action === 'drop') {
        deleteTask(taskId);
      }
    });
    updateScore();
    setStep('reflection');
  };

  const handleSaveReflection = () => {
    // Save reflection to localStorage as part of today's day data
    if (today && reflection.trim()) {
      try {
        const reflections = JSON.parse(
          localStorage.getItem('dcc_reflections') || '{}'
        );
        reflections[today.date] = reflection.trim();
        localStorage.setItem('dcc_reflections', JSON.stringify(reflections));
      } catch {
        // ignore
      }
    }
    updateScore();
    setStep('score');
  };

  const handleFinish = () => {
    try {
      localStorage.setItem(reviewDoneKey, 'done');
    } catch {
      // ignore
    }
    setIsOpen(false);
    setDismissed(true);
  };

  // Get final score (recalculated after triage)
  const finalScore = useMemo(() => {
    const todayTasks = tasks.filter((t) => today && t.dayId === today.id);
    const total = todayTasks.length;
    const done = todayTasks.filter((t) => t.status === 'completed').length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [tasks, today, step]); // recalc when step changes (after triage)

  const scoreMessage = useMemo(() => {
    if (finalScore >= 90) return "Dominant day. You showed up and delivered.";
    if (finalScore >= 75) return "Strong execution. Momentum is building.";
    if (finalScore >= 50) return "Solid progress. Every step forward counts.";
    if (finalScore >= 25) return "Tough day, but you showed up. That matters.";
    return "Tomorrow is a new day. Rest up and come back ready.";
  }, [finalScore]);

  // All remaining triaged?
  const allTriaged =
    remainingTasks.length === 0 ||
    remainingTasks.every((t) => triageActions[t.id]);

  return (
    <>
      {/* ── Evening Review Banner ── */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mb-5"
          >
            <button
              onClick={handleStartReview}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all group"
              style={{
                background:
                  'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(167,139,250,0.08) 50%, rgba(244,114,182,0.06) 100%)',
                border: '1px solid rgba(167,139,250,0.2)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(244,114,182,0.15))',
                }}
              >
                <Moon className="w-5 h-5 text-[#a78bfa]" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-[#e2e8f0]">
                  Ready to close out the day?
                </p>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  {remainingTasks.length} task{remainingTasks.length !== 1 ? 's' : ''} remaining
                  &middot; {completedTasks.length} completed
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#a78bfa] group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full-Screen Review Modal ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[var(--z-overlay)]"
              style={{ backgroundColor: 'rgba(14, 17, 26, 0.92)' }}
            />

            {/* Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="w-full max-w-lg">
                {/* Close button */}
                <div className="flex justify-end mb-3">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setDismissed(true);
                    }}
                    className="p-2 rounded-lg text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.06] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {/* ═══ Step 1: Intro ═══ */}
                  {step === 'intro' && (
                    <motion.div
                      key="intro"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col items-center text-center gap-6"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 20,
                          delay: 0.1,
                        }}
                        className="w-20 h-20 rounded-2xl flex items-center justify-center"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(56,189,248,0.15))',
                          border: '1px solid rgba(167,139,250,0.2)',
                        }}
                      >
                        <Moon className="w-9 h-9 text-[#a78bfa]" />
                      </motion.div>

                      <div>
                        <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">
                          Evening Review
                        </h2>
                        <p className="text-sm text-[#94a3b8] leading-relaxed max-w-sm">
                          Let's close out the day with intention. We'll triage your
                          remaining tasks, capture your biggest win, and seal your
                          score.
                        </p>
                      </div>

                      <div className="flex items-center gap-6 text-center">
                        <div>
                          <span className="block font-mono text-2xl font-bold text-[#a3e635]">
                            {completedTasks.length}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-[#64748b]">
                            Done
                          </span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                          <span className="block font-mono text-2xl font-bold text-[#fbbf24]">
                            {remainingTasks.length}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-[#64748b]">
                            Remaining
                          </span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                          <span className="block font-mono text-2xl font-bold text-[#e2e8f0]">
                            {totalTodayTasks}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-[#64748b]">
                            Total
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          remainingTasks.length > 0
                            ? setStep('triage')
                            : setStep('reflection')
                        }
                        className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                        style={{
                          background:
                            'linear-gradient(135deg, #38bdf8, #a78bfa)',
                          color: '#fff',
                          border: 'none',
                          boxShadow:
                            '0 0 24px rgba(56,189,248,0.3), 0 4px 16px rgba(0,0,0,0.2)',
                        }}
                      >
                        {remainingTasks.length > 0
                          ? 'Triage Remaining Tasks'
                          : 'Continue to Reflection'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {/* ═══ Step 2: Triage ═══ */}
                  {step === 'triage' && (
                    <motion.div
                      key="triage"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="text-center mb-2">
                        <h2 className="text-xl font-bold text-[#e2e8f0] mb-1">
                          Triage Remaining
                        </h2>
                        <p className="text-xs text-[#94a3b8]">
                          For each task: did you do it, push to tomorrow, or let
                          it go?
                        </p>
                      </div>

                      <div
                        className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'rgba(255,255,255,0.08) transparent',
                        }}
                      >
                        {remainingTasks.map((task, i) => {
                          const action = triageActions[task.id];
                          return (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05, duration: 0.2 }}
                              className="rounded-xl p-3"
                              style={{
                                backgroundColor:
                                  action === 'complete'
                                    ? 'rgba(163,230,53,0.08)'
                                    : action === 'tomorrow'
                                      ? 'rgba(251,191,36,0.08)'
                                      : action === 'drop'
                                        ? 'rgba(244,114,182,0.06)'
                                        : '#252d3d',
                                border: `1px solid ${
                                  action === 'complete'
                                    ? 'rgba(163,230,53,0.2)'
                                    : action === 'tomorrow'
                                      ? 'rgba(251,191,36,0.2)'
                                      : action === 'drop'
                                        ? 'rgba(244,114,182,0.15)'
                                        : 'rgba(255,255,255,0.06)'
                                }`,
                                transition: 'all 0.2s',
                              }}
                            >
                              <div className="flex items-center gap-2 mb-2.5">
                                <span
                                  className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                                  style={{
                                    color: CATEGORY_COLORS[task.category],
                                    backgroundColor: `${CATEGORY_COLORS[task.category]}12`,
                                    borderColor: `${CATEGORY_COLORS[task.category]}25`,
                                  }}
                                >
                                  {CATEGORY_LABELS[task.category]}
                                </span>
                                <span
                                  className={`text-[13px] font-medium flex-1 ${
                                    action === 'drop'
                                      ? 'line-through text-[#64748b]'
                                      : action === 'complete'
                                        ? 'text-[#a3e635]'
                                        : 'text-[#e2e8f0]'
                                  }`}
                                >
                                  {task.title}
                                </span>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleTriageAction(task.id, 'complete')
                                  }
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                                    action === 'complete'
                                      ? 'bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/30'
                                      : 'bg-white/[0.04] text-[#94a3b8] border border-white/[0.06] hover:border-[#a3e635]/30 hover:text-[#a3e635]'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Did it
                                </button>
                                <button
                                  onClick={() =>
                                    handleTriageAction(task.id, 'tomorrow')
                                  }
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                                    action === 'tomorrow'
                                      ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30'
                                      : 'bg-white/[0.04] text-[#94a3b8] border border-white/[0.06] hover:border-[#fbbf24]/30 hover:text-[#fbbf24]'
                                  }`}
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                  Tomorrow
                                </button>
                                <button
                                  onClick={() =>
                                    handleTriageAction(task.id, 'drop')
                                  }
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                                    action === 'drop'
                                      ? 'bg-[#f472b6]/15 text-[#f472b6] border border-[#f472b6]/25'
                                      : 'bg-white/[0.04] text-[#94a3b8] border border-white/[0.06] hover:border-[#f472b6]/25 hover:text-[#f472b6]'
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Drop
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      <button
                        onClick={handleApplyTriage}
                        disabled={!allTriaged}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-2"
                        style={{
                          backgroundColor: '#38bdf8',
                          color: '#fff',
                          border: 'none',
                          boxShadow: '0 0 16px rgba(56,189,248,0.25)',
                        }}
                      >
                        Apply & Continue
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {/* ═══ Step 3: Reflection ═══ */}
                  {step === 'reflection' && (
                    <motion.div
                      key="reflection"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{
                          background: 'rgba(163,230,53,0.12)',
                          border: '1px solid rgba(163,230,53,0.2)',
                        }}
                      >
                        <Trophy className="w-7 h-7 text-[#a3e635]" />
                      </div>

                      <div className="text-center">
                        <h2 className="text-xl font-bold text-[#e2e8f0] mb-1">
                          What was your biggest win today?
                        </h2>
                        <p className="text-xs text-[#94a3b8]">
                          Capture what mattered most. You'll see this when you look
                          back.
                        </p>
                      </div>

                      {/* Wins recap */}
                      {completedTasks.length > 0 && (
                        <div className="w-full">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b] block mb-2">
                            Today's Completed Tasks
                          </span>
                          <div
                            className="flex flex-col gap-1 max-h-32 overflow-y-auto rounded-lg p-2"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.06)',
                            }}
                          >
                            {completedTasks.map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center gap-2 py-1"
                              >
                                <Check className="w-3 h-3 text-[#a3e635] shrink-0" />
                                <span className="text-xs text-[#94a3b8] truncate">
                                  {t.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <textarea
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        placeholder="My biggest win today was..."
                        rows={3}
                        className="w-full rounded-xl px-4 py-3 text-base text-[#e2e8f0] placeholder:text-[#475569] focus:outline-none resize-none transition-all"
                        style={{
                          backgroundColor: '#252d3d',
                          border: '1px solid rgba(255,255,255,0.1)',
                          fontFamily: 'var(--font-ui)',
                        }}
                        autoFocus
                      />

                      <div className="flex items-center gap-3 w-full">
                        <button
                          onClick={() => {
                            setReflection('');
                            handleSaveReflection();
                          }}
                          className="px-4 py-3 rounded-xl text-sm font-medium text-[#94a3b8] hover:bg-white/[0.04] transition-colors cursor-pointer"
                          style={{ border: 'none', background: 'none' }}
                        >
                          Skip
                        </button>
                        <button
                          onClick={handleSaveReflection}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                          style={{
                            backgroundColor: '#38bdf8',
                            color: '#fff',
                            border: 'none',
                            boxShadow: '0 0 16px rgba(56,189,248,0.25)',
                          }}
                        >
                          <Sparkles className="w-4 h-4" />
                          Save & See Score
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ═══ Step 4: Score Reveal ═══ */}
                  {step === 'score' && (
                    <motion.div
                      key="score"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5 }}
                      className="flex flex-col items-center gap-6 text-center"
                    >
                      <ScoreRevealRing percentage={finalScore} />

                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.4 }}
                        className="text-sm font-medium text-[#94a3b8] max-w-xs leading-relaxed"
                      >
                        {scoreMessage}
                      </motion.p>

                      {/* Bible verse as closing thought */}
                      {bibleVerse && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.4, duration: 0.4 }}
                          className="w-full rounded-xl p-4 text-center"
                          style={{
                            backgroundColor: 'rgba(212,169,78,0.06)',
                            border: '1px solid rgba(212,169,78,0.12)',
                          }}
                        >
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <BookOpen
                              className="w-3 h-3"
                              style={{ color: '#d4a94e' }}
                            />
                            <span
                              className="text-[9px] font-semibold uppercase tracking-wider"
                              style={{ color: '#d4a94e' }}
                            >
                              Evening Reflection
                            </span>
                          </div>
                          <p
                            className="text-sm italic leading-relaxed"
                            style={{
                              fontFamily:
                                "'Cormorant Garamond', 'Georgia', serif",
                              color: '#e2e8f0',
                            }}
                          >
                            &ldquo;{bibleVerse.text}&rdquo;
                          </p>
                          <p
                            className="text-[10px] mt-1.5 uppercase tracking-wider"
                            style={{
                              color: '#d4a94e',
                              fontFamily:
                                "'Cormorant Garamond', 'Georgia', serif",
                            }}
                          >
                            &mdash; {bibleVerse.reference}
                          </p>
                        </motion.div>
                      )}

                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8, duration: 0.4 }}
                        onClick={handleFinish}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(56,189,248,0.12))',
                          color: '#e2e8f0',
                          border: '1px solid rgba(167,139,250,0.2)',
                        }}
                      >
                        <Moon className="w-4 h-4 text-[#a78bfa]" />
                        See you tomorrow morning.
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
