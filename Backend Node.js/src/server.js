require('dotenv').config()

const config = require('./config')
const { createPoolFromEnv, setPool } = require('./database/db')
const { createApp } = require('./app')

const REQUIRED_ENV = {
  jwtSecret: 'JWT_SECRET',
  dbHost: 'DB_HOST',
  dbUser: 'DB_USER',
  dbName: 'DB_NAME',
}

for (const [key, envVar] of Object.entries(REQUIRED_ENV)) {
  if (!config[key] || (typeof config[key] === 'string' && !config[key].trim())) {
    console.error(`[backend] FATAL: ${envVar} no esta configurado en .env o variables de entorno`)
    process.exit(1)
  }
}

const pool = createPoolFromEnv(config)
setPool(pool)

const app = createApp()

app.listen(config.port, () => {
  console.log(`[backend] listening on port ${config.port}`)
})

process.on('unhandledRejection', (reason) => {
  console.error('[backend] unhandled rejection:', reason?.message || reason)
})

process.on('uncaughtException', (err) => {
  console.error('[backend] uncaught exception:', err?.message || err)
  process.exit(1)
})

process.on('SIGINT', async () => {
  console.log('[backend] shutting down...')
  try {
    await pool.end()
  } catch {
    // ignore
  }
  process.exit(0)
})
