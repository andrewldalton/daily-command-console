import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, LayoutDashboard, History, Settings } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import type { TabId } from '../../types';

const navItems: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function formatTopBarDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme, activeTab, setActiveTab } = useUIStore();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-root)' }}
    >
      {/* ── Brand Gradient Stripe ── */}
      <div
        className="h-[2px] w-full flex-shrink-0 bg-gradient-to-r from-[#06d6a0] via-[#06b6d4] to-[#8b5cf6]"
        style={{ zIndex: 60 }}
      />

      {/* ── Top Bar ── */}
      <header
        className="sticky top-0 flex items-center justify-between px-5 py-3 md:px-8"
        style={{
          zIndex: 'var(--z-sticky)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(8,9,14,0.8)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Left: Logo + Desktop Nav */}
        <div className="flex items-center gap-6">
          <span
            className="text-xs sm:text-sm font-semibold uppercase truncate max-w-[140px] sm:max-w-none"
            style={{
              color: 'var(--color-text-tertiary)',
              letterSpacing: '0.2em',
              textShadow: '0 0 30px rgba(6,214,160,0.08)',
            }}
          >
            Command Console
          </span>

          {/* Desktop Horizontal Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ id, label }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="relative px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] rounded transition-colors cursor-pointer"
                  style={{
                    color: isActive ? '#06d6a0' : 'var(--color-text-tertiary)',
                    backgroundColor: 'transparent',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--color-text-tertiary)';
                  }}
                >
                  {label}
                  {isActive && (
                    <motion.div
                      layoutId="desktop-nav-underline"
                      className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                      style={{ backgroundColor: '#06d6a0' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Date + Theme Toggle */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className="text-[11px] font-medium hidden sm:block tabular-nums"
            style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}
          >
            {formatTopBarDate()}
          </span>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-all cursor-pointer"
            style={{
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <motion.main
        className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {children}
      </motion.main>

      {/* ── Bottom Navigation (Mobile) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        style={{
          zIndex: 'var(--z-sticky)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          backgroundColor: 'rgba(8,9,14,0.85)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
              style={{
                color: isActive ? '#06d6a0' : 'var(--color-text-tertiary)',
                backgroundColor: 'transparent',
                border: 'none',
              }}
              aria-label={label}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-pip"
                  className="absolute -top-1 w-4 h-[2px] rounded-full"
                  style={{ backgroundColor: '#06d6a0' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom padding to prevent content from hiding behind mobile nav */}
      <div className="md:hidden" style={{ height: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }} />
    </div>
  );
}
