import { create } from 'zustand';
import { api } from '../lib/api';

interface AuthState {
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  authenticated: false,
  loading: true,
  error: null,

  checkAuth: async () => {
    set({ loading: true });
    try {
      const { authenticated } = await api.checkAuth();
      set({ authenticated, loading: false });
    } catch {
      set({ authenticated: false, loading: false });
    }
  },

  login: async (password: string) => {
    set({ error: null, loading: true });
    try {
      await api.login(password);
      set({ authenticated: true, loading: false, error: null });
      return true;
    } catch {
      set({ error: 'Wrong password', loading: false });
      return false;
    }
  },

  logout: () => {
    set({ authenticated: false });
    document.cookie = 'dcc_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
  },
}));
