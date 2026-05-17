require('dotenv').config()

const config = require('./config')
const { createPoolFromEnv, setPool } = require('./database/db')
const { createApp } = require('./app')

const pool = createPoolFromEnv(config)
setPool(pool)

const app = createApp()

const server = app.listen(config.port, () => {
  console.log(`[backend] listening on http://localhost:${config.port}`)
})

process.on('SIGINT', async () => {
  server.close(() => {
    console.log('[backend] server closed')
  })
  try {
    await pool.end()
  } catch {
    // ignore
  }
  process.exit(0)
})
