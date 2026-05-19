const { getPool } = require('../database/db')
const { toInt, mysqlErrorMessage } = require('../utils')

async function list(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const limit = Math.min(500, Math.max(1, toInt(req.query.limit) || 100))
  const from = String(req.query.from || '').trim()
  const to = String(req.query.to || '').trim()
  let usuarioId = req.query.usuarioId !== undefined ? toInt(req.query.usuarioId) : null
  const tipo = String(req.query.tipo || '').trim().toUpperCase()

  const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s)
  if (from && !isDateOnly(from)) return res.status(400).json({ ok: false, error: 'from invalido (YYYY-MM-DD)' })
  if (to && !isDateOnly(to)) return res.status(400).json({ ok: false, error: 'to invalido (YYYY-MM-DD)' })
  if (usuarioId !== null && (!Number.isInteger(usuarioId) || usuarioId <= 0)) {
    return res.status(400).json({ ok: false, error: 'usuarioId invalido' })
  }
  if (tipo && !['INGRESO', 'SALIDA', 'AJUSTE'].includes(tipo)) {
    return res.status(400).json({ ok: false, error: 'tipo invalido' })
  }

  if (req.auth?.rol !== 'Administrador') {
    if (usuarioId === null) usuarioId = req.auth.userId
    if (usuarioId !== req.auth.userId) return res.status(403).json({ ok: false, error: 'Prohibido' })
  }
  try {
    const where = []
    const params = []
    if (from) {
      where.push('DATE(m.fecha) >= ?')
      params.push(from)
    }
    if (to) {
      where.push('DATE(m.fecha) <= ?')
      params.push(to)
    }
    if (usuarioId) {
      where.push('m.usuarioId = ?')
      params.push(usuarioId)
    }
    if (tipo) {
      where.push('m.tipo = ?')
      params.push(tipo)
    }

    const [rows] = await pool.query(
      `SELECT m.id, m.tipo, m.cantidad, m.fecha, m.usuarioId, u.nombre AS usuarioNombre,
              m.productoId, p.codigo AS productoCodigo, p.nombre AS productoNombre
       FROM movements m
       JOIN users u ON u.id = m.usuarioId
       JOIN products p ON p.id = m.productoId
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY m.id DESC
       LIMIT ?`,
      [...params, limit],
    )
    res.json({ ok: true, movements: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

module.exports = { list }
