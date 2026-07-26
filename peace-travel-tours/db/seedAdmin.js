// One-time script to create (or update) the admin account for the business owner.
// Run with: npm run seed:admin
// Reads ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD from .env

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database');

const name = process.env.ADMIN_NAME || 'Mahbubur Rahman';
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file before running this script.');
  process.exit(1);
}

const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
const hash = bcrypt.hashSync(password, 10);

if (existing) {
  db.prepare('UPDATE users SET password_hash = ?, role = ?, name = ? WHERE email = ?')
    .run(hash, 'admin', name, email.toLowerCase());
  console.log(`Updated existing admin account for ${email}`);
} else {
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email.toLowerCase(), hash, 'admin');
  console.log(`Created admin account for ${email}`);
}

console.log('Done. You can now log in at /login.html with this email and password.');
