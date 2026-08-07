import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import './db/database.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import taskRoutes from './routes/tasks.js';
import projectRoutes from './routes/projects.js';
import attendanceRoutes from './routes/attendance.js';
import notificationRoutes from './routes/notifications.js';
import announcementRoutes from './routes/announcements.js';
import documentRoutes from './routes/documents.js';
import chatRoutes from './routes/chat.js';
import leaveRoutes from './routes/leaves.js';
import dashboardRoutes from './routes/dashboard.js';
import settingsRoutes from './routes/settings.js';
import calendarRoutes from './routes/calendar.js';
import websiteRoutes from './routes/website.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const websiteRoot = path.join(__dirname, '../..');
const platformDist = path.join(__dirname, '../../platform/dist');
const marketingPages = [
  'index.html',
  'portals.html',
  'employee-login.html',
  'intern-login.html',
  'employer-login.html',
  'intern-dashboard.html',
];

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8000',
  'http://127.0.0.1:5173',
  'https://agriguardian.in',
  'https://www.agriguardian.in',
];
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(',').map(s => s.trim()));
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/website', websiteRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', platform: 'AgriGuardian Enterprise' }));

// Marketing website static assets and pages (served before the React SPA)
app.use('/css', express.static(path.join(websiteRoot, 'css')));
app.use('/js', express.static(path.join(websiteRoot, 'js')));
app.use('/assets', express.static(path.join(websiteRoot, 'assets')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(websiteRoot, 'index.html'));
});

marketingPages.forEach((page) => {
  if (page === 'index.html') return;
  app.get(`/${page}`, (_req, res) => {
    res.sendFile(path.join(websiteRoot, page));
  });
});

app.get('/index.html', (_req, res) => {
  res.sendFile(path.join(websiteRoot, 'index.html'));
});

app.use(express.static(platformDist));
app.use(express.static(websiteRoot));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();

  const platformIndex = path.join(platformDist, 'index.html');
  const appHtml = path.join(websiteRoot, 'app.html');
  const rootIndex = path.join(websiteRoot, 'index.html');

  if (fs.existsSync(platformIndex)) {
    return res.sendFile(platformIndex);
  } else if (fs.existsSync(appHtml)) {
    return res.sendFile(appHtml);
  } else if (fs.existsSync(rootIndex)) {
    return res.sendFile(rootIndex);
  }
  next();
});

app.listen(PORT, () => {
  console.log(`AgriGuardian API running on http://localhost:${PORT}`);
});
