const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || '/api';

function getToken() {
  return localStorage.getItem('ag_token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
  ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => api<User>('/auth/me'),
};

export interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  employee_id?: string;
  department?: string;
  performance_score?: number;
  mentor_id?: string;
  project_id?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  progress: number;
  deadline?: string;
  project_name?: string;
  assignee_name?: string;
  assignee_id?: string;
  project_id?: string;
  estimated_hours?: number;
  start_date?: string;
}

export interface Submission {
  id: string;
  task_id: string;
  task_title?: string;
  user_name?: string;
  summary?: string;
  file_url?: string;
  file_name?: string;
  status: string;
  mentor_feedback?: string;
  submitted_at: string;
}

export const dashboardApi = {
  admin: () => api<AdminDashboard>('/dashboard/admin'),
  employee: () => api<EmployeeDashboard>('/dashboard/employee'),
  intern: () => api<InternDashboard>('/dashboard/intern'),
};

export interface AdminDashboard {
  stats: Record<string, number>;
  recentActivity: { type: string; label: string; time: string }[];
  deptDistribution: { department: string; count: number }[];
  taskCompletion: { status: string; count: number }[];
  weeklyAttendance: { date: string; status: string; count: number }[];
  recentLogins?: { name: string; role: string; department: string; last_login: string }[];
}

export interface EmployeeDashboard {
  tasks: Task[];
  announcements: { id: string; title: string; content: string; pinned: number }[];
  attendance: { status: string } | null;
  performanceScore: number | null;
}

export interface InternDashboard {
  mentor: { name: string; department: string } | null;
  project: { name: string; progress: number; deadline: string } | null;
  tasks: Task[];
  attendance: { date: string; status: string }[];
  submissions: { title: string; status: string; submitted_at: string }[];
  performanceScore: number;
  certificateProgress: number;
}

export const tasksApi = {
  list: () => api<Task[]>('/tasks'),
  create: (data: object) => api('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: object) => api(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  submit: (id: string, data: object) => api(`/tasks/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  review: (id: string, data: object) => api(`/tasks/${id}/review`, { method: 'PATCH', body: JSON.stringify(data) }),
  comments: (id: string) => api<{ id: string; content: string; user_name: string; created_at: string }[]>(`/tasks/${id}/comments`),
  addComment: (id: string, content: string) => api(`/tasks/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  submissions: (id: string) => api<Submission[]>(`/tasks/${id}/submissions`),
  pendingSubmissions: () => api<Submission[]>('/tasks/submissions/pending'),
};

export const attendanceApi = {
  list: () => api<{ id: string; date: string; status: string; check_in?: string; check_out?: string; note?: string; user_id?: string }[]>('/attendance'),
  stats: () => api<{ present: number; late: number; absent: number; breakdown: Record<string, number> }>('/attendance/stats'),
  mark: (data: object) => api('/attendance/mark', { method: 'POST', body: JSON.stringify(data) }),
  overview: () => api<{ today: { status: string; count: number }[]; weekly: unknown[] }>('/attendance/overview'),
  override: (id: string, data: object) => api(`/attendance/${id}/override`, { method: 'PATCH', body: JSON.stringify(data) }),
  exportCsv: () => fetch('/api/attendance/export', { headers: { Authorization: `Bearer ${getToken()}` } }),
};

export const projectsApi = {
  list: () => api('/projects'),
  get: (id: string) => api(`/projects/${id}`),
  create: (data: object) => api('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: object) => api(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  addMember: (id: string, data: object) => api(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify(data) }),
};

export const notificationsApi = {
  list: () => api<Notification[]>('/notifications'),
  read: (id: string) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
  readAll: () => api('/notifications/read-all', { method: 'PATCH' }),
};

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: number;
  created_at: string;
}

export const announcementsApi = {
  list: () => api('/announcements'),
  create: (data: object) => api('/announcements', { method: 'POST', body: JSON.stringify(data) }),
};

export const documentsApi = {
  list: () => api('/documents'),
  upload: (file: File, folder?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    if (folder) fd.append('folder', folder);
    return api('/documents/upload', { method: 'POST', body: fd });
  },
};

export const chatApi = {
  list: (params: string) => api(`/chat?${params}`),
  send: (data: object) => api('/chat', { method: 'POST', body: JSON.stringify(data) }),
};

export const leavesApi = {
  list: () => api('/leaves'),
  request: (data: object) => api('/leaves', { method: 'POST', body: JSON.stringify(data) }),
  approve: (id: string, status: 'approved' | 'rejected') => api(`/leaves/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export const usersApi = {
  list: () => api<User[]>('/users'),
  get: (id: string) => api<Record<string, unknown>>(`/users/${id}`),
  create: (data: object) => api('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: object) => api<Record<string, unknown>>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/users/${id}`, { method: 'DELETE' }),
};

export const settingsApi = {
  get: () => api<{ theme: string; notifications_enabled: number; language: string; two_fa_enabled: number }>('/settings'),
  update: (data: object) => api('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
};

export const calendarApi = {
  events: (month?: string) => api<{ date: string; title: string; type: string }[]>(`/calendar/events${month ? `?month=${month}` : ''}`),
};
