import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from './store/authStore';
import { useTaskStore } from './store/taskStore';
import { useDayStore } from './store/dayStore';
import { useUIStore } from './store/uiStore';
import { useDailyInfoStore } from './store/dailyInfoStore';
import { useProspectStore } from './store/prospectStore';
import { useXpStore } from './store/xpStore';
import LoginScreen from './components/auth/LoginScreen';
import AppShell from './components/layout/AppShell';
import DashboardPage from './components/dashboard/DashboardPage';
import HistoryPage from './components/history/HistoryPage';
import SettingsPage from './components/layout/SettingsPage';
import VoiceCapture from './components/capture/VoiceCapture';
import EveningReview from './components/review/EveningReview';
import MorningBriefing from './components/briefing/MorningBriefing';
import LevelUpCelebration from './components/dashboard/LevelUpCelebration';
import SkeletonDashboard from './components/ui/SkeletonDashboard';
import { XPToastContainer } from './components/ui/XPToast';
import { Big3CelebrationOverlay } from './components/ui/Big3Celebration';
import MomentumPulse from './components/dashboard/MomentumPulse';

export default function App() {
  const { authenticated, loading: authLoading, checkAuth } = useAuthStore();
  const { activeTab } = useUIStore();
  const initializeToday = useDayStore((s) => s.initializeToday);
  const loadHistory = useDayStore((s) => s.loadHistory);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadDailyInfo = useDailyInfoStore((s) => s.loadDailyInfo);
  const initProspects = useProspectStore((s) => s.initProspects);
  const initializeXp = useXpStore((s) => s.initializeXp);
  const [storesReady, setStoresReady] = useState(false);
  const tasks = useTaskStore((s) => s.tasks);
  const todayForPulse = useDayStore((s) => s.today);

  const pulseRate = useMemo(() => {
    if (!todayForPulse) return 0;
    const todayTasks = tasks.filter(t => t.dayId === todayForPulse.id);
    const total = todayTasks.length;
    const done = todayTasks.filter(t => t.status === 'completed').length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [tasks, todayForPulse]);

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
  // IMPORTANT: initializeToday must complete BEFORE loadTasks so tasks
  // use the server's day ID (not a mismatched local UUID)
  useEffect(() => {
    if (authenticated) {
      const init = async () => {
        await initializeToday();
        await loadHistory();
        loadTasks();
        loadDailyInfo();
        initProspects();
        initializeXp();
        // Small delay to let stores populate before rendering UI
        setTimeout(() => setStoresReady(true), 80);
      };
      init();
    } else {
      setStoresReady(false);
    }
  }, [authenticated, initializeToday, loadTasks, loadHistory, loadDailyInfo, initProspects, initializeXp]);

  // Auth loading or stores initializing — show nothing (just bg color)
  if (authLoading) {
    return <div style={{ minHeight: '100vh', background: '#1e2433' }} />;
  }

  if (!authenticated) {
    return <LoginScreen />;
  }

  if (!storesReady) {
    return <div style={{ minHeight: '100vh', background: '#1e2433' }}><SkeletonDashboard /></div>;
  }

  return (
    <AppShell>
      <MomentumPulse completionRate={pulseRate} />
      {activeTab === 'dashboard' && (
        <>
          <MorningBriefing />
          <EveningReview />
          <DashboardPage />
        </>
      )}
      {activeTab === 'history' && <HistoryPage />}
      {activeTab === 'settings' && <SettingsPage />}
      <VoiceCapture />
      <LevelUpCelebration />
      <XPToastContainer />
      <Big3CelebrationOverlay />
    </AppShell>
  );
}
