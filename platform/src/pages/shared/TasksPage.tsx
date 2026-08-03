import { useEffect, useState } from 'react';
import { DashboardLayout, adminLinks, employeeLinks } from '../../layouts/DashboardLayout';
import { GlassCard, Modal } from '../../components/UI';
import { tasksApi, Task, Submission, usersApi, projectsApi, User } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Plus, MessageSquare, Eye } from 'lucide-react';

export default function TasksPage({ role }: { role: 'admin' | 'employee' }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [submitModal, setSubmitModal] = useState<Task | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [detailModal, setDetailModal] = useState<Task | null>(null);
  const [comments, setComments] = useState<{ id: string; content: string; user_name: string; created_at: string }[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [commentText, setCommentText] = useState('');
  const [pendingSubs, setPendingSubs] = useState<Submission[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const links = role === 'admin' ? adminLinks : employeeLinks;

  const load = () => tasksApi.list().then(setTasks);
  useEffect(() => {
    load();
    if (role === 'admin') {
      usersApi.list().then(setUsers);
      projectsApi.list().then(setProjects);
      tasksApi.pendingSubmissions().then(setPendingSubs).catch(() => {});
    }
  }, [role]);

  const openDetail = async (task: Task) => {
    setDetailModal(task);
    const [c, s] = await Promise.all([
      tasksApi.comments(task.id),
      tasksApi.submissions(task.id),
    ]);
    setComments(c);
    setSubmissions(s);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!submitModal) return;
    const fd = new FormData(e.currentTarget);
    try {
      await tasksApi.submit(submitModal.id, { summary: fd.get('summary'), file_url: fd.get('file_url'), file_name: fd.get('file_name') });
      toast('Work submitted successfully');
      setSubmitModal(null);
      load();
    } catch { toast('Submission failed', 'error'); }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await tasksApi.create({
        title: fd.get('title'),
        description: fd.get('description'),
        priority: fd.get('priority'),
        deadline: fd.get('deadline'),
        assignee_id: fd.get('assignee_id'),
        assignee_type: fd.get('assignee_type'),
        project_id: fd.get('project_id'),
        estimated_hours: fd.get('estimated_hours'),
      });
      toast('Task assigned successfully');
      setCreateModal(false);
      load();
    } catch { toast('Failed to create task', 'error'); }
  };

  const handleReview = async (submissionId: string, status: string) => {
    if (!detailModal) return;
    const feedback = status === 'approved' ? 'Great work!' : 'Please revise and resubmit.';
    try {
      await tasksApi.review(detailModal.id, { submission_id: submissionId, status, feedback });
      toast(`Submission ${status.replace('_', ' ')}`);
      openDetail(detailModal);
      load();
      if (role === 'admin') tasksApi.pendingSubmissions().then(setPendingSubs);
    } catch { toast('Review failed', 'error'); }
  };

  const addComment = async () => {
    if (!detailModal || !commentText.trim()) return;
    await tasksApi.addComment(detailModal.id, commentText);
    setCommentText('');
    setComments(await tasksApi.comments(detailModal.id));
  };

  const statusBadge = (s: string) => `badge badge--${s === 'completed' ? 'done' : s === 'in-progress' || s === 'submitted' ? 'progress' : 'pending'}`;
  const assignableUsers = users.filter(u => u.role === 'employee');
  const pageTitle = role === 'employee' ? 'My Tasks' : 'Task Management';
  const taskListTitle = role === 'employee' ? 'My Tasks' : 'All Tasks';

  return (
    <DashboardLayout title={pageTitle} links={links}>
      {role === 'admin' && pendingSubs.length > 0 && (
        <GlassCard style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 12 }}>Pending Reviews ({pendingSubs.length})</h3>
          {pendingSubs.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span><strong>{s.task_title}</strong> by {s.user_name}</span>
              <button className="btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => {
                const t = tasks.find(x => x.id === s.task_id);
                if (t) openDetail(t);
              }}>Review</button>
            </div>
          ))}
        </GlassCard>
      )}

      <GlassCard style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)' }}>{taskListTitle}</h3>
          {role === 'admin' && (
            <button className="btn-primary" onClick={() => setCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Assign Task
            </button>
          )}
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th><th>Priority</th><th>Deadline</th><th>Status</th><th>Progress</th>
              {role === 'admin' && <th>Assignee</th>}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr><td colSpan={role === 'admin' ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No tasks assigned yet.</td></tr>
            ) : tasks.map(t => (
              <tr key={t.id}>
                <td><strong>{t.title}</strong>{t.project_name && <><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.project_name}</span></>}</td>
                <td><span className={`badge badge--${t.priority === 'high' ? 'high' : 'pending'}`}>{t.priority}</span></td>
                <td>{t.deadline}</td>
                <td><span className={statusBadge(t.status)}>{t.status}</span></td>
                <td><div className="progress-bar"><div className="progress-bar__fill" style={{ width: `${t.progress}%` }} /></div></td>
                {role === 'admin' && <td>{t.assignee_name || '—'}</td>}
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 10px' }} onClick={() => openDetail(t)}><Eye size={14} /></button>
                  {role !== 'admin' && t.status !== 'completed' && t.status !== 'submitted' && (
                    <button className="btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 10px' }} onClick={() => setSubmitModal(t)}>
                      <Plus size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <Modal open={!!submitModal} onClose={() => setSubmitModal(null)} title="Submit Work">
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Work Summary</label><textarea name="summary" rows={4} required placeholder="Describe completed work..." /></div>
          <div className="form-group"><label>Document Link</label><input name="file_url" type="url" placeholder="https://drive.google.com/..." /></div>
          <div className="form-group"><label>File Name</label><input name="file_name" placeholder="report.pdf" /></div>
          <button type="submit" className="btn-primary">Submit for Review</button>
        </form>
      </Modal>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Assign Task">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label>Title</label><input name="title" required /></div>
          <div className="form-group"><label>Description</label><textarea name="description" rows={3} /></div>
          <div className="form-group"><label>Priority</label><select name="priority"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
          <div className="form-group"><label>Deadline</label><input name="deadline" type="date" required /></div>
          <div className="form-group"><label>Project</label>
            <select name="project_id"><option value="">No Project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </div>
          <div className="form-group"><label>Assign To</label>
            <select name="assignee_id" required>{assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}</select>
          </div>
          <input type="hidden" name="assignee_type" value="employee" />
          <div className="form-group"><label>Estimated Hours</label><input name="estimated_hours" type="number" step="0.5" defaultValue={4} /></div>
          <button type="submit" className="btn-primary">Assign Task</button>
        </form>
      </Modal>

      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal?.title || 'Task Details'}>
        {detailModal && (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{detailModal.description}</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span className={`badge badge--${detailModal.priority === 'high' ? 'high' : 'pending'}`}>{detailModal.priority}</span>
              <span className={statusBadge(detailModal.status)}>{detailModal.status}</span>
              {detailModal.estimated_hours && <span className="badge badge--pending">{detailModal.estimated_hours}h est.</span>}
            </div>

            {submissions.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ marginBottom: 8 }}>Submissions</h4>
                {submissions.map(s => (
                  <div key={s.id} style={{ padding: 12, background: 'var(--surface)', borderRadius: 10, marginBottom: 8 }}>
                    <p>{s.summary}</p>
                    {s.file_url && <a href={s.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontSize: '0.85rem' }}>{s.file_name || 'View file'}</a>}
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Status: {s.status} — {s.submitted_at}</p>
                    {s.mentor_feedback && <p style={{ fontSize: '0.85rem', marginTop: 4 }}><em>Feedback: {s.mentor_feedback}</em></p>}
                    {role === 'admin' && s.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => handleReview(s.id, 'approved')}>Approve</button>
                        <button className="btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => handleReview(s.id, 'changes_requested')}>Request Changes</button>
                        <button className="btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 12px', color: '#dc2626' }} onClick={() => handleReview(s.id, 'rejected')}>Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div>
              <h4 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><MessageSquare size={16} /> Comments</h4>
              {comments.map(c => (
                <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                  <strong>{c.user_name}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{c.created_at}</span>
                  <p>{c.content}</p>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--text)' }} />
                <button className="btn-primary" onClick={addComment}>Send</button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </DashboardLayout>
  );
}
