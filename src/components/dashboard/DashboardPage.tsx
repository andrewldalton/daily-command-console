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

      {/* ── Main Grid: Tasks (7 cols) + Sidebar (5 cols) — 58/42 split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left column: Tasks (7 cols on desktop) */}
        <div className="min-w-0 lg:col-span-7 order-3 lg:order-1">
          <TaskBoard />
        </div>

        {/* Right column: Sidebar widgets (5 cols on desktop) */}
        <aside className="lg:col-span-5 flex flex-col gap-4 order-2 lg:order-2">
          <MomentumPanel />
          <ProspectsPipeline />
          <WinsFeed />
        </aside>
      </div>
    </motion.div>
  );
}
