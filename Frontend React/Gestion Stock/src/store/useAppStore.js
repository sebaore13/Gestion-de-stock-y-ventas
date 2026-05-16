import { create } from 'zustand'
import { productos as productosSeed } from '../data/productos'
import { movimientos as movimientosSeed } from '../data/movimientos'
import { usuarioActivoId, usuarios } from '../data/usuarios'

function computeEstado(p) {
  if (p.stock <= p.minimo) return 'Stock Bajo'
  return 'Disponible'
}

function normalizeProductos(list) {
  return list.map((p) => ({
    ...p,
    // si no viene del seed, se inicializa al crear
    fechaIngreso: p.fechaIngreso ?? new Date().toISOString(),
    estado: computeEstado(p),
  }))
}

function nextId(list) {
  return (list.reduce((max, item) => Math.max(max, item.id ?? 0), 0) || 0) + 1
}

function applyStockByTipo(stock, tipo, cantidad) {
  if (tipo === 'INGRESO') return stock + Math.max(0, cantidad)
  if (tipo === 'SALIDA') return Math.max(0, stock - Math.max(0, cantidad))
  // AJUSTE: permite +/-
  return Math.max(0, stock + cantidad)
}

export const useAppStore = create((set, get) => ({
  productos: normalizeProductos(productosSeed),
  movimientos: movimientosSeed,
  usuarioActivoId,
  usuarios,
  _nextMovimientoId: Math.max(1000, nextId(movimientosSeed)),
  _nextProductoId: nextId(productosSeed),
  _nextUsuarioId: nextId(usuarios),

  getUsuarioActivo: () => {
    const { usuarios, usuarioActivoId } = get()
    return usuarios.find((u) => u.id === usuarioActivoId) ?? null
  },

  getRolActivo: () => {
    const u = get().getUsuarioActivo()
    return u?.rol ?? 'Vendedor'
  },

  // demo switch (hasta que exista auth real)
  setUsuarioActivoId: (id) => set({ usuarioActivoId: id }),

  // === Usuarios (admin) ===
  crearUsuario: ({ nombre, rol }) => {
    const { _nextUsuarioId } = get()
    const nuevo = { id: _nextUsuarioId, nombre: String(nombre || '').trim(), rol }
    if (!nuevo.nombre) return { ok: false, error: 'Nombre requerido' }
    if (!['Administrador', 'Vendedor'].includes(nuevo.rol)) return { ok: false, error: 'Rol invalido' }

    set((s) => ({
      usuarios: [...s.usuarios, nuevo],
      _nextUsuarioId: s._nextUsuarioId + 1,
    }))
    return { ok: true, usuario: nuevo }
  },

  editarUsuario: ({ id, nombre, rol }) => {
    const nextNombre = String(nombre || '').trim()
    if (!nextNombre) return { ok: false, error: 'Nombre requerido' }
    if (!['Administrador', 'Vendedor'].includes(rol)) return { ok: false, error: 'Rol invalido' }

    set((s) => ({
      usuarios: s.usuarios.map((u) => (u.id === id ? { ...u, nombre: nextNombre, rol } : u)),
    }))
    return { ok: true }
  },

  borrarUsuario: ({ id }) => {
    const activeId = get().usuarioActivoId
    if (id === activeId) return { ok: false, error: 'No se puede borrar el usuario activo' }
    set((s) => ({ usuarios: s.usuarios.filter((u) => u.id !== id) }))
    return { ok: true }
  },

  // === Productos (admin) ===
  crearProducto: ({ codigo, nombre, categoria, stock, minimo, precio, fechaIngreso }) => {
    const { _nextProductoId } = get()
    const p = {
      id: _nextProductoId,
      codigo: String(codigo || '').trim(),
      nombre: String(nombre || '').trim(),
      categoria: String(categoria || '').trim() || 'General',
      stock: Math.max(0, Math.floor(stock || 0)),
      minimo: Math.max(0, Math.floor(minimo || 0)),
      precio: Math.max(0, Math.floor(precio || 0)),
      fechaIngreso: fechaIngreso ? new Date(fechaIngreso).toISOString() : new Date().toISOString(),
      estado: 'Disponible',
    }
    if (!p.codigo || !p.nombre) return { ok: false, error: 'Codigo y nombre requeridos' }

    set((s) => {
      const next = [...s.productos, { ...p, estado: computeEstado(p) }]
      return { productos: next, _nextProductoId: s._nextProductoId + 1 }
    })
    return { ok: true, producto: p }
  },

  editarProducto: ({ id, codigo, nombre, categoria, stock, minimo, precio, fechaIngreso }) => {
    const patch = {
      codigo: String(codigo || '').trim(),
      nombre: String(nombre || '').trim(),
      categoria: String(categoria || '').trim() || 'General',
      stock: Math.max(0, Math.floor(stock || 0)),
      minimo: Math.max(0, Math.floor(minimo || 0)),
      precio: Math.max(0, Math.floor(precio || 0)),
      fechaIngreso: fechaIngreso ? new Date(fechaIngreso).toISOString() : undefined,
    }
    if (!patch.codigo || !patch.nombre) return { ok: false, error: 'Codigo y nombre requeridos' }

    set((s) => ({
      productos: s.productos.map((p) =>
        p.id === id
          ? {
              ...p,
              ...patch,
              ...(patch.fechaIngreso ? { fechaIngreso: patch.fechaIngreso } : null),
              estado: computeEstado({ ...p, ...patch }),
            }
          : p,
      ),
    }))
    return { ok: true }
  },

  borrarProducto: ({ id }) => {
    set((s) => ({ productos: s.productos.filter((p) => p.id !== id) }))
    return { ok: true }
  },

  // === Movimientos (admin) ===
  crearMovimiento: ({ tipo, productoId, cantidad, usuarioId, fecha }) => {
    const { productos, movimientos, _nextMovimientoId, usuarioActivoId: uid } = get()
    if (!['INGRESO', 'SALIDA', 'AJUSTE'].includes(tipo)) return { ok: false, error: 'Tipo invalido' }
    if (!Number.isFinite(productoId)) return { ok: false, error: 'Producto invalido' }
    if (!Number.isFinite(cantidad) || cantidad === 0) return { ok: false, error: 'Cantidad invalida' }

    const now = fecha ? new Date(fecha).toISOString() : new Date().toISOString()
    const m = {
      id: _nextMovimientoId,
      tipo,
      productoId,
      cantidad,
      fecha: now,
      usuarioId: usuarioId ?? uid,
    }

    const updated = productos.map((p) => {
      if (p.id !== productoId) return p
      const nextStock = applyStockByTipo(p.stock, tipo, cantidad)
      return { ...p, stock: nextStock, estado: computeEstado({ ...p, stock: nextStock }) }
    })

    set({
      productos: updated,
      movimientos: [m, ...movimientos],
      _nextMovimientoId: _nextMovimientoId + 1,
    })

    return { ok: true, movimiento: m }
  },

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
      const nextStock = applyStockByTipo(p.stock, 'SALIDA', item.cantidad)
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
