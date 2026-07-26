const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');

const router = express.Router();

// ---- Register ----
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Please enter your full name.'),
    body('email').trim().isEmail().withMessage('Please enter a valid email address.'),
    body('phone').optional({ checkFalsy: true }).trim(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, email, phone, password } = req.body;
    const emailLower = email.toLowerCase();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailLower);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in instead.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db
      .prepare('INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)')
      .run(name, emailLower, phone || null, hash, 'user');

    req.session.user = { id: result.lastInsertRowid, name, email: emailLower, role: 'user' };
    res.json({ success: true, user: req.session.user });
  }
);

// ---- Login ----
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Please enter a valid email address.'),
    body('password').notEmpty().withMessage('Please enter your password.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ error: 'Incorrect email or password.' });
    }

    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ success: true, user: req.session.user });
  }
);

// ---- Logout ----
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// ---- Current session ----
router.get('/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

module.exports = router;
