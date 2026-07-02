const fs = require('fs')
const { exec } = require('child_process')
const path = require('path')

const W = 42 // 80mm ~42 chars

function padCenter(s, w) {
  const left = Math.max(0, Math.floor((w - s.length) / 2))
  return ' '.repeat(left) + s
}

function padRight(s, w) {
  return s + ' '.repeat(Math.max(0, w - s.length))
}

function padLeft(s, w) {
  return ' '.repeat(Math.max(0, w - s.length)) + s
}

// Double-size header
function bigHeader(text) {
  const HALF = Math.floor(W / 2)
  const buf = []
  buf.push(Buffer.from([0x1B, 0x45, 0x01]))   // ESC E 1 = bold on
  buf.push(Buffer.from([0x1D, 0x21, 0x11]))   // GS ! 0x11 = double w + double h
  buf.push(Buffer.from(padCenter(text, HALF) + '\n', 'latin1'))
  buf.push(Buffer.from([0x1D, 0x21, 0x00]))   // GS ! 0 = normal size
  buf.push(Buffer.from([0x1B, 0x45, 0x00]))   // ESC E 0 = bold off
  return Buffer.concat(buf)
}

// Construye el buffer ESC/POS completo para el ticket
function buildTicket(sale) {
  const lines = []
  const sep = () => lines.push(''.padEnd(W, '-'))
  const sepD = () => lines.push(''.padEnd(W, '='))
  const empty = () => lines.push('')

  // Encabezado
  empty()
  lines.push(padCenter(formatFecha(sale.fecha), W))
  lines.push(padCenter(`Venta #${sale.id}`, W))
  empty()
  lines.push(padRight('N°celular: +569 9378 3219', W))
  lines.push(padRight('Direccion: Correa 277b, Melipilla', W))
  empty()
  sepD()
  empty()

  // Productos
  if (sale.items && sale.items.length > 0) {
    empty()
    sep()
    lines.push(padCenter('PRODUCTOS', W))
    sep()
    empty()
    for (const item of sale.items) {
      const nombre = item.nombre || ''
      const cant = String(item.cantidad)
      const total = '$' + formatear(item.precio * item.cantidad)
      const line1 = padRight(nombre.slice(0, W - 17), W - 17) + padLeft(cant, 5) + '  ' + padLeft(total, 10)
      lines.push(line1)
    }
  }

  // Servicios
  if (sale.servicios && sale.servicios.length > 0) {
    empty()
    sep()
    lines.push(padCenter('SERVICIOS', W))
    sep()
    empty()
    for (const sv of sale.servicios) {
      const label = sv.descripcion
      const total = '$' + formatear(sv.monto)
      lines.push(padRight(label, W - 12) + padLeft(total, 12))
    }
  }

  // Otros cobros
  if (sale.otrosCargos > 0) {
    const label = 'Otros cobros'
    const total = '$' + formatear(sale.otrosCargos)
    const line = padRight(label, W - 12) + padLeft(total, 12)
    lines.push(line)
  }

  empty()
  sep()
  empty()

  // Notas
  if (sale.nota) {
    lines.push('Notas:')
    lines.push(sale.nota)
    empty()
  }

  // Totales
  lines.push(padRight('TOTAL', W - 12) + padLeft('$' + formatear(sale.total), 12))
  lines.push('Pago: ' + (sale.metodoPago || 'EFECTIVO'))
  empty()
  sepD()

  // Pie
  empty()
  lines.push(padCenter('Gracias por su compra', W))
  empty()
  empty()
  empty()
  empty()
  empty()
  empty()

  const textBuf = linesToEscpos(lines, bigHeader('PitstopPRO'))
  return textBuf
}

function linesToEscpos(lines, prefix) {
  const bufs = []

  // Initialize printer
  bufs.push(Buffer.from([0x1B, 0x40])) // ESC @

  // Code page 858 (Latin-1 + Euro)
  bufs.push(Buffer.from([0x1B, 0x74, 0x13])) // ESC t 0x13

  // Optional prefix (e.g. big header)
  if (prefix) bufs.push(prefix)

  for (const line of lines) {
    // Si es una línea de separación con =, usar doble ancho normal
    if (line.startsWith('=') || line.startsWith('-')) {
      // Línea normal con guiones
      const text = line.slice(0, W)
      bufs.push(Buffer.from(text, 'latin1'))
      bufs.push(Buffer.from([0x0A])) // LF
      continue
    }

    // Texto normal
    const text = line.slice(0, W)
    bufs.push(Buffer.from(text, 'latin1'))
    bufs.push(Buffer.from([0x0A])) // LF
  }

  // Cut (paper full cut)
  bufs.push(Buffer.from([0x1D, 0x56, 0x00])) // GS V 0

  return Buffer.concat(bufs)
}

function buildQuotation(q) {
  const lines = []
  const sep = () => lines.push(''.padEnd(W, '-'))
  const sepD = () => lines.push(''.padEnd(W, '='))
  const empty = () => lines.push('')

  sepD()
  lines.push(padCenter('COTIZACION', W))
  lines.push(padCenter('N° ' + String(q.id).padStart(6, '0'), W))
  sepD()
  lines.push(padCenter(formatFecha(q.fecha), W))
  empty()
  lines.push(padRight('N°celular: +569 9378 3219', W))
  lines.push(padRight('Direccion: Correa 277b, Melipilla', W))
  empty()
  sepD()
  empty()

  const hasProductos = q.items && q.items.length > 0
  const hasServicios = q.servicios && q.servicios.length > 0
  const hasOtros = q.otros_costos && q.otros_costos.length > 0

  if (hasProductos) {
    sep()
    lines.push(padCenter('PRODUCTOS', W))
    sep()
    empty()
    for (const item of q.items) {
      const nombre = item.nombre_snapshot || item.nombre || ''
      const pu = '$' + formatear(item.precio_snapshot || item.precio || 0)
      lines.push(nombre)
      lines.push(item.cantidad + ' x ' + pu)
      empty()
    }
  }

  if (hasServicios) {
    sep()
    lines.push(padCenter('SERVICIOS', W))
    sep()
    empty()
    for (const sv of q.servicios) {
      lines.push(sv.descripcion)
      lines.push('$' + formatear(sv.monto))
      empty()
    }
  }

  if (hasOtros) {
    sep()
    lines.push(padCenter('OTROS COSTOS', W))
    sep()
    empty()
    for (const oc of q.otros_costos) {
      lines.push(oc.descripcion)
      lines.push('$' + formatear(oc.monto))
      empty()
    }
  }

  sep()
  lines.push(padCenter('TOTAL', W))
  lines.push(padCenter('$' + formatear(q.total), W))
  sep()

  if (q.nota) {
    empty()
    lines.push('Observaciones:')
    lines.push(q.nota)
    empty()
    sep()
  }

  empty()
  lines.push(padCenter('Gracias por su visita', W))
  empty()
  empty()
  empty()
  empty()
  empty()
  empty()

  return linesToEscpos(lines, bigHeader('PitstopPRO'))
}

function formatFecha(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return String(fecha)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatear(valor) {
  return String(valor).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ''
}

// Envía buffer raw ESC/POS a la impresora via cmd copy /b (windows)
function printBuffer(buffer, printerName) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(__dirname, `__print_${Date.now()}.prn`)
    try {
      fs.writeFileSync(tmpFile, buffer)
    } catch (err) {
      return reject(err)
    }

    const cmd = `copy /b "${tmpFile}" "\\\\localhost\\${printerName}" >nul 2>&1`
    exec(cmd, { timeout: 15000 }, (err) => {
      try { fs.unlinkSync(tmpFile) } catch {}
      if (err) {
        return reject(new Error(
          `No se pudo imprimir. Asegurate de compartir la impresora:\n` +
          `  1. Panel de control > Impresoras\n` +
          `  2. Clic derecho "${printerName}" > Compartir\n` +
          `  3. Compartir como "${printerName}"\n` +
          `  4. Volve a intentar`
        ))
      }
      resolve('OK')
    })
  })
}

module.exports = { buildTicket, buildQuotation, printBuffer }
