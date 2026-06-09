require('dotenv').config()
const fs = require('fs')
const path = require('path')

const { buildTicket, printBuffer } = require('./printer')

const printerName = process.env.PRINTER_NAME || 'POS-80'

const testSale = {
  id: 999,
  fecha: new Date().toISOString(),
  metodoPago: 'EFECTIVO',
  nota: 'Cambio de aceite y filtro',
  otrosCargos: 15000,
  total: 47950,
  items: [
    { nombre: 'Filtro aceite Mann', codigo: 'FIL-001', cantidad: 1, precio: 8990 },
    { nombre: 'Aceite 5W30 1L', codigo: 'ACE-5W30', cantidad: 4, precio: 5990 },
  ],
}

async function main() {
  console.log('Generando ticket de prueba...')
  const buffer = buildTicket(testSale)

  // Guardar como archivo .prn por si no hay impresora
  const prnFile = path.join(__dirname, 'test-ticket.prn')
  fs.writeFileSync(prnFile, buffer)
  console.log(`Ticket guardado en: ${prnFile}`)
  console.log(`Tamanio: ${buffer.length} bytes`)
  console.log('')

  console.log(`Enviando a impresora: ${printerName}...`)
  try {
    const result = await printBuffer(buffer, printerName)
    console.log('Impresion exitosa:', result)
  } catch (err) {
    console.error('Error:', err.message)
    console.log('')
    console.log('Posibles soluciones:')
    console.log('  1. Verifica que la impresora este encendida y conectada por USB')
    console.log('  2. Verifica el nombre exacto en "Dispositivos e impresoras" y ajusta PRINTER_NAME en .env')
    console.log('  3. Si no tienes impresora conectada, el archivo test-ticket.prn se guardo igual')
    console.log('  4. Podes imprimirlo manualmente:')
    console.log(`     copy /b test-ticket.prn \\\\localhost\\${printerName}`)
    process.exit(1)
  }
}

main()
