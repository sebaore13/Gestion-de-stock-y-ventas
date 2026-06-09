const { Router } = require('express')
const { getPool } = require('../database/db')
const { toInt } = require('../utils')

const router = Router()

// GET /print-jobs/next  — devuelve el próximo trabajo pendiente con datos completos de la venta
router.get('/print-jobs/next', async (req, res) => {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })

  try {
    const [jobs] = await pool.query(
      `SELECT id, saleId FROM print_jobs WHERE estado = 'pending' ORDER BY id ASC LIMIT 1`,
    )
    if (!jobs.length) return res.status(204).end()

    const job = jobs[0]

    const [sales] = await pool.query(
      `SELECT s.id, s.fecha, s.metodoPago, s.nota, s.otrosCargos, s.total,
              u.nombre AS usuarioNombre
       FROM sales s
       JOIN users u ON u.id = s.usuarioId
       WHERE s.id = ?`,
      [job.saleId],
    )
    if (!sales.length) {
      await pool.query("UPDATE print_jobs SET estado = 'failed', error = 'Venta no encontrada' WHERE id = ?", [job.id])
      return res.status(404).json({ ok: false, error: 'Venta no encontrada' })
    }

    const sale = sales[0]

    const [items] = await pool.query(
      `SELECT nombre_snapshot AS nombre, codigo_snapshot AS codigo, precio_snapshot AS precio, cantidad
       FROM sale_items WHERE saleId = ? ORDER BY id ASC`,
      [job.saleId],
    )

    res.json({
      ok: true,
      jobId: job.id,
      sale: {
        id: sale.id,
        fecha: sale.fecha,
        metodoPago: sale.metodoPago,
        nota: sale.nota,
        otrosCargos: sale.otrosCargos,
        total: sale.total,
        usuarioNombre: sale.usuarioNombre,
        items,
      },
    })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// POST /print-jobs/:id/ack  — confirma que el trabajo se imprimió o falló
router.post('/print-jobs/:id/ack', async (req, res) => {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })

  const id = toInt(req.params.id)
  if (!id) return res.status(400).json({ ok: false, error: 'id invalido' })

  const estado = req.body?.estado === 'printed' ? 'printed' : 'failed'
  const error = estado === 'failed' ? String(req.body?.error || '').slice(0, 255) : null
  const now = new Date()

  try {
    await pool.query(
      estado === 'printed'
        ? "UPDATE print_jobs SET estado = 'printed', printedAt = ? WHERE id = ?"
        : "UPDATE print_jobs SET estado = 'failed', error = ?, printedAt = ? WHERE id = ?",
      estado === 'printed' ? [now, id] : [error, now, id],
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

module.exports = router
