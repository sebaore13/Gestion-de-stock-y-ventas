// Movimientos iniciales (mock). En runtime se agregan nuevos desde el store.
export const movimientos = [
  {
    id: 101,
    tipo: 'INGRESO',
    productoId: 3,
    cantidad: 25,
    fecha: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    usuarioId: 1,
  },
  {
    id: 102,
    tipo: 'SALIDA',
    productoId: 2,
    cantidad: 2,
    fecha: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    usuarioId: 1,
  },
  {
    id: 103,
    tipo: 'AJUSTE',
    productoId: 7,
    cantidad: 1,
    fecha: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    usuarioId: 2,
  },
]
