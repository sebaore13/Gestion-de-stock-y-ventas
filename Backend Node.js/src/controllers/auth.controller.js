const { getPool } = require('../database/db')
const { signToken } = require('../middlewares/auth')
const bcrypt = require('bcryptjs')
const config = require('../config')
const { formatLocalDatetime, localDatetimeStr } = require('../utils')

async function login(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  if (!email) return res.status(400).json({ ok: false, error: 'Email requerido' })
  if (!password) return res.status(400).json({ ok: false, error: 'Password requerido' })
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, email, rol, activo, passwordHash, failed_attempts, locked_until
       FROM users WHERE LOWER(email) = ? LIMIT 1`,
      [email],
    )
    if (!rows || rows.length === 0) {
      return res.status(401).json({ ok: false, error: 'Credenciales invalidas' })
    }
    const user = rows[0]

    if (Number(user.activo) === 0) {
      return res.status(403).json({ ok: false, error: 'Usuario desactivado' })
    }
    if (user.locked_until) {
      const until = new Date(user.locked_until)
      if (!Number.isNaN(until.getTime()) && until.getTime() > Date.now()) {
        return res.status(429).json({ ok: false, error: 'Cuenta bloqueada temporalmente' })
      }
    }
    if (!user.passwordHash) {
      return res.status(403).json({ ok: false, error: 'Usuario sin password configurado. Contacta al administrador.' })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      const nextAttempts = (Number(user.failed_attempts) || 0) + 1
      let lockedUntil = null
      // Bloqueo simple progresivo: 5 intentos -> 15 min
      if (nextAttempts >= 5) {
        const until = new Date(Date.now() + 15 * 60 * 1000)
        lockedUntil = formatLocalDatetime(until)
      }
      await pool.query(
        'UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ? LIMIT 1',
        [nextAttempts, lockedUntil, user.id],
      )
      return res.status(401).json({ ok: false, error: 'Credenciales invalidas' })
    }

    // Reset lock/attempts and set last_login_at
    const nowStr = localDatetimeStr()
    await pool.query(
      'UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ? LIMIT 1',
      [nowStr, user.id],
    )

    const token = signToken({ userId: user.id, rol: user.rol })
    res.json({
      ok: true,
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      expiresIn: config.jwtExpiresIn,
    })
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
