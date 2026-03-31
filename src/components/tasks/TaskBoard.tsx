import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useDayStore } from '../../store/dayStore';
import type { Task } from '../../types';
import TaskCard from './TaskCard';
import AddTaskModal from './AddTaskModal';

interface CategoryConfig {
  key: Task['category'];
  label: string;
  color: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'must-win',
    label: 'Must Win Today',
    color: '#f43f5e',
  },
  {
    key: 'work',
    label: 'Work',
    color: '#06d6a0',
  },
  {
    key: 'personal',
    label: 'Personal',
    color: '#8b5cf6',
  },
  {
    key: 'follow-up',
    label: 'Follow-Up',
    color: '#f59e0b',
  },
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

  const categoryTasks = tasks.filter((t) => t.category === config.key);
  const pendingTasks = categoryTasks.filter((t) => t.status !== 'completed');
  const completedTasks = categoryTasks.filter((t) => t.status === 'completed');

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
    setQuickAddOpen(false);
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
    <div className="flex flex-col rounded-lg bg-white/[0.02] border border-white/[0.06] overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          {/* Colored pip */}
          <div
            className="w-[3px] h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: config.color }}
          />
          <h3 className="text-[11px] font-semibold tracking-wider uppercase text-white/50">
            {config.label}
          </h3>
          <span className="text-[10px] font-mono font-medium text-white/30 bg-white/[0.05] px-1.5 py-0.5 rounded-full">
            {pendingTasks.length}
          </span>
        </div>
        <button
          onClick={openQuickAdd}
          className="p-1 rounded-md text-white/25 hover:text-white/50 hover:bg-white/[0.05] transition-all duration-150"
          title="Add task"
        >
          <Plus className="w-4 h-4" />
        </button>
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
              <div className="flex items-center gap-2 mb-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={quickAddValue}
                  onChange={(e) => setQuickAddValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      inputRef.current?.blur();
                      handleQuickAdd();
                    }
                    if (e.key === 'Escape') {
                      setQuickAddOpen(false);
                      setQuickAddValue('');
                    }
                  }}
                  placeholder="Type a task and press Enter..."
                  className="flex-1 bg-transparent border-b border-white/10 px-1 py-1.5 text-base text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#06d6a0]/40 transition-colors duration-150"
                />
                <button
                  onClick={() => {
                    setQuickAddOpen(false);
                    setQuickAddValue('');
                  }}
                  className="text-white/20 hover:text-white/40 text-[10px] uppercase tracking-wider transition-colors"
                >
                  Esc
                </button>
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
              className="text-[11px] text-white/15 text-center py-4 italic"
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
              className="flex items-center gap-1.5 text-[10px] font-medium text-white/20 hover:text-white/35 uppercase tracking-wider transition-colors"
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {CATEGORIES.map((cat) => (
        <CategorySection key={cat.key} config={cat} />
      ))}
    </div>
  );
}
