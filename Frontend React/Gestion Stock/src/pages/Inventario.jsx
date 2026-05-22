import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { ProductTable } from '../components/organisms/ProductTable'
import { useCatalogStore } from '../store/catalog.store'

export function Inventario() {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState([])
  const categories = useCatalogStore((s) => s.categories)
  const loadCategories = useCatalogStore((s) => s.loadCategories)

  useEffect(() => { loadCategories() }, [loadCategories])

  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('query', query.trim())
    api.get(`/products?limit=500&${params.toString()}`)
      .then((res) => setProducts(res.products || []))
      .catch(() => {})
  }, [query])

  const mapped = useMemo(
    () =>
      products.map((p) => ({
        sku: p.codigo,
        name: p.nombre,
        stock: p.stock,
        min: p.minimo,
        price: p.precio,
        category: p.categoria,
      })),
    [products],
  )

  return (
    <ProductTable
      title="Inventario"
      subtitle="Productos y stock actual."
      products={mapped}
      categoryOptions={categories.map((c) => c.nombre)}
      query={query}
      onQueryChange={setQuery}
    />
  )
}
