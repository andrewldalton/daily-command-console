import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDailyInfoStore } from '../../store/dailyInfoStore';
import { useTaskStore } from '../../store/taskStore';
import { useDayStore } from '../../store/dayStore';
import { Cloud, Droplets, Wind, BookOpen, Sun, CloudRain, CloudLightning } from 'lucide-react';
import { use3DTilt } from '../../hooks/use3DTilt';

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
    transition: { staggerChildren: 0.03, delayChildren: 0 },
  },
};

const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
};

export default function TodayHero() {
  const { weather, bibleVerse, nationalDay, quote } = useDailyInfoStore();
  const tasks = useTaskStore((s) => s.tasks);
  const today = useDayStore((s) => s.today);
  const [now, setNow] = useState(new Date());
  const tilt1 = use3DTilt({ maxRotation: 4 });
  const tilt2 = use3DTilt({ maxRotation: 4 });
  const tilt3 = use3DTilt({ maxRotation: 4 });

  // Live clock -- updates every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const todayTasks = today ? tasks.filter((t) => t.dayId === today.id) : [];
  const total = todayTasks.length;
  const completed = todayTasks.filter((t) => t.status === 'completed').length;
  const mustWinLeft = todayTasks.filter(
    (t) => t.category === 'must-win' && t.status !== 'completed'
  ).length;
  const carriedOver = todayTasks.filter((t) => t.source === 'carryover' && t.status !== 'completed').length;

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
            color: '#e2e8f0',
          }}
        >
          {getGreeting()}
        </motion.h1>
        <motion.span
          variants={item}
          className="text-base sm:text-lg font-medium tabular-nums"
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            color: '#38bdf8',
            textShadow: '0 0 20px rgba(56,189,248,0.3)',
          }}
        >
          {formatTime(now)}
        </motion.span>
      </div>

      {/* ── Date + National Day ── */}
      <motion.div variants={item} className="flex items-center flex-wrap gap-3 mb-6">
        <span
          className="text-sm font-medium"
          style={{ color: '#64748b' }}
        >
          {formatDate()}
        </span>
        {nationalDay && (
          <span
            className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(167,139,250,0.15)',
              border: '1px solid rgba(167,139,250,0.2)',
              color: '#a78bfa',
            }}
          >
            {nationalDay.name}
          </span>
        )}
      </motion.div>

      {/* ── Info Cards Row (equal height) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {/* ═══ Weather Card ═══ */}
        {weather && (
          <div ref={tilt1.ref} onMouseMove={tilt1.onMouseMove} onMouseLeave={tilt1.onMouseLeave} style={tilt1.style}>
          <motion.div
            variants={item}
            className="relative overflow-hidden rounded-xl p-4 sm:p-5 flex flex-col gap-3 transition-all duration-300 group"
            style={{
              backgroundColor: '#252d3d',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            whileHover={{
              boxShadow: '0 0 24px rgba(56,189,248,0.08)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(56,189,248,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            {/* Sky blue accent stripe */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#38bdf8] via-[#0ea5e9] to-transparent" />

            {/* Spotlight on hover */}
            <div
              className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)',
              }}
            />

            {/* 3D tilt spotlight */}
            <div className="absolute inset-0 pointer-events-none" style={tilt1.spotlightStyle} />

            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Cloud size={14} style={{ color: '#38bdf8' }} />
                  <span
                    className="text-[9px] font-semibold uppercase tracking-[0.15em]"
                    style={{ color: '#64748b' }}
                  >
                    {weather.location}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                  {weather.current.condition}
                </p>
              </div>
              <span
                className="text-4xl font-bold tabular-nums"
                style={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  color: '#e2e8f0',
                  textShadow: '0 0 20px rgba(56,189,248,0.25)',
                }}
              >
                {weather.current.temp}&deg;
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs" style={{ color: '#64748b' }}>
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

            {/* Next 4 hours */}
            {weather.hourly.length > 0 && (
              <div
                className="flex flex-nowrap gap-1.5 mt-1 pt-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-[8px] font-semibold uppercase tracking-wider self-center mr-1" style={{ color: '#475569' }}>
                  Next
                </span>
                {weather.hourly.slice(0, 4).map((h, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center rounded-lg px-2 py-1.5 flex-1 min-w-0"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span
                      className="text-[8px] font-medium uppercase"
                      style={{ color: '#64748b' }}
                    >
                      {h.time}
                    </span>
                    <span
                      className="text-xs font-semibold tabular-nums mt-0.5"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: '#94a3b8',
                      }}
                    >
                      {h.temp}&deg;
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 3-Day Forecast */}
            {weather.daily && weather.daily.length > 0 && (
              <div
                className="flex flex-nowrap gap-1.5 mt-1.5"
              >
                {weather.daily.map((d, i) => {
                  const DayIcon = d.icon === 'storm' ? CloudLightning : d.icon === 'cloud' ? CloudRain : Sun;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 flex-1 min-w-0"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <DayIcon size={12} style={{ color: d.icon === 'storm' ? '#fbbf24' : d.icon === 'cloud' ? '#94a3b8' : '#fbbf24', flexShrink: 0 }} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                          {d.day}
                        </span>
                        <span
                          className="text-[10px] tabular-nums font-medium"
                          style={{ fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8' }}
                        >
                          {d.high}&deg;/{d.low}&deg;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
          </div>
        )}

        {/* ═══ Bible Verse Card ═══ */}
        {bibleVerse && (
          <div ref={tilt2.ref} onMouseMove={tilt2.onMouseMove} onMouseLeave={tilt2.onMouseLeave} style={tilt2.style}>
          <motion.div
            variants={item}
            className="relative overflow-hidden rounded-xl p-4 sm:p-5 flex flex-col gap-3 transition-all duration-300 group"
            style={{
              backgroundColor: '#252d3d',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            whileHover={{
              boxShadow: '0 0 24px rgba(56,189,248,0.08)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(56,189,248,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            {/* Blue accent stripe */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#38bdf8] via-[#0ea5e9] to-transparent" />

            {/* Spotlight on hover */}
            <div
              className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)',
              }}
            />

            {/* 3D tilt spotlight */}
            <div className="absolute inset-0 pointer-events-none" style={tilt2.spotlightStyle} />

            <div className="flex items-center gap-2">
              <BookOpen size={14} style={{ color: '#d4a94e' }} />
              <span
                className="text-[9px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: '#d4a94e' }}
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
                color: '#e2e8f0',
                lineHeight: 1.7,
              }}
            >
              &ldquo;{bibleVerse.text}&rdquo;
            </p>

            <p
              className="text-[10px] font-semibold uppercase"
              style={{
                color: '#d4a94e',
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
                  color: '#64748b',
                  borderTop: '1px solid rgba(212,169,78,0.15)',
                }}
              >
                {bibleVerse.reflection}
              </p>
            )}
          </motion.div>
          </div>
        )}

        {/* ═══ Task Stats + Quote Card ═══ */}
        <div ref={tilt3.ref} onMouseMove={tilt3.onMouseMove} onMouseLeave={tilt3.onMouseLeave} style={tilt3.style}>
        <motion.div
          variants={item}
          className="relative overflow-hidden rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all duration-300 group"
          style={{
            backgroundColor: '#252d3d',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          whileHover={{
            boxShadow: '0 0 24px rgba(56,189,248,0.08)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(56,189,248,0.15)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        >
          {/* Blue accent stripe */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#38bdf8] via-[#0ea5e9] to-transparent" />

          {/* Spotlight on hover */}
          <div
            className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)',
            }}
          />

          {/* 3D tilt spotlight */}
          <div className="absolute inset-0 pointer-events-none" style={tilt3.spotlightStyle} />

          {/* Task Stats */}
          <div>
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.15em] block mb-3"
              style={{ color: '#64748b' }}
            >
              Today's Execution
            </span>
            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col">
                <span
                  className="text-3xl font-bold block tabular-nums"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    color: '#e2e8f0',
                  }}
                >
                  {total}
                </span>
                <span className="text-[10px] mt-1 uppercase tracking-wider" style={{ color: '#64748b' }}>
                  tasks
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-3xl font-bold block tabular-nums"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    color: '#a3e635',
                    textShadow: '0 0 16px rgba(163,230,53,0.3)',
                  }}
                >
                  {completed}
                </span>
                <span className="text-[10px] mt-1 uppercase tracking-wider" style={{ color: '#64748b' }}>
                  done
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-3xl font-bold block tabular-nums"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    color: '#f472b6',
                    textShadow: '0 0 16px rgba(244,114,182,0.25)',
                  }}
                >
                  {mustWinLeft}
                </span>
                <span className="text-[10px] mt-1 uppercase tracking-wider" style={{ color: '#64748b' }}>
                  big 3
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-3xl font-bold block tabular-nums"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    color: '#fbbf24',
                    textShadow: '0 0 16px rgba(251,191,36,0.25)',
                  }}
                >
                  {carriedOver}
                </span>
                <span className="text-[10px] mt-1 uppercase tracking-wider" style={{ color: '#64748b' }}>
                  carried
                </span>
              </div>
            </div>
          </div>

          {/* Section pip divider */}
          <div className="flex items-center gap-1.5">
            <div className="h-[1px] flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'rgba(56,189,248,0.4)' }} />
            <div className="h-[1px] flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Quote */}
          {quote && (
            <div
              className="pl-3"
              style={{
                borderLeft: '2px solid rgba(56,189,248,0.35)',
              }}
            >
              <p
                className="text-xs italic leading-relaxed"
                style={{ color: '#94a3b8' }}
              >
                &ldquo;{quote.text}&rdquo;
              </p>
              <p
                className="text-[9px] font-semibold uppercase tracking-[0.12em] mt-1.5"
                style={{ color: '#64748b' }}
              >
                &mdash; {quote.author}
              </p>
            </div>
          )}
        </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
