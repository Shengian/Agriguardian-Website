import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY name').all();
  res.json(projects);
});

router.get('/:id', authMiddleware, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const members = db.prepare(`
    SELECT u.id, u.name, u.role, u.department, pm.role as project_role
    FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ?
  `).all(req.params.id);
  const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ?').all(req.params.id);
  res.json({ ...project, members, tasks });
});

router.post('/', authMiddleware, requireRole('admin'), (req, res) => {
  const { name, description, deadline, category, progress } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO projects (id, name, description, deadline, category, progress) VALUES (?,?,?,?,?,?)')
    .run(id, name, description, deadline, category || 'general', progress || 0);
  res.status(201).json({ id, name });
});

router.patch('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const { name, description, progress, status, deadline } = req.body;
  db.prepare(`UPDATE projects SET
    name = COALESCE(?, name),
    description = COALESCE(?, description),
    progress = COALESCE(?, progress),
    status = COALESCE(?, status),
    deadline = COALESCE(?, deadline)
    WHERE id = ?`).run(name, description, progress, status, deadline, req.params.id);
  res.json({ success: true });
});

router.post('/:id/members', authMiddleware, requireRole('admin'), (req, res) => {
  const { user_id, role } = req.body;
  db.prepare('INSERT OR REPLACE INTO project_members (project_id, user_id, role) VALUES (?,?,?)')
    .run(req.params.id, user_id, role || 'member');
  db.prepare('UPDATE users SET project_id = ? WHERE id = ?').run(req.params.id, user_id);
  res.status(201).json({ success: true });
});

export default router;

