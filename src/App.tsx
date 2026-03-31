import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useTaskStore } from './store/taskStore';
import { useDayStore } from './store/dayStore';
import { useUIStore } from './store/uiStore';
import { useDailyInfoStore } from './store/dailyInfoStore';
import { useProspectStore } from './store/prospectStore';
import LoginScreen from './components/auth/LoginScreen';
import AppShell from './components/layout/AppShell';
import DashboardPage from './components/dashboard/DashboardPage';
import HistoryPage from './components/history/HistoryPage';
import SettingsPage from './components/layout/SettingsPage';

export default function App() {
  const { authenticated, loading: authLoading, checkAuth } = useAuthStore();
  const { activeTab } = useUIStore();
  const initializeToday = useDayStore((s) => s.initializeToday);
  const loadHistory = useDayStore((s) => s.loadHistory);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadDailyInfo = useDailyInfoStore((s) => s.loadDailyInfo);
  const initProspects = useProspectStore((s) => s.initProspects);
  const [storesReady, setStoresReady] = useState(false);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      useAuthStore.setState({ authenticated: false });
    };
    window.addEventListener('dcc:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('dcc:unauthorized', handleUnauthorized);
  }, []);

  // Initialize stores after auth, then reveal
  useEffect(() => {
    if (authenticated) {
      initializeToday();
      loadTasks();
      loadHistory();
      loadDailyInfo();
      initProspects();
      // Small delay to let stores populate before rendering UI
      const t = setTimeout(() => setStoresReady(true), 80);
      return () => clearTimeout(t);
    } else {
      setStoresReady(false);
    }
  }, [authenticated, initializeToday, loadTasks, loadHistory, loadDailyInfo, initProspects]);

  // Auth loading or stores initializing — show nothing (just bg color)
  if (authLoading) {
    return <div style={{ minHeight: '100vh', background: '#1e2433' }} />;
  }

  if (!authenticated) {
    return <LoginScreen />;
  }

  if (!storesReady) {
    return <div style={{ minHeight: '100vh', background: '#1e2433' }} />;
  }

  return (
    <AppShell>
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'history' && <HistoryPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </AppShell>
  );
}
