import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, Users, Calendar, FileText, Bell, MessageSquare,
  Settings, LogOut, Moon, Sun, FolderKanban, BarChart3, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import { notificationsApi, Notification } from '../api/client';
import { getWebsiteHomeUrl, navigateToWebsiteHome } from '../config/urls';

const logoutRoutes: Record<string, string> = {
  admin: '/login/admin',
  employee: '/login/employee',
  intern: '/login/intern',
};

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/admin/employees', icon: Users, label: 'Employees' },
  { to: '/admin/attendance', icon: Calendar, label: 'Attendance' },
  { to: '/admin/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/admin/announcements', icon: Bell, label: 'Announcements' },
  { to: '/admin/documents', icon: FileText, label: 'Documents' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const employeeLinks = [
  { to: '/employee', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employee/tasks', icon: CheckSquare, label: 'My Tasks' },
  { to: '/employee/attendance', icon: Calendar, label: 'Attendance' },
  { to: '/employee/documents', icon: FileText, label: 'Documents' },
  { to: '/employee/profile', icon: User, label: 'Profile' },
];

const internLinks = [
  { to: '/intern', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/intern/tasks', icon: CheckSquare, label: 'Task Sheet' },
  { to: '/intern/attendance', icon: Calendar, label: 'Attendance' },
  { to: '/intern/projects', icon: FolderKanban, label: 'Project' },
  { to: '/intern/documents', icon: FileText, label: 'Documents' },
  { to: '/intern/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/intern/chat', icon: MessageSquare, label: 'Mentor Chat' },
  { to: '/intern/profile', icon: User, label: 'Profile' },
  { to: '/intern/settings', icon: Settings, label: 'Settings' },
];

export function DashboardLayout({ children, title, links }: { children: React.ReactNode; title: string; links: typeof adminLinks }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    notificationsApi.list().then(setNotifications).catch(() => {});
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  const handleNotifClick = async (n: Notification) => {
    if (!n.read) {
      await notificationsApi.read(n.id).catch(() => {});
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: 1 } : x));
    }
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    await notificationsApi.readAll().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
  };

  const handleLogout = () => {
    const role = user?.role || 'admin';
    logout();
    navigate(logoutRoutes[role] || '/login/admin');
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          AgriGuardian
          <small>Enterprise Platform</small>
        </div>
        <nav className="sidebar-nav">
          {links.map(link => (
            <NavLink key={link.to} to={link.to} end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <link.icon size={20} />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <a
          href={getWebsiteHomeUrl()}
          onClick={navigateToWebsiteHome}
          className="sidebar-link sidebar-link--external"
          style={{ textDecoration: 'none', cursor: 'pointer' }}
        >
          ← Back to Website
        </a>
        <button className="sidebar-link" onClick={handleLogout} style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer' }}>
          <LogOut size={20} /> Log Out
        </button>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Welcome back, {user?.name}</p>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn" onClick={toggle} aria-label="Toggle theme">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button className="icon-btn" onClick={() => setShowNotif(!showNotif)} aria-label="Notifications">
              <Bell size={20} />
              {unread > 0 && <span className="notif-dot" />}
            </button>
          </div>
        </header>

        {showNotif && (
          <motion.div className="glass" style={{ padding: 16, marginBottom: 20, maxHeight: 300, overflow: 'auto' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)' }}>Notifications {unread > 0 && `(${unread})`}</h3>
              {unread > 0 && <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={markAllRead}>Mark all read</button>}
            </div>
            {notifications.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No notifications</p> : notifications.map(n => (
              <div key={n.id} onClick={() => handleNotifClick(n)} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer', opacity: n.read ? 0.6 : 1 }}>
                <strong>{n.title}</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{n.message}</p>
              </div>
            ))}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export { adminLinks, employeeLinks, internLinks };
