import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Target,
  Crosshair,
  Crown,
  Swords,
  Trophy,
} from 'lucide-react';
import { useXpStore } from '../../store/xpStore';
import type { LucideIcon } from 'lucide-react';

/* ── Rank icon map ── */
const RANK_ICONS: Record<string, LucideIcon> = {
  Recruit: Shield,
  Closer: Target,
  Operator: Crosshair,
  Commander: Crown,
  'War Chief': Swords,
  Legend: Trophy,
};

/* ── Confetti burst (CSS-driven particles with Framer Motion) ── */
function ConfettiBurst() {
  const particles = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    angle: (i / 36) * 360,
    distance: 80 + Math.random() * 120,
    size: 5 + Math.random() * 5,
    color: ['#38bdf8', '#a3e635', '#f472b6', '#fbbf24', '#a78bfa'][
      Math.floor(Math.random() * 5)
    ],
    delay: Math.random() * 0.3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: '50%',
            top: '50%',
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            opacity: 0,
            scale: 0.2,
          }}
          transition={{
            duration: 1,
            delay: 0.4 + p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

export default function LevelUpCelebration() {
  const levelUp = useXpStore((s) => s.levelUp);
  const totalXp = useXpStore((s) => s.totalXp);
  const dismissLevelUp = useXpStore((s) => s.dismissLevelUp);

  const isVisible = levelUp.pending && levelUp.newRank;
  const rankName = levelUp.newRank ?? '';
  const RankIcon = RANK_ICONS[rankName] ?? Shield;

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      dismissLevelUp();
    }, 5000);
    return () => clearTimeout(timer);
  }, [isVisible, dismissLevelUp]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[var(--z-overlay)]"
            style={{ backgroundColor: 'rgba(14, 17, 26, 0.92)' }}
            onClick={dismissLevelUp}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
              className="relative flex flex-col items-center text-center gap-6 max-w-sm w-full"
            >
              {/* Confetti */}
              <ConfettiBurst />

              {/* Rank icon — large, animated */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 18,
                  delay: 0.15,
                }}
                className="w-24 h-24 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(167,139,250,0.18))',
                  border: '1px solid rgba(56,189,248,0.25)',
                  boxShadow:
                    '0 0 60px rgba(56,189,248,0.25), 0 0 120px rgba(167,139,250,0.15)',
                }}
              >
                <RankIcon className="w-11 h-11 text-[#38bdf8]" />
              </motion.div>

              {/* "RANK UP!" text with glow */}
              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="text-sm font-bold uppercase tracking-[0.25em]"
                style={{
                  color: '#a78bfa',
                  textShadow: '0 0 24px rgba(167,139,250,0.5), 0 0 48px rgba(167,139,250,0.2)',
                }}
              >
                Rank Up!
              </motion.h2>

              {/* New rank title */}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="text-4xl font-bold"
                style={{
                  color: '#38bdf8',
                  textShadow: '0 0 30px rgba(56,189,248,0.35)',
                }}
              >
                {rankName}
              </motion.h1>

              {/* XP summary */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="text-sm text-[#94a3b8]"
              >
                Total XP:{' '}
                <span className="font-mono font-semibold text-[#e2e8f0]">
                  {totalXp.toLocaleString()}
                </span>
              </motion.p>

              {/* Dismiss button */}
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.4 }}
                onClick={dismissLevelUp}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                style={{
                  background: 'linear-gradient(135deg, #38bdf8, #a78bfa)',
                  color: '#fff',
                  border: 'none',
                  boxShadow:
                    '0 0 24px rgba(56,189,248,0.3), 0 4px 16px rgba(0,0,0,0.2)',
                }}
              >
                Let's go
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
