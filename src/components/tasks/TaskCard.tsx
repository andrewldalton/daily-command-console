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
} from 'lucide-react';
import type { Task } from '../../types';

const CATEGORY_COLORS: Record<Task['category'], string> = {
  'must-win': '#f43f5e',
  work: '#06d6a0',
  personal: '#8b5cf6',
  'follow-up': '#f59e0b',
};

const CATEGORY_LABEL: Record<Task['category'], string> = {
  'must-win': 'Must Win',
  work: 'Work',
  personal: 'Personal',
  'follow-up': 'Follow-Up',
};

const PRIORITY_DOT: Record<Task['priority'], string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-400',
  low: 'bg-gray-600',
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
  const categoryColor = CATEGORY_COLORS[task.category];

  const handleComplete = (id: string) => {
    if (!isCompleted) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
    onComplete(id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: isCompleted ? 0.5 : 1,
        y: 0,
        scale: isCompleted ? 0.98 : 1,
        boxShadow: justCompleted
          ? '0 0 20px rgba(6, 214, 160, 0.3), 0 0 40px rgba(6, 214, 160, 0.1)'
          : '0 0 0px rgba(6, 214, 160, 0)',
      }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative rounded-lg bg-[var(--color-bg-surface)] border border-white/[0.06] transition-all duration-150 hover:border-white/[0.12] ${
        repeatedlyDeferred ? 'ring-1 ring-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.1)]' : ''
      }`}
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
                ? 'bg-[#06d6a0] border-[#06d6a0]'
                : 'border-white/20 hover:border-[#06d6a0]/60'
            }`}
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
                  ? 'line-through text-white/30'
                  : 'text-white/90'
              }`}
              style={
                isCompleted
                  ? { textDecorationColor: 'rgba(255,255,255,0.15)' }
                  : undefined
              }
            >
              {task.title}
            </span>

            {/* Deferred warning */}
            {repeatedlyDeferred && (
              <span title={`Deferred ${task.deferredCount} times`}>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mt-1.5">
            {/* Category badge with colored dot */}
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium tracking-wide uppercase bg-white/[0.04] text-white/40 border border-white/[0.06]">
              <span
                className="w-1 h-1 rounded-full flex-shrink-0"
                style={{ backgroundColor: categoryColor }}
              />
              {CATEGORY_LABEL[task.category]}
            </span>

            {/* Source badge */}
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium tracking-wide uppercase bg-white/[0.03] text-white/30 border border-white/[0.06]">
              {SOURCE_LABEL[task.source]}
            </span>

            {/* Deferred badge */}
            {isDeferred && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/15">
                <Clock className="w-2.5 h-2.5" />
                deferred
              </span>
            )}

            {/* Duration */}
            {task.estimatedMinutes && (
              <span className="text-[9px] text-white/25 font-mono">
                {task.estimatedMinutes}m
              </span>
            )}

            {/* Notes toggle */}
            {task.notes && (
              <button
                onClick={() => setNotesOpen(!notesOpen)}
                className="flex items-center gap-0.5 text-[9px] text-white/25 hover:text-white/40 transition-colors uppercase tracking-wide"
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
                <p className="mt-2 text-[11px] text-white/40 leading-relaxed border-t border-white/[0.06] pt-2">
                  {task.notes}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons -- visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 max-sm:opacity-100 transition-opacity duration-150 flex-shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded-md text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDefer(task.id)}
            className="p-1 rounded-md text-white/20 hover:text-amber-400 hover:bg-white/[0.05] transition-colors"
            title="Defer to tomorrow"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 rounded-md text-white/20 hover:text-rose-400 hover:bg-white/[0.05] transition-colors"
            title="Delete"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
