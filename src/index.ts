import express, { Request, Response, NextFunction } from 'express'
import { customAlphabet } from 'nanoid'
import db from './db'
import path from 'path'

const app = express()
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000

// Use built-in middleware only
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.text({ type: 'text/plain' }))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Clean up expired bins every 5 min
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

// Home page
app.get('/', (req: Request, res: Response) => {
  res.render('index', {
    expired: req.query.expired === 'true',
    host: req.get('host'),
  })
})

// Create new bin
app.post('/', (req: Request, res: Response) => {
  const nanoid = customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    12,
  )
  const id = nanoid()
  const now = Date.now()
  const expires = now + 30 * 60 * 1000 // 30 minutes

  db.run(
    'INSERT INTO bins (id, created_at, expires_at) VALUES (?, ?, ?)',
    [id, now, expires],
    (err: Error | null) => {
      if (err) return res.status(500).send('Error creating bin')
      res.redirect(`/b/${id}`)
    },
  )
})

// API Documentation Page
app.get('/api', (req: Request, res: Response) => {
  res.render('api', { host: req.get('host') })
})

// GET Requests for a Bin
app.get('/api/bin/:id/requests', (req: Request, res: Response) => {
  const binId = req.params.id
  const since = parseInt(req.query.since as string, 10)
  const isSinceValid = !isNaN(since) && since > 0

  const query = isSinceValid
    ? `SELECT id, method, path, headers, query, body, ip, created_at FROM requests WHERE bin_id = ? AND created_at > ? ORDER BY created_at ASC LIMIT 10`
    : `SELECT id, method, path, headers, query, body, ip, created_at FROM requests WHERE bin_id = ? ORDER BY created_at ASC LIMIT 10`

  const params = isSinceValid ? [binId, since] : [binId]

  db.all(query, params, (err: Error | null, rows: any[]) => {
    if (err) {
      console.error('[API] Error loading requests:', err)
      return res.status(500).json({ message: 'Error loading requests' })
    }

    res.json(rows.map((r) => ({ ...r, created_at: Number(r.created_at) })))
  })
})

// Bin Viewer Page
app.get('/b/:id', (req: Request, res: Response) => {
  const binId = req.params.id

  db.get('SELECT * FROM bins WHERE id = ?', [binId], (err: Error | null, bin: any) => {
    if (err || !bin) {
      return res.status(404).redirect('/?expired=true')
    }

    res.set('Cache-Control', 'no-store')
    res.render('bin', {
      bin,
      host: req.get('host'),
    })
  })
})

// Catch-all route for incoming requests to bin
app.all('/:id', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/b/') || req.path.startsWith('/api/')) return next()

  const binId = req.params.id
  const ip =
    (req.headers['x-real-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string) ||
    req.ip ||
    'unknown'
  const path = req.originalUrl

  db.get(
    'SELECT id FROM bins WHERE id = ? AND expires_at > ?',
    [binId, Date.now()],
    (err: Error | null, bin: any) => {
      if (err || !bin) {
        return res.status(404).json({ message: 'Bin expired or not found' })
      }

      // Save body as string, regardless of type
      let body: string | null

      console.log('Request body:', req.body)
      if (typeof req.body === 'object' && req.body !== null) {
        body = JSON.stringify(req.body, null, 2)
      } else if (typeof req.body === 'string') {
        body = req.body
      } else {
        body = null
      }

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
        ],
        function (err: Error | null) {
          if (err) {
            console.error('DB insert error:', err)
            return res.status(500).json({ message: 'Error saving request' })
          }

          return res.status(200).json({
            binId,
            method: req.method,
            query: req.query && Object.keys(req.query).length > 0 ? req.query : null,
            headers: req.headers && Object.keys(req.headers).length > 0 ? req.headers : null,
            body: body,
          })
        },
      )
    },
  )
})

app.listen(PORT, () => {
  console.log(`🚀 Listening at http://localhost:${PORT}`)
})
