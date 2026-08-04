import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { PageLoader } from './components/UI';
import { getWebsiteHomeUrl } from './config/urls';
import LoginPage from './pages/LoginPage';
import PortalsHub from './pages/PortalsHub';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import TasksPage from './pages/shared/TasksPage';
import AttendancePage from './pages/shared/AttendancePage';
import ProjectsPage from './pages/shared/ProjectsPage';
import DocumentsPage from './pages/shared/DocumentsPage';
import ChatPage from './pages/shared/ChatPage';
import SettingsPage from './pages/shared/SettingsPage';
import ProfilePage from './pages/shared/ProfilePage';
import CalendarPage from './pages/shared/CalendarPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import UsersListPage from './pages/admin/UsersListPage';

function loginPathForRoute(pathname: string): string {
  if (pathname.startsWith('/employee')) return '/login/employee';
  return '/login/admin';
}

function WebsiteHomeRedirect() {
  useEffect(() => {
    window.location.replace(getWebsiteHomeUrl());
  }, []);
  return <PageLoader />;
}

function Protected({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to={loginPathForRoute(location.pathname)} replace />;
  if (!roles.includes(user.role) && user.role !== 'admin') return <Navigate to={`/${user.role}`} replace />;
  return <>{children}</>;
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/portals" replace />} />
        <Route path="/portals" element={<PortalsHub />} />
        <Route path="/login/:role" element={<LoginPage />} />

        <Route path="/admin" element={<Protected roles={['admin']}><AdminDashboard /></Protected>} />
        <Route path="/admin/tasks" element={<Protected roles={['admin']}><TasksPage role="admin" /></Protected>} />
        <Route path="/admin/employees" element={<Protected roles={['admin']}><UsersListPage type="employee" /></Protected>} />
        <Route path="/admin/attendance" element={<Protected roles={['admin']}><AttendancePage role="admin" /></Protected>} />
        <Route path="/admin/projects" element={<Protected roles={['admin']}><ProjectsPage role="admin" /></Protected>} />
        <Route path="/admin/announcements" element={<Protected roles={['admin']}><AnnouncementsPage /></Protected>} />
        <Route path="/admin/documents" element={<Protected roles={['admin']}><DocumentsPage role="admin" /></Protected>} />
        <Route path="/admin/analytics" element={<Protected roles={['admin']}><AnalyticsPage /></Protected>} />
        <Route path="/admin/chat" element={<Protected roles={['admin']}><ChatPage role="admin" /></Protected>} />
        <Route path="/admin/settings" element={<Protected roles={['admin']}><SettingsPage role="admin" /></Protected>} />

        <Route path="/employee" element={<Protected roles={['employee', 'admin']}><EmployeeDashboard /></Protected>} />
        <Route path="/employee/tasks" element={<Protected roles={['employee', 'admin']}><TasksPage role="employee" /></Protected>} />
        <Route path="/employee/attendance" element={<Protected roles={['employee', 'admin']}><AttendancePage role="employee" /></Protected>} />
        <Route path="/employee/documents" element={<Protected roles={['employee', 'admin']}><DocumentsPage role="employee" /></Protected>} />
        <Route path="/employee/profile" element={<Protected roles={['employee', 'admin']}><ProfilePage role="employee" /></Protected>} />

        <Route path="*" element={<Navigate to="/portals" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
