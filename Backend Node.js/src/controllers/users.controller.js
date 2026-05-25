const bcrypt = require('bcryptjs')
const config = require('../config')
const { getPool } = require('../database/db')
const { toInt, mysqlErrorMessage } = require('../utils')

function normalizeRole(raw) {
  const rol = String(raw || '').trim()
  if (!rol) return null
  if (!['Administrador', 'Vendedor'].includes(rol)) return null
  return rol
}

async function getUserById(pool, id) {
  const [rows] = await pool.query(
    'SELECT id, nombre, email, rol, activo FROM users WHERE id = ? LIMIT 1',
    [id],
  )
  return rows && rows.length ? rows[0] : null
}

async function list(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, email, rol, activo, last_login_at, failed_attempts, locked_until, created_at
       FROM users
       ORDER BY id DESC
       LIMIT 500`,
    )
    res.json({ ok: true, users: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

async function create(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })

  const nombre = String(req.body?.nombre || '').trim()
  const email = String(req.body?.email || '').trim().toLowerCase()
  const requestedRole = req.body?.rol
  const rol = 'Vendedor'
  const password = String(req.body?.password || '')
  const activo = req.body?.activo === undefined ? 1 : Number(req.body.activo) ? 1 : 0

  if (!nombre || !email) return res.status(400).json({ ok: false, error: 'nombre y email son requeridos' })
  if (!password || password.length < 8) return res.status(400).json({ ok: false, error: 'password minimo 8 caracteres' })

  // Seguridad: por ahora solo existe 1 administrador fijo. No se permiten nuevos admins.
  if (requestedRole !== undefined) {
    const normalized = normalizeRole(requestedRole)
    if (normalized && normalized !== 'Vendedor') {
      return res.status(403).json({ ok: false, error: 'No se permite crear usuarios administradores' })
    }
  }

  try {
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds)
    const [result] = await pool.query(
      'INSERT INTO users (nombre, email, rol, activo, passwordHash) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, rol, activo, passwordHash],
    )
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, activo, last_login_at, created_at FROM users WHERE id = ? LIMIT 1',
      [result.insertId],
    )
    res.status(201).json({ ok: true, user: rows[0] })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

async function update(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const id = toInt(req.params.id)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, error: 'id invalido' })

  // Seguridad: rol fijo (no se permite cambiar ni enviar actualizaciones de rol).
  if (req.body?.rol !== undefined) {
    return res.status(403).json({ ok: false, error: 'No se permite cambiar roles' })
  }

  const patch = {}
  if (req.body?.nombre !== undefined) patch.nombre = String(req.body.nombre || '').trim()
  if (req.body?.email !== undefined) patch.email = String(req.body.email || '').trim().toLowerCase()
  if (req.body?.activo !== undefined) patch.activo = Number(req.body.activo) ? 1 : 0

  if (patch.nombre !== undefined && !patch.nombre) return res.status(400).json({ ok: false, error: 'nombre invalido' })
  if (patch.email !== undefined && !patch.email) return res.status(400).json({ ok: false, error: 'email invalido' })
  // rol no permitido

  const fields = []
  const params = []
  for (const k of ['nombre', 'email', 'activo']) {
    if (patch[k] === undefined) continue
    fields.push(`${k} = ?`)
    params.push(patch[k])
  }
  if (fields.length === 0) return res.json({ ok: true })

  try {
    const existing = await getUserById(pool, id)
    if (!existing) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' })

    // Proteccion del administrador: solo se permite editar nombre.
    if (existing.rol === 'Administrador') {
      const hasForbidden = patch.email !== undefined || patch.activo !== undefined
      if (hasForbidden) {
        return res.status(403).json({ ok: false, error: 'El administrador solo puede modificar su nombre' })
      }
    }

    params.push(id)
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params)
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, activo, last_login_at, created_at FROM users WHERE id = ? LIMIT 1',
      [id],
    )
    res.json({ ok: true, user: rows[0] })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

async function resetPassword(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const id = toInt(req.params.id)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, error: 'id invalido' })
  const password = String(req.body?.password || '')
  if (!password || password.length < 8) return res.status(400).json({ ok: false, error: 'password minimo 8 caracteres' })
  try {
    const existing = await getUserById(pool, id)
    if (!existing) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' })

    if (existing.rol === 'Administrador') {
      return res.status(403).json({ ok: false, error: 'No se puede restablecer la contraseña del administrador' })
    }
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds)
    await pool.query(
      'UPDATE users SET passwordHash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ? LIMIT 1',
      [passwordHash, id],
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

async function changeMyPassword(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const currentPassword = String(req.body?.currentPassword || '')
  const newPassword = String(req.body?.newPassword || '')
  if (!currentPassword) return res.status(400).json({ ok: false, error: 'currentPassword requerido' })
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ ok: false, error: 'newPassword minimo 8 caracteres' })

  try {
    const [rows] = await pool.query('SELECT id, passwordHash, rol FROM users WHERE id = ? LIMIT 1', [req.auth.userId])
    if (!rows || rows.length === 0) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' })
    const user = rows[0]

    if (user.rol === 'Administrador') {
      return res.status(403).json({ ok: false, error: 'No se permite cambiar la contraseña del administrador' })
    }
    if (!user.passwordHash) return res.status(403).json({ ok: false, error: 'Usuario sin password configurado' })
    const ok = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!ok) return res.status(401).json({ ok: false, error: 'Credenciales invalidas' })

    const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds)
    await pool.query('UPDATE users SET passwordHash = ? WHERE id = ? LIMIT 1', [passwordHash, user.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

async function remove(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const id = toInt(req.params.id)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, error: 'id invalido' })

  try {
    const existing = await getUserById(pool, id)
    if (!existing) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' })

    if (existing.rol === 'Administrador') {
      return res.status(403).json({ ok: false, error: 'No se puede eliminar el administrador' })
    }
    if (existing.rol !== 'Vendedor') {
      return res.status(403).json({ ok: false, error: 'Solo se pueden eliminar vendedores' })
    }

    // Protege integridad: si el vendedor tiene ventas/movimientos asociados, MySQL rechaza por FK.
    await pool.query('DELETE FROM users WHERE id = ? LIMIT 1', [id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

module.exports = { list, create, update, remove, resetPassword, changeMyPassword }
