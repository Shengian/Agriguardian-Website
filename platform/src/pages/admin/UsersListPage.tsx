import { DashboardLayout, adminLinks } from '../../layouts/DashboardLayout';
import { GlassCard, Modal } from '../../components/UI';
import { usersApi, User } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Eye } from 'lucide-react';

const DEPARTMENTS = ['Executive', 'Operations', 'Finance', 'Technology', 'Research', 'HR', 'Marketing', 'Sales'];

export default function UsersListPage({ type }: { type: 'employee' | 'intern' }) {
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [viewUser, setViewUser] = useState<Record<string, unknown> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const { toast } = useToast();

  const load = () => usersApi.list().then(all => setUsers(all.filter(u => u.role === type)));
  useEffect(() => { load(); }, [type]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await usersApi.create({
        name: fd.get('name'),
        email: fd.get('email'),
        password: fd.get('password'),
        role: type,
        employee_id: fd.get('employee_id'),
        department: fd.get('department'),
      });
      toast(`${type === 'employee' ? 'Employee' : 'Intern'} added successfully`);
      setShowAdd(false);
      load();
    } catch { toast('Failed to add user', 'error'); }
  };

  const handleView = async (u: User) => {
    const profile = await usersApi.get(u.id);
    setViewUser(profile);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await usersApi.delete(deleteConfirm.id);
      toast(`${type === 'employee' ? 'Employee' : 'Intern'} removed`);
      setDeleteConfirm(null);
      load();
    } catch { toast('Failed to delete user', 'error'); }
  };

  return (
    <DashboardLayout title={type === 'employee' ? 'Employees' : 'Interns'} links={adminLinks}>
      <GlassCard style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)' }}>{type === 'employee' ? 'Employee Directory' : 'Intern Directory'} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 400 }}>({users.length})</span></h3>
          <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Add {type === 'employee' ? 'Employee' : 'Intern'}
          </button>
        </div>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>ID</th><th>Department</th><th>Performance</th><th>Actions</th></tr></thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No {type}s found. Add one to get started.</td></tr>
            ) : users.map(u => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                <td><span className="badge badge--pending">{u.employee_id}</span></td>
                <td>{u.department}</td>
                <td><span style={{ color: 'var(--green)', fontWeight: 600 }}>{u.performance_score}%</span></td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleView(u)}>
                    <Eye size={14} />
                  </button>
                  <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setDeleteConfirm(u)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={`Add ${type === 'employee' ? 'Employee' : 'Intern'}`}>
        <form onSubmit={handleAdd}>
          <div className="form-group"><label>Full Name</label><input name="name" required /></div>
          <div className="form-group"><label>Email</label><input name="email" type="email" required /></div>
          <div className="form-group"><label>Password</label><input name="password" type="password" required minLength={6} placeholder="Min 6 characters" /></div>
          <div className="form-group"><label>Employee ID</label><input name="employee_id" required placeholder={type === 'employee' ? 'EMP-005' : 'INT-002'} /></div>
          <div className="form-group">
            <label>Department</label>
            <select name="department" required>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary">Create Account</button>
        </form>
      </Modal>

      <Modal open={!!viewUser} onClose={() => setViewUser(null)} title={viewUser?.name as string || 'Profile'}>
        {viewUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                {(viewUser.name as string)?.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)' }}>{viewUser.name as string}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{viewUser.email as string}</p>
              </div>
            </div>
            {[
              { label: 'Employee ID', value: viewUser.employee_id },
              { label: 'Department', value: viewUser.department },
              { label: 'Role', value: viewUser.role },
              { label: 'Performance Score', value: `${viewUser.performance_score}%` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <strong>{value as string || '—'}</strong>
              </div>
            ))}
            {viewUser.bio && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 8 }}>{viewUser.bio as string}</p>}
          </div>
        )}
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <p style={{ marginBottom: 20 }}>Are you sure you want to remove <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" style={{ background: '#dc2626' }} onClick={handleDelete}>Delete</button>
          <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
