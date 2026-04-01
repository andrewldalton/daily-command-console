import { motion } from 'framer-motion';
import { Ghost } from 'lucide-react';

interface GhostTaskBannerProps {
  ghostCount: number;
  onResolve: () => void;
}

export default function GhostTaskBanner({
  ghostCount,
  onResolve,
}: GhostTaskBannerProps) {
  if (ghostCount <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[var(--radius-md)] border border-[#fbbf24]/20 overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(244, 114, 182, 0.10) 100%)',
      }}
    >
      <motion.div
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex items-center justify-between gap-3 px-4 py-2.5"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Ghost className="w-4 h-4 text-[#fbbf24] flex-shrink-0" />
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-snug">
            You have{' '}
            <span className="font-semibold text-[#fbbf24]">
              {ghostCount} ghost task{ghostCount !== 1 ? 's' : ''}
            </span>{' '}
            haunting your list
          </p>
        </div>

        <button
          onClick={onResolve}
          className="flex-shrink-0 px-3 py-1.5 rounded-[var(--radius-sm)] text-[var(--text-xs)] font-semibold uppercase tracking-wider text-[#fbbf24] bg-[#fbbf24]/10 border border-[#fbbf24]/20 hover:bg-[#fbbf24]/20 hover:border-[#fbbf24]/30 transition-all duration-150"
        >
          Deal with it
        </button>
      </motion.div>
    </motion.div>
  );
}
