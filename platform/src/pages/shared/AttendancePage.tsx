import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DashboardLayout, adminLinks, employeeLinks } from '../../layouts/DashboardLayout';
import { GlassCard, StatCard, Modal } from '../../components/UI';
import { attendanceApi, leavesApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Calendar, Download } from 'lucide-react';

const COLORS = ['#2E7D32', '#C9A227', '#dc2626'];

export default function AttendancePage({ role }: { role: 'admin' | 'employee' }) {
  const [records, setRecords] = useState<{ id: string; date: string; status: string; check_in?: string; check_out?: string; note?: string }[]>([]);
  const [stats, setStats] = useState<{ present: number; late: number; absent: number; breakdown: Record<string, number> } | null>(null);
  const [overview, setOverview] = useState<{ today: { status: string; count: number }[] } | null>(null);
  const [leaves, setLeaves] = useState<{ id: string; start_date: string; end_date: string; reason: string; status: string; user_name?: string }[]>([]);
  const [overrideModal, setOverrideModal] = useState<{ id: string; status: string } | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const links = role === 'admin' ? adminLinks : employeeLinks;

  const refresh = () => {
    attendanceApi.list().then(setRecords);
    attendanceApi.stats().then(setStats);
    if (role === 'admin') attendanceApi.overview().then(setOverview);
    leavesApi.list().then(setLeaves).catch(() => {});
  };

  useEffect(() => { refresh(); }, [role]);

  const handleMark = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await attendanceApi.mark(Object.fromEntries(fd));
      toast('Attendance marked');
      refresh();
      e.currentTarget.reset();
    } catch { toast('Failed to mark attendance', 'error'); }
  };

  const handleOverride = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!overrideModal) return;
    const fd = new FormData(e.currentTarget);
    try {
      await attendanceApi.override(overrideModal.id, { status: fd.get('status'), note: fd.get('note') });
      toast('Attendance overridden');
      setOverrideModal(null);
      refresh();
    } catch { toast('Override failed', 'error'); }
  };

  const handleLeave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await leavesApi.request({ start_date: fd.get('start_date'), end_date: fd.get('end_date'), reason: fd.get('reason') });
      toast('Leave request submitted');
      setShowLeaveModal(false);
      refresh();
    } catch { toast('Leave request failed', 'error'); }
  };

  const handleLeaveApproval = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await leavesApi.approve(id, status);
      toast(`Leave ${status}`);
      refresh();
    } catch { toast(`Failed to ${status} leave`, 'error'); }
  };

  const handleExport = async () => {
    try {
      const res = await attendanceApi.exportCsv();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance-export.csv';
      a.click();
      toast('Attendance exported');
    } catch { toast('Export failed', 'error'); }
  };

  const pieData = stats && stats.total > 0 ? [
    { name: 'Present', value: stats.breakdown.present || 0 },
    { name: 'Late', value: stats.breakdown.late || 0 },
    { name: 'Absent', value: stats.breakdown.absent || 0 },
  ] : [];

  const hasStats = stats && stats.total > 0;
  const pageTitle = role === 'employee' ? 'My Attendance' : 'Attendance';

  return (
    <DashboardLayout title={pageTitle} links={links}>
      {hasStats && (
        <div className="stats-grid">
          <StatCard label="Present %" value={`${stats.present}%`} icon={Calendar} />
          <StatCard label="Late %" value={`${stats.late}%`} icon={Calendar} />
          <StatCard label="Absent %" value={`${stats.absent}%`} icon={Calendar} />
        </div>
      )}

      {role === 'admin' && overview && (
        <GlassCard style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-heading)' }}>Today's Overview</h3>
            <button className="btn-ghost" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={16} /> Export Excel
            </button>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {overview.today.map((t, i) => (
              <div key={i} style={{ padding: '12px 20px', background: 'var(--surface)', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green)' }}>{t.count}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{t.status}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <div className="charts-grid">
        {role !== 'admin' && (
          <GlassCard style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Mark Attendance</h3>
            <form onSubmit={handleMark}>
              <div className="form-group"><label>Date</label><input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required /></div>
              <div className="form-group"><label>Status</label>
                <select name="status" required>
                  <option value="present">Present</option>
                  <option value="wfh">Work From Home</option>
                  <option value="half-day">Half Day</option>
                  <option value="leave">Leave</option>
                </select>
              </div>
              <div className="form-group"><label>Check In</label><input name="check_in" type="time" /></div>
              <div className="form-group"><label>Note</label><textarea name="note" rows={2} placeholder="Daily work focus..." /></div>
              <button type="submit" className="btn-primary">Mark Attendance</button>
            </form>
            <button className="btn-ghost" style={{ marginTop: 12 }} onClick={() => setShowLeaveModal(true)}>Request Leave</button>
          </GlassCard>
        )}

        {hasStats ? (
        <GlassCard className="chart-card">
          <h3>Attendance Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
        ) : role !== 'admin' && (
          <GlassCard style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No attendance records yet. Mark your attendance to get started.</p>
          </GlassCard>
        )}
      </div>

      {leaves.length > 0 && (
        <GlassCard style={{ padding: 24, marginTop: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Leave Requests {role === 'admin' ? `(All)` : ''}</h3>
          <table className="data-table">
            <thead><tr>
              {role === 'admin' && <th>Employee</th>}
              <th>From</th><th>To</th><th>Reason</th><th>Status</th>
              {role === 'admin' && <th>Action</th>}
            </tr></thead>
            <tbody>
              {leaves.map(l => (
                <tr key={l.id}>
                  {role === 'admin' && <td><strong>{(l as { user_name?: string }).user_name || '—'}</strong></td>}
                  <td>{l.start_date}</td><td>{l.end_date}</td><td>{l.reason}</td>
                  <td><span className={`badge badge--${l.status === 'approved' ? 'done' : l.status === 'rejected' ? 'high' : 'pending'}`}>{l.status}</span></td>
                  {role === 'admin' && (
                    <td>
                      {l.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => handleLeaveApproval(l.id, 'approved')}>Approve</button>
                          <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#dc2626' }} onClick={() => handleLeaveApproval(l.id, 'rejected')}>Reject</button>
                        </div>
                      ) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      <GlassCard style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Attendance History</h3>
        <table className="data-table">
          <thead><tr><th>Date</th>{role === 'admin' && <th>Employee</th>}<th>Status</th><th>Check In</th><th>Check Out</th><th>Note</th>{role === 'admin' && <th>Action</th>}</tr></thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={role === 'admin' ? 7 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No attendance records yet.</td></tr>
            ) : records.map(r => (
              <tr key={r.id}>
                <td>{r.date}</td>
                {role === 'admin' && <td>{(r as { user_name?: string }).user_name || '—'}</td>}
                <td><span className={`badge badge--${r.status === 'present' ? 'done' : r.status === 'late' ? 'pending' : 'high'}`}>{r.status}</span></td>
                <td>{r.check_in || '—'}</td>
                <td>{r.check_out || '—'}</td>
                <td>{r.note || '—'}</td>
                {role === 'admin' && (
                  <td><button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => setOverrideModal({ id: r.id, status: r.status })}>Override</button></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <Modal open={!!overrideModal} onClose={() => setOverrideModal(null)} title="Override Attendance">
        <form onSubmit={handleOverride}>
          <div className="form-group"><label>Status</label>
            <select name="status" defaultValue={overrideModal?.status}>
              <option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option>
              <option value="wfh">WFH</option><option value="half-day">Half Day</option><option value="leave">Leave</option>
            </select>
          </div>
          <div className="form-group"><label>Note</label><textarea name="note" rows={2} placeholder="Override reason..." /></div>
          <button type="submit" className="btn-primary">Save Override</button>
        </form>
      </Modal>

      <Modal open={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Request Leave">
        <form onSubmit={handleLeave}>
          <div className="form-group"><label>Start Date</label><input name="start_date" type="date" required /></div>
          <div className="form-group"><label>End Date</label><input name="end_date" type="date" required /></div>
          <div className="form-group"><label>Reason</label><textarea name="reason" rows={3} required /></div>
          <button type="submit" className="btn-primary">Submit Request</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
