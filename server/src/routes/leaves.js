import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, (req, res) => {
  const { start_date, end_date, reason } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO leave_requests (id, user_id, start_date, end_date, reason) VALUES (?,?,?,?,?)')
    .run(id, req.user.id, start_date, end_date, reason);
  res.status(201).json({ id });
});

router.get('/', authMiddleware, (req, res) => {
  if (req.user.role === 'admin') {
    return res.json(db.prepare('SELECT l.*, u.name as user_name, u.employee_id, u.department FROM leave_requests l JOIN users u ON u.id = l.user_id ORDER BY l.created_at DESC').all());
  }
  res.json(db.prepare('SELECT * FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id));
});

router.patch('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.prepare('UPDATE leave_requests SET status = ? WHERE id = ?').run(status, req.params.id);
  const leave = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(req.params.id);
  if (leave) {
    db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?,?,?,?,?,?)')
      .run(uuid(), leave.user_id, 'leave', `Leave ${status}`, `Your leave request from ${leave.start_date} to ${leave.end_date} has been ${status}.`, '/employee/attendance');
  }
  res.json({ success: true });
});

export default router;
