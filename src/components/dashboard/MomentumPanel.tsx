import { motion } from 'framer-motion';
import { Sun, Zap, AlertTriangle } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useDayStore } from '../../store/dayStore';

function ProgressRing({
  percentage,
  size = 140,
  strokeWidth = 10,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const filterId = 'glow-ring';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Filled arc with glow */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          filter={`url(#${filterId})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-3xl font-bold text-[#e2e8f0]"
          style={{ textShadow: '0 0 20px rgba(56, 189, 248, 0.4)' }}
        >
          {percentage}%
        </span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-[#64748b] mt-0.5">
          Execution Score
        </span>
      </div>
    </div>
  );
}

function StatCell({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white/[0.04] border border-white/[0.07] rounded-lg p-3">
      <span
        className="font-mono text-xl font-bold"
        style={{ color: color ?? '#e2e8f0' }}
      >
        {value}
      </span>
      <span className="text-[9px] font-medium uppercase tracking-wider text-[#64748b]">
        {label}
      </span>
    </div>
  );
}

function DayHealthBadge({ total }: { total: number }) {
  let label: string;
  let color: string;
  let Icon: typeof Sun;
  let pulse = false;

  if (total < 5) {
    label = 'Light';
    color = '#38bdf8';
    Icon = Sun;
  } else if (total <= 12) {
    label = 'Normal';
    color = '#a3e635';
    Icon = Zap;
  } else {
    label = 'Overloaded';
    color = '#f472b6';
    Icon = AlertTriangle;
    pulse = true;
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider border ${
        pulse ? 'animate-pulse' : ''
      }`}
      style={{
        color,
        backgroundColor: `${color}15`,
        borderColor: `${color}20`,
      }}
    >
      <Icon className="w-3 h-3" />
      {label}
    </div>
  );
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function WeekBars({ history }: { history: { score: number; date: string }[] }) {
  const today = new Date();
  const days: { score: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const entry = history.find((h) => h.date === dateStr);
    days.push({ score: entry?.score ?? 0 });
  }

  // Determine starting day-of-week for the label row
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 6);
  const startDow = startDate.getDay(); // 0=Sun

  return (
    <div className="w-full flex flex-col items-center gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-[#64748b]">
        7-Day Trend
      </span>
      <div className="flex items-end gap-2 justify-center h-8">
        {days.map((day, i) => {
          const height = Math.max(4, (day.score / 100) * 28);
          const isToday = i === 6;
          const opacity = isToday ? 1 : day.score > 0 ? 0.4 + (day.score / 100) * 0.4 : 0.1;
          return (
            <motion.div
              key={i}
              className="rounded-sm"
              style={{
                width: 6,
                backgroundColor: `rgba(56, 189, 248, ${opacity})`,
              }}
              initial={{ height: 0 }}
              animate={{ height }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.06, ease: 'easeOut' }}
            />
          );
        })}
      </div>
      <div className="flex gap-2 justify-center">
        {days.map((_, i) => {
          const dow = (startDow + i) % 7;
          // Convert JS day (0=Sun) to label index (0=Mon)
          const labelIdx = dow === 0 ? 6 : dow - 1;
          return (
            <span key={i} className="text-[9px] text-[#64748b] w-[6px] text-center font-mono">
              {DAY_LETTERS[labelIdx]}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function MomentumPanel() {
  const tasks = useTaskStore((s) => s.tasks);
  const history = useDayStore((s) => s.history);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const deferred = tasks.filter((t) => t.status === 'deferred').length;
  const remaining = total - completed - deferred;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <motion.div
      className="bg-[#252d3d]/60 border border-white/[0.06] rounded-lg p-6 flex flex-col items-center gap-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
    >
      {/* Progress Ring */}
      <ProgressRing percentage={percentage} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        <StatCell value={total} label="Total" />
        <StatCell value={completed} label="Done" color="#38bdf8" />
        <StatCell value={remaining} label="Left" />
        <StatCell value={deferred} label="Defer" color="#fbbf24" />
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-white/[0.06]" />

      {/* Day Health */}
      <DayHealthBadge total={total} />

      {/* 7-Day Trend */}
      <WeekBars history={history} />
    </motion.div>
  );
}
