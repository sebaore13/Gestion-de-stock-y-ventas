import { createContext, useContext, useMemo, useState } from 'react'
import {
  categories,
  initialMovements,
  initialProducts,
  initialUsers,
} from './mockData.js'

const AppStoreContext = createContext(null)

function computeCriticality(stock) {
  if (stock <= 0) return 'SIN_STOCK'
  if (stock <= 2) return 'CRITICO'
  if (stock <= 5) return 'BAJO'
  return 'OK'
}

export function AppStoreProvider({ children }) {
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState(initialProducts)
  const [movements, setMovements] = useState(initialMovements)
  const [users, setUsers] = useState(initialUsers)

  const productsById = useMemo(() => {
    const m = new Map()
    for (const p of products) m.set(p.id, p)
    return m
  }, [products])

  const productsByBarcode = useMemo(() => {
    const m = new Map()
    for (const p of products) m.set(p.barcode, p)
    return m
  }, [products])

  function login({ email }) {
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    setUser(found ?? { id: 999, name: 'Usuario', email, role: 'Vendedor' })
  }

  function logout() {
    setUser(null)
  }

  function updateProductStock(productId, delta, meta) {
    const p = productsById.get(productId)
    if (!p) return { ok: false, error: 'Producto no encontrado' }
    const nextStock = Math.max(0, p.stock + delta)
    setProducts((prev) =>
      prev.map((x) => (x.id === productId ? { ...x, stock: nextStock } : x)),
    )

    const movementId = Math.floor(Math.random() * 900000 + 100000)
    const movement = {
      id: movementId,
      at: new Date().toISOString(),
      user: meta?.user ?? user?.name ?? 'Sistema',
      type: meta?.type ?? (delta < 0 ? 'VENTA' : 'AJUSTE'),
      items: [{ productId, qty: Math.abs(delta) }],
      note: meta?.note ?? '',
    }
    setMovements((prev) => [movement, ...prev])
    return { ok: true }
  }

  function upsertProduct(partial) {
    setProducts((prev) => {
      if (partial.id) {
        return prev.map((p) => (p.id === partial.id ? { ...p, ...partial } : p))
      }
      const nextId = Math.max(0, ...prev.map((p) => p.id)) + 1
      return [...prev, { id: nextId, stock: 0, price: 0, ...partial }]
    })
  }

  function deleteProduct(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const derived = useMemo(() => {
    const enriched = products.map((p) => ({
      ...p,
      category: categories.find((c) => c.id === p.categoryId)?.name ?? 'Sin categoria',
      criticality: computeCriticality(p.stock),
    }))
    const lowStock = enriched.filter((p) => p.stock <= 5)
    const outOfStock = enriched.filter((p) => p.stock <= 0)
    return { productsEnriched: enriched, lowStock, outOfStock }
  }, [products])

  const value = useMemo(
    () => ({
      user,
      products,
      movements,
      users,
      categories,
      ...derived,
      productsById,
      productsByBarcode,
      actions: {
        login,
        logout,
        updateProductStock,
        upsertProduct,
        deleteProduct,
        setUsers,
      },
    }),
    [
      user,
      products,
      movements,
      users,
      derived,
      productsById,
      productsByBarcode,
    ],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore debe usarse dentro de AppStoreProvider')
  return ctx
}
