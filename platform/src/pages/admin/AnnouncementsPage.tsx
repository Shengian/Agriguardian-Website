import { useEffect, useState } from 'react';
import { DashboardLayout, adminLinks } from '../../layouts/DashboardLayout';
import { GlassCard, Modal } from '../../components/UI';
import { announcementsApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function AnnouncementsPage() {
  const [items, setItems] = useState<{ id: string; title: string; content: string; pinned: number; author_name?: string; created_at: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => { announcementsApi.list().then(setItems); }, []);

  const handlePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await announcementsApi.create({ title: fd.get('title'), content: fd.get('content'), pinned: fd.get('pinned') === 'on' });
      toast('Announcement posted');
      setShowModal(false);
      announcementsApi.list().then(setItems);
    } catch { toast('Failed', 'error'); }
  };

  return (
    <DashboardLayout title="Announcements" links={adminLinks}>
      <div style={{ marginBottom: 20 }}>
        <button className="btn-primary" onClick={() => setShowModal(true)}>Post Announcement</button>
      </div>
      {items.map(a => (
        <GlassCard key={a.id} style={{ padding: 24, marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)' }}>{a.title} {a.pinned ? '📌' : ''}</h3>
          <p style={{ color: 'var(--text-muted)', margin: '8px 0' }}>{a.content}</p>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.created_at}</span>
        </GlassCard>
      ))}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Post Announcement">
        <form onSubmit={handlePost}>
          <div className="form-group"><label>Title</label><input name="title" required /></div>
          <div className="form-group"><label>Content</label><textarea name="content" rows={4} required /></div>
          <label><input type="checkbox" name="pinned" /> Pin</label>
          <button type="submit" className="btn-primary" style={{ marginTop: 16 }}>Post</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
