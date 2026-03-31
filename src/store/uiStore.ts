import { create } from 'zustand';
import type { TabId } from '../types';

interface UIState {
  activeTab: TabId;
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  uploadModalOpen: boolean;
  settingsOpen: boolean;
  setActiveTab: (tab: TabId) => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  setUploadModalOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
}

const THEME_KEY = 'dcc_theme';

const loadTheme = (): 'dark' | 'light' => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // Storage unavailable
  }
  return 'dark';
};

const applyTheme = (theme: 'dark' | 'light') => {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage unavailable
  }
};

export const useUIStore = create<UIState>((set) => {
  const initialTheme = loadTheme();
  applyTheme(initialTheme);

  return {
    activeTab: 'dashboard',
    sidebarOpen: false,
    theme: initialTheme,
    uploadModalOpen: false,
    settingsOpen: false,

    setActiveTab: (tab) => set({ activeTab: tab }),

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    toggleTheme: () =>
      set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        return { theme: newTheme };
      }),

    setUploadModalOpen: (open) => set({ uploadModalOpen: open }),

    setSettingsOpen: (open) => set({ settingsOpen: open }),
  };
});
