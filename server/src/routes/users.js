import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, requireRole('admin'), (req, res) => {
  const users = db.prepare('SELECT id, email, role, name, employee_id, department, performance_score, created_at FROM users').all();
  res.json(users);
});

router.post('/', authMiddleware, requireRole('admin'), (req, res) => {
  const { email, password, role, name, employee_id, department } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO users (id, email, password_hash, role, name, employee_id, department) VALUES (?,?,?,?,?,?,?)')
    .run(id, email, bcrypt.hashSync(password, 10), role, name, employee_id, department);
  db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(id);
  res.status(201).json({ id, email, role, name });
});

router.get('/:id', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, role, name, employee_id, department, photo, skills, mentor_id, project_id, performance_score, bio, social_links FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

router.patch('/:id', authMiddleware, (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'Not found' });
  // Only admin can edit others; users can only edit themselves
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { name, bio, department, skills, social_links, mentor_id, project_id, performance_score } = req.body;
  db.prepare(`UPDATE users SET
    name = COALESCE(?, name),
    bio = COALESCE(?, bio),
    department = COALESCE(?, department),
    skills = COALESCE(?, skills),
    social_links = COALESCE(?, social_links),
    mentor_id = COALESCE(?, mentor_id),
    project_id = COALESCE(?, project_id),
    performance_score = COALESCE(?, performance_score)
    WHERE id = ?`).run(name, bio, department, skills, social_links, mentor_id, project_id, performance_score, req.params.id);
  res.json(db.prepare('SELECT id, email, role, name, employee_id, department, photo, skills, mentor_id, project_id, performance_score, bio, social_links FROM users WHERE id = ?').get(req.params.id));
});

router.delete('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  const id = req.params.id;
  
  db.transaction(() => {
    // Delete dependent records
    db.prepare('DELETE FROM task_comments WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM submissions WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM attendance WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM documents WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM chat_messages WHERE sender_id = ? OR receiver_id = ?').run(id, id);
    db.prepare('DELETE FROM leave_requests WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM user_settings WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM project_members WHERE user_id = ?').run(id);
    
    // For tasks/announcements, nullify instead of deleting to keep the data
    db.prepare('UPDATE tasks SET assignee_id = NULL WHERE assignee_id = ?').run(id);
    db.prepare('UPDATE tasks SET created_by = NULL WHERE created_by = ?').run(id);
    db.prepare('UPDATE announcements SET created_by = NULL WHERE created_by = ?').run(id);
    db.prepare('UPDATE users SET mentor_id = NULL WHERE mentor_id = ?').run(id);

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  })();
  
  res.json({ success: true });
});

export default router;

