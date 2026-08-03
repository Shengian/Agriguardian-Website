import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { evaluateAttendanceForUser, getAttendanceStats } from '../services/attendanceService.js';

const router = Router();

router.get('/export', authMiddleware, requireRole('admin'), (req, res) => {
  const records = db.prepare(`
    SELECT a.date, u.name, u.employee_id, u.department, a.status, a.check_in, a.check_out, a.note
    FROM attendance a JOIN users u ON u.id = a.user_id
    ORDER BY a.date DESC LIMIT 500
  `).all();
  const header = 'Date,Name,Employee ID,Department,Status,Check In,Check Out,Note\n';
  const rows = records.map(r =>
    [r.date, r.name, r.employee_id, r.department, r.status, r.check_in || '', r.check_out || '', (r.note || '').replace(/,/g, ';')].join(',')
  ).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=attendance-export.csv');
  res.send(header + rows);
});

router.get('/', authMiddleware, (req, res) => {
  const { user_id, month } = req.query;
  if (req.user.role === 'admin' && !user_id) {
    let records;
    if (month) {
      records = db.prepare(`
        SELECT a.*, u.name as user_name FROM attendance a
        JOIN users u ON u.id = a.user_id
        WHERE strftime('%Y-%m', a.date) = ? ORDER BY a.date DESC
      `).all(month);
    } else {
      records = db.prepare(`
        SELECT a.*, u.name as user_name FROM attendance a
        JOIN users u ON u.id = a.user_id
        ORDER BY a.date DESC LIMIT 100
      `).all();
    }
    return res.json(records);
  }
  const targetId = req.user.role === 'admin' && user_id ? user_id : req.user.id;
  let records;
  if (month) {
    records = db.prepare("SELECT * FROM attendance WHERE user_id = ? AND strftime('%Y-%m', date) = ? ORDER BY date DESC").all(targetId, month);
  } else {
    records = db.prepare('SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC LIMIT 30').all(targetId);
  }
  res.json(records);
});

router.get('/stats', authMiddleware, (req, res) => {
  const targetId = req.query.user_id && req.user.role === 'admin' ? req.query.user_id : req.user.id;
  res.json(getAttendanceStats(targetId));
});

router.get('/overview', authMiddleware, requireRole('admin'), (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = db.prepare('SELECT status, COUNT(*) as count FROM attendance WHERE date = ? GROUP BY status').all(today);
  const weekly = db.prepare(`
    SELECT date, status, COUNT(*) as count FROM attendance
    WHERE date >= date('now', '-7 days') GROUP BY date, status ORDER BY date
  `).all();
  res.json({ today: todayRecords, weekly });
});

router.post('/mark', authMiddleware, (req, res) => {
  const { date, status, check_in, check_out, note } = req.body;
  const today = date || new Date().toISOString().split('T')[0];
  const existing = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, today);
  if (existing) {
    db.prepare('UPDATE attendance SET status = ?, check_in = ?, check_out = ?, note = ? WHERE id = ?')
      .run(status, check_in, check_out, note, existing.id);
    return res.json({ id: existing.id });
  }
  const id = uuid();
  db.prepare('INSERT INTO attendance (id, user_id, date, status, check_in, check_out, note) VALUES (?,?,?,?,?,?,?)')
    .run(id, req.user.id, today, status, check_in, check_out, note);
  res.status(201).json({ id });
});

router.patch('/:id/override', authMiddleware, requireRole('admin'), (req, res) => {
  const { status, note } = req.body;
  db.prepare('UPDATE attendance SET status = ?, note = ?, overridden_by = ?, auto_generated = 0 WHERE id = ?')
    .run(status, note, req.user.id, req.params.id);
  res.json({ success: true });
});

router.post('/evaluate', authMiddleware, (req, res) => {
  const date = req.body.date || new Date().toISOString().split('T')[0];
  const result = evaluateAttendanceForUser(req.user.id, date);
  res.json(result);
});

export default router;
