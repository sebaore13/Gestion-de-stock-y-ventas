const { getPool } = require('../database/db')
const { mysqlErrorMessage } = require('../utils')

async function list(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM categories ORDER BY nombre ASC')
    res.json({ ok: true, categories: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

module.exports = { list }
