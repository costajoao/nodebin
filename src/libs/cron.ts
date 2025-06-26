import db from './db'

// Clean up expired bins and requests every 5 minutes
// This will remove any bins and their associated requests that have expired
// based on the current timestamp.
setInterval(
  () => {
    const now = Date.now()
    db.run(`DELETE FROM requests WHERE bin_id IN (SELECT id FROM bins WHERE expires_at <= ?)`, [
      now,
    ])
    db.run(`DELETE FROM bins WHERE expires_at <= ?`, [now])
  },
  5 * 60 * 1000,
)
