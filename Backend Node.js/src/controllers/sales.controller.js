const { getPool } = require('../database/db')
const { toInt, mysqlErrorMessage, normalizeSaleItems } = require('../utils')

async function create(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const note = String(req.body?.nota || '').trim()
  const parsed = normalizeSaleItems(req.body?.items)
  if (!parsed.ok) return res.status(400).json({ ok: false, error: parsed.error })

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

    const [saleResult] = await conn.query(
      'INSERT INTO sales (fecha, usuarioId, nota, total) VALUES (?, ?, ?, ?)',
      [fechaStr, req.auth.userId, note || null, total],
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
    res.status(201).json({ ok: true, sale: { id: saleId, fecha: fechaStr, total } })
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
  const limit = Math.min(200, Math.max(1, toInt(req.query.limit) || 50))
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.fecha, s.usuarioId, u.nombre AS usuarioNombre, u.rol AS usuarioRol, s.nota, s.total
       FROM sales s
       JOIN users u ON u.id = s.usuarioId
       ORDER BY s.id DESC
       LIMIT ?`,
      [limit],
    )
    res.json({ ok: true, sales: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

module.exports = { create, list }
