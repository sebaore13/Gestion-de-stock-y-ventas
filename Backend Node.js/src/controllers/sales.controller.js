const { getPool } = require('../database/db')
const { toInt, mysqlErrorMessage, normalizeSaleItems, isNonNegativeInt, formatLocalDatetime } = require('../utils')

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
  if (note && note.length > 255) {
    return res.status(400).json({ ok: false, error: 'nota demasiado larga (max 255)' })
  }

  const serviciosRaw = req.body?.servicios
  let servicios = []
  if (Array.isArray(serviciosRaw)) {
    for (const s of serviciosRaw) {
      const desc = String(s.descripcion || '').trim()
      const cant = Math.max(1, Math.trunc(Number(s.cantidad) || 1))
      const precio = Math.trunc(Number(s.precio) || 0)
      if (!desc) continue
      if (precio <= 0) continue
      servicios.push({ descripcion: desc, cantidad: cant, precio, monto: cant * precio })
    }
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const items = parsed.items
    const hasItems = items.length > 0

    let products = []
    let total = 0

    total += servicios.reduce((sum, s) => sum + s.monto, 0)

    if (hasItems) {
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

      const [rows] = await conn.query(
        `
        SELECT id, codigo, nombre, precio, stock
        FROM products
        WHERE id IN (${productIds.map(() => '?').join(',')}) AND activo = 1
        ORDER BY id ASC
        FOR UPDATE
        `,
        productIds,
      )

      if (rows.length !== productIds.length) {
        await conn.rollback()
        return res.status(400).json({ ok: false, error: 'Producto no encontrado o desactivado' })
      }

      const insufficient = []
      for (const p of rows) {
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

      for (const p of rows) {
        total += (qtyById.get(p.id) || 0) * p.precio
      }
      products = rows
    }

    total += otrosCargos
    const now = new Date()
    const fechaStr = formatLocalDatetime(now)

    const [saleResult] = await conn.query(
      'INSERT INTO sales (fecha, usuarioId, metodoPago, nota, otrosCargos, servicios, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [fechaStr, req.auth.userId, metodoPagoRaw, note || null, otrosCargos, JSON.stringify(servicios), total],
    )
    const saleId = saleResult.insertId

    const qtyById = new Map()
    for (const i of items) {
      qtyById.set(i.productoId, (qtyById.get(i.productoId) || 0) + i.cantidad)
    }

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

    await pool.query('INSERT INTO print_jobs (saleId) VALUES (?)', [saleId]).catch(() => {})

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
  const includeItems = String(req.query.includeItems || '').trim() === '1'
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
               s.metodoPago, s.nota, s.otrosCargos, s.servicios, s.total
       FROM sales s
       JOIN users u ON u.id = s.usuarioId
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY s.id DESC
       LIMIT ?`,
      [...params, limit],
    )

    const parseServicios = (s) => s.servicios
      ? (typeof s.servicios === 'string' ? JSON.parse(s.servicios) : s.servicios)
      : []

    if (!includeItems || !rows.length) {
      return res.json({ ok: true, sales: rows.map((s) => ({ ...s, servicios: parseServicios(s) })) })
    }

    const saleIds = rows.map((r) => r.id)
    const [itemRows] = await pool.query(
      `SELECT si.id, si.saleId, si.productoId,
              si.codigo_snapshot, si.nombre_snapshot, si.precio_snapshot, si.cantidad
       FROM sale_items si
       WHERE si.saleId IN (${saleIds.map(() => '?').join(',')})
       ORDER BY si.saleId DESC, si.id ASC`,
      saleIds,
    )

    const itemsBySaleId = new Map()
    for (const it of itemRows) {
      const k = Number(it.saleId)
      const arr = itemsBySaleId.get(k) || []
      arr.push(it)
      itemsBySaleId.set(k, arr)
    }

    res.json({
      ok: true,
      sales: rows.map((s) => ({
        ...s,
        servicios: parseServicios(s),
        items: itemsBySaleId.get(Number(s.id)) || [],
      })),
    })
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
               s.metodoPago, s.nota, s.otrosCargos, s.servicios, s.total
       FROM sales s
       JOIN users u ON u.id = s.usuarioId
       WHERE s.id = ?
       LIMIT 1`,
      [id],
    )
    if (!saleRows || saleRows.length === 0) return res.status(404).json({ ok: false, error: 'Venta no encontrada' })
    const sale = saleRows[0]
    sale.servicios = sale.servicios
      ? (typeof sale.servicios === 'string' ? JSON.parse(sale.servicios) : sale.servicios)
      : []

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

async function reprint(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const id = toInt(req.params.id)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, error: 'id invalido' })

  try {
    const [rows] = await pool.query('SELECT id FROM sales WHERE id = ? LIMIT 1', [id])
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Venta no encontrada' })

    await pool.query('INSERT INTO print_jobs (saleId, tipo) VALUES (?, ?)', [id, 'sale'])
    res.json({ ok: true, message: 'Enviada a impresion' })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

module.exports = { create, list, getById, reprint }
