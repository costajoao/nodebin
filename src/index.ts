import express from 'express'
import path from 'path'

import routers from './routes'
import logger from './libs/logger'
import bodyParser from './libs/body-parser'
import './libs/cron' // Import cron job for cleanup

const Logger = logger('Bootstrap')
const app = express()
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000

// App Configuration
app.use(express.static('public'))
app.disable('x-powered-by')
app.enable('trust proxy')
app.use((req, _res, next) => {
  logger('HTTP').debug(`${req.method} ${req.url}`)
  next()
})

// Middleware for parsing request bodies
app.use(bodyParser)

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(routers)

app.listen(PORT, () => {
  Logger.log(`🌐 NodeBin is running on port ${PORT}`)
})