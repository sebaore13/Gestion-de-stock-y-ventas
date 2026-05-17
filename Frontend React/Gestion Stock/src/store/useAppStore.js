import { create } from 'zustand'

export const useAppStore = create((set) => ({
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
}))
