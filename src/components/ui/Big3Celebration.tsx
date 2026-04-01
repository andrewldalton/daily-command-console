import { useEffect, useState, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Module-level trigger state ── */

let isActive = false;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return isActive;
}

function notify() {
  for (const listener of listeners) listener();
}

/** Imperatively trigger the Big 3 celebration sequence. */
export function triggerBig3Celebration(): void {
  if (isActive) return;
  isActive = true;
  notify();
}

function clearCelebration() {
  isActive = false;
  notify();
}

/* ── Confetti burst (24 particles, fly outward from center) ── */

function ConfettiBurst() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    angle: (i / 24) * 360,
    distance: 80 + Math.random() * 120,
    size: 5 + Math.random() * 5,
    color: ['#fbbf24', '#f59e0b', '#38bdf8', '#a3e635', '#f472b6', '#a78bfa'][
      Math.floor(Math.random() * 6)
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
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

/* ── Golden shimmer wave ── */

function ShimmerWave() {
  return (
    <motion.div
      className="absolute top-0 left-0 right-0 h-1.5 pointer-events-none"
      style={{
        background:
          'linear-gradient(90deg, transparent 0%, #fbbf24 30%, #f59e0b 50%, #fbbf24 70%, transparent 100%)',
      }}
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
      transition={{ duration: 1, ease: 'easeInOut' }}
    />
  );
}

/* ── Big 3 Celebration Overlay ── */

export function Big3CelebrationOverlay() {
  const active = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [phase, setPhase] = useState<'idle' | 'show' | 'fadeOut'>('idle');

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      return;
    }

    setPhase('show');

    // T+2500ms: begin fade out
    const fadeTimer = setTimeout(() => setPhase('fadeOut'), 2500);
    // T+3000ms: unmount and reset
    const clearTimer = setTimeout(() => clearCelebration(), 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
  }, [active]);

  return (
    <AnimatePresence>
      {active && phase !== 'idle' && (
        <motion.div
          key="big3-celebration"
          className="fixed inset-0 pointer-events-none flex items-center justify-center"
          style={{ zIndex: 200 }}
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'fadeOut' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === 'fadeOut' ? 0.5 : 0.2 }}
        >
          {/* Confetti — T+0ms */}
          <ConfettiBurst />

          {/* Golden shimmer wave — T+0ms */}
          <ShimmerWave />

          {/* Center text: "BIG 3 LOCKED" — T+200ms */}
          <motion.h1
            className="absolute text-4xl font-bold uppercase tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
              filter: 'drop-shadow(0 0 24px rgba(251,191,36,0.4))',
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.2,
              type: 'spring',
              stiffness: 260,
              damping: 20,
            }}
          >
            BIG 3 LOCKED
          </motion.h1>

          {/* Sub text: "2x XP ACTIVATED" — T+400ms */}
          <motion.p
            className="absolute mt-24 text-lg font-semibold uppercase tracking-widest"
            style={{
              color: '#fbbf24',
              textShadow:
                '0 0 16px rgba(251,191,36,0.5), 0 0 32px rgba(251,191,36,0.2)',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            2&times; XP ACTIVATED
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
