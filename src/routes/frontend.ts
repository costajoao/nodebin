import express, { type Request, type Response } from 'express'
import db from '../libs/db'
import Logger from '../libs/logger'

const router = express.Router()
const logger = Logger('Frontend')

// Home page
router.get('/', (req: Request, res: Response) => {
  res.render('index', {
    expired: req.query.expired === 'true',
    host: req.get('host'),
  })
})

// Bin Viewer Page
router.get('/b/:id', (req: Request, res: Response) => {
  const binId = req.params.id ?? '';

  try {
    const stmt = db.query('SELECT * FROM bins WHERE id = ?');
    const bin = stmt.get(binId);

    if (!bin) {
      return res.status(404).redirect('/?expired=true')
    }

    res.set('Cache-Control', 'no-store')
    res.render('bin', {
      bin,
      host: req.get('host'),
    })
  } catch (err) {
    logger.error('Error loading bin:', err)
    return res.status(500).send('Internal Server Error');
  }
})

export default router
