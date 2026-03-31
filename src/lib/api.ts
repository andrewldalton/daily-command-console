const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (res.status === 401) {
    window.dispatchEvent(new Event('dcc:unauthorized'));
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  checkAuth: () => request<{ authenticated: boolean }>('/auth/check'),
  login: (password: string) =>
    request<{ success: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  // Sync
  sync: () =>
    request<{ today: any; tasks: any[]; history: any[] }>('/sync'),

  // Tasks
  getTasks: (dayId?: string) =>
    request<any[]>(`/tasks${dayId ? `?dayId=${dayId}` : ''}`),
  createTask: (task: any) =>
    request<{ id: string }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),
  updateTask: (id: string, updates: any) =>
    request<{ success: boolean }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteTask: (id: string) =>
    request<{ success: boolean }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),
  importTasks: (tasks: any[], dayId: string) =>
    request<{ success: boolean }>('/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({ tasks, dayId }),
    }),

  // Days
  getToday: () => request<any>('/days/today'),
  getDays: () => request<any[]>('/days'),
  saveDay: (day: any) =>
    request<any>('/days', {
      method: 'POST',
      body: JSON.stringify(day),
    }),
};
