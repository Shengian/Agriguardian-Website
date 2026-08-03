import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id);
  if (!settings) {
    db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(req.user.id);
    settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id);
  }
  res.json(settings);
});

router.patch('/', authMiddleware, (req, res) => {
  const { theme, notifications_enabled, language, two_fa_enabled } = req.body;
  const existing = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id);
  if (!existing) {
    db.prepare('INSERT INTO user_settings (user_id, theme, notifications_enabled, language, two_fa_enabled) VALUES (?,?,?,?,?)')
      .run(req.user.id, theme || 'light', notifications_enabled ?? 1, language || 'en', two_fa_enabled ?? 0);
  } else {
    db.prepare(`UPDATE user_settings SET
      theme = COALESCE(?, theme),
      notifications_enabled = COALESCE(?, notifications_enabled),
      language = COALESCE(?, language),
      two_fa_enabled = COALESCE(?, two_fa_enabled)
      WHERE user_id = ?`)
      .run(theme, notifications_enabled, language, two_fa_enabled, req.user.id);
  }
  res.json(db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id));
});

export default router;
