import { useEffect, useState } from 'react';
import { DashboardLayout, adminLinks, internLinks } from '../../layouts/DashboardLayout';
import { GlassCard, Modal } from '../../components/UI';
import { projectsApi, usersApi, User } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Plus, UserPlus } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  deadline: string;
  category: string;
  status?: string;
}

interface ProjectDetail extends Project {
  members: { name: string; role: string; project_role?: string }[];
  tasks: { title: string; status: string; progress: number }[];
}

const CATEGORIES = ['ai', 'web', 'mobile', 'research', 'general'];

export default function ProjectsPage({ role }: { role: 'admin' | 'intern' }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();
  const links = role === 'admin' ? adminLinks : internLinks;

  const load = () => projectsApi.list().then(setProjects);
  useEffect(() => {
    load();
    if (role === 'admin') usersApi.list().then(setUsers);
  }, [role]);

  const openDetail = async (id: string) => {
    const data = await projectsApi.get(id);
    setDetail(data as ProjectDetail);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await projectsApi.create({
        name: fd.get('name'),
        description: fd.get('description'),
        deadline: fd.get('deadline'),
        category: fd.get('category'),
      });
      toast('Project created');
      setShowCreate(false);
      load();
    } catch { toast('Failed to create project', 'error'); }
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showAddMember) return;
    const fd = new FormData(e.currentTarget);
    try {
      await projectsApi.addMember(showAddMember, { user_id: fd.get('user_id'), role: fd.get('role') });
      toast('Member added to project');
      setShowAddMember(null);
      openDetail(showAddMember);
    } catch { toast('Failed to add member', 'error'); }
  };

  const handleUpdateProgress = async (id: string, progress: number) => {
    try {
      await projectsApi.update(id, { progress });
      toast('Progress updated');
      openDetail(id);
      load();
    } catch { toast('Failed to update', 'error'); }
  };

  return (
    <DashboardLayout title="Projects" links={links}>
      {role === 'admin' && (
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> New Project
          </button>
        </div>
      )}
      <div className="charts-grid">
        {projects.map(p => (
          <GlassCard key={p.id} style={{ padding: 24, cursor: 'pointer' }} onClick={() => openDetail(p.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)' }}>{p.name}</h3>
              <span className={`badge badge--${p.status === 'completed' ? 'done' : 'pending'}`}>{p.status || 'active'}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 12 }}>{p.description}</p>
            <span className="badge badge--pending" style={{ marginBottom: 12 }}>{p.category}</span>
            <div className="progress-bar" style={{ marginBottom: 8 }}><div className="progress-bar__fill" style={{ width: `${p.progress}%` }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--green)' }}>{p.progress}% complete</span>
              <span style={{ color: 'var(--text-muted)' }}>Due: {p.deadline}</span>
            </div>
          </GlassCard>
        ))}
        {projects.length === 0 && (
          <GlassCard style={{ padding: 40, textAlign: 'center', gridColumn: '1 / -1' }}>
            <p style={{ color: 'var(--text-muted)' }}>No projects yet. {role === 'admin' ? 'Create one to get started.' : 'No project assigned yet.'}</p>
          </GlassCard>
        )}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name || 'Project'}>
        {detail && (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{detail.description}</p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div className="progress-bar"><div className="progress-bar__fill" style={{ width: `${detail.progress}%` }} /></div>
                <p style={{ fontSize: '0.8rem', color: 'var(--green)', marginTop: 4 }}>{detail.progress}% — Due: {detail.deadline}</p>
              </div>
              {role === 'admin' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="number" min={0} max={100} defaultValue={detail.progress} id="prog-input"
                    style={{ width: 70, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--text)' }} />
                  <button className="btn-ghost" style={{ fontSize: '0.8rem' }}
                    onClick={() => handleUpdateProgress(detail.id, Number((document.getElementById('prog-input') as HTMLInputElement)?.value))}>
                    Update
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4>Team Members</h4>
              {role === 'admin' && (
                <button className="btn-ghost" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setShowAddMember(detail.id)}>
                  <UserPlus size={14} /> Add Member
                </button>
              )}
            </div>
            {detail.members?.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No members yet.</p> :
              detail.members?.map((m, i) => (
                <div key={i} style={{ padding: '6px 0', fontSize: '0.9rem' }}>
                  {m.name} — <span className="badge badge--pending">{m.project_role || m.role}</span>
                </div>
              ))}

            <h4 style={{ margin: '16px 0 8px' }}>Tasks</h4>
            {detail.tasks?.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No tasks for this project.</p> :
              detail.tasks?.map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                  <span>{t.title}</span>
                  <span className={`badge badge--${t.status === 'completed' ? 'done' : 'progress'}`}>{t.status}</span>
                </div>
              ))}
          </>
        )}
      </Modal>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Project">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label>Project Name</label><input name="name" required /></div>
          <div className="form-group"><label>Description</label><textarea name="description" rows={3} /></div>
          <div className="form-group"><label>Deadline</label><input name="deadline" type="date" required /></div>
          <div className="form-group">
            <label>Category</label>
            <select name="category">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary">Create Project</button>
        </form>
      </Modal>

      <Modal open={!!showAddMember} onClose={() => setShowAddMember(null)} title="Add Team Member">
        <form onSubmit={handleAddMember}>
          <div className="form-group">
            <label>Select User</label>
            <select name="user_id" required>
              {users.filter(u => u.role !== 'admin').map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Project Role</label>
            <select name="role">
              <option value="member">Member</option>
              <option value="lead">Lead</option>
              <option value="intern">Intern</option>
              <option value="reviewer">Reviewer</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">Add to Project</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
