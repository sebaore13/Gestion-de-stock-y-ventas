const { getPool } = require('../database/db')
const { toInt, mysqlErrorMessage, normalizeSaleItems, isNonNegativeInt } = require('../utils')

const ALLOWED_METODOS_PAGO = new Set(['EFECTIVO', 'TARJETA', 'FACTURA'])

async function create(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const note = String(req.body?.nota || '').trim()
  const metodoPagoRaw = String(req.body?.metodoPago || 'EFECTIVO').trim().toUpperCase()
  const otrosCargos = toInt(req.body?.otrosCargos) ?? 0
  const parsed = normalizeSaleItems(req.body?.items)
  if (!parsed.ok) return res.status(400).json({ ok: false, error: parsed.error })
  if (!ALLOWED_METODOS_PAGO.has(metodoPagoRaw)) {
    return res.status(400).json({ ok: false, error: 'metodoPago invalido' })
  }
  if (!isNonNegativeInt(otrosCargos)) {
    return res.status(400).json({ ok: false, error: 'otrosCargos invalido' })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const items = parsed.items
    const needCodigos = items.filter((i) => !i.productoId && i.codigo).map((i) => i.codigo)
    let codigoToId = new Map()
    if (needCodigos.length) {
      const [rows] = await conn.query(
        `SELECT id, codigo FROM products WHERE codigo IN (${needCodigos.map(() => '?').join(',')})`,
        needCodigos,
      )
      codigoToId = new Map(rows.map((r) => [r.codigo, r.id]))
    }

    const resolved = items.map((i) => {
      const id = i.productoId || (i.codigo ? codigoToId.get(i.codigo) : null)
      return { ...i, productoId: id || null }
    })

    const missing = resolved.filter((i) => !i.productoId)
    if (missing.length) {
      await conn.rollback()
      return res.status(400).json({
        ok: false,
        error: 'Producto no encontrado',
        missing: missing.map((m) => ({ codigo: m.codigo, productoId: m.productoId })),
      })
    }

    const qtyById = new Map()
    for (const i of resolved) {
      qtyById.set(i.productoId, (qtyById.get(i.productoId) || 0) + i.cantidad)
    }
    const productIds = Array.from(qtyById.keys()).sort((a, b) => a - b)

    const [products] = await conn.query(
      `
      SELECT id, codigo, nombre, precio, stock
      FROM products
      WHERE id IN (${productIds.map(() => '?').join(',')})
      ORDER BY id ASC
      FOR UPDATE
      `,
      productIds,
    )

    if (products.length !== productIds.length) {
      await conn.rollback()
      return res.status(400).json({ ok: false, error: 'Producto no encontrado' })
    }

    const insufficient = []
    for (const p of products) {
      const want = qtyById.get(p.id) || 0
      if (p.stock < want) {
        insufficient.push({
          productoId: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          disponible: p.stock,
          solicitado: want,
        })
      }
    }
    if (insufficient.length) {
      await conn.rollback()
      return res.status(409).json({
        ok: false,
        error: 'Stock insuficiente',
        details: insufficient,
      })
    }

    const now = new Date()
    const fechaStr = now.toISOString().slice(0, 19).replace('T', ' ')

    let total = 0
    for (const p of products) {
      total += (qtyById.get(p.id) || 0) * p.precio
    }
    total += otrosCargos

    const [saleResult] = await conn.query(
      'INSERT INTO sales (fecha, usuarioId, metodoPago, nota, otrosCargos, total) VALUES (?, ?, ?, ?, ?, ?)',
      [fechaStr, req.auth.userId, metodoPagoRaw, note || null, otrosCargos, total],
    )
    const saleId = saleResult.insertId

    for (const p of products) {
      const want = qtyById.get(p.id) || 0
      if (!want) continue
      await conn.query(
        'INSERT INTO sale_items (saleId, productoId, codigo_snapshot, nombre_snapshot, precio_snapshot, cantidad) VALUES (?, ?, ?, ?, ?, ?)',
        [saleId, p.id, p.codigo, p.nombre, p.precio, want],
      )
    }

    for (const p of products) {
      const want = qtyById.get(p.id) || 0
      if (!want) continue
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [want, p.id])
    }

    for (const p of products) {
      const want = qtyById.get(p.id) || 0
      if (!want) continue
      await conn.query(
        'INSERT INTO movements (tipo, productoId, cantidad, fecha, usuarioId) VALUES (?, ?, ?, ?, ?)',
        ['SALIDA', p.id, want, fechaStr, req.auth.userId],
      )
    }

    await conn.commit()
    res.status(201).json({
      ok: true,
      sale: {
        id: saleId,
        fecha: fechaStr,
        metodoPago: metodoPagoRaw,
        otrosCargos,
        total,
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
  const limit = Math.min(200, Math.max(1, toInt(req.query.limit) || 50))
  const from = String(req.query.from || '').trim()
  const to = String(req.query.to || '').trim()
  let usuarioId = isAdmin && req.query.usuarioId !== undefined ? toInt(req.query.usuarioId) : null

  const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s)
  if (from && !isDateOnly(from)) return res.status(400).json({ ok: false, error: 'from invalido (YYYY-MM-DD)' })
  if (to && !isDateOnly(to)) return res.status(400).json({ ok: false, error: 'to invalido (YYYY-MM-DD)' })
  if (isAdmin && usuarioId !== null && (!Number.isInteger(usuarioId) || usuarioId <= 0)) {
    return res.status(400).json({ ok: false, error: 'usuarioId invalido' })
  }

  if (!isAdmin) {
    // Vendedor: siempre se forza el propio usuarioId (se ignora cualquier usuarioId en query)
    usuarioId = req.auth.userId
  }
  try {
    const where = []
    const params = []
    if (from) {
      where.push('DATE(s.fecha) >= ?')
      params.push(from)
    }
    if (to) {
      where.push('DATE(s.fecha) <= ?')
      params.push(to)
    }
    if (usuarioId) {
      where.push('s.usuarioId = ?')
      params.push(usuarioId)
    }

    const [rows] = await pool.query(
      `SELECT s.id, s.fecha, s.usuarioId, u.nombre AS usuarioNombre, u.rol AS usuarioRol,
              s.metodoPago, s.nota, s.otrosCargos, s.total
       FROM sales s
       JOIN users u ON u.id = s.usuarioId
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY s.id DESC
       LIMIT ?`,
      [...params, limit],
    )
    res.json({ ok: true, sales: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

async function getById(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const isAdmin = req.auth?.rol === 'Administrador'
  const id = toInt(req.params.id)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, error: 'id invalido' })

  try {
    const [saleRows] = await pool.query(
      `SELECT s.id, s.fecha, s.usuarioId, u.nombre AS usuarioNombre, u.rol AS usuarioRol,
              s.metodoPago, s.nota, s.otrosCargos, s.total
       FROM sales s
       JOIN users u ON u.id = s.usuarioId
       WHERE s.id = ?
       LIMIT 1`,
      [id],
    )
    if (!saleRows || saleRows.length === 0) return res.status(404).json({ ok: false, error: 'Venta no encontrada' })
    const sale = saleRows[0]

    if (!isAdmin && Number(sale.usuarioId) !== Number(req.auth.userId)) {
      return res.status(403).json({ ok: false, error: 'Prohibido' })
    }

    const [itemRows] = await pool.query(
      `SELECT id, saleId, productoId, codigo_snapshot, nombre_snapshot, precio_snapshot, cantidad
       FROM sale_items
       WHERE saleId = ?
       ORDER BY id ASC`,
      [id],
    )

    res.json({ ok: true, sale, items: itemRows })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

module.exports = { create, list, getById }
