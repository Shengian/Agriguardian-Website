import { useEffect, useState } from 'react';
import { DashboardLayout, adminLinks, employeeLinks } from '../../layouts/DashboardLayout';
import { GlassCard } from '../../components/UI';
import { chatApi, projectsApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Send, Smile } from 'lucide-react';

const EMOJIS = ['👍', '✅', '🎉', '💪', '🌱', '📎'];

export default function ChatPage({ role }: { role: 'admin' | 'employee' }) {
  const [messages, setMessages] = useState<{ id: string; content: string; sender_name: string; created_at: string }[]>([]);
  const [text, setText] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const links = role === 'admin' ? adminLinks : employeeLinks;

  useEffect(() => {
    projectsApi.list().then(ps => {
      setProjects(ps);
      const pid = user?.project_id || ps[0]?.id;
      if (pid) setProjectId(pid);
    });
  }, [user]);

  useEffect(() => {
    if (projectId) loadMessages();
    const interval = setInterval(() => projectId && loadMessages(), 10000);
    return () => clearInterval(interval);
  }, [projectId]);

  const loadMessages = () => {
    if (!projectId) return;
    chatApi.list(`project_id=${projectId}`).then(setMessages).catch(() => {});
  };

  const send = async () => {
    if (!text.trim() || !projectId) return;
    try {
      await chatApi.send({ content: text, project_id: projectId });
      setText('');
      loadMessages();
    } catch { toast('Failed to send', 'error'); }
  };

  const title = role === 'intern' ? 'Mentor Chat' : role === 'admin' ? 'Team Chat' : 'Messages';

  return (
    <DashboardLayout title={title} links={links}>
      <GlassCard style={{ padding: 24, maxWidth: 800 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)' }}>Project Discussion</h3>
          {projects.length > 1 && (
            <select value={projectId || ''} onChange={e => setProjectId(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--text)' }}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>
        <div style={{ maxHeight: 420, overflowY: 'auto', marginBottom: 16, padding: '0 4px' }}>
          {messages.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No messages yet. Start the conversation!</p> :
            messages.map(m => (
              <div key={m.id} style={{
                padding: '12px 0', borderBottom: '1px solid var(--border)',
                marginLeft: m.sender_name === user?.name ? 'auto' : 0,
                maxWidth: '85%',
              }}>
                <strong style={{ color: m.sender_name === user?.name ? 'var(--green)' : 'var(--gold-dark)' }}>{m.sender_name}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>{new Date(m.created_at).toLocaleString()}</span>
                <p style={{ marginTop: 4 }}>{m.content}</p>
              </div>
            ))}
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setText(t => t + e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>{e}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--text)' }} onKeyDown={e => e.key === 'Enter' && send()} />
          <button className="btn-primary" onClick={send}><Send size={18} /></button>
        </div>
      </GlassCard>
    </DashboardLayout>
  );
}
