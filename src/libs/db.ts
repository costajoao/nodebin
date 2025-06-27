// db.ts
import { join } from 'node:path'
import { Database } from 'bun:sqlite'

const db = new Database(join(__dirname, '../../data/postbin.db'))

const IS_PROD = process.env.NODE_ENV === 'production'

// Ensure schema and clean data on boot
db.run(`
  CREATE TABLE IF NOT EXISTS bins (
    id TEXT PRIMARY KEY,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000),
    expires_at INTEGER DEFAULT ((strftime('%s','now') + 1800) * 1000) -- 30 min
  )
`)

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
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  )
`)

// Clean all (prod only)
if (IS_PROD) {
  db.run('DELETE FROM requests')
  db.run('DELETE FROM bins')
}

export default db
