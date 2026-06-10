const { getPool } = require('../database/db')
const { toInt, mysqlErrorMessage, normalizeSaleItems, formatLocalDatetime } = require('../utils')

function normalizeTextoItems(raw, label) {
  if (!Array.isArray(raw)) return { ok: true, items: [] }
  const items = []
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i]
    const descripcion = String(r?.descripcion || '').trim()
    const monto = toInt(r?.monto)
    if (!descripcion || descripcion.length > 255) {
      return { ok: false, error: `${label}[${i}]: descripcion invalida (max 255)` }
    }
    if (!Number.isInteger(monto) || monto <= 0) {
      return { ok: false, error: `${label}[${i}]: monto invalido` }
    }
    items.push({ descripcion, monto })
  }
  return { ok: true, items }
}

function parseJsonField(val) {
  if (!val) return []
  return typeof val === 'string' ? JSON.parse(val) : val
}

async function create(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const note = String(req.body?.nota || '').trim()
  const parsed = normalizeSaleItems(req.body?.items)
  if (!parsed.ok) return res.status(400).json({ ok: false, error: parsed.error })
  if (note && note.length > 255) {
    return res.status(400).json({ ok: false, error: 'nota demasiado larga (max 255)' })
  }
  const serviciosParsed = normalizeTextoItems(req.body?.servicios, 'servicios')
  if (!serviciosParsed.ok) return res.status(400).json({ ok: false, error: serviciosParsed.error })
  const otrosParsed = normalizeTextoItems(req.body?.otrosCostos, 'otrosCostos')
  if (!otrosParsed.ok) return res.status(400).json({ ok: false, error: otrosParsed.error })

  let conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const items = parsed.items
    const hasItems = items.length > 0
    let subtotalProductos = 0
    let subtotalServicios = 0
    let subtotalOtrosCostos = 0

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
        `SELECT id, codigo, nombre, precio, stock
         FROM products
         WHERE id IN (${productIds.map(() => '?').join(',')}) AND activo = 1
         ORDER BY id ASC`,
        productIds,
      )

      if (rows.length !== productIds.length) {
        await conn.rollback()
        return res.status(400).json({ ok: false, error: 'Producto no encontrado o desactivado' })
      }

      for (const p of rows) {
        subtotalProductos += (qtyById.get(p.id) || 0) * p.precio
      }
    }

    const servicios = serviciosParsed.items
    for (const s of servicios) {
      subtotalServicios += s.monto
    }

    const otros = otrosParsed.items
    for (const o of otros) {
      subtotalOtrosCostos += o.monto
    }

    const total = subtotalProductos + subtotalServicios + subtotalOtrosCostos
    const otrosJson = otros.length ? JSON.stringify(otros) : null
    const serviciosJson = servicios.length ? JSON.stringify(servicios) : null

    const now = new Date()
    const fechaStr = formatLocalDatetime(now)

    const [qResult] = await conn.query(
      'INSERT INTO quotations (fecha, usuarioId, nota, otros_costos, servicios, total) VALUES (?, ?, ?, ?, ?, ?)',
      [fechaStr, req.auth.userId, note || null, otrosJson, serviciosJson, total],
    )
    const quotationId = qResult.insertId

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

      const qtyById = new Map()
      for (const i of resolved) {
        qtyById.set(i.productoId, (qtyById.get(i.productoId) || 0) + i.cantidad)
      }
      const productIds = Array.from(qtyById.keys()).sort((a, b) => a - b)

      const [rows] = await conn.query(
        `SELECT id, codigo, nombre, precio FROM products
         WHERE id IN (${productIds.map(() => '?').join(',')}) AND activo = 1
         ORDER BY id ASC`,
        productIds,
      )

      for (const p of rows) {
        const want = qtyById.get(p.id) || 0
        if (!want) continue
        await conn.query(
          'INSERT INTO quotation_items (quotationId, productoId, codigo_snapshot, nombre_snapshot, precio_snapshot, cantidad) VALUES (?, ?, ?, ?, ?, ?)',
          [quotationId, p.id, p.codigo, p.nombre, p.precio, want],
        )
      }
    }

    await conn.commit()
    conn.release()
    conn = null

    pool.query('INSERT INTO print_jobs (saleId, tipo, quotationId) VALUES (NULL, ?, ?)', ['quotation', quotationId]).catch(() => {})

    res.status(201).json({
      ok: true,
      quotation: {
        id: quotationId,
        fecha: fechaStr,
        total,
        subtotalProductos,
        subtotalServicios,
        subtotalOtrosCostos,
      },
    })
  } catch (err) {
    try { if (conn) await conn.rollback() } catch {}
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  } finally {
    if (conn) conn.release()
  }
}

async function list(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const isAdmin = req.auth?.rol === 'Administrador'
  const limit = Math.min(200, Math.max(1, toInt(req.query.limit) || 50))
  const from = String(req.query.from || '').trim()
  const to = String(req.query.to || '').trim()
  const estado = String(req.query.estado || '').trim()
  const includeItems = String(req.query.includeItems || '').trim() === '1'
  let usuarioId = isAdmin && req.query.usuarioId !== undefined ? toInt(req.query.usuarioId) : null

  const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s)
  if (from && !isDateOnly(from)) return res.status(400).json({ ok: false, error: 'from invalido (YYYY-MM-DD)' })
  if (to && !isDateOnly(to)) return res.status(400).json({ ok: false, error: 'to invalido (YYYY-MM-DD)' })

  if (!isAdmin) {
    usuarioId = req.auth.userId
  }

  try {
    const where = []
    const params = []
    if (from) {
      where.push('DATE(q.fecha) >= ?')
      params.push(from)
    }
    if (to) {
      where.push('DATE(q.fecha) <= ?')
      params.push(to)
    }
    if (usuarioId) {
      where.push('q.usuarioId = ?')
      params.push(usuarioId)
    }
    if (estado) {
      where.push('q.estado = ?')
      params.push(estado)
    }

    const [rows] = await pool.query(
      `SELECT q.id, q.fecha, q.usuarioId, u.nombre AS usuarioNombre,
              q.estado, q.nota, q.otros_costos, q.servicios, q.total
       FROM quotations q
       JOIN users u ON u.id = q.usuarioId
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY q.id DESC
       LIMIT ?`,
      [...params, limit],
    )

    function parseRows(raw) {
      return raw.map((r) => ({
        ...r,
        otros_costos: parseJsonField(r.otros_costos),
        servicios: parseJsonField(r.servicios),
      }))
    }

    if (!includeItems || !rows.length) {
      return res.json({ ok: true, quotations: parseRows(rows) })
    }

    const qIds = rows.map((r) => r.id)
    const [itemRows] = await pool.query(
      `SELECT qi.id, qi.quotationId, qi.productoId,
              qi.codigo_snapshot, qi.nombre_snapshot, qi.precio_snapshot, qi.cantidad
       FROM quotation_items qi
       WHERE qi.quotationId IN (${qIds.map(() => '?').join(',')})
       ORDER BY qi.quotationId DESC, qi.id ASC`,
      qIds,
    )

    const itemsByQId = new Map()
    for (const it of itemRows) {
      const k = Number(it.quotationId)
      const arr = itemsByQId.get(k) || []
      arr.push(it)
      itemsByQId.set(k, arr)
    }

    res.json({
      ok: true,
      quotations: parseRows(rows).map((q) => ({
        ...q,
        items: itemsByQId.get(Number(q.id)) || [],
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
    const [qRows] = await pool.query(
      `SELECT q.id, q.fecha, q.usuarioId, u.nombre AS usuarioNombre,
              q.estado, q.nota, q.otros_costos, q.servicios, q.total
       FROM quotations q
       JOIN users u ON u.id = q.usuarioId
       WHERE q.id = ?
       LIMIT 1`,
      [id],
    )
    if (!qRows || qRows.length === 0) return res.status(404).json({ ok: false, error: 'Cotizacion no encontrada' })
    const quotation = qRows[0]

    if (!isAdmin && Number(quotation.usuarioId) !== Number(req.auth.userId)) {
      return res.status(403).json({ ok: false, error: 'Prohibido' })
    }

    quotation.otros_costos = parseJsonField(quotation.otros_costos)
    quotation.servicios = parseJsonField(quotation.servicios)

    const [itemRows] = await pool.query(
      `SELECT id, quotationId, productoId, codigo_snapshot, nombre_snapshot, precio_snapshot, cantidad
       FROM quotation_items
       WHERE quotationId = ?
       ORDER BY id ASC`,
      [id],
    )

    res.json({ ok: true, quotation, items: itemRows })
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
    const [rows] = await pool.query('SELECT id FROM quotations WHERE id = ? LIMIT 1', [id])
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Cotizacion no encontrada' })

    await pool.query('INSERT INTO print_jobs (saleId, tipo, quotationId) VALUES (NULL, ?, ?)', ['quotation', id])
    res.json({ ok: true, message: 'Enviada a impresion' })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

module.exports = { create, list, getById, reprint }
