import express from 'express'
import frontend from './frontend'
import api from './api'
import db from '../libs/db'

const router = express.Router()

// Import frontend routers
router.use(frontend)

// Import API routers
router.use(api)

// Health check endpoint
router.get('/health', (_req, res) => {
  // Check if the database is accessible
  try {
    db.get('SELECT 1', [], (err) => {
      if (err) {
        console.error('Database connection error:', err)
        return res.status(500).json({ status: 'error', message: 'Database is unreachable' })
      }
    })
    res.status(200).json({ status: 'ok', message: 'Service is healthy' })
  } catch (error) {
    console.error('Health check failed:', error)
    res.status(500).json({ status: 'error', message: 'Service is unhealthy' })
  }
})
export default router
