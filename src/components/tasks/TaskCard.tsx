import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  X,
  Pencil,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Check,
  RotateCcw,
  Skull,
} from 'lucide-react';
import type { Task } from '../../types';
import { useSwipeActions, SwipeRevealLayer } from '../../hooks/useSwipeActions';

const CATEGORY_COLORS: Record<Task['category'], string> = {
  'must-win': '#f472b6',
  work: '#38bdf8',
  personal: '#a78bfa',
  'follow-up': '#fbbf24',
};

const CATEGORY_LABEL: Record<Task['category'], string> = {
  'must-win': 'Big 3',
  work: 'Blitz',
  personal: 'Personal',
  'follow-up': 'Follow-Up',
};

const PRIORITY_DOT: Record<Task['priority'], string> = {
  high: 'bg-pink-400',
  medium: 'bg-amber-400',
  low: 'bg-slate-600',
};

const SOURCE_LABEL: Record<Task['source'], string> = {
  notebook: 'notebook',
  manual: 'manual',
  carryover: 'carryover',
};

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onDefer: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export default function TaskCard({
  task,
  onComplete,
  onDefer,
  onDelete,
  onEdit,
}: TaskCardProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const isCompleted = task.status === 'completed';
  const isDeferred = task.status === 'deferred';
  const repeatedlyDeferred = task.deferredCount > 2;
  const isGhost = task.deferredCount >= 5;
  const isDecaying = task.deferredCount >= 4;
  const categoryColor = CATEGORY_COLORS[task.category];

  const { containerRef, dragProps, revealState } = useSwipeActions({
    onSwipeRight: () => onComplete(task.id),
    onSwipeLeft: () => onDefer(task.id),
    enabled: !isCompleted,
  });

  const handleComplete = (id: string) => {
    if (!isCompleted) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
    onComplete(id);
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-lg">
      <SwipeRevealLayer direction="right" active={revealState === 'complete'} />
      <SwipeRevealLayer direction="left" active={revealState === 'defer'} />
      <motion.div
        {...dragProps}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{
          ...dragProps.animate,
          opacity: isCompleted ? 0.5 : 1,
          y: 0,
          scale: isCompleted ? 0.98 : 1,
          boxShadow: justCompleted
            ? '0 0 20px rgba(56, 189, 248, 0.3), 0 0 40px rgba(56, 189, 248, 0.1)'
            : '0 0 0px rgba(56, 189, 248, 0)',
        }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ ...dragProps.transition, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={`group relative rounded-lg bg-[#252d3d] border border-white/[0.06] transition-all duration-150 hover:border-white/[0.12] ${
          isGhost
            ? 'ring-1 ring-red-500/40 shadow-[0_0_16px_rgba(244,114,182,0.15)]'
            : isDecaying
              ? 'ring-1 ring-red-400/25 shadow-[0_0_12px_rgba(239,68,68,0.1)]'
              : repeatedlyDeferred
                ? 'ring-1 ring-amber-500/30 shadow-[0_0_12px_rgba(251,191,36,0.1)]'
                : ''
        }`}
        style={{
          borderLeft: `3px solid ${categoryColor}`,
          ...(isGhost ? { opacity: 0.6, filter: 'saturate(0.6)' } : {}),
        }}
      >
      <div className="flex items-start gap-3 px-3 py-2.5">
        {/* Custom Checkbox */}
        <button
          onClick={() => handleComplete(task.id)}
          className="mt-0.5 flex-shrink-0 focus:outline-none"
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-colors duration-150 ${
              isCompleted
                ? 'border-transparent'
                : 'border-white/20 hover:border-[#38bdf8]/60'
            }`}
            style={isCompleted ? { backgroundColor: categoryColor, borderColor: categoryColor } : undefined}
          >
            {isCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </motion.div>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Priority dot */}
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`}
              title={`${task.priority} priority`}
            />

            {/* Title */}
            <span
              className={`text-[13px] font-medium leading-snug transition-all duration-200 ${
                isCompleted
                  ? 'line-through text-[#64748b]'
                  : 'text-[#e2e8f0]'
              }`}
              style={
                isCompleted
                  ? { textDecorationColor: 'rgba(100,116,139,0.4)' }
                  : undefined
              }
            >
              {task.title}
            </span>

            {/* Ghost/Deferred warning */}
            {isGhost ? (
              <span title={`Ghost task — deferred ${task.deferredCount} times`}>
                <Skull className="w-3.5 h-3.5 text-[#f472b6] flex-shrink-0 animate-pulse" />
              </span>
            ) : repeatedlyDeferred ? (
              <span title={`Deferred ${task.deferredCount} times`}>
                <AlertTriangle className="w-3.5 h-3.5 text-[#fbbf24] flex-shrink-0" />
              </span>
            ) : null}
          </div>

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mt-1.5">
            {/* Category badge with colored dot */}
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium tracking-wide uppercase bg-white/[0.04] text-[#94a3b8] border border-white/[0.06]">
              <span
                className="w-1 h-1 rounded-full flex-shrink-0"
                style={{ backgroundColor: categoryColor }}
              />
              {CATEGORY_LABEL[task.category]}
            </span>

            {/* Source badge */}
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium tracking-wide uppercase bg-white/[0.03] text-[#64748b] border border-white/[0.06]">
              {SOURCE_LABEL[task.source]}
            </span>

            {/* Carry-forward badge */}
            {task.source === 'carryover' && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium tracking-wide uppercase bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20">
                <RotateCcw className="w-2.5 h-2.5" />
                {task.deferredCount > 1 ? `Carried \u00d7${task.deferredCount}` : 'Carried over'}
              </span>
            )}

            {/* Deferred badge */}
            {isDeferred && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium tracking-wide uppercase bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/15">
                <Clock className="w-2.5 h-2.5" />
                deferred
              </span>
            )}

            {/* Duration */}
            {task.estimatedMinutes && (
              <span className="text-[9px] text-[#64748b] font-mono">
                {task.estimatedMinutes}m
              </span>
            )}

            {/* Notes toggle */}
            {task.notes && (
              <button
                onClick={() => setNotesOpen(!notesOpen)}
                className="flex items-center gap-0.5 text-[9px] text-[#64748b] hover:text-[#94a3b8] transition-colors uppercase tracking-wide"
              >
                {notesOpen ? (
                  <ChevronDown className="w-2.5 h-2.5" />
                ) : (
                  <ChevronRight className="w-2.5 h-2.5" />
                )}
                notes
              </button>
            )}
          </div>

          {/* Expandable notes */}
          <AnimatePresence>
            {notesOpen && task.notes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <p className="mt-2 text-[11px] text-[#94a3b8] leading-relaxed border-t border-white/[0.06] pt-2">
                  {task.notes}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons -- visible on hover, always visible on mobile */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 max-sm:opacity-100 transition-opacity duration-150 flex-shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded-md text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.06] transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDefer(task.id)}
            className="p-1 rounded-md text-[#64748b] hover:text-[#fbbf24] hover:bg-white/[0.06] transition-colors"
            title="Defer to tomorrow"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 rounded-md text-[#64748b] hover:text-[#f472b6] hover:bg-white/[0.06] transition-colors"
            title="Delete"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
    </div>
  );
}
