const { getPool } = require('../database/db')
const { mysqlErrorMessage } = require('../utils')

async function list(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM categories ORDER BY nombre ASC')
    res.json({ ok: true, categories: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

async function create(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const { nombre } = req.body
  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ ok: false, error: 'Nombre requerido' })
  }
  try {
    const name = String(nombre).trim()
    const [existing] = await pool.query('SELECT id FROM categories WHERE nombre = ?', [name])
    if (existing.length > 0) {
      return res.status(409).json({ ok: false, error: 'Ya existe una categoria con ese nombre' })
    }
    const [result] = await pool.query('INSERT INTO categories (nombre) VALUES (?)', [name])
    res.status(201).json({ ok: true, id: result.insertId, nombre: name })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

async function update(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const { id } = req.params
  const { nombre } = req.body
  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ ok: false, error: 'Nombre requerido' })
  }
  try {
    const name = String(nombre).trim()
    const [existing] = await pool.query('SELECT id FROM categories WHERE nombre = ? AND id != ?', [name, id])
    if (existing.length > 0) {
      return res.status(409).json({ ok: false, error: 'Ya existe otra categoria con ese nombre' })
    }
    const [result] = await pool.query('UPDATE categories SET nombre = ? WHERE id = ?', [name, id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: 'Categoria no encontrada' })
    }
    res.json({ ok: true, id: Number(id), nombre: name })
  } catch (err) {
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

async function remove(req, res) {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })
  const { id } = req.params
  try {
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: 'Categoria no encontrada' })
    }
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ ok: false, error: 'No se puede eliminar: hay productos asociados a esta categoria' })
    }
    res.status(500).json({ ok: false, error: mysqlErrorMessage(err) })
  }
}

module.exports = { list, create, update, remove }
