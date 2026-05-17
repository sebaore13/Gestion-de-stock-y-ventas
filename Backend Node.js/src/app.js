const express = require('express')
const cors = require('cors')

function createApp({ dbPool, frontendOrigin }) {
  const app = express()

  app.use(
    cors({
      origin: frontendOrigin || true,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))

  app.get('/health', (req, res) => {
    res.json({ ok: true })
  })

  // Verifica conexion a MySQL.
  app.get('/db/ping', async (req, res) => {
    if (!dbPool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
    try {
      const [rows] = await dbPool.query('SELECT 1 AS ok')
      res.json({ ok: true, result: rows?.[0]?.ok ?? 1 })
    } catch (err) {
      res.status(500).json({ ok: false, error: err?.message || 'Error DB' })
    }
  })

  // 404 simple
  app.use((req, res) => {
    res.status(404).json({ ok: false, error: 'Not found' })
  })

  return app
}

module.exports = { createApp }
