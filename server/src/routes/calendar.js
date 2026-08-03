import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/events', authMiddleware, (req, res) => {
  const { month } = req.query;
  const monthFilter = month || new Date().toISOString().slice(0, 7);

  const tasks = db.prepare(`
    SELECT deadline as date, title, 'deadline' as type, priority
    FROM tasks WHERE assignee_id = ? AND deadline IS NOT NULL
    AND strftime('%Y-%m', deadline) = ?
  `).all(req.user.id, monthFilter);

  const leaves = db.prepare(`
    SELECT start_date as date, reason as title, 'leave' as type, status
    FROM leave_requests WHERE user_id = ? AND strftime('%Y-%m', start_date) = ?
  `).all(req.user.id, monthFilter);

  const announcements = db.prepare(`
    SELECT date(created_at) as date, title, 'event' as type
    FROM announcements WHERE strftime('%Y-%m', created_at) = ?
  `).all(monthFilter);

  const meetings = [
    { date: `${monthFilter}-08`, title: 'Team Standup', type: 'meeting' },
    { date: `${monthFilter}-15`, title: 'Sprint Review', type: 'meeting' },
  ];

  res.json([...tasks, ...leaves, ...announcements, ...meetings]);
});

export default router;
