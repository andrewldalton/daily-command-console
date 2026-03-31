import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  LayoutDashboard,
  ListTodo,
  CloudSun,
  Database,
  Trash2,
  Download,
  Sun,
  Moon,
  Check,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import type { UserSettings } from '../../types';

/* ── Constants ── */
const SETTINGS_KEY = 'dcc_settings';

const ACCENT_COLORS = [
  { name: 'Sky Blue', value: '#38bdf8' },
  { name: 'Violet', value: '#a78bfa' },
  { name: 'Pink', value: '#f472b6' },
  { name: 'Lime', value: '#a3e635' },
  { name: 'Amber', value: '#fbbf24' },
  { name: 'Emerald', value: '#34d399' },
];

const DEFAULT_CATEGORIES = [
  { id: 'must-win', label: 'Must-Win' },
  { id: 'work', label: 'Work' },
  { id: 'personal', label: 'Personal' },
  { id: 'follow-up', label: 'Follow-Up' },
];

const defaultSettings: UserSettings = {
  theme: 'dark',
  accentColor: '#38bdf8',
  weatherLocation: 'Omaha, NE',
  showQuote: true,
  showNationalDay: true,
  showBibleVerse: true,
  defaultCategories: ['must-win', 'work', 'personal', 'follow-up'],
};

/* ── Storage helpers ── */
function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return defaultSettings;
}

function persistSettings(settings: UserSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

/* ── Toggle switch ── */
function PillToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="relative w-11 h-6 rounded-full cursor-pointer transition-colors"
      style={{
        backgroundColor: enabled ? '#38bdf8' : 'var(--color-bg-hover)',
        border: `1px solid ${enabled ? '#38bdf8' : 'var(--color-border-default)'}`,
      }}
    >
      <motion.div
        className="absolute top-0.5 rounded-full"
        style={{
          width: 18,
          height: 18,
          backgroundColor: enabled ? '#fff' : 'var(--color-text-tertiary)',
          boxShadow: 'var(--shadow-xs)',
        }}
        animate={{ x: enabled ? 22 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

/* ── Section wrapper ── */
function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  description: string;
  icon: typeof Palette;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-accent-muted)' }}
        >
          <Icon size={17} className="text-[var(--color-accent)]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h3>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {description}
          </p>
        </div>
      </div>
      <div className="w-full h-px" style={{ backgroundColor: 'var(--color-border-subtle)' }} />
      {children}
    </motion.div>
  );
}

/* ── Row helper ── */
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 sm:gap-4 py-1">
      <div className="flex-1 min-w-0">
        <span className="text-xs sm:text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </span>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Main component ── */
export default function SettingsPage() {
  const { theme, toggleTheme } = useUIStore();
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [confirmClear, setConfirmClear] = useState(false);

  // Auto-reset confirmClear after 5 seconds
  useEffect(() => {
    if (!confirmClear) return;
    const timer = setTimeout(() => setConfirmClear(false), 5000);
    return () => clearTimeout(timer);
  }, [confirmClear]);

  // Sync theme from UI store
  useEffect(() => {
    setSettings((prev) => ({ ...prev, theme }));
  }, [theme]);

  const update = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      persistSettings(next);
      return next;
    });
  }, []);

  // Apply accent color as CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', settings.accentColor);
    // Derive muted + glow variants
    document.documentElement.style.setProperty(
      '--color-accent-muted',
      `${settings.accentColor}26`
    );
    document.documentElement.style.setProperty(
      '--color-accent-glow',
      `${settings.accentColor}40`
    );
  }, [settings.accentColor]);

  const handleExport = () => {
    const data = {
      settings: loadSettings(),
      days: JSON.parse(localStorage.getItem('dcc_days') || '[]'),
      tasks: JSON.parse(localStorage.getItem('dcc_tasks') || '[]'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dcc-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    localStorage.removeItem('dcc_days');
    localStorage.removeItem('dcc_tasks');
    localStorage.removeItem(SETTINGS_KEY);
    setConfirmClear(false);
    window.location.reload();
  };

  const toggleCategory = (catId: string) => {
    const cats = settings.defaultCategories.includes(catId)
      ? settings.defaultCategories.filter((c) => c !== catId)
      : [...settings.defaultCategories, catId];
    update({ defaultCategories: cats });
  };

  return (
    <motion.div
      className="flex flex-col gap-5 max-w-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Appearance ── */}
      <SettingsSection
        title="Appearance"
        description="Theme and visual preferences"
        icon={Palette}
        delay={0}
      >
        <SettingRow label="Theme" description="Switch between dark and light mode">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (theme !== 'dark') toggleTheme();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--color-accent-muted)' : 'var(--color-bg-surface)',
                color: theme === 'dark' ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                border: `1px solid ${theme === 'dark' ? 'var(--color-accent)' : 'var(--color-border-subtle)'}`,
              }}
            >
              <Moon size={13} />
              Dark
            </button>
            <button
              onClick={() => {
                if (theme !== 'light') toggleTheme();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              style={{
                backgroundColor: theme === 'light' ? 'var(--color-accent-muted)' : 'var(--color-bg-surface)',
                color: theme === 'light' ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                border: `1px solid ${theme === 'light' ? 'var(--color-accent)' : 'var(--color-border-subtle)'}`,
              }}
            >
              <Sun size={13} />
              Light
            </button>
          </div>
        </SettingRow>

        <SettingRow label="Accent Color" description="Highlight color used across the app">
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => update({ accentColor: c.value })}
                className="w-7 h-7 rounded-full cursor-pointer flex items-center justify-center transition-transform hover:scale-110"
                style={{
                  backgroundColor: c.value,
                  border:
                    settings.accentColor === c.value
                      ? '2px solid var(--color-text-primary)'
                      : '2px solid transparent',
                  boxShadow:
                    settings.accentColor === c.value
                      ? `0 0 0 2px var(--color-bg-root), 0 0 12px ${c.value}60`
                      : 'none',
                }}
                aria-label={c.name}
                title={c.name}
              >
                {settings.accentColor === c.value && <Check size={13} color="#fff" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </SettingRow>
      </SettingsSection>

      {/* ── Dashboard ── */}
      <SettingsSection
        title="Dashboard"
        description="Control what appears on your daily view"
        icon={LayoutDashboard}
        delay={0.05}
      >
        <SettingRow label="Show Bible Verse" description="Daily scripture and reflection">
          <PillToggle
            enabled={settings.showBibleVerse}
            onChange={(v) => update({ showBibleVerse: v })}
          />
        </SettingRow>
        <SettingRow label="Show Quote" description="Inspirational quote of the day">
          <PillToggle
            enabled={settings.showQuote}
            onChange={(v) => update({ showQuote: v })}
          />
        </SettingRow>
        <SettingRow label="Show National Day" description="Today's national/world day">
          <PillToggle
            enabled={settings.showNationalDay}
            onChange={(v) => update({ showNationalDay: v })}
          />
        </SettingRow>
      </SettingsSection>

      {/* ── Tasks ── */}
      <SettingsSection
        title="Tasks"
        description="Default task categories and behavior"
        icon={ListTodo}
        delay={0.1}
      >
        <div>
          <span className="text-xs font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
            Default Categories
          </span>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CATEGORIES.map((cat) => {
              const active = settings.defaultCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--color-accent-muted)' : 'var(--color-bg-surface)',
                    color: active ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                    border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border-subtle)'}`,
                  }}
                >
                  {active && <Check size={11} className="inline mr-1" />}
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </SettingsSection>

      {/* ── Weather ── */}
      <SettingsSection
        title="Weather"
        description="Location for weather data"
        icon={CloudSun}
        delay={0.15}
      >
        <SettingRow label="Location" description="City name for weather forecasts">
          <input
            type="text"
            placeholder="e.g. Omaha, NE"
            value={settings.weatherLocation}
            onChange={(e) => update({ weatherLocation: e.target.value })}
            className="px-3 py-2 rounded-xl text-sm w-44"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-ui)',
              outline: 'none',
            }}
          />
        </SettingRow>
      </SettingsSection>

      {/* ── Data ── */}
      <SettingsSection
        title="Data"
        description="Export or clear your data"
        icon={Database}
        delay={0.2}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-default)')}
          >
            <Download size={15} />
            Export All Data
          </button>

          <button
            onClick={handleClearAll}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors"
            style={{
              backgroundColor: confirmClear ? 'var(--color-danger)' : 'var(--color-bg-surface)',
              border: `1px solid ${confirmClear ? 'var(--color-danger)' : 'var(--color-border-default)'}`,
              color: confirmClear ? '#fff' : 'var(--color-danger)',
            }}
            onMouseEnter={(e) => {
              if (!confirmClear) e.currentTarget.style.backgroundColor = 'var(--color-danger-muted)';
            }}
            onMouseLeave={(e) => {
              if (!confirmClear) e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
            }}
            onBlur={() => setConfirmClear(false)}
          >
            <Trash2 size={15} />
            {confirmClear ? 'Confirm: Delete Everything' : 'Clear All Data'}
          </button>
        </div>
        {confirmClear && (
          <motion.p
            className="text-xs"
            style={{ color: 'var(--color-danger)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            This will permanently delete all days, tasks, and settings. Click again to confirm.
          </motion.p>
        )}
      </SettingsSection>
    </motion.div>
  );
}
