const { getPool } = require('../database/db')

async function health(req, res) {
  res.json({ ok: true })
}

async function dbPing(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  try {
    const [rows] = await pool.query('SELECT 1 AS ok')
    res.json({ ok: true, result: rows?.[0]?.ok ?? 1 })
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || 'Error DB' })
  }
}

async function adminPing(req, res) {
  res.json({ ok: true })
}

module.exports = { health, dbPing, adminPing }
