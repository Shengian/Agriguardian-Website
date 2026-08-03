import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { evaluateAttendanceForUser } from '../services/attendanceService.js';

const router = Router();

router.get('/submissions/pending', authMiddleware, requireRole('admin'), (req, res) => {
  const subs = db.prepare(`
    SELECT s.*, t.title as task_title, t.id as task_id, u.name as user_name
    FROM submissions s
    JOIN tasks t ON t.id = s.task_id
    JOIN users u ON u.id = s.user_id
    WHERE s.status = 'pending'
    ORDER BY s.submitted_at DESC
  `).all();
  res.json(subs);
});

router.get('/:id/submissions', authMiddleware, (req, res) => {
  const subs = db.prepare(`
    SELECT s.*, u.name as user_name FROM submissions s
    JOIN users u ON u.id = s.user_id
    WHERE s.task_id = ? ORDER BY s.submitted_at DESC
  `).all(req.params.id);
  res.json(subs);
});

router.get('/', authMiddleware, (req, res) => {
  let tasks;
  if (req.user.role === 'admin') {
    tasks = db.prepare(`
      SELECT t.*, u.name as assignee_name, p.name as project_name
      FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id LEFT JOIN projects p ON p.id = t.project_id
      ORDER BY t.created_at DESC
    `).all();
  } else {
    tasks = db.prepare(`
      SELECT t.*, p.name as project_name FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.assignee_id = ? ORDER BY t.deadline ASC
    `).all(req.user.id);
  }
  res.json(tasks);
});

router.post('/', authMiddleware, requireRole('admin'), (req, res) => {
  const { title, description, priority, deadline, project_id, assignee_id, assignee_type, estimated_hours } = req.body;
  const id = uuid();
  db.prepare(`INSERT INTO tasks (id, title, description, priority, deadline, project_id, assignee_id, assignee_type, estimated_hours, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id, title, description, priority || 'medium', deadline, project_id, assignee_id, assignee_type, estimated_hours, req.user.id);

  if (assignee_id) {
    db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?,?,?,?,?,?)')
      .run(uuid(), assignee_id, 'task', 'New Task Assigned', `"${title}" has been assigned to you.`, `/${assignee_type}/tasks`);
  }
  res.status(201).json({ id });
});

router.patch('/:id', authMiddleware, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });

  const { status, progress, title, description, priority } = req.body;
  db.prepare(`UPDATE tasks SET status = COALESCE(?, status), progress = COALESCE(?, progress), title = COALESCE(?, title), description = COALESCE(?, description), priority = COALESCE(?, priority), updated_at = datetime('now') WHERE id = ?`)
    .run(status, progress, title, description, priority, req.params.id);
  res.json({ success: true });
});

router.post('/:id/comments', authMiddleware, (req, res) => {
  const id = uuid();
  db.prepare('INSERT INTO task_comments (id, task_id, user_id, content) VALUES (?,?,?,?)').run(id, req.params.id, req.user.id, req.body.content);
  res.status(201).json({ id });
});

router.get('/:id/comments', authMiddleware, (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.name as user_name FROM task_comments c JOIN users u ON u.id = c.user_id WHERE c.task_id = ? ORDER BY c.created_at
  `).all(req.params.id);
  res.json(comments);
});

router.post('/:id/submit', authMiddleware, (req, res) => {
  const { summary, file_url, file_name } = req.body;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });

  const id = uuid();
  const today = new Date().toISOString().split('T')[0];
  db.prepare('INSERT INTO submissions (id, task_id, user_id, summary, file_url, file_name) VALUES (?,?,?,?,?,?)')
    .run(id, req.params.id, req.user.id, summary, file_url, file_name);

  db.prepare("UPDATE tasks SET status = 'submitted', progress = 100, updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  evaluateAttendanceForUser(req.user.id, today);

  res.status(201).json({ id, message: 'Submission received' });
});

router.patch('/:id/review', authMiddleware, requireRole('admin'), (req, res) => {
  const { submission_id, status, feedback } = req.body;
  db.prepare('UPDATE submissions SET status = ?, mentor_feedback = ? WHERE id = ?').run(status, feedback, submission_id);
  if (status === 'approved') {
    db.prepare("UPDATE tasks SET status = 'completed' WHERE id = ?").run(req.params.id);
  } else if (status === 'rejected' || status === 'changes_requested') {
    db.prepare("UPDATE tasks SET status = 'in-progress', progress = 50 WHERE id = ?").run(req.params.id);
  }
  res.json({ success: true });
});

export default router;
