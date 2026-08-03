import { useEffect, useState } from 'react';
import { DashboardLayout, employeeLinks, internLinks } from '../../layouts/DashboardLayout';
import { GlassCard } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usersApi } from '../../api/client';

export default function ProfilePage({ role }: { role: 'employee' | 'intern' }) {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const links = role === 'employee' ? employeeLinks : internLinks;

  useEffect(() => {
    if (user) {
      setName(user.name);
      usersApi.get(user.id).then(setProfile).catch(() => toast('Failed to load profile', 'error'));
    }
  }, [user]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      const updated = await usersApi.update(user.id, { name: name.trim() });
      updateUser({ name: updated.name as string });
      setProfile(updated);
      toast('Name updated successfully', 'success');
    } catch {
      toast('Failed to update name', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const skills = profile?.skills ? JSON.parse(profile.skills as string) as string[] : [];
  const social = profile?.social_links ? JSON.parse(profile.social_links as string) as Record<string, string> : {};

  if (role === 'employee') {
    return (
      <DashboardLayout title="Profile" links={links}>
        <div style={{ maxWidth: 520 }}>
          <GlassCard style={{ padding: 32 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gold-gradient)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 700, color: 'white' }}>
              {user.name?.charAt(0)?.toUpperCase()}
            </div>

            <form onSubmit={handleSaveName}>
              <div className="form-group">
                <label htmlFor="profileName">Full Name</label>
                <input
                  id="profileName"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={saving || name.trim() === user.name}>
                {saving ? 'Saving...' : 'Update Name'}
              </button>
            </form>

            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Email</p>
                <p>{user.email}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Role</p>
                <p style={{ textTransform: 'capitalize' }}>{user.role}</p>
              </div>
              {user.employee_id && (
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Employee ID</p>
                  <p>{user.employee_id}</p>
                </div>
              )}
              {user.department && (
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Department</p>
                  <p>{user.department}</p>
                </div>
              )}
              {typeof profile?.bio === 'string' && profile.bio && (
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Bio</p>
                  <p>{profile.bio}</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profile" links={links}>
      <div className="charts-grid">
        <GlassCard style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--gold-gradient)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: 'white' }}>
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)' }}>{user.name}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{user.role}{user.department ? ` — ${user.department}` : ''}</p>
          {user.employee_id && <p style={{ marginTop: 8, fontSize: '0.9rem' }}>ID: {user.employee_id}</p>}
          {typeof profile?.bio === 'string' && profile.bio && (
            <p style={{ marginTop: 12, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{profile.bio}</p>
          )}
        </GlassCard>

        {skills.length > 0 && (
          <GlassCard style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 12 }}>Skills</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {skills.map(s => <span key={s} className="badge badge--done">{s}</span>)}
            </div>
          </GlassCard>
        )}

        {Object.keys(social).length > 0 && (
          <GlassCard style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 12 }}>Social Links</h3>
            {Object.entries(social).map(([k, v]) => (
              <a key={k} href={v} target="_blank" rel="noreferrer" style={{ display: 'block', color: 'var(--green)', marginBottom: 4 }}>{k}</a>
            ))}
          </GlassCard>
        )}
      </div>
    </DashboardLayout>
  );
}
