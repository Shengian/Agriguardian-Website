import { useEffect, useState } from 'react';
import { DashboardLayout, internLinks } from '../../layouts/DashboardLayout';
import { StatCard, GlassCard, ProgressRing } from '../../components/UI';
import { User, FolderKanban, CheckSquare, Calendar, Award } from 'lucide-react';
import { dashboardApi, InternDashboard, Task } from '../../api/client';

export default function InternDashboardPage() {
  const [data, setData] = useState<InternDashboard | null>(null);

  useEffect(() => { dashboardApi.intern().then(setData); }, []);

  if (!data) return <DashboardLayout title="Intern Dashboard" links={internLinks}><div className="page-loader"><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Intern Dashboard" links={internLinks}>
      <div className="stats-grid">
        <StatCard label="Assigned Tasks" value={data.tasks.length} icon={CheckSquare} />
        <StatCard label="Mentor" value={data.mentor?.name?.split(' ')[0] || '—'} icon={User} />
        <StatCard label="Project" value={data.project?.name?.split(' ')[0] || '—'} icon={FolderKanban} />
        <StatCard label="Performance" value={`${data.performanceScore}%`} icon={Award} />
      </div>

      <div className="charts-grid">
        <GlassCard style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 8 }}>Current Project</h3>
          {data.project ? (
            <>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{data.project.name} — Deadline: {data.project.deadline}</p>
              <div className="progress-bar" style={{ marginBottom: 8 }}><div className="progress-bar__fill" style={{ width: `${data.project.progress}%` }} /></div>
              <span style={{ fontSize: '0.85rem', color: 'var(--green)' }}>{data.project.progress}% complete</span>
            </>
          ) : <p style={{ color: 'var(--text-muted)' }}>No project assigned</p>}
          {data.mentor && <p style={{ marginTop: 16, fontSize: '0.9rem' }}><strong>Mentor:</strong> {data.mentor.name} ({data.mentor.department})</p>}
        </GlassCard>

        <GlassCard style={{ padding: 24, textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Certificate Progress</h3>
          <div style={{ display: 'flex', justifyContent: 'center' }}><ProgressRing progress={data.certificateProgress} size={100} /></div>
          <p style={{ marginTop: 12, fontWeight: 600, color: 'var(--gold)' }}>{data.certificateProgress}%</p>
        </GlassCard>
      </div>

      <GlassCard style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Assigned Task Sheet</h3>
        <table className="data-table">
          <thead><tr><th>Task</th><th>Priority</th><th>Deadline</th><th>Status</th><th>Progress</th></tr></thead>
          <tbody>
            {data.tasks.map((t: Task) => (
              <tr key={t.id}>
                <td><strong>{t.title}</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.description}</span></td>
                <td><span className={`badge badge--${t.priority === 'high' ? 'high' : 'pending'}`}>{t.priority}</span></td>
                <td>{t.deadline}</td>
                <td><span className={`badge badge--${t.status === 'completed' ? 'done' : 'progress'}`}>{t.status}</span></td>
                <td><div className="progress-bar"><div className="progress-bar__fill" style={{ width: `${t.progress}%` }} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Submission Status</h3>
        {data.submissions.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No submissions yet.</p> :
          data.submissions.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span><strong>{s.title}</strong> — {s.submitted_at}</span>
              <span className={`badge badge--${s.status === 'approved' ? 'done' : 'progress'}`}>{s.status}</span>
            </div>
          ))}
      </GlassCard>

      <GlassCard style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={20} /> Attendance History</h3>
        {data.attendance.map((a, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span>{a.date}</span>
            <span className={`badge badge--${a.status === 'present' ? 'done' : a.status === 'late' ? 'pending' : 'high'}`}>{a.status}</span>
          </div>
        ))}
      </GlassCard>
    </DashboardLayout>
  );
}
