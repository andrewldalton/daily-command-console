import { motion } from 'framer-motion';
import { useDailyInfoStore } from '../../store/dailyInfoStore';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.35 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function DailyInfo() {
  const { bibleVerse, quote, nationalDay, loading } = useDailyInfoStore();

  if (loading) return null;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4"
    >
      {/* ── Bible Verse ── */}
      {bibleVerse && (
        <motion.div
          variants={item}
          className="surface p-5"
          style={{ borderColor: 'var(--color-gold-muted)' }}
        >
          <p
            className="verse-text mb-3"
            style={{ fontSize: 'var(--text-base)' }}
          >
            &ldquo;{bibleVerse.text}&rdquo;
          </p>
          <p
            className="verse-reference text-xs uppercase mb-3"
            style={{ letterSpacing: '0.1em' }}
          >
            {bibleVerse.reference}
          </p>
          {bibleVerse.reflection && (
            <p
              className="text-xs leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {bibleVerse.reflection}
            </p>
          )}
        </motion.div>
      )}

      {/* ── Motivational Quote ── */}
      {quote && (
        <motion.div variants={item} className="surface p-5">
          <p
            className="text-sm italic leading-relaxed mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            &ldquo;{quote.text}&rdquo;
          </p>
          <p
            className="text-[10px] font-medium uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            &mdash; {quote.author}
          </p>
        </motion.div>
      )}

      {/* ── National Day ── */}
      {nationalDay && (
        <motion.div variants={item} className="flex">
          <span
            className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: 'var(--color-accent-muted)',
              color: 'var(--color-accent)',
            }}
          >
            {nationalDay.name}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
