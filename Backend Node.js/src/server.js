require('dotenv').config()

const config = require('./config')
const { createPoolFromEnv, setPool } = require('./database/db')
const { createApp } = require('./app')

const pool = createPoolFromEnv(config)
setPool(pool)

const app = createApp()

async function ensureSchema() {
  // Minimal schema migration for existing dev DBs.
  async function hasColumn(table, column) {
    const [rows] = await pool.query(
      `SELECT 1 AS ok
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
       LIMIT 1`,
      [config.dbName, table, column],
    )
    return !!(rows && rows.length)
  }

  if (!(await hasColumn('products', 'activo'))) {
    await pool.query('ALTER TABLE products ADD COLUMN activo TINYINT NOT NULL DEFAULT 1')
    await pool.query('CREATE INDEX idx_products_activo ON products (activo)')
  }

  if (!(await hasColumn('sales', 'metodoPago'))) {
    await pool.query(
      "ALTER TABLE sales ADD COLUMN metodoPago ENUM('EFECTIVO','TARJETA','FACTURA') NOT NULL DEFAULT 'EFECTIVO'",
    )
  }
  if (!(await hasColumn('sales', 'otrosCargos'))) {
    await pool.query('ALTER TABLE sales ADD COLUMN otrosCargos INT NOT NULL DEFAULT 0')
  }
}

let server

ensureSchema()
  .catch((err) => {
    console.error('[backend] schema check failed:', err?.message || err)
  })
  .finally(() => {
    server = app.listen(config.port, () => {
      console.log(`[backend] listening on http://localhost:${config.port}`)
    })
  })

process.on('SIGINT', async () => {
  if (server) {
    server.close(() => {
      console.log('[backend] server closed')
    })
  }
  try {
    await pool.end()
  } catch {
    // ignore
  }
  process.exit(0)
})
