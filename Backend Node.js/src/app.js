const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const config = require('./config')

const { requestIdMiddleware, errorHandler } = require('./middlewares/requestContext')

const authRoutes = require('./routes/auth.routes')
const categoryRoutes = require('./routes/categories.routes')
const productRoutes = require('./routes/products.routes')
const saleRoutes = require('./routes/sales.routes')
const movementRoutes = require('./routes/movements.routes')
const healthRoutes = require('./routes/health.routes')
const userRoutes = require('./routes/users.routes')
const printRoutes = require('./routes/print.routes')
const quotationRoutes = require('./routes/quotations.routes')

function createApp() {
  const app = express()

  app.disable('x-powered-by')

  // Trust proxy (Apache/Nginx reverso en hosting)
  app.set('trust proxy', 1)

  app.use(requestIdMiddleware())

  app.use(helmet({
    // Keep defaults; can be tuned once behind HTTPS / reverse proxy.
    crossOriginResourcePolicy: false,
  }))

  const origins = String(config.frontendOrigins || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const originSet = new Set(origins)

  app.use(cors({
    origin: (origin, cb) => {
      // Non-browser clients (curl, server-to-server) usually send no Origin.
      if (!origin) return cb(null, true)
      if (originSet.has(origin)) return cb(null, true)
      const err = new Error('CORS: origen no permitido')
      err.status = 403
      return cb(err)
    },
    credentials: true,
  }))

  app.use(express.json({ limit: config.bodyLimit }))

  app.use(authRoutes)
  app.use(categoryRoutes)
  app.use(productRoutes)
  app.use(saleRoutes)
  app.use(movementRoutes)
  app.use(userRoutes)
  app.use(healthRoutes)
  app.use(quotationRoutes)

  app.use((req, res) => {
    res.status(404).json({ ok: false, error: 'Not found' })
  })

  app.use(errorHandler())

  return app
}

module.exports = { createApp }
