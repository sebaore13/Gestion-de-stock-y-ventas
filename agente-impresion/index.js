require('dotenv').config()

const { getPool, close } = require('./db')
const { buildTicket, printBuffer } = require('./printer')

const POLL_INTERVAL = (Number(process.env.POLL_INTERVAL) || 2) * 1000
const PRINTER_NAME = process.env.PRINTER_NAME || 'POS-80'

let running = true

async function poll() {
  const pool = await getPool()

  try {
    const [jobs] = await pool.query(
      `SELECT id, saleId FROM print_jobs WHERE estado = 'pending' ORDER BY id ASC LIMIT 1`,
    )

    if (!jobs.length) return

    const job = jobs[0]
    console.log(`[${new Date().toLocaleTimeString()}] Job #${job.id}: imprimiendo venta #${job.saleId}...`)

    // Obtener datos de la venta
    const [sales] = await pool.query(
      `SELECT id, fecha, metodoPago, nota, otrosCargos, total
       FROM sales WHERE id = ?`,
      [job.saleId],
    )

    if (!sales.length) {
      await pool.query("UPDATE print_jobs SET estado = 'failed', error = 'Venta no encontrada' WHERE id = ?", [job.id])
      console.log(`  -> Venta #${job.saleId} no encontrada, marcando como failed`)
      return
    }

    const sale = sales[0]

    // Obtener items
    const [items] = await pool.query(
      `SELECT nombre_snapshot AS nombre, codigo_snapshot AS codigo, precio_snapshot AS precio, cantidad
       FROM sale_items WHERE saleId = ? ORDER BY id ASC`,
      [job.saleId],
    )

    sale.items = items

    // Generar e imprimir ticket
    const buffer = buildTicket(sale)
    await printBuffer(buffer, PRINTER_NAME)

    // Marcar como impreso
    await pool.query("UPDATE print_jobs SET estado = 'printed', printedAt = NOW() WHERE id = ?", [job.id])
    console.log(`  -> Venta #${job.saleId} impresa correctamente`)

  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] Error:`, err.message)
    // Incrementar intentos y marcar como failed si supera el limite
    await pool.query(
      `UPDATE print_jobs SET intentos = intentos + 1,
       estado = CASE WHEN intentos >= 2 THEN 'failed' ELSE estado END,
       error = CASE WHEN intentos >= 2 THEN ? ELSE NULL END
       WHERE id = ?`,
      [err.message.slice(0, 255), job?.id || 0],
    )
  }
}

async function shutdown() {
  console.log('\nDeteniendo agente...')
  running = false
  await close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

console.log('=== Agente de impresion PitstopPRO ===')
console.log(`Impresora: ${PRINTER_NAME}`)
console.log(`Polling cada: ${POLL_INTERVAL / 1000}s`)
console.log('Presiona Ctrl+C para detener.')
console.log('')

async function main() {
  const pool = await getPool()
  // Test de conexión
  try {
    await pool.query('SELECT 1')
    console.log('Conexion a BD: OK')
  } catch (err) {
    console.error('Error de conexion a BD:', err.message)
    console.error('Verifica las credenciales en .env')
    process.exit(1)
  }
  console.log('Esperando trabajos de impresion...')
  console.log('')

  while (running) {
    await poll()
    await new Promise((r) => setTimeout(r, POLL_INTERVAL))
  }
}

main()
