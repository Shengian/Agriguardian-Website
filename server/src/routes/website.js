import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

router.post('/contact', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  try {
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO contact_messages (id, name, email, phone, subject, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, email, phone || null, subject || null, message);
    
    res.status(201).json({ success: true, message: 'Message received successfully' });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ error: 'Failed to submit contact message' });
  }
});

router.post('/newsletter', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const existing = db.prepare('SELECT id FROM newsletter_subscribers WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already subscribed' });
    }

    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    
    db.prepare('INSERT INTO newsletter_subscribers (id, email) VALUES (?, ?)').run(id, email);
    
    res.status(201).json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Newsletter submission error:', error);
    res.status(500).json({ error: 'Failed to subscribe to newsletter' });
  }
});

export default router;
