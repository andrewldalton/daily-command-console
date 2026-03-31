export interface Task {
  id: string;
  dayId: string;
  title: string;
  category: 'must-win' | 'work' | 'personal' | 'follow-up';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'deferred';
  source: 'notebook' | 'manual' | 'carryover';
  estimatedMinutes?: number;
  dueTime?: string;
  notes?: string;
  deferredCount: number;
  sortOrder: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DayEntry {
  id: string;
  date: string; // ISO date string
  imageUrl?: string;
  ocrText?: string;
  tasks: Task[];
  score: number;
  totalTasks: number;
  completedTasks: number;
  createdAt: string;
}

export interface WeatherData {
  current: {
    temp: number;
    condition: string;
    icon: string;
    humidity: number;
    windSpeed: number;
  };
  hourly: Array<{
    time: string;
    temp: number;
    condition: string;
    icon: string;
  }>;
  high: number;
  low: number;
  location: string;
}

export interface Quote {
  text: string;
  author: string;
}

export interface BibleVerse {
  reference: string;
  text: string;
  reflection: string;
}

export interface NationalDay {
  name: string;
  description?: string;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  accentColor: string;
  weatherLocation: string;
  showQuote: boolean;
  showNationalDay: boolean;
  showBibleVerse: boolean;
  defaultCategories: string[];
}

export type TabId = 'dashboard' | 'history' | 'settings';
