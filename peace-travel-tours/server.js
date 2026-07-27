require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const SqliteSessionStore = require('./db/sqliteSessionStore');

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);   // ADD THIS LINE — tells Express to trust Render's proxy/HTTPS headers 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new SqliteSessionStore(),
    secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Peace Travel and Tours server running at http://localhost:${PORT}`);
});
