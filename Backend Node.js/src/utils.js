function toInt(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.trunc(n)
}

function isNonNegativeInt(n) {
  return Number.isInteger(n) && n >= 0
}

function mysqlErrorMessage(err) {
  if (err?.code === 'ER_DUP_ENTRY') return 'Dato duplicado'
  if (err?.code === 'ER_ROW_IS_REFERENCED_2' || err?.code === 'ER_ROW_IS_REFERENCED') {
    return 'No se puede eliminar: tiene registros asociados'
  }
  return err?.message || 'Error DB'
}

function normalizeSaleItems(items) {
  if (!Array.isArray(items)) return { ok: false, error: 'items debe ser una lista' }
  const normalized = []
  for (const raw of items) {
    const productoId = raw?.productoId !== undefined ? toInt(raw.productoId) : null
    const codigo = raw?.codigo !== undefined ? String(raw.codigo || '').trim() : ''
    const cantidad = toInt(raw?.cantidad)
    if (!isNonNegativeInt(cantidad) || cantidad <= 0) {
      return { ok: false, error: 'cantidad invalida' }
    }
    if (!productoId && !codigo) {
      return { ok: false, error: 'Cada item requiere productoId o codigo' }
    }
    normalized.push({
      productoId: productoId || null,
      codigo: codigo || null,
      cantidad,
    })
  }
  return { ok: true, items: normalized }
}

function localDatetimeStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatLocalDatetime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

module.exports = { toInt, isNonNegativeInt, mysqlErrorMessage, normalizeSaleItems, localDatetimeStr, formatLocalDatetime }
