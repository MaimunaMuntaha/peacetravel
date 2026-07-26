const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'peace_travel.db'));
db.pragma('journal_mode = WAL');

// ---- Schema ----
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    phone         TEXT,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',   -- 'user' or 'admin'
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL,
    type           TEXT NOT NULL,                 -- 'flight' or 'package'
    destination    TEXT NOT NULL,
    origin         TEXT,
    depart_date    TEXT NOT NULL,
    return_date    TEXT,
    trip_days      INTEGER,
    passengers     INTEGER NOT NULL DEFAULT 1,
    travel_class   TEXT NOT NULL,                 -- economy/premium_economy/business/first
    notes          TEXT,
    status         TEXT NOT NULL DEFAULT 'pending', -- pending/quoted/closed
    admin_reply    TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
`);

module.exports = db;
