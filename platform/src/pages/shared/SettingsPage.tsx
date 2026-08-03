import { useEffect, useState } from 'react';
import { DashboardLayout, adminLinks, employeeLinks } from '../../layouts/DashboardLayout';
import { GlassCard } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { settingsApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function SettingsPage({ role }: { role: 'admin' | 'employee' }) {
  const { theme, toggle, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const links = role === 'admin' ? adminLinks : employeeLinks;

  useEffect(() => {
    settingsApi.get().then(s => {
      if (s.theme && s.theme !== theme) setTheme(s.theme as 'light' | 'dark');
      setNotifications(!!s.notifications_enabled);
      setLanguage(s.language || 'en');
    }).catch(() => {});
  }, []);

  const saveSettings = async (updates: object) => {
    try {
      await settingsApi.update(updates);
      toast('Settings saved');
    } catch { toast('Failed to save settings', 'error'); }
  };

  const handleThemeToggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    toggle();
    saveSettings({ theme: next });
  };

  return (
    <DashboardLayout title="Settings" links={links}>
      <GlassCard style={{ padding: 32, maxWidth: 560 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Preferences</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><strong>Dark Mode</strong><p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Toggle theme appearance</p></div>
            <button className="btn-ghost" onClick={handleThemeToggle}>{theme === 'light' ? 'Enable Dark' : 'Enable Light'}</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><strong>Notifications</strong><p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Task and announcement alerts</p></div>
            <button className={`badge ${notifications ? 'badge--done' : 'badge--pending'}`} style={{ cursor: 'pointer', border: 'none' }}
              onClick={() => { setNotifications(!notifications); saveSettings({ notifications_enabled: notifications ? 0 : 1 }); }}>
              {notifications ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><strong>Two-Factor Auth</strong><p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Extra security layer</p></div>
            <span className="badge badge--pending">Coming Soon</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><strong>Language</strong><p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Interface language</p></div>
            <select value={language} onChange={e => { setLanguage(e.target.value); saveSettings({ language: e.target.value }); }}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--text)' }}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ml">Malayalam</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Logged in as <strong>{user?.email}</strong></p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Role: {user?.role} | ID: {user?.employee_id}</p>
        </div>
      </GlassCard>
    </DashboardLayout>
  );
}
