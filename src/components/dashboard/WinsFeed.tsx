import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function WinsFeed() {
  const tasks = useTaskStore((s) => s.tasks);

  const wins = tasks
    .filter((t) => t.status === 'completed' && t.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  return (
    <motion.div
      className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/35">
          Your Wins
        </h3>
        {wins.length > 0 && (
          <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#06d6a0]/15 text-[#06d6a0]">
            {wins.length}
          </span>
        )}
      </div>

      {/* Feed */}
      <div
        className="max-h-52 overflow-y-auto space-y-0.5"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.08) transparent',
        }}
      >
        <AnimatePresence mode="popLayout">
          {wins.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[11px] py-6 text-center text-white/20 italic"
            >
              Start checking off tasks to build momentum.
            </motion.p>
          ) : (
            wins.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex items-center gap-2.5 py-2 px-2 rounded-md hover:bg-white/[0.02] transition-colors"
              >
                <CheckCircle2
                  size={12}
                  className="shrink-0"
                  style={{ color: '#06d6a0' }}
                />
                <span className="flex-1 min-w-0 text-[13px] text-white/70 truncate">
                  {task.title}
                </span>
                <span className="text-[10px] font-mono text-white/20 shrink-0">
                  {timeAgo(task.completedAt!)}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
