import db from '../db/database.js';
import { v4 as uuid } from 'uuid';

export function evaluateAttendanceForUser(userId, date) {
  const tasks = db.prepare(`
    SELECT * FROM tasks WHERE assignee_id = ? AND date(deadline) = date(?)
  `).all(userId, date);

  if (tasks.length === 0) {
    const existing = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(userId, date);
    if (!existing) return null;
    return existing;
  }

  const submissions = db.prepare(`
    SELECT s.* FROM submissions s
    JOIN tasks t ON t.id = s.task_id
    WHERE s.user_id = ? AND date(s.submitted_at) = date(?)
  `).all(userId, date);

  const allCompleted = tasks.every(t => t.status === 'completed' || submissions.some(s => s.task_id === t.id));
  const anyLate = tasks.some(t => {
    const sub = submissions.find(s => s.task_id === t.id);
    if (!sub) return false;
    return new Date(sub.submitted_at) > new Date(t.deadline + 'T23:59:59');
  });

  let status = 'absent';
  if (allCompleted && submissions.length > 0) {
    status = anyLate ? 'late' : 'present';
  } else if (submissions.length > 0) {
    status = 'late';
  }

  const existing = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(userId, date);
  if (existing && existing.overridden_by) return existing;

  if (existing) {
    db.prepare('UPDATE attendance SET status = ?, auto_generated = 1 WHERE id = ?').run(status, existing.id);
    return db.prepare('SELECT * FROM attendance WHERE id = ?').get(existing.id);
  }

  const id = uuid();
  db.prepare('INSERT INTO attendance (id, user_id, date, status, auto_generated) VALUES (?,?,?,?,1)').run(id, userId, date, status);
  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id);
}

export function getAttendanceStats(userId) {
  const records = db.prepare('SELECT status FROM attendance WHERE user_id = ?').all(userId);
  const counts = { present: 0, late: 0, absent: 0, wfh: 0, 'half-day': 0, leave: 0 };
  if (records.length === 0) {
    return { present: 0, late: 0, absent: 0, total: 0, breakdown: counts };
  }
  records.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
  const total = records.length;
  return {
    present: Math.round((counts.present / total) * 100),
    late: Math.round((counts.late / total) * 100),
    absent: Math.round((counts.absent / total) * 100),
    total,
    breakdown: counts,
  };
}
