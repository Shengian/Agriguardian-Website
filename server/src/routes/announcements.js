import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const items = db.prepare(`
    SELECT a.*, u.name as author_name FROM announcements a
    LEFT JOIN users u ON u.id = a.created_by ORDER BY a.pinned DESC, a.created_at DESC
  `).all();
  res.json(items);
});

router.post('/', authMiddleware, requireRole('admin'), (req, res) => {
  const { title, content, pinned } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO announcements (id, title, content, pinned, created_by) VALUES (?,?,?,?,?)')
    .run(id, title, content, pinned ? 1 : 0, req.user.id);

  const users = db.prepare('SELECT id FROM users WHERE role IN (?, ?)').all('employee', 'intern');
  const insert = db.prepare('INSERT INTO notifications (id, user_id, type, title, message) VALUES (?,?,?,?,?)');
  users.forEach(u => insert.run(uuid(), u.id, 'announcement', 'New Announcement', title));

  res.status(201).json({ id });
});

export default router;
