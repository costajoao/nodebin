import express, {type Request, type Response } from 'express'
import frontend from './frontend'
import api from './api'
import db from '../libs/db'
import Logger from '../libs/logger'

const router = express.Router()
const logger = Logger('HealthCheck')

// Import frontend and API routers
router.use(frontend)
router.use(api)

// Health check endpoint
router.get('/api/health', async (_req: Request, res: Response) => {
  try {
    db.query('SELECT 1').get()
    res.status(200).json({ status: 'ok', message: 'Service is healthy' })
  } catch (err) {
    logger.error('Database connection error:', err)
    res.status(500).json({ status: 'error', message: 'Database is unreachable' })
  }
})

router.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
  // Return sample devtools JSON (customize as needed)
  return res.status(200).json({
    devtools: process.env.NODE_ENV !== "production",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
})

export default router
