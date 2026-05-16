import { create } from 'zustand'
import { productos as productosSeed } from '../data/productos'
import { movimientos as movimientosSeed } from '../data/movimientos'
import { usuarioActivoId } from '../data/usuarios'

function computeEstado(p) {
  if (p.stock <= p.minimo) return 'Stock Bajo'
  return 'Disponible'
}

function normalizeProductos(list) {
  return list.map((p) => ({ ...p, estado: computeEstado(p) }))
}

export const useAppStore = create((set, get) => ({
  productos: normalizeProductos(productosSeed),
  movimientos: movimientosSeed,
  usuarioActivoId,
  _nextMovimientoId: 1000,

  // VENTAS (UI): items en carrito [{ productoId, cantidad }]
  ventaItems: [],

  setVentaCantidad: ({ productoId, cantidad }) => {
    const qty = Math.max(0, Math.floor(cantidad || 0))
    set((s) => {
      const prev = s.ventaItems
      const idx = prev.findIndex((i) => i.productoId === productoId)
      if (qty === 0) {
        return { ventaItems: prev.filter((i) => i.productoId !== productoId) }
      }
      if (idx === -1) return { ventaItems: [...prev, { productoId, cantidad: qty }] }
      const next = [...prev]
      next[idx] = { ...next[idx], cantidad: qty }
      return { ventaItems: next }
    })
  },

  clearVenta: () => set({ ventaItems: [] }),

  // VENTA (mock): descuenta stock y genera movimiento.
  registrarSalida: ({ items }) => {
    const { productos, movimientos, usuarioActivoId: uid, _nextMovimientoId } = get()

    // items: [{ productoId, cantidad }]
    const byId = new Map(productos.map((p) => [p.id, p]))
    const now = new Date().toISOString()

    const updated = productos.map((p) => {
      const item = items.find((i) => i.productoId === p.id)
      if (!item) return p
      const nextStock = Math.max(0, p.stock - item.cantidad)
      return { ...p, stock: nextStock, estado: computeEstado({ ...p, stock: nextStock }) }
    })

    const newMovs = items
      .map((i, idx) => {
        const prod = byId.get(i.productoId)
        if (!prod) return null
        return {
          id: _nextMovimientoId + idx,
          tipo: 'SALIDA',
          productoId: i.productoId,
          cantidad: i.cantidad,
          fecha: now,
          usuarioId: uid,
        }
      })
      .filter(Boolean)

    set({
      productos: updated,
      movimientos: [...newMovs, ...movimientos],
      _nextMovimientoId: _nextMovimientoId + newMovs.length,
    })

    return { ok: true }
  },
}))
