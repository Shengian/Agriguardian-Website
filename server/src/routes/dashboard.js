import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/recent-logins', authMiddleware, requireRole('admin'), (req, res) => {
  const logins = db.prepare(`
    SELECT name, role, department, created_at as last_login FROM users
    WHERE role IN ('admin','employee') ORDER BY created_at DESC LIMIT 8
  `).all();
  res.json(logins);
});

router.get('/admin', authMiddleware, requireRole('admin'), (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const employees = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'employee'").get().count;
  const pendingTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status IN ('pending','in-progress')").get().count;
  const completedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get().count;
  const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
  const projects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
  const announcements = db.prepare('SELECT COUNT(*) as count FROM announcements').get().count;
  const todayAttendance = db.prepare('SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = ?').get(today, 'present')?.count || 0;
  const performance = Math.round(db.prepare("SELECT AVG(performance_score) as avg FROM users WHERE role = 'employee'").get()?.avg || 0);

  const recentActivity = db.prepare(`
    SELECT 'task' as type, t.title as label, t.updated_at as time FROM tasks t ORDER BY t.updated_at DESC LIMIT 5
  `).all();
  const deptDistribution = db.prepare('SELECT department, COUNT(*) as count FROM users GROUP BY department').all();
  const taskCompletion = db.prepare(`
    SELECT status, COUNT(*) as count FROM tasks GROUP BY status
  `).all();
  const weeklyAttendance = db.prepare(`
    SELECT date, status, COUNT(*) as count FROM attendance
    WHERE date >= date('now', '-14 days') GROUP BY date, status ORDER BY date
  `).all();

  const recentLogins = db.prepare(`
    SELECT name, role, department, created_at as last_login FROM users
    WHERE role IN ('admin','employee') ORDER BY created_at DESC LIMIT 6
  `).all();

  res.json({
    stats: { employees, todayAttendance, pendingTasks, completedTasks, totalTasks, projects, announcements, performance },
    recentActivity,
    deptDistribution,
    taskCompletion,
    weeklyAttendance,
    recentLogins,
  });
});

router.get('/employee', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const tasks = db.prepare("SELECT * FROM tasks WHERE assignee_id = ? AND status != 'completed' ORDER BY deadline LIMIT 5").all(req.user.id);
  const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?').get(req.user.id).count;
  const announcements = db.prepare('SELECT * FROM announcements ORDER BY pinned DESC, created_at DESC LIMIT 3').all();
  const attendance = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, today);
  const user = db.prepare('SELECT performance_score FROM users WHERE id = ?').get(req.user.id);
  res.json({
    tasks,
    totalTasks,
    announcements,
    attendance,
    performanceScore: user?.performance_score ?? null,
  });
});

export default router;
