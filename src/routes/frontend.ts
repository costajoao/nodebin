import express, { Request, Response } from 'express'
import db from '../libs/db'

const router = express.Router()

// Home page
router.get('/', (req: Request, res: Response) => {
  res.render('index', {
    expired: req.query.expired === 'true',
    host: req.get('host'),
  })
})

// Bin Viewer Page
router.get('/b/:id', (req: Request, res: Response) => {
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

export default router
