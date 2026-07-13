const { Router } = require('express')
const { getPool } = require('../database/db')
const { toInt } = require('../utils')
const config = require('../config')

const router = Router()

function requireAgentKey(req, res, next) {
  const key = req.headers['x-agent-key']
  if (!key || key !== config.agentKey) {
    return res.status(401).json({ ok: false, error: 'Agente no autorizado' })
  }
  next()
}

// GET /print-jobs/next  — devuelve el próximo trabajo pendiente con datos completos
router.get('/print-jobs/next', requireAgentKey, async (req, res) => {
  const pool = getPool()
  if (!pool) return res.status(500).json({ ok: false, error: 'DB no configurada' })

  try {
    const [jobs] = await pool.query(
      `SELECT id, saleId, tipo, quotationId, origen FROM print_jobs WHERE estado = 'pending' ORDER BY id ASC LIMIT 1`,
    )
    if (!jobs.length) return res.status(204).end()

    const job = jobs[0]

    if (job.tipo === 'quotation') {
      const [qRows] = await pool.query(
        `SELECT id, fecha, nota, otros_costos, servicios, total FROM quotations WHERE id = ?`,
        [job.quotationId],
      )
      if (!qRows.length) {
        await pool.query("UPDATE print_jobs SET estado = 'failed', error = 'Cotizacion no encontrada' WHERE id = ?", [job.id])
        return res.status(404).json({ ok: false, error: 'Cotizacion no encontrada' })
      }

      const q = qRows[0]
      q.otros_costos = q.otros_costos
        ? (typeof q.otros_costos === 'string' ? JSON.parse(q.otros_costos) : q.otros_costos)
        : []
      q.servicios = q.servicios
        ? (typeof q.servicios === 'string' ? JSON.parse(q.servicios) : q.servicios)
        : []

      const [items] = await pool.query(
        `SELECT nombre_snapshot, codigo_snapshot, precio_snapshot, cantidad
         FROM quotation_items WHERE quotationId = ? ORDER BY id ASC`,
        [job.quotationId],
      )
      q.items = items

      return res.json({
        ok: true,
        jobId: job.id,
        tipo: 'quotation',
        data: q,
      })
    }

    // tipo: 'sale'
    const [sales] = await pool.query(
      `SELECT s.id, s.fecha, s.metodoPago, s.nota, s.otrosCargos, s.servicios, s.montoRecibido, s.descuento, s.tipoDescuento, s.descuentoMonto, s.total,
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
    sale.servicios = sale.servicios
      ? (typeof sale.servicios === 'string' ? JSON.parse(sale.servicios) : sale.servicios)
      : []

    const [items] = await pool.query(
      `SELECT nombre_snapshot AS nombre, codigo_snapshot AS codigo, precio_snapshot AS precio, cantidad
       FROM sale_items WHERE saleId = ? ORDER BY id ASC`,
      [job.saleId],
    )

    res.json({
      ok: true,
      jobId: job.id,
      tipo: 'sale',
      data: {
        id: sale.id,
        fecha: sale.fecha,
        metodoPago: sale.metodoPago,
        nota: sale.nota,
        otrosCargos: sale.otrosCargos,
        servicios: sale.servicios,
        montoRecibido: sale.montoRecibido,
        descuento: sale.descuento,
        tipoDescuento: sale.tipoDescuento,
        descuentoMonto: sale.descuentoMonto,
        total: sale.total,
        usuarioNombre: sale.usuarioNombre,
        origen: job.origen,
        items,
      },
    })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// POST /print-jobs/:id/ack  — confirma que el trabajo se imprimió o falló
router.post('/print-jobs/:id/ack', requireAgentKey, async (req, res) => {
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
