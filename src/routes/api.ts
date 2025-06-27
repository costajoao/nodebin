import express, { type NextFunction, type Request, type Response } from 'express'
import { customAlphabet } from 'nanoid'

import { type RequestRow } from '../types'
import db from '../libs/db'
import Logger from '../libs/logger'

const router = express.Router()
const logger = Logger('API')

// API Documentation Page
router.get('/api', (req: Request, res: Response) => {
  res.render('api', { host: req.get('host') })
})

// Create new bin
router.post('/api/bin', (_req: Request, res: Response) => {
  const nanoid = customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    12,
  )
  const id = nanoid()
  const now = Date.now()
  const expires = now + 60 * 60 * 1000 // 60 minutes

  try {
    db.run(
      'INSERT INTO bins (id, created_at, expires_at) VALUES (?, ?, ?)',
      [id, now, expires]
    )
    res.redirect(`/b/${id}`)
  } catch (err) {
    logger.error('Error creating bin:', err)
    res.status(500).send('Error creating bin')
  }
})

// GET Requests for a Bin
router.get('/api/bin/:id/requests', (req: Request, res: Response) => {
  const binId = req.params.id
  const since = parseInt(req.query.since as string, 10)
  const isSinceValid = !isNaN(since) && since > 0

  const query = isSinceValid
    ? `SELECT id, method, path, headers, query, body, ip, created_at FROM requests WHERE bin_id = ? AND created_at > ? ORDER BY created_at ASC LIMIT 10`
    : `SELECT id, method, path, headers, query, body, ip, created_at FROM requests WHERE bin_id = ? ORDER BY created_at ASC LIMIT 10`

  const params = isSinceValid ? [binId, since] : [binId]

  try {
    const rows = db.query<RequestRow, any[]>(query).all(...params)
    res.json(rows.map((r) => ({ ...r, created_at: Number(r.created_at) })))
  } catch (err) {
    logger.error('[API] Error loading requests:', err)
    res.status(500).json({ message: 'Error loading requests' })
  }
})

// Catch-all route for incoming requests to bin
router.all('/:id', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/b/') || req.path.startsWith('/api/')) return next();

  const binId = req.params.id ?? '';
  const ip =
    (req.headers['x-real-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string) ||
    req.ip ||
    'unknown';
  const path = req.originalUrl;

  if (!binId) {
    return res.status(400).json({ message: 'Missing bin id' });
  }

  try {
    const bin = db.query('SELECT id FROM bins WHERE id = ? AND expires_at > ?').get(binId, Date.now());
    if (!bin) {
      return res.status(404).json({ message: 'Bin expired or not found' });
    }

    // Save body as string, regardless of type
    const body: string | null = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    logger.debug('Request body:', req.body, body);

    db.run(
      `INSERT INTO requests (bin_id, method, path, headers, body, query, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        binId,
        req.method,
        path,
        req.headers ? JSON.stringify(req.headers, null, 2) : null,
        body,
        req.query && Object.keys(req.query).length > 0
          ? JSON.stringify(req.query, null, 2)
          : null,
        ip,
        Date.now(),
      ]
    );

    return res.status(200).json({
      binId,
      method: req.method,
      query: req.query && Object.keys(req.query).length > 0 ? req.query : null,
      headers: req.headers && Object.keys(req.headers).length > 0 ? req.headers : null,
      body: body,
    });
  } catch (err) {
    logger.error('DB error:', err);
    return res.status(500).json({ message: 'Error saving request' });
  }
});

export default router
