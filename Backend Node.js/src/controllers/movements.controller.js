const { getPool } = require('../database/db')
const { toInt, mysqlErrorMessage } = require('../utils')

async function list(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const limit = Math.min(500, Math.max(1, toInt(req.query.limit) || 100))
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.tipo, m.cantidad, m.fecha, m.usuarioId, u.nombre AS usuarioNombre,
              m.productoId, p.codigo AS productoCodigo, p.nombre AS productoNombre
       FROM movements m
       JOIN users u ON u.id = m.usuarioId
       JOIN products p ON p.id = m.productoId
       ORDER BY m.id DESC
       LIMIT ?`,
      [limit],
    )
    res.json({ ok: true, movements: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

module.exports = { list }
