import { useEffect } from 'react';
import { useTaskStore } from './store/taskStore';
import { useDayStore } from './store/dayStore';
import { useUIStore } from './store/uiStore';
import { useDailyInfoStore } from './store/dailyInfoStore';
import AppShell from './components/layout/AppShell';
import DashboardPage from './components/dashboard/DashboardPage';
import HistoryPage from './components/history/HistoryPage';
import SettingsPage from './components/layout/SettingsPage';

export default function App() {
  const { activeTab } = useUIStore();
  const initializeToday = useDayStore((s) => s.initializeToday);
  const loadHistory = useDayStore((s) => s.loadHistory);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadDailyInfo = useDailyInfoStore((s) => s.loadDailyInfo);

  useEffect(() => {
    initializeToday();
    loadTasks();
    loadHistory();
    loadDailyInfo();
  }, [initializeToday, loadTasks, loadHistory, loadDailyInfo]);

  return (
    <AppShell>
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'history' && <HistoryPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </AppShell>
  );
}
