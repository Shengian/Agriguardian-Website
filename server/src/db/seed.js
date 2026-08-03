import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import db from './database.js';

const hash = (pw) => bcrypt.hashSync(pw, 10);

const users = [
  { id: uuid(), email: 'vigneshvid2006@gmail.com', password: 'admin123', role: 'admin', name: 'Saivignesh R V', employee_id: 'ADM-001', department: 'Executive' },
  { id: uuid(), email: 'tleo76645@gmail.com', password: 'admin123', role: 'admin', name: 'Shengian T', employee_id: 'ADM-002', department: 'Operations' },
  { id: uuid(), email: 'haripriya5102007@gmail.com', password: 'admin123', role: 'admin', name: 'Haripriya S', employee_id: 'ADM-003', department: 'Finance' },
  { id: uuid(), email: 'stinyalbert100@gmail.com', password: 'admin123', role: 'admin', name: 'Stiny A', employee_id: 'ADM-004', department: 'Technology' },
];

// Clear all existing data
db.exec('DELETE FROM task_comments; DELETE FROM submissions; DELETE FROM attendance; DELETE FROM notifications; DELETE FROM announcements; DELETE FROM documents; DELETE FROM chat_messages; DELETE FROM leave_requests; DELETE FROM user_settings; DELETE FROM tasks; DELETE FROM project_members; DELETE FROM projects; DELETE FROM contact_messages; DELETE FROM newsletter_subscribers; DELETE FROM users;');

const insertUser = db.prepare(`INSERT INTO users (id, email, password_hash, role, name, employee_id, department, performance_score, skills) VALUES (?,?,?,?,?,?,?,?,?)`);

users.forEach(u => {
  insertUser.run(u.id, u.email, hash(u.password), u.role, u.name, u.employee_id, u.department, 0, '[]');
});

// Create user settings for each user
const insertSettings = db.prepare('INSERT INTO user_settings (user_id, theme) VALUES (?,?)');
users.forEach(u => insertSettings.run(u.id, 'light'));

console.log('Database seeded successfully (clean slate).');
console.log('Admin logins:');
console.log('  vigneshvid2006@gmail.com / admin123');
console.log('  tleo76645@gmail.com / admin123');
console.log('  haripriya5102007@gmail.com / admin123');
console.log('  stinyalbert100@gmail.com / admin123');
