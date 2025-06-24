const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./postbin.db');

// Ensure schema and clean data on boot
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS bins (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME DEFAULT (DATETIME(CURRENT_TIMESTAMP, '+30 minutes'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bin_id TEXT,
      method TEXT,
      path TEXT,
      headers TEXT,
      query TEXT,
      body TEXT,
      ip TEXT,
      inserted INTEGER,
      created_at TEXT
    );
  `);

  // Clean all (only for dev)
  db.run('DELETE FROM requests');
  db.run('DELETE FROM bins');
});

module.exports = db;