const { getPool } = require('../database/db')
const { toInt, mysqlErrorMessage, isNonNegativeInt } = require('../utils')

const ALLOWED_CREATE_TIPOS = new Set(['INGRESO', 'AJUSTE'])

async function create(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })

  const tipo = String(req.body?.tipo || '').trim().toUpperCase()
  const productoId = req.body?.productoId !== undefined ? toInt(req.body.productoId) : null
  const codigo = String(req.body?.codigo || '').trim()
  const cantidad = toInt(req.body?.cantidad)
  const motivo = req.body?.motivo !== undefined ? String(req.body.motivo || '').trim() : null
  const notaRaw = req.body?.nota !== undefined ? req.body.nota : req.body?.notas
  const nota = notaRaw !== undefined ? String(notaRaw || '').trim() : null

  if (!ALLOWED_CREATE_TIPOS.has(tipo)) {
    return res.status(400).json({ ok: false, error: 'tipo invalido (solo INGRESO/AJUSTE)' })
  }
  if (!Number.isInteger(cantidad)) {
    return res.status(400).json({ ok: false, error: 'cantidad invalida' })
  }
  if (tipo === 'INGRESO') {
    if (!isNonNegativeInt(cantidad) || cantidad <= 0) {
      return res.status(400).json({ ok: false, error: 'cantidad invalida (INGRESO > 0)' })
    }
  } else {
    // AJUSTE: delta puede ser positivo o negativo, pero no 0.
    if (cantidad === 0) return res.status(400).json({ ok: false, error: 'cantidad invalida (AJUSTE != 0)' })
  }
  if (productoId === null && !codigo) {
    return res.status(400).json({ ok: false, error: 'productoId o codigo requerido' })
  }
  if (productoId !== null && (!Number.isInteger(productoId) || productoId <= 0)) {
    return res.status(400).json({ ok: false, error: 'productoId invalido' })
  }
  if (motivo && motivo.length > 120) return res.status(400).json({ ok: false, error: 'motivo demasiado largo' })
  if (nota && nota.length > 255) return res.status(400).json({ ok: false, error: 'nota demasiado larga' })

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    let pid = productoId
    if (!pid && codigo) {
      const [rows] = await conn.query('SELECT id FROM products WHERE codigo = ? LIMIT 1', [codigo])
      if (!rows || rows.length === 0) {
        await conn.rollback()
        return res.status(400).json({ ok: false, error: 'Producto no encontrado' })
      }
      pid = rows[0].id
    }

    const [products] = await conn.query(
      'SELECT id, stock FROM products WHERE id = ? LIMIT 1 FOR UPDATE',
      [pid],
    )
    if (!products || products.length === 0) {
      await conn.rollback()
      return res.status(400).json({ ok: false, error: 'Producto no encontrado' })
    }
    const currentStock = Number(products[0].stock) || 0
    const nextStock = currentStock + cantidad
    if (nextStock < 0) {
      await conn.rollback()
      return res.status(409).json({ ok: false, error: 'Stock insuficiente', stock: currentStock })
    }

    await conn.query('UPDATE products SET stock = ? WHERE id = ? LIMIT 1', [nextStock, pid])

    const fechaStr = new Date().toISOString().slice(0, 19).replace('T', ' ')
    let result
    try {
      ;([result] = await conn.query(
        'INSERT INTO movements (tipo, productoId, cantidad, fecha, usuarioId, motivo, nota) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [tipo, pid, cantidad, fechaStr, req.auth.userId, motivo || null, nota || null],
      ))
    } catch (err) {
      // Compat: algunas DBs usan columna `notas`.
      if (err?.code === 'ER_BAD_FIELD_ERROR') {
        ;([result] = await conn.query(
          'INSERT INTO movements (tipo, productoId, cantidad, fecha, usuarioId, motivo, notas) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [tipo, pid, cantidad, fechaStr, req.auth.userId, motivo || null, nota || null],
        ))
      } else {
        throw err
      }
    }

    await conn.commit()
    res.status(201).json({
      ok: true,
      movement: {
        id: result.insertId,
        tipo,
        productoId: pid,
        cantidad,
        fecha: fechaStr,
        usuarioId: req.auth.userId,
        motivo: motivo || null,
        nota: nota || null,
        stockAntes: currentStock,
        stockDespues: nextStock,
      },
    })
  } catch (err) {
    try { await conn.rollback() } catch { }
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  } finally {
    conn.release()
  }
}

async function list(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const isAdmin = req.auth?.rol === 'Administrador'
  const limit = Math.min(500, Math.max(1, toInt(req.query.limit) || 100))
  const from = String(req.query.from || '').trim()
  const to = String(req.query.to || '').trim()
  let usuarioId = isAdmin && req.query.usuarioId !== undefined ? toInt(req.query.usuarioId) : null
  const tipo = isAdmin ? String(req.query.tipo || '').trim().toUpperCase() : ''

  const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s)
  if (from && !isDateOnly(from)) return res.status(400).json({ ok: false, error: 'from invalido (YYYY-MM-DD)' })
  if (to && !isDateOnly(to)) return res.status(400).json({ ok: false, error: 'to invalido (YYYY-MM-DD)' })
  if (isAdmin && usuarioId !== null && (!Number.isInteger(usuarioId) || usuarioId <= 0)) {
    return res.status(400).json({ ok: false, error: 'usuarioId invalido' })
  }
  if (isAdmin && tipo && !['INGRESO', 'SALIDA', 'AJUSTE'].includes(tipo)) {
    return res.status(400).json({ ok: false, error: 'tipo invalido' })
  }

  if (!isAdmin) {
    // Vendedor: solo SALIDA generadas por sus ventas (se ignora cualquier filtro de usuarioId/tipo en query)
    usuarioId = req.auth.userId
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
    if (!isAdmin) {
      where.push('m.tipo = ?')
      params.push('SALIDA')
    } else if (tipo) {
      where.push('m.tipo = ?')
      params.push(tipo)
    }

    const baseSql =
      `FROM movements m
       JOIN users u ON u.id = m.usuarioId
       JOIN products p ON p.id = m.productoId
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY m.id DESC
       LIMIT ?`

    const sqlNota =
      `SELECT m.id, m.tipo, m.cantidad, m.fecha, m.usuarioId, u.nombre AS usuarioNombre, u.rol AS usuarioRol,
              m.productoId, p.codigo AS productoCodigo, p.nombre AS productoNombre,
              m.motivo, m.nota
       ${baseSql}`

    const sqlNotas =
      `SELECT m.id, m.tipo, m.cantidad, m.fecha, m.usuarioId, u.nombre AS usuarioNombre, u.rol AS usuarioRol,
              m.productoId, p.codigo AS productoCodigo, p.nombre AS productoNombre,
              m.motivo, m.notas AS nota
       ${baseSql}`

    const sqlNoNotes =
      `SELECT m.id, m.tipo, m.cantidad, m.fecha, m.usuarioId, u.nombre AS usuarioNombre, u.rol AS usuarioRol,
              m.productoId, p.codigo AS productoCodigo, p.nombre AS productoNombre,
              NULL AS motivo, NULL AS nota
       ${baseSql}`

    try {
      const [rows] = await pool.query(sqlNota, [...params, limit])
      res.json({ ok: true, movements: rows })
    } catch (err) {
      if (err?.code === 'ER_BAD_FIELD_ERROR') {
        try {
          const [rows] = await pool.query(sqlNotas, [...params, limit])
          res.json({ ok: true, movements: rows })
          return
        } catch (err2) {
          if (err2?.code === 'ER_BAD_FIELD_ERROR') {
            const [rows] = await pool.query(sqlNoNotes, [...params, limit])
            res.json({ ok: true, movements: rows })
            return
          }
          throw err2
        }
      }
      throw err
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

module.exports = { list, create }
