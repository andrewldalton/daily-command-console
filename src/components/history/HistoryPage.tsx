import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Image,
  Target,
  CheckCircle2,
  Search,
  X,
} from 'lucide-react';
import { useDayStore } from '../../store/dayStore';
import { useUIStore } from '../../store/uiStore';
import type { DayEntry } from '../../types';
import DayDetail from './DayDetail';

/* ── Score badge with color coding ── */
function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? '#06d6a0'
      : score >= 50
        ? '#f59e0b'
        : '#f43f5e';

  return (
    <div className="flex items-center gap-2">
      {/* Mini bar */}
      <div
        className="h-1.5 rounded-full"
        style={{
          width: 48,
          backgroundColor: 'var(--color-border-subtle)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="stat-value text-xs" style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

/* ── Day card ── */
function DayCard({
  day,
  isExpanded,
  onToggle,
}: {
  day: DayEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const dateFormatted = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const completed = day.tasks.filter((t) => t.status === 'completed').length;
  const deferred = day.tasks.filter((t) => t.status === 'deferred').length;

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full text-left p-4 cursor-pointer bg-[var(--color-bg-surface)] border border-white/[0.06] rounded-xl transition-colors hover:border-white/[0.12]"
        style={{ borderColor: isExpanded ? 'var(--color-accent-muted)' : undefined }}
      >
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          {day.imageUrl ? (
            <div
              className="w-11 h-11 rounded-lg flex-shrink-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${day.imageUrl})`,
                border: '1px solid var(--color-border-subtle)',
              }}
            />
          ) : (
            <div
              className="w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
            >
              <Image size={16} style={{ color: 'var(--color-text-disabled)' }} />
            </div>
          )}

          {/* Date + stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {dateFormatted}
              </span>
              <ScoreBadge score={day.score} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Target size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {day.totalTasks} tasks
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} style={{ color: 'var(--color-success)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {completed}/{day.totalTasks}
                </span>
              </div>
              {deferred > 0 && (
                <span className="text-xs" style={{ color: 'var(--color-warning)' }}>
                  {deferred} deferred
                </span>
              )}
            </div>
          </div>

          {/* Expand indicator */}
          <div style={{ color: 'var(--color-text-tertiary)' }}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              <DayDetail day={day} onClose={onToggle} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main page ── */
export default function HistoryPage() {
  const history = useDayStore((s) => s.history);
  const theme = useUIStore((s) => s.theme);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sort newest first, and filter
  const filteredDays = useMemo(() => {
    let days = [...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Keyword filter: match against date string, task titles, ocrText
    if (search.trim()) {
      const q = search.toLowerCase();
      days = days.filter(
        (d) =>
          d.date.includes(q) ||
          d.tasks.some((t) => t.title.toLowerCase().includes(q)) ||
          d.ocrText?.toLowerCase().includes(q)
      );
    }

    // Date range filter
    if (dateFrom) {
      days = days.filter((d) => d.date >= dateFrom);
    }
    if (dateTo) {
      days = days.filter((d) => d.date <= dateTo);
    }

    return days;
  }, [history, search, dateFrom, dateTo]);

  const hasFilters = search.trim() || dateFrom || dateTo;

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Section title */}
      <div className="flex items-center gap-3">
        <Calendar size={20} style={{ color: 'var(--color-accent)' }} />
        <h1
          className="text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)' }}
        >
          Archive
        </h1>
      </div>

      {/* Search / filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Keyword search */}
        <div
          className="flex-1 flex items-center gap-2 px-1 py-2 border-b border-white/[0.1]"
        >
          <Search size={15} style={{ color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search tasks, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm border-none"
            style={{
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-ui)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="cursor-pointer p-0.5"
              style={{ color: 'var(--color-text-tertiary)', background: 'none', border: 'none' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Date range */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs flex-1 min-w-[130px] sm:flex-none"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-ui)',
              colorScheme: theme,
            }}
          />
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            to
          </span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs flex-1 min-w-[130px] sm:flex-none"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-ui)',
              colorScheme: theme,
            }}
          />
          {hasFilters && (
            <button
              onClick={() => {
                setSearch('');
                setDateFrom('');
                setDateTo('');
              }}
              className="text-xs px-2 py-1 rounded-lg cursor-pointer"
              style={{
                color: 'var(--color-accent)',
                background: 'var(--color-accent-muted)',
                border: 'none',
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Day list */}
      {filteredDays.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredDays.map((day, index) => (
            <motion.div
              key={day.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: Math.min(index * 0.05, 0.4) }}
            >
              <DayCard
                day={day}
                isExpanded={expandedId === day.id}
                onToggle={() => setExpandedId(expandedId === day.id ? null : day.id)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <motion.div
          className="surface flex flex-col items-center justify-center py-16 px-6 text-center gap-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: 'var(--color-accent-muted)',
            }}
          >
            <Calendar size={24} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              {hasFilters ? 'No matching days found' : 'No days recorded yet.'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {hasFilters
                ? 'Try adjusting your search or date filters.'
                : 'Upload your first notebook page to get started.'}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
