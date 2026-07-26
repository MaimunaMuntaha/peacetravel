// A minimal express-session store backed by the same better-sqlite3 database
// we already use for users/bookings. This avoids pulling in a second, separately
// compiled SQLite driver (connect-sqlite3 depends on the native "sqlite3" package,
// which can conflict with better-sqlite3's own native binding).

const session = require('express-session');
const db = require('./database');

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid     TEXT PRIMARY KEY,
    sess    TEXT NOT NULL,
    expires INTEGER NOT NULL
  );
`);

class SqliteSessionStore extends session.Store {
  constructor() {
    super();
    this._get = db.prepare('SELECT sess, expires FROM sessions WHERE sid = ?');
    this._set = db.prepare(
      'INSERT INTO sessions (sid, sess, expires) VALUES (?, ?, ?) ' +
      'ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expires = excluded.expires'
    );
    this._destroy = db.prepare('DELETE FROM sessions WHERE sid = ?');
    this._touch = db.prepare('UPDATE sessions SET expires = ? WHERE sid = ?');
    this._cleanup = db.prepare('DELETE FROM sessions WHERE expires < ?');

    // Periodically purge expired sessions.
    setInterval(() => {
      try { this._cleanup.run(Date.now()); } catch (_) {}
    }, 1000 * 60 * 60).unref?.();
  }

  get(sid, cb) {
    try {
      const row = this._get.get(sid);
      if (!row || row.expires < Date.now()) return cb(null, null);
      cb(null, JSON.parse(row.sess));
    } catch (e) { cb(e); }
  }

  set(sid, sessionData, cb) {
    try {
      const maxAge = sessionData.cookie && sessionData.cookie.maxAge ? sessionData.cookie.maxAge : 1000 * 60 * 60 * 24;
      const expires = Date.now() + maxAge;
      this._set.run(sid, JSON.stringify(sessionData), expires);
      cb(null);
    } catch (e) { cb(e); }
  }

  destroy(sid, cb) {
    try { this._destroy.run(sid); cb(null); } catch (e) { cb(e); }
  }

  touch(sid, sessionData, cb) {
    try {
      const maxAge = sessionData.cookie && sessionData.cookie.maxAge ? sessionData.cookie.maxAge : 1000 * 60 * 60 * 24;
      this._touch.run(Date.now() + maxAge, sid);
      cb(null);
    } catch (e) { cb(e); }
  }
}

module.exports = SqliteSessionStore;
