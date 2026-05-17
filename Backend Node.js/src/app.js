const express = require('express')
const cors = require('cors')
const config = require('./config')

const authRoutes = require('./routes/auth.routes')
const categoryRoutes = require('./routes/categories.routes')
const productRoutes = require('./routes/products.routes')
const saleRoutes = require('./routes/sales.routes')
const movementRoutes = require('./routes/movements.routes')
const healthRoutes = require('./routes/health.routes')

function createApp() {
  const app = express()

  app.use(cors({ origin: config.frontendOrigin || true, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  app.use(authRoutes)
  app.use(categoryRoutes)
  app.use(productRoutes)
  app.use(saleRoutes)
  app.use(movementRoutes)
  app.use(healthRoutes)

  app.use((req, res) => {
    res.status(404).json({ ok: false, error: 'Not found' })
  })

  return app
}

module.exports = { createApp }
