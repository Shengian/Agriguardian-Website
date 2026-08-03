import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const docs = req.user.role === 'admin'
    ? db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all()
    : db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(docs);
});

router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const id = uuid();
  db.prepare('INSERT INTO documents (id, user_id, name, folder, file_path, mime_type, size) VALUES (?,?,?,?,?,?,?)')
    .run(id, req.user.id, req.file.originalname, req.body.folder || 'general', `/uploads/${req.file.filename}`, req.file.mimetype, req.file.size);
  res.status(201).json({ id, url: `/uploads/${req.file.filename}`, name: req.file.originalname });
});

export default router;
