require('dotenv').config()
const { buildTicket, buildQuotation, printBuffer } = require('./printer')

const API_URL = process.env.API_URL || 'http://localhost:3001'
const AGENT_KEY = process.env.AGENT_KEY || ''
const POLL_INTERVAL = (Number(process.env.POLL_INTERVAL) || 2) * 1000
const PRINTER_NAME = process.env.PRINTER_NAME || 'POS-80'

let running = true

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-agent-key': AGENT_KEY,
  }
}

async function fetchNext() {
  const res = await fetch(`${API_URL}/print-jobs/next`, { headers: headers() })
  if (res.status === 204) return null
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

async function ack(jobId, estado, errorMsg) {
  const body = { estado }
  if (errorMsg) body.error = errorMsg
  const res = await fetch(`${API_URL}/print-jobs/${jobId}/ack`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`  -> Error al confirmar job #${jobId}: ${text}`)
  }
}

async function poll() {
  try {
    const result = await fetchNext()
    if (!result) return

    const { jobId, tipo, data } = result

    if (tipo === 'quotation') {
      console.log(`[${new Date().toLocaleTimeString()}] Job #${jobId}: imprimiendo cotizacion #${data.id}...`)
      const buffer = buildQuotation(data)
      await printBuffer(buffer, PRINTER_NAME)
      await ack(jobId, 'printed')
      console.log(`  -> Cotizacion #${data.id} impresa correctamente`)
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] Job #${jobId}: imprimiendo venta #${data.id}...`)
      const buffer = buildTicket(data, data.origen)
      await printBuffer(buffer, PRINTER_NAME)
      await ack(jobId, 'printed')
      console.log(`  -> Venta #${data.id} impresa correctamente`)
    }
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] Error:`, err.message)
  }
}

function shutdown() {
  console.log('\nDeteniendo agente...')
  running = false
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

console.log('=== Agente de impresion PitstopPRO ===')
console.log(`API: ${API_URL}`)
console.log(`Impresora: ${PRINTER_NAME}`)
console.log(`Polling cada: ${POLL_INTERVAL / 1000}s`)
console.log('Presiona Ctrl+C para detener.')
console.log('')

async function main() {
  console.log('Esperando trabajos de impresion...')
  console.log('')

  while (running) {
    await poll()
    await new Promise((r) => setTimeout(r, POLL_INTERVAL))
  }
}

main()
