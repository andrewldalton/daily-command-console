import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  ArrowRightLeft,
  Image,
  FileText,
} from 'lucide-react';
import type { DayEntry, Task } from '../../types';

/* ── Score Ring (compact) ── */
function ScoreRing({ percentage, size = 80 }: { percentage: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const ringColor =
    percentage >= 80
      ? 'var(--color-success)'
      : percentage >= 50
        ? 'var(--color-warning)'
        : 'var(--color-danger)';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="stat-value" style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)' }}>
          {percentage}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          %
        </span>
      </div>
    </div>
  );
}

/* ── Status icon per task ── */
function TaskStatusIcon({ status }: { status: Task['status'] }) {
  if (status === 'completed') return <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />;
  if (status === 'deferred') return <ArrowRightLeft size={14} style={{ color: 'var(--color-warning)' }} />;
  return <Circle size={14} style={{ color: 'var(--color-text-tertiary)' }} />;
}

/* ── Category badge ── */
const categoryColors: Record<Task['category'], string> = {
  'must-win': 'var(--color-danger)',
  work: 'var(--color-accent)',
  personal: 'var(--color-success)',
  'follow-up': 'var(--color-warning)',
};

function CategoryBadge({ category }: { category: Task['category'] }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{
        color: categoryColors[category],
        backgroundColor: `color-mix(in srgb, ${categoryColors[category]} 12%, transparent)`,
      }}
    >
      {category}
    </span>
  );
}

/* ── Collapsible section ── */
function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: typeof Image;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-bg-surface)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--color-text-primary)' }}
      >
        <div className="flex items-center gap-2">
          <Icon size={15} style={{ color: 'var(--color-text-tertiary)' }} />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {open ? (
          <ChevronUp size={15} style={{ color: 'var(--color-text-tertiary)' }} />
        ) : (
          <ChevronDown size={15} style={{ color: 'var(--color-text-tertiary)' }} />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main component ── */
export default function DayDetail({ day, onClose }: { day: DayEntry; onClose: () => void }) {
  const dateFormatted = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const completed = day.tasks.filter((t) => t.status === 'completed').length;
  const deferred = day.tasks.filter((t) => t.status === 'deferred').length;
  const pending = day.tasks.filter((t) => t.status === 'pending').length;

  // Group tasks by category
  const tasksByCategory = day.tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {});

  return (
    <motion.div
      className="surface p-6 flex flex-col gap-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {dateFormatted}
          </h2>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
            {day.totalTasks} tasks recorded
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--color-text-tertiary)', backgroundColor: 'transparent', border: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label="Close detail view"
        >
          <X size={18} />
        </button>
      </div>

      {/* Score + stats */}
      <div className="flex items-center gap-6">
        <ScoreRing percentage={day.score} />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="stat-value" style={{ fontSize: 'var(--text-xl)', color: 'var(--color-success)' }}>
                {completed}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                Done
              </span>
            </div>
            <div className="flex flex-col">
              <span className="stat-value" style={{ fontSize: 'var(--text-xl)', color: 'var(--color-warning)' }}>
                {deferred}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                Deferred
              </span>
            </div>
            <div className="flex flex-col">
              <span className="stat-value" style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-secondary)' }}>
                {pending}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                Pending
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px" style={{ backgroundColor: 'var(--color-border-subtle)' }} />

      {/* Category breakdown */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(tasksByCategory).map(([cat, tasks]) => (
          <div
            key={cat}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
          >
            <CategoryBadge category={cat as Task['category']} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {tasks.filter((t) => t.status === 'completed').length}/{tasks.length}
            </span>
          </div>
        ))}
      </div>

      {/* Task list */}
      <CollapsibleSection title="All Tasks" icon={CheckCircle2} defaultOpen>
        <div className="flex flex-col gap-1 pt-3">
          {day.tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 py-2 px-2 rounded-lg"
              style={{
                opacity: task.status === 'completed' ? 0.7 : 1,
              }}
            >
              <TaskStatusIcon status={task.status} />
              <span
                className="text-sm flex-1"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  textDecorationColor: 'var(--color-text-tertiary)',
                }}
              >
                {task.title}
              </span>
              <CategoryBadge category={task.category} />
            </div>
          ))}
          {day.tasks.length === 0 && (
            <span className="text-sm py-2" style={{ color: 'var(--color-text-tertiary)' }}>
              No tasks recorded for this day.
            </span>
          )}
        </div>
      </CollapsibleSection>

      {/* Original Notebook */}
      {day.imageUrl && (
        <CollapsibleSection title="Original Notebook" icon={Image}>
          <div className="pt-3">
            <img
              src={day.imageUrl}
              alt="Notebook page"
              className="w-full rounded-lg"
              style={{ border: '1px solid var(--color-border-subtle)' }}
            />
          </div>
        </CollapsibleSection>
      )}

      {/* OCR Result */}
      {day.ocrText && (
        <CollapsibleSection title="OCR Result" icon={FileText}>
          <pre
            className="font-mono text-xs leading-relaxed whitespace-pre-wrap pt-3"
            style={{
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {day.ocrText}
          </pre>
        </CollapsibleSection>
      )}
    </motion.div>
  );
}
