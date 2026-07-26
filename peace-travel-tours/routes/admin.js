const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ---- List all booking requests, newest first ----
router.get('/bookings', requireAdmin, (req, res) => {
  const bookings = db
    .prepare(
      `SELECT b.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
       FROM bookings b JOIN users u ON u.id = b.user_id
       ORDER BY b.created_at DESC`
    )
    .all();
  res.json({ bookings });
});

// ---- Update a booking's status / add a reply note ----
router.patch(
  '/bookings/:id',
  requireAdmin,
  [
    body('status').optional().isIn(['pending', 'quoted', 'closed']),
    body('admin_reply').optional({ checkFalsy: true }).trim(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Booking not found.' });

    const status = req.body.status || existing.status;
    const adminReply = req.body.admin_reply !== undefined ? req.body.admin_reply : existing.admin_reply;

    db.prepare(`UPDATE bookings SET status = ?, admin_reply = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(status, adminReply, id);

    res.json({ success: true, booking: db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) });
  }
);

module.exports = router;
