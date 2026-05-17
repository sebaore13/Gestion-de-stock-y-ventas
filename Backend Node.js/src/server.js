require('dotenv').config()

const { createApp } = require('./app')
const { createPoolFromEnv } = require('./db')

const port = Number(process.env.PORT || 3001)
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

const dbPool = createPoolFromEnv(process.env)
const app = createApp({ dbPool, frontendOrigin })

const server = app.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port}`)
})

process.on('SIGINT', async () => {
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log('[backend] server closed')
  })
  try {
    await dbPool.end()
  } catch {
    // ignore
  }
  process.exit(0)
})
