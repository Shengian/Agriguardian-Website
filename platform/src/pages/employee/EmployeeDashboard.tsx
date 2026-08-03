import { useEffect, useState } from 'react';
import { DashboardLayout, employeeLinks } from '../../layouts/DashboardLayout';
import { StatCard, GlassCard } from '../../components/UI';
import { CheckSquare, Calendar, Bell } from 'lucide-react';
import { dashboardApi, EmployeeDashboard, Task } from '../../api/client';

function EmptyMessage({ message }: { message: string }) {
  return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>{message}</p>;
}

export default function EmployeeDashboardPage() {
  const [data, setData] = useState<EmployeeDashboard | null>(null);

  useEffect(() => { dashboardApi.employee().then(setData); }, []);

  if (!data) return <DashboardLayout title="Employee Dashboard" links={employeeLinks}><div className="page-loader"><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Employee Dashboard" links={employeeLinks}>
      <div className="stats-grid">
        <StatCard label="Active Tasks" value={data.tasks.length} icon={CheckSquare} />
        <StatCard label="Today's Attendance" value={data.attendance?.status || 'Not marked'} icon={Calendar} />
        <StatCard label="Announcements" value={data.announcements.length} icon={Bell} />
      </div>

      <GlassCard style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>My Tasks</h3>
        {data.tasks.length === 0 ? (
          <EmptyMessage message="No tasks assigned yet." />
        ) : (
          <table className="data-table">
            <thead><tr><th>Task</th><th>Priority</th><th>Status</th><th>Progress</th></tr></thead>
            <tbody>
              {data.tasks.map((t: Task) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td><span className={`badge badge--${t.priority === 'high' ? 'high' : 'pending'}`}>{t.priority}</span></td>
                  <td><span className={`badge badge--${t.status === 'completed' ? 'done' : 'progress'}`}>{t.status}</span></td>
                  <td>
                    <div className="progress-bar"><div className="progress-bar__fill" style={{ width: `${t.progress}%` }} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      <GlassCard style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Announcements</h3>
        {data.announcements.length === 0 ? (
          <EmptyMessage message="No announcements yet." />
        ) : (
          data.announcements.map(a => (
            <div key={a.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <strong>{a.title}</strong>{a.pinned ? ' 📌' : ''}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>{a.content}</p>
            </div>
          ))
        )}
      </GlassCard>
    </DashboardLayout>
  );
}
