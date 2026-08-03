import { useEffect, useState } from 'react';
import { DashboardLayout, adminLinks, employeeLinks } from '../../layouts/DashboardLayout';
import { GlassCard } from '../../components/UI';
import { documentsApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Upload, Download, Folder } from 'lucide-react';

export default function DocumentsPage({ role }: { role: 'admin' | 'employee' }) {
  const [docs, setDocs] = useState<{ id: string; name: string; folder: string; created_at: string; mime_type: string; file_path: string; size?: number }[]>([]);
  const [folder, setFolder] = useState('all');
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const links = role === 'admin' ? adminLinks : employeeLinks;

  const load = () => documentsApi.list().then(setDocs).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await documentsApi.upload(file, folder === 'all' ? 'general' : folder);
      toast('Document uploaded');
      load();
    } catch { toast('Upload failed', 'error'); }
  };

  const folders = ['all', ...new Set(docs.map(d => d.folder))];
  const filtered = docs.filter(d => {
    const matchFolder = folder === 'all' || d.folder === folder;
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    return matchFolder && matchSearch;
  });

  return (
    <DashboardLayout title="Documents" links={links}>
      <GlassCard style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)' }}>Document Library</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--text)' }} />
            <label className="btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Upload size={16} /> Upload
              <input type="file" hidden onChange={handleUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg" />
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {folders.map(f => (
            <button key={f} className={`btn-ghost${folder === f ? ' active' : ''}`} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setFolder(f)}>
              <Folder size={14} /> {f === 'all' ? 'All Files' : f}
            </button>
          ))}
        </div>

        <table className="data-table">
          <thead><tr><th>Name</th><th>Folder</th><th>Type</th><th>Size</th><th>Uploaded</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No documents found.</td></tr> :
              filtered.map(d => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.folder}</td>
                  <td>{d.mime_type?.split('/').pop() || '—'}</td>
                  <td>{d.size ? `${(d.size / 1024).toFixed(1)} KB` : '—'}</td>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  <td>
                    <a href={d.file_path} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: '0.8rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Download size={14} /> Download
                    </a>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </GlassCard>
    </DashboardLayout>
  );
}
