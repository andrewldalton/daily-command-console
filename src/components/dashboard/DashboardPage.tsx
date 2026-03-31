import { motion } from 'framer-motion';
import TodayHero from './TodayHero';
import MomentumPanel from './MomentumPanel';
import ProspectsPipeline from './ProspectsPipeline';
import WinsFeed from './WinsFeed';
import TaskBoard from '../tasks/TaskBoard';
import NotebookUpload from '../upload/NotebookUpload';

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* ── Hero: greeting, time, weather, Bible verse, national day, quote, stats ── */}
      <TodayHero />

      {/* ── Notebook Upload (full width, compact) ── */}
      <div className="mb-4 sm:mb-6">
        <NotebookUpload />
      </div>

      {/* ── Main Grid: Tasks + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 sm:gap-6">
        <div className="min-w-0 order-3 lg:order-1">
          <TaskBoard />
        </div>

        <aside className="flex flex-col gap-4 order-2 lg:order-2">
          <MomentumPanel />
          <ProspectsPipeline />
          <WinsFeed />
        </aside>
      </div>
    </motion.div>
  );
}
