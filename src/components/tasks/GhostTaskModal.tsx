import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Skull, Target, UserPlus, Trash2 } from 'lucide-react';
import type { Task } from '../../types';

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

interface GhostTaskModalProps {
  task: Task;
  onCommit: (taskId: string) => void;
  onDelegate: (taskId: string, delegateTo: string) => void;
  onKill: (taskId: string) => void;
  onClose: () => void;
}

type SelectedAction = 'commit' | 'delegate' | 'kill' | null;

export default function GhostTaskModal({
  task,
  onCommit,
  onDelegate,
  onKill,
  onClose,
}: GhostTaskModalProps) {
  const [selectedAction, setSelectedAction] = useState<SelectedAction>(null);
  const [delegateName, setDelegateName] = useState('');
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    if (!isExiting) onClose();
  }, [isExiting, onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClose]);

  const executeAction = (action: SelectedAction) => {
    setSelectedAction(action);
    setIsExiting(true);

    setTimeout(() => {
      switch (action) {
        case 'commit':
          onCommit(task.id);
          break;
        case 'delegate':
          onDelegate(task.id, delegateName.trim());
          break;
        case 'kill':
          onKill(task.id);
          break;
      }
    }, 400);
  };

  const handleCommit = () => executeAction('commit');
  const handleKill = () => executeAction('kill');
  const handleDelegateConfirm = () => {
    if (delegateName.trim()) executeAction('delegate');
  };

  const categoryColor = CATEGORY_COLORS[task.category];

  return (
    <AnimatePresence>
      {!isExiting && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[var(--z-overlay)]"
            style={{ backgroundColor: 'rgba(14, 17, 26, 0.92)' }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
          >
            <div className="w-full max-w-md bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] overflow-hidden relative">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex flex-col items-center pt-8 pb-4 px-6">
                {/* Skull icon with glow */}
                <motion.div
                  animate={{
                    opacity: [0.7, 1, 0.7],
                    filter: [
                      'drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))',
                      'drop-shadow(0 0 16px rgba(244, 114, 182, 0.6))',
                      'drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))',
                    ],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Skull className="w-10 h-10 text-[#fbbf24]" />
                </motion.div>

                <h2 className="mt-4 text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)]">
                  This task is haunting you
                </h2>
                <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                  Deferred {task.deferredCount} times — time to decide.
                </p>
              </div>

              {/* Task preview */}
              <div className="mx-6 mb-5">
                <motion.div
                  animate={{
                    opacity: [0.45, 0.65, 0.45],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="rounded-[var(--radius-md)] bg-[var(--color-bg-surface,#252d3d)] border border-white/[0.06] px-4 py-3"
                  style={{ filter: 'blur(0.3px)' }}
                >
                  <p className="text-[var(--text-sm)] font-medium text-[var(--color-text-primary)]">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium tracking-wide uppercase bg-white/[0.04] text-[#94a3b8] border border-white/[0.06]">
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ backgroundColor: categoryColor }}
                      />
                      {CATEGORY_LABEL[task.category]}
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium tracking-wide uppercase bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20">
                      deferred x{task.deferredCount}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3 px-6 pb-7">
                {/* Commit */}
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{
                    boxShadow: '0 0 20px rgba(163, 230, 53, 0.2)',
                    borderColor: 'rgba(163, 230, 53, 0.4)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCommit}
                  className={`w-full flex items-start gap-3.5 px-4 py-3.5 rounded-[var(--radius-xl)] border transition-all duration-150 text-left ${
                    selectedAction === 'commit'
                      ? 'border-[#a3e635]/50 bg-[#a3e635]/10 shadow-[0_0_24px_rgba(163,230,53,0.25)]'
                      : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface,#252d3d)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-[#a3e635]/10 flex items-center justify-center">
                    <Target className="w-4.5 h-4.5 text-[#a3e635]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-sm)] font-semibold text-[#a3e635]">
                      Commit — Pin to Big 3
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 leading-relaxed">
                      This goes to tomorrow's Must-Win. No more excuses.
                    </p>
                  </div>
                </motion.button>

                {/* Delegate */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.button
                    whileHover={{
                      boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)',
                      borderColor: 'rgba(56, 189, 248, 0.4)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      setSelectedAction(
                        selectedAction === 'delegate' ? null : 'delegate'
                      )
                    }
                    className={`w-full flex items-start gap-3.5 px-4 py-3.5 rounded-[var(--radius-xl)] border transition-all duration-150 text-left ${
                      selectedAction === 'delegate'
                        ? 'border-[#38bdf8]/50 bg-[#38bdf8]/10 shadow-[0_0_24px_rgba(56,189,248,0.2)]'
                        : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface,#252d3d)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-[#38bdf8]/10 flex items-center justify-center">
                      <UserPlus className="w-4.5 h-4.5 text-[#38bdf8]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-sm)] font-semibold text-[#38bdf8]">
                        Delegate — Hand it off
                      </p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 leading-relaxed">
                        Assign this to someone else and move on.
                      </p>
                    </div>
                  </motion.button>

                  {/* Delegate input */}
                  <AnimatePresence>
                    {selectedAction === 'delegate' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-2 mt-2 pl-[52px]">
                          <input
                            type="text"
                            value={delegateName}
                            onChange={(e) => setDelegateName(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && handleDelegateConfirm()
                            }
                            placeholder="Who's taking this?"
                            autoFocus
                            className="flex-1 bg-[var(--color-bg-base,#1e2433)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] px-3 py-2 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:border-[#38bdf8] focus:shadow-[0_0_12px_rgba(56,189,248,0.15)] transition-all duration-150"
                          />
                          <button
                            onClick={handleDelegateConfirm}
                            disabled={!delegateName.trim()}
                            className="px-4 py-2 rounded-[var(--radius-sm)] text-[var(--text-sm)] font-semibold bg-[#38bdf8] hover:bg-[#0ea5e9] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                          >
                            Confirm
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Kill */}
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{
                    boxShadow: '0 0 20px rgba(244, 114, 182, 0.2)',
                    borderColor: 'rgba(244, 114, 182, 0.4)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleKill}
                  className={`w-full flex items-start gap-3.5 px-4 py-3.5 rounded-[var(--radius-xl)] border transition-all duration-150 text-left ${
                    selectedAction === 'kill'
                      ? 'border-[#f472b6]/50 bg-[#f472b6]/10 shadow-[0_0_24px_rgba(244,114,182,0.25)]'
                      : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface,#252d3d)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-[#f472b6]/10 flex items-center justify-center">
                    <Trash2 className="w-4.5 h-4.5 text-[#f472b6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-sm)] font-semibold text-[#f472b6]">
                      Kill — Send to graveyard
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 leading-relaxed">
                      Accept it's not happening. Move on.
                    </p>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
