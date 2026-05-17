const { getPool } = require('../database/db')
const { toInt, isNonNegativeInt, mysqlErrorMessage } = require('../utils')

async function list(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const q = String(req.query.query || '').trim()
  const categoriaId = String(req.query.categoriaId || '').trim()
  try {
    const where = []
    const params = []

    if (q) {
      where.push('(p.codigo LIKE ? OR p.nombre LIKE ?)')
      params.push(`%${q}%`, `%${q}%`)
    }
    if (categoriaId) {
      where.push('p.categoriaId = ?')
      params.push(Number(categoriaId))
    }

    const sql = `
      SELECT p.id, p.codigo, p.nombre, p.categoriaId, c.nombre AS categoria,
             p.precio, p.stock, p.minimo, p.fechaIngreso
      FROM products p
      JOIN categories c ON c.id = p.categoriaId
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY p.id DESC
      LIMIT 500
    `
    const [rows] = await pool.query(sql, params)
    res.json({ ok: true, products: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

async function getByCodigo(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const codigo = String(req.params.codigo || '').trim()
  if (!codigo) return res.status(400).json({ ok: false, error: 'Codigo requerido' })
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.codigo, p.nombre, p.categoriaId, c.nombre AS categoria,
              p.precio, p.stock, p.minimo, p.fechaIngreso
       FROM products p
       JOIN categories c ON c.id = p.categoriaId
       WHERE p.codigo = ?
       LIMIT 1`,
      [codigo],
    )
    if (!rows || rows.length === 0) return res.status(404).json({ ok: false, error: 'Producto no encontrado' })
    res.json({ ok: true, product: rows[0] })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

async function create(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })

  const codigo = String(req.body?.codigo || '').trim()
  const nombre = String(req.body?.nombre || '').trim()
  const categoriaId = toInt(req.body?.categoriaId)
  const precio = toInt(req.body?.precio)
  const stock = toInt(req.body?.stock)
  const minimo = toInt(req.body?.minimo)
  const fechaIngreso = req.body?.fechaIngreso ? new Date(req.body.fechaIngreso) : null

  if (!codigo || !nombre) {
    return res.status(400).json({ ok: false, error: 'codigo y nombre son requeridos' })
  }
  if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
    return res.status(400).json({ ok: false, error: 'categoriaId invalido' })
  }
  if (!isNonNegativeInt(precio ?? 0) || !isNonNegativeInt(stock ?? 0) || !isNonNegativeInt(minimo ?? 0)) {
    return res.status(400).json({ ok: false, error: 'precio/stock/minimo invalidos' })
  }
  if (fechaIngreso && Number.isNaN(fechaIngreso.getTime())) {
    return res.status(400).json({ ok: false, error: 'fechaIngreso invalida' })
  }

  try {
    const [cats] = await pool.query('SELECT id FROM categories WHERE id = ? LIMIT 1', [categoriaId])
    if (!cats || cats.length === 0) {
      return res.status(400).json({ ok: false, error: 'categoria no existe' })
    }

    const [result] = await pool.query(
      'INSERT INTO products (codigo, nombre, categoriaId, precio, stock, minimo, fechaIngreso) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        codigo,
        nombre,
        categoriaId,
        precio ?? 0,
        stock ?? 0,
        minimo ?? 0,
        fechaIngreso ? fechaIngreso.toISOString().slice(0, 19).replace('T', ' ') : null,
      ],
    )

    const [rows] = await pool.query(
      `SELECT p.id, p.codigo, p.nombre, p.categoriaId, c.nombre AS categoria,
              p.precio, p.stock, p.minimo, p.fechaIngreso
       FROM products p
       JOIN categories c ON c.id = p.categoriaId
       WHERE p.id = ?
       LIMIT 1`,
      [result.insertId],
    )
    res.status(201).json({ ok: true, product: rows[0] })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

async function update(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const id = toInt(req.params.id)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, error: 'id invalido' })

  const patch = {}
  if (req.body?.codigo !== undefined) patch.codigo = String(req.body.codigo || '').trim()
  if (req.body?.nombre !== undefined) patch.nombre = String(req.body.nombre || '').trim()
  if (req.body?.categoriaId !== undefined) patch.categoriaId = toInt(req.body.categoriaId)
  if (req.body?.precio !== undefined) patch.precio = toInt(req.body.precio)
  if (req.body?.stock !== undefined) patch.stock = toInt(req.body.stock)
  if (req.body?.minimo !== undefined) patch.minimo = toInt(req.body.minimo)
  if (req.body?.fechaIngreso !== undefined) {
    patch.fechaIngreso = req.body.fechaIngreso ? new Date(req.body.fechaIngreso) : null
  }

  if (patch.codigo !== undefined && !patch.codigo) {
    return res.status(400).json({ ok: false, error: 'codigo invalido' })
  }
  if (patch.nombre !== undefined && !patch.nombre) {
    return res.status(400).json({ ok: false, error: 'nombre invalido' })
  }
  if (patch.categoriaId !== undefined && (!Number.isInteger(patch.categoriaId) || patch.categoriaId <= 0)) {
    return res.status(400).json({ ok: false, error: 'categoriaId invalido' })
  }
  for (const f of ['precio', 'stock', 'minimo']) {
    if (patch[f] !== undefined && !isNonNegativeInt(patch[f])) {
      return res.status(400).json({ ok: false, error: `${f} invalido` })
    }
  }
  if (patch.fechaIngreso instanceof Date && Number.isNaN(patch.fechaIngreso.getTime())) {
    return res.status(400).json({ ok: false, error: 'fechaIngreso invalida' })
  }

  try {
    const [existingRows] = await pool.query('SELECT id FROM products WHERE id = ? LIMIT 1', [id])
    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Producto no encontrado' })
    }
    if (patch.categoriaId !== undefined) {
      const [cats] = await pool.query('SELECT id FROM categories WHERE id = ? LIMIT 1', [patch.categoriaId])
      if (!cats || cats.length === 0) {
        return res.status(400).json({ ok: false, error: 'categoria no existe' })
      }
    }

    const fields = []
    const params = []
    for (const key of ['codigo', 'nombre', 'categoriaId', 'precio', 'stock', 'minimo']) {
      if (patch[key] === undefined) continue
      fields.push(`${key} = ?`)
      params.push(patch[key])
    }
    if (patch.fechaIngreso !== undefined) {
      fields.push('fechaIngreso = ?')
      params.push(
        patch.fechaIngreso
          ? patch.fechaIngreso.toISOString().slice(0, 19).replace('T', ' ')
          : null,
      )
    }

    if (fields.length === 0) return res.json({ ok: true })

    params.push(id)
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params)

    const [rows] = await pool.query(
      `SELECT p.id, p.codigo, p.nombre, p.categoriaId, c.nombre AS categoria,
              p.precio, p.stock, p.minimo, p.fechaIngreso
       FROM products p
       JOIN categories c ON c.id = p.categoriaId
       WHERE p.id = ?
       LIMIT 1`,
      [id],
    )
    res.json({ ok: true, product: rows[0] })
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
    const [result] = await pool.query('DELETE FROM products WHERE id = ? LIMIT 1', [id])
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Producto no encontrado' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

module.exports = { list, getByCodigo, create, update, remove }
