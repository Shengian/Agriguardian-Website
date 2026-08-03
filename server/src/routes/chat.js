import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const { project_id, user_id } = req.query;
  let messages;
  if (project_id) {
    messages = db.prepare(`
      SELECT m.*, u.name as sender_name FROM chat_messages m JOIN users u ON u.id = m.sender_id
      WHERE m.project_id = ? ORDER BY m.created_at
    `).all(project_id);
  } else if (user_id) {
    messages = db.prepare(`
      SELECT m.*, u.name as sender_name FROM chat_messages m JOIN users u ON u.id = m.sender_id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at
    `).all(req.user.id, user_id, user_id, req.user.id);
  } else {
    messages = [];
  }
  res.json(messages);
});

router.post('/', authMiddleware, (req, res) => {
  const { content, receiver_id, project_id, file_url } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO chat_messages (id, sender_id, receiver_id, project_id, content, file_url) VALUES (?,?,?,?,?,?)')
    .run(id, req.user.id, receiver_id || null, project_id || null, content, file_url || null);
  res.status(201).json({ id });
});

export default router;
