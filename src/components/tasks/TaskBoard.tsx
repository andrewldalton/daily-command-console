import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useDayStore } from '../../store/dayStore';
import type { Task } from '../../types';
import TaskCard from './TaskCard';
import AddTaskModal from './AddTaskModal';
import GhostTaskBanner from './GhostTaskBanner';
import GhostTaskModal from './GhostTaskModal';

interface CategoryConfig {
  key: Task['category'];
  label: string;
  color: string;
  maxPending?: number;
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'must-win', label: 'Big 3', color: '#f472b6', maxPending: 3 },
  { key: 'work', label: 'Daily Blitz', color: '#38bdf8' },
  { key: 'personal', label: 'Personal', color: '#a78bfa' },
  { key: 'follow-up', label: 'Follow-Up', color: '#fbbf24' },
];

function CategorySection({ config }: { config: CategoryConfig }) {
  const { tasks, addTask, completeTask, deferTask, deleteTask } =
    useTaskStore();
  const today = useDayStore((s) => s.today);

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categoryTasks = tasks.filter((t) => t.category === config.key && today && t.dayId === today.id);
  const pendingTasks = categoryTasks.filter((t) => t.status !== 'completed');
  const completedTasks = categoryTasks.filter((t) => t.status === 'completed');
  const atMaxPending = config.maxPending != null && pendingTasks.length >= config.maxPending;

  const handleQuickAdd = useCallback(() => {
    const title = quickAddValue.trim();
    if (!title || !today) return;

    addTask({
      dayId: today.id,
      title,
      category: config.key,
      priority: 'medium',
      source: 'manual',
    });

    setQuickAddValue('');
    // Stay open for more tasks — refocus input
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [quickAddValue, today, addTask, config.key]);

  // Focus input when quick-add opens
  useEffect(() => {
    if (quickAddOpen) {
      inputRef.current?.focus();
    }
  }, [quickAddOpen]);

  const openQuickAdd = () => {
    setQuickAddOpen(true);
  };

  return (
    <div className="flex flex-col rounded-lg bg-[#252d3d]/60 border border-white/[0.06] overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          {/* Colored pip */}
          <div
            className="w-[3px] h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: config.color }}
          />
          <h3 className="text-[11px] font-semibold tracking-wider uppercase text-[#94a3b8]">
            {config.label}
          </h3>
          <span className="text-[10px] font-mono font-medium text-[#64748b] bg-white/[0.06] px-1.5 py-0.5 rounded-full">
            {pendingTasks.length}
          </span>
        </div>
        {atMaxPending ? (
          <span
            className="text-[10px] font-mono font-semibold text-[#fbbf24] bg-[#fbbf24]/10 px-2 py-0.5 rounded-full border border-[#fbbf24]/20"
            title={`Maximum ${config.maxPending} tasks reached`}
          >
            {pendingTasks.length}/{config.maxPending}
          </span>
        ) : (
          <button
            onClick={openQuickAdd}
            className="p-1 rounded-md text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.06] transition-all duration-150"
            title="Add task"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-1.5 px-3 pb-3 pt-1 min-h-[48px]">
        {/* Quick-add input */}
        <AnimatePresence>
          {quickAddOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 mb-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={quickAddValue}
                  onChange={(e) => setQuickAddValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && quickAddValue.trim()) {
                      handleQuickAdd();
                    }
                    if (e.key === 'Escape') {
                      setQuickAddOpen(false);
                      setQuickAddValue('');
                    }
                  }}
                  placeholder="Type a task and press Enter to add more..."
                  className="flex-1 bg-transparent border-b border-white/10 px-1 py-1.5 text-base text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#38bdf8]/40 transition-colors duration-150"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setQuickAddOpen(false);
                      setQuickAddValue('');
                    }}
                    className="px-3 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.04] transition-colors"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => {
                      if (quickAddValue.trim()) handleQuickAdd();
                    }}
                    disabled={!quickAddValue.trim()}
                    className="px-3 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider bg-[#38bdf8] text-white hover:bg-[#0ea5e9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending tasks */}
        <AnimatePresence mode="popLayout">
          {pendingTasks.length === 0 && !quickAddOpen && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[11px] text-[#64748b]/60 text-center py-4 italic"
            >
              No tasks yet
            </motion.p>
          )}
          {pendingTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={completeTask}
              onDefer={deferTask}
              onDelete={deleteTask}
              onEdit={setEditingTask}
            />
          ))}
        </AnimatePresence>

        {/* Completed tasks toggle */}
        {completedTasks.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-1.5 text-[10px] font-medium text-[#64748b] hover:text-[#94a3b8] uppercase tracking-wider transition-colors"
            >
              {showCompleted ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              Show completed ({completedTasks.length})
            </button>

            <AnimatePresence>
              {showCompleted && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-1.5 mt-1.5 overflow-hidden"
                >
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={completeTask}
                      onDefer={deferTask}
                      onDelete={deleteTask}
                      onEdit={setEditingTask}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editingTask && (
          <AddTaskModal
            key="add-task-modal"
            initialTask={editingTask}
            onClose={() => setEditingTask(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TaskBoard() {
  const tasks = useTaskStore((s) => s.tasks);
  const today = useDayStore((s) => s.today);
  const { commitGhostTask, killGhostTask, delegateGhostTask } = useTaskStore();
  const [ghostModalTask, setGhostModalTask] = useState<Task | null>(null);

  const ghostTasks = useMemo(() => {
    if (!today) return [];
    return tasks.filter(
      (t) => t.dayId === today.id && t.deferredCount >= 5 && t.status !== 'completed'
    );
  }, [tasks, today]);

  const handleResolveGhosts = () => {
    if (ghostTasks.length > 0) {
      setGhostModalTask(ghostTasks[0]);
    }
  };

  const handleGhostCommit = (id: string) => {
    commitGhostTask(id);
    // Move to next ghost task or close
    const remaining = ghostTasks.filter((t) => t.id !== id);
    setGhostModalTask(remaining.length > 0 ? remaining[0] : null);
  };

  const handleGhostKill = (id: string) => {
    killGhostTask(id);
    const remaining = ghostTasks.filter((t) => t.id !== id);
    setGhostModalTask(remaining.length > 0 ? remaining[0] : null);
  };

  const handleGhostDelegate = (id: string, delegateTo: string) => {
    delegateGhostTask(id, delegateTo);
    const remaining = ghostTasks.filter((t) => t.id !== id);
    setGhostModalTask(remaining.length > 0 ? remaining[0] : null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Ghost Task Banner */}
      <GhostTaskBanner ghostCount={ghostTasks.length} onResolve={handleResolveGhosts} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => (
          <CategorySection key={cat.key} config={cat} />
        ))}
      </div>

      {/* Ghost Task Decision Modal */}
      <AnimatePresence>
        {ghostModalTask && (
          <GhostTaskModal
            key={ghostModalTask.id}
            task={ghostModalTask}
            onCommit={handleGhostCommit}
            onDelegate={handleGhostDelegate}
            onKill={handleGhostKill}
            onClose={() => setGhostModalTask(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
