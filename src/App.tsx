import { useEffect } from 'react';
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

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-root)',
      }}
    >
      <div className="accent-stripe" style={{ width: '100%' }} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '2px',
            background: 'var(--color-accent-muted)',
            borderRadius: '1px',
            animation: 'loadPulse 1.5s ease-in-out infinite',
          }}
        />
        <style>{`
          @keyframes loadPulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function App() {
  const { authenticated, loading: authLoading, checkAuth } = useAuthStore();
  const { activeTab } = useUIStore();
  const initializeToday = useDayStore((s) => s.initializeToday);
  const loadHistory = useDayStore((s) => s.loadHistory);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadDailyInfo = useDailyInfoStore((s) => s.loadDailyInfo);
  const initProspects = useProspectStore((s) => s.initProspects);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for unauthorized events (e.g. expired session)
  useEffect(() => {
    const handleUnauthorized = () => {
      useAuthStore.setState({ authenticated: false });
    };
    window.addEventListener('dcc:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('dcc:unauthorized', handleUnauthorized);
    };
  }, []);

  // Initialize stores only after authentication succeeds
  useEffect(() => {
    if (authenticated) {
      initializeToday();
      loadTasks();
      loadHistory();
      loadDailyInfo();
      initProspects();
    }
  }, [authenticated, initializeToday, loadTasks, loadHistory, loadDailyInfo, initProspects]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!authenticated) {
    return <LoginScreen />;
  }

  return (
    <AppShell>
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'history' && <HistoryPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </AppShell>
  );
}
