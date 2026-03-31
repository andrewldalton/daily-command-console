import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDailyInfoStore } from '../../store/dailyInfoStore';
import { useTaskStore } from '../../store/taskStore';
import { Cloud, Droplets, Wind, BookOpen } from 'lucide-react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 17) return 'Good afternoon.';
  return 'Good evening.';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function TodayHero() {
  const { weather, bibleVerse, nationalDay, quote } = useDailyInfoStore();
  const tasks = useTaskStore((s) => s.tasks);
  const [now, setNow] = useState(new Date());

  // Live clock -- updates every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const mustWinLeft = tasks.filter(
    (t) => t.category === 'must-win' && t.status !== 'completed'
  ).length;

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="mb-10"
    >
      {/* ── Greeting + Time ── */}
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
        <motion.h1
          variants={item}
          className="font-bold leading-tight tracking-tight"
          style={{
            fontSize: 'clamp(1.75rem, 5vw, 3rem)',
            color: 'var(--color-text-primary)',
          }}
        >
          {getGreeting()}
        </motion.h1>
        <motion.span
          variants={item}
          className="text-base sm:text-lg font-medium tabular-nums"
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            color: '#06d6a0',
            textShadow: '0 0 20px rgba(6,214,160,0.25)',
          }}
        >
          {formatTime(now)}
        </motion.span>
      </div>

      {/* ── Date + National Day ── */}
      <motion.div variants={item} className="flex items-center flex-wrap gap-3 mb-6">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {formatDate()}
        </span>
        {nationalDay && (
          <span
            className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {nationalDay.name}
          </span>
        )}
      </motion.div>

      {/* ── Info Cards Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ═══ Weather Card ═══ */}
        {weather && (
          <motion.div
            variants={item}
            className="relative overflow-hidden rounded-xl p-4 sm:p-5 flex flex-col gap-3 transition-all group"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            whileHover={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(6,214,160,0.15)',
            }}
          >
            {/* Accent stripe */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#06d6a0] via-[#06b6d4] to-transparent" />

            {/* Spotlight on hover */}
            <div
              className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(6,214,160,0.06) 0%, transparent 70%)',
              }}
            />

            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Cloud size={14} style={{ color: '#06d6a0' }} />
                  <span
                    className="text-[9px] font-semibold uppercase tracking-[0.15em]"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {weather.location}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {weather.current.condition}
                </p>
              </div>
              <span
                className="text-4xl font-bold tabular-nums"
                style={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  color: 'var(--color-text-primary)',
                  textShadow: '0 0 20px rgba(6,214,160,0.2)',
                }}
              >
                {weather.current.temp}&deg;
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                H {weather.high}&deg;
              </span>
              <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                L {weather.low}&deg;
              </span>
              <span style={{ color: 'rgba(255,255,255,0.12)' }}>|</span>
              <span className="flex items-center gap-1">
                <Droplets size={10} /> {weather.current.humidity}%
              </span>
              <span className="flex items-center gap-1">
                <Wind size={10} /> {weather.current.windSpeed}
              </span>
            </div>

            {/* Hourly forecast pills */}
            {weather.hourly.length > 0 && (
              <div
                className="flex flex-nowrap gap-1.5 mt-1 pt-3 overflow-x-auto"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                {weather.hourly.slice(0, 6).map((h, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center rounded-lg px-2 py-1.5 min-w-[44px]"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span
                      className="text-[8px] font-medium uppercase"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {h.time}
                    </span>
                    <span
                      className="text-xs font-semibold tabular-nums mt-0.5"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {h.temp}&deg;
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ Bible Verse Card ═══ */}
        {bibleVerse && (
          <motion.div
            variants={item}
            className="relative overflow-hidden rounded-xl p-4 sm:p-5 flex flex-col gap-3 transition-all group"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            whileHover={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(201,169,110,0.15)',
            }}
          >
            {/* Gold accent stripe */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#c9a96e] via-[#e2c992] to-transparent" />

            {/* Spotlight on hover */}
            <div
              className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)',
              }}
            />

            <div className="flex items-center gap-2">
              <BookOpen size={14} style={{ color: '#c9a96e' }} />
              <span
                className="text-[9px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: '#c9a96e' }}
              >
                The Bible &middot; Daily Verse
              </span>
            </div>

            <p
              className="leading-relaxed"
              style={{
                fontFamily: "'Cormorant Garamond', 'Georgia', serif",
                fontSize: '0.95rem',
                fontStyle: 'italic',
                color: 'var(--color-text-primary)',
                lineHeight: 1.7,
              }}
            >
              &ldquo;{bibleVerse.text}&rdquo;
            </p>

            <p
              className="text-[10px] font-semibold uppercase"
              style={{
                color: '#c9a96e',
                letterSpacing: '0.12em',
                fontFamily: "'Cormorant Garamond', 'Georgia', serif",
                fontVariant: 'small-caps',
                fontSize: '0.75rem',
              }}
            >
              &mdash; {bibleVerse.reference}
            </p>

            {bibleVerse.reflection && (
              <p
                className="text-xs leading-relaxed mt-1 pt-3"
                style={{
                  color: 'var(--color-text-tertiary)',
                  borderTop: '1px solid rgba(201,169,110,0.15)',
                }}
              >
                {bibleVerse.reflection}
              </p>
            )}
          </motion.div>
        )}

        {/* ═══ Task Stats + Quote Card ═══ */}
        <motion.div
          variants={item}
          className="relative overflow-hidden rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all group"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          whileHover={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(6,214,160,0.15)',
          }}
        >
          {/* Accent stripe */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#06d6a0] via-[#8b5cf6] to-transparent" />

          {/* Spotlight on hover */}
          <div
            className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(6,214,160,0.06) 0%, transparent 70%)',
            }}
          />

          {/* Task Stats */}
          <div>
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.15em] block mb-3"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Today's Execution
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col">
                <span
                  className="text-3xl font-bold block tabular-nums"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {total}
                </span>
                <span className="text-[10px] mt-1 uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                  tasks
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-3xl font-bold block tabular-nums"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    color: '#06d6a0',
                    textShadow: '0 0 16px rgba(6,214,160,0.3)',
                  }}
                >
                  {completed}
                </span>
                <span className="text-[10px] mt-1 uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                  done
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-3xl font-bold block tabular-nums"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    color: '#f43f5e',
                    textShadow: '0 0 16px rgba(244,63,94,0.2)',
                  }}
                >
                  {mustWinLeft}
                </span>
                <span className="text-[10px] mt-1 uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                  must-win
                </span>
              </div>
            </div>
          </div>

          {/* Section pip divider */}
          <div className="flex items-center gap-1.5">
            <div className="h-[1px] flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'rgba(6,214,160,0.4)' }} />
            <div className="h-[1px] flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Quote */}
          {quote && (
            <div
              className="pl-3"
              style={{
                borderLeft: '2px solid rgba(6,214,160,0.3)',
              }}
            >
              <p
                className="text-xs italic leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                &ldquo;{quote.text}&rdquo;
              </p>
              <p
                className="text-[9px] font-semibold uppercase tracking-[0.12em] mt-1.5"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                &mdash; {quote.author}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
