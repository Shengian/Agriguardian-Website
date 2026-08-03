import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, CheckSquare, FolderKanban, Bell, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, adminLinks } from '../../layouts/DashboardLayout';
import { StatCard, GlassCard, Modal } from '../../components/UI';
import { dashboardApi, type AdminDashboard as AdminDashboardData, tasksApi, announcementsApi, usersApi, projectsApi, User } from '../../api/client';
import { useToast } from '../../context/ToastContext';

const COLORS = ['#2E7D32', '#C9A227', '#4CAF50', '#9A7B0A', '#66BB6A'];

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    dashboardApi.admin().then(setData).catch(() => toast('Failed to load dashboard', 'error'));
    usersApi.list().then(setUsers);
    projectsApi.list().then(setProjects);
  }, []);

  const handleAssignTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await tasksApi.create(Object.fromEntries(fd));
      toast('Task assigned successfully');
      setShowTaskModal(false);
      dashboardApi.admin().then(setData);
    } catch { toast('Failed to assign task', 'error'); }
  };

  const handleAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await announcementsApi.create({ title: fd.get('title'), content: fd.get('content'), pinned: fd.get('pinned') === 'on' });
      toast('Announcement posted');
      setShowAnnounceModal(false);
    } catch { toast('Failed to post', 'error'); }
  };

  if (!data) return <DashboardLayout title="Admin Dashboard" links={adminLinks}><div className="page-loader"><div className="spinner" /></div></DashboardLayout>;

  const s = data.stats;
  const attendanceChart = data.weeklyAttendance.reduce((acc: { date: string; count: number }[], item) => {
    const existing = acc.find(a => a.date === item.date);
    if (existing) existing.count += item.count;
    else acc.push({ date: item.date, count: item.count });
    return acc;
  }, []);

  return (
    <DashboardLayout title="Admin Dashboard" links={adminLinks}>
      <div className="stats-grid">
        <StatCard label="Employees" value={s.employees} icon={Users} delay={0} />
        <StatCard label="Today's Attendance" value={s.todayAttendance} icon={Calendar} delay={0.05} />
        <StatCard label="Pending Tasks" value={s.pendingTasks} icon={CheckSquare} delay={0.15} />
        <StatCard label="Completed Tasks" value={s.completedTasks} icon={CheckSquare} delay={0.2} />
        <StatCard label="Projects" value={s.projects} icon={FolderKanban} delay={0.25} />
        <StatCard label="Announcements" value={s.announcements} icon={Bell} delay={0.3} />
        <StatCard label="Performance" value={`${s.performance}%`} icon={TrendingUp} delay={0.35} />
      </div>

      <div className="charts-grid">
        <GlassCard className="chart-card">
          <h3>Attendance Graph</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={attendanceChart}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2E7D32" strokeWidth={2} dot={{ fill: '#C9A227' }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="chart-card">
          <h3>Task Completion</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.taskCompletion}>
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2E7D32" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="chart-card">
          <h3>Department Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.deptDistribution} dataKey="count" nameKey="department" cx="50%" cy="50%" outerRadius={80} label>
                {data.deptDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <div className="charts-grid">
        <GlassCard style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[
              { label: 'Assign Task', action: () => setShowTaskModal(true) },
              { label: 'Add Employee', action: () => navigate('/admin/employees') },
              { label: 'Post Announcement', action: () => setShowAnnounceModal(true) },
              { label: 'Manage Attendance', action: () => navigate('/admin/attendance') },
              { label: 'Upload Documents', action: () => navigate('/admin/documents') },
              { label: 'Export Report', action: () => navigate('/admin/analytics') },
            ].map(({ label, action }) => (
              <motion.button key={label} className="btn-ghost" whileHover={{ scale: 1.03 }} onClick={action}>
                {label}
              </motion.button>
            ))}
          </div>
        </GlassCard>

        <GlassCard style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={20} /> Recent Activity</h3>
          {data.recentActivity.map((a, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
              <strong>{a.label}</strong>
              <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.8rem' }}>{a.time}</span>
            </div>
          ))}
        </GlassCard>

        {data.recentLogins && (
          <GlassCard style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Recent Logins</h3>
            {data.recentLogins.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                <span><strong>{l.name}</strong> <span className="badge badge--pending" style={{ marginLeft: 8 }}>{l.role}</span></span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{l.department}</span>
              </div>
            ))}
          </GlassCard>
        )}
      </div>

      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="Assign Task">
        <form onSubmit={handleAssignTask}>
          <div className="form-group"><label>Title</label><input name="title" required /></div>
          <div className="form-group"><label>Description</label><textarea name="description" rows={3} /></div>
          <div className="form-group"><label>Priority</label><select name="priority"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
          <div className="form-group"><label>Deadline</label><input name="deadline" type="date" required /></div>
          <div className="form-group"><label>Project</label>
            <select name="project_id"><option value="">No Project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </div>
          <div className="form-group"><label>Assign To</label>
            <select name="assignee_id" required>{users.filter(u => u.role === 'employee').map(u => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}</select>
          </div>
          <input type="hidden" name="assignee_type" value="employee" />
          <div className="form-group"><label>Estimated Hours</label><input name="estimated_hours" type="number" step="0.5" defaultValue={4} /></div>
          <button type="submit" className="btn-primary">Assign Task</button>
        </form>
      </Modal>

      <Modal open={showAnnounceModal} onClose={() => setShowAnnounceModal(false)} title="Post Announcement">
        <form onSubmit={handleAnnouncement}>
          <div className="form-group"><label>Title</label><input name="title" required /></div>
          <div className="form-group"><label>Content</label><textarea name="content" rows={4} required /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><input type="checkbox" name="pinned" /> Pin announcement</label>
          <button type="submit" className="btn-primary">Post</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
