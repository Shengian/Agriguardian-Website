import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database.js';
import { signToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const { password_hash, ...safe } = user;
    const token = signToken(safe);
    res.json({ token, user: safe });
  } catch (error) {
    console.error('Login route error:', error);
    res.status(500).json({ error: 'Authentication failed due to a server error' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role: reqRole } = req.body || {};
    const role = reqRole === 'intern' ? 'intern' : 'employee'; // Allow employee or intern, default to employee
    
    if (!name || !email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    const password_hash = bcrypt.hashSync(password, 10);
    
    db.prepare('INSERT INTO users (id, email, password_hash, role, name) VALUES (?, ?, ?, ?, ?)').run(id, cleanEmail, password_hash, role, name.trim());
    const user = db.prepare('SELECT id, email, role, name, employee_id, department, photo, skills, mentor_id, project_id, performance_score, bio, social_links, created_at FROM users WHERE id = ?').get(id);
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Signup route error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, role, name, employee_id, department, photo, skills, mentor_id, project_id, performance_score, bio, social_links, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

export default router;
