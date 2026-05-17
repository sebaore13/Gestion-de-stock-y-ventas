export function moneyCLP(value) {
  const n = Number.isFinite(value) ? value : Number(value) || 0
  // CLP is integer currency.
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function numberCL(value) {
  const n = Number.isFinite(value) ? value : Number(value) || 0
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(n)
}
