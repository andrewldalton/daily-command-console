import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useDayStore } from '../../store/dayStore';
import type { Task } from '../../types';

interface AddTaskModalProps {
  onClose: () => void;
  initialCategory?: Task['category'];
  initialTask?: Task;
}

const CATEGORY_OPTIONS: { value: Task['category']; label: string }[] = [
  { value: 'must-win', label: 'Must Win' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'follow-up', label: 'Follow-Up' },
];

const PRIORITY_OPTIONS: { value: Task['priority']; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function AddTaskModal({
  onClose,
  initialCategory,
  initialTask,
}: AddTaskModalProps) {
  const { addTask, updateTask } = useTaskStore();
  const today = useDayStore((s) => s.today);
  const isEditing = !!initialTask;

  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [category, setCategory] = useState<Task['category']>(
    initialTask?.category ?? initialCategory ?? 'work'
  );
  const [priority, setPriority] = useState<Task['priority']>(
    initialTask?.priority ?? 'medium'
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initialTask?.estimatedMinutes?.toString() ?? ''
  );
  const [notes, setNotes] = useState(initialTask?.notes ?? '');

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    if (isEditing && initialTask) {
      updateTask(initialTask.id, {
        title: trimmedTitle,
        category,
        priority,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
        notes: notes.trim() || undefined,
      });
    } else if (today) {
      addTask({
        dayId: today.id,
        title: trimmedTitle,
        category,
        priority,
        source: 'manual',
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  const selectClass =
    'w-full bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow)] transition-all duration-150 appearance-none cursor-pointer';

  const inputClass =
    'w-full bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] px-3 py-2 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow)] transition-all duration-150';

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[var(--z-overlay)] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full max-w-md bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
            <h2 className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">
              {isEditing ? 'Edit Task' : 'New Task'}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-4 px-5 py-5">
            {/* Title */}
            <div>
              <label className="block text-[var(--text-xs)] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="What needs to get done?"
                className={inputClass}
                autoFocus
              />
            </div>

            {/* Category + Priority row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--text-xs)] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as Task['category'])
                  }
                  className={selectClass}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-xs)] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as Task['priority'])
                  }
                  className={selectClass}
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-[var(--text-xs)] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                Estimated Duration{' '}
                <span className="text-[var(--color-text-disabled)]">(min, optional)</span>
              </label>
              <input
                type="number"
                min="1"
                max="480"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="30"
                className={inputClass}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[var(--text-xs)] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                Notes{' '}
                <span className="text-[var(--color-text-disabled)]">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--color-border-subtle)]">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-[var(--radius-md)] text-[var(--text-sm)] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-5 py-2 rounded-[var(--radius-md)] text-[var(--text-sm)] font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-[var(--shadow-sm)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              {isEditing ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
