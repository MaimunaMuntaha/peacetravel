const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');
const { requireLogin } = require('../middleware/auth');
const { sendBookingConfirmation, sendAdminNotification } = require('../emails/mailer');

const router = express.Router();

// ---- Submit a new booking request (flight or package) ----
router.post(
  '/',
  requireLogin,
  [
    body('type').isIn(['flight', 'package']).withMessage('Please choose flight or package.'),
    body('destination').trim().notEmpty().withMessage('Please tell us where you want to go.'),
    body('depart_date').isISO8601().withMessage('Please provide a valid departure date.'),
    body('return_date').optional({ checkFalsy: true }).isISO8601(),
    body('trip_days').optional({ checkFalsy: true }).isInt({ min: 1 }).toInt(),
    body('passengers').isInt({ min: 1, max: 50 }).withMessage('Number of passengers must be at least 1.').toInt(),
    body('travel_class').isIn(['economy', 'premium_economy', 'business', 'first']).withMessage('Please choose a valid class.'),
    body('notes').optional({ checkFalsy: true }).trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { type, destination, origin, depart_date, return_date, trip_days, passengers, travel_class, notes } = req.body;
    const user = req.session.user;

    const result = db
      .prepare(
        `INSERT INTO bookings (user_id, type, destination, origin, depart_date, return_date, trip_days, passengers, travel_class, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(user.id, type, destination, origin || null, depart_date, return_date || null, trip_days || null, passengers, travel_class, notes || null);

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);

    // Fire off emails — don't let email failures break the booking flow.
    try {
      await sendBookingConfirmation({ toEmail: user.email, toName: user.name, booking });
    } catch (e) {
      console.error('Failed to send customer confirmation email:', e.message);
    }
    try {
      await sendAdminNotification({ booking, customer: user });
    } catch (e) {
      console.error('Failed to send admin notification email:', e.message);
    }

    res.json({ success: true, booking });
  }
);

// ---- Get the logged-in user's own bookings ----
router.get('/mine', requireLogin, (req, res) => {
  const bookings = db
    .prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.session.user.id);
  res.json({ bookings });
});

module.exports = router;
