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
  if (normalized.length === 0) return { ok: false, error: 'items no puede estar vacio' }
  return { ok: true, items: normalized }
}

module.exports = { toInt, isNonNegativeInt, mysqlErrorMessage, normalizeSaleItems }
