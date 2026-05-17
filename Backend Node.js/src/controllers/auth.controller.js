const { getPool } = require('../database/db')
const { signToken } = require('../middlewares/auth')

async function login(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!email) return res.status(400).json({ ok: false, error: 'Email requerido' })
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol FROM users WHERE LOWER(email) = ? LIMIT 1',
      [email],
    )
    if (!rows || rows.length === 0) {
      return res.status(401).json({ ok: false, error: 'Credenciales invalidas' })
    }
    const user = rows[0]
    const token = signToken({ userId: user.id, rol: user.rol })
    res.json({ ok: true, token, user })
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || 'Error DB' })
  }
}

async function me(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol FROM users WHERE id = ? LIMIT 1',
      [req.auth.userId],
    )
    if (!rows || rows.length === 0) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' })
    res.json({ ok: true, user: rows[0] })
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || 'Error DB' })
  }
}

module.exports = { login, me }
