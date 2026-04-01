import type { Task } from '../types';

/**
 * Returns today's date string in YYYY-MM-DD format using the America/Chicago
 * timezone.  This MUST match the backend (functions/api/days/today.ts) which
 * also uses America/Chicago so that the frontend and D1 agree on which day
 * "today" is.  Using UTC (toISOString) would cause a mismatch for several
 * hours around midnight.
 */
export function getTodayDateCT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDateShort(date);
}

export function calculateDayScore(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getWorkloadLevel(taskCount: number): 'light' | 'normal' | 'overloaded' {
  if (taskCount < 5) return 'light';
  if (taskCount <= 12) return 'normal';
  return 'overloaded';
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function parseOcrText(
  text: string
): Array<{ title: string; category: Task['category']; priority: Task['priority'] }> {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line) => {
    const firstChar = line[0];
    let category: Task['category'] = 'work';
    let priority: Task['priority'] = 'medium';
    let title = line;

    switch (firstChar) {
      case '!':
        category = 'must-win';
        priority = 'high';
        title = line.slice(1).trim();
        break;
      case '*':
        category = 'work';
        priority = 'medium';
        title = line.slice(1).trim();
        break;
      case '-':
        category = 'personal';
        priority = 'low';
        title = line.slice(1).trim();
        break;
      case '?':
        category = 'follow-up';
        priority = 'medium';
        title = line.slice(1).trim();
        break;
      default:
        // No prefix — defaults apply, keep full line as title
        break;
    }

    return { title, category, priority };
  });
}
