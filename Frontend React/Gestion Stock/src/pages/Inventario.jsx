import { useMemo, useState } from 'react'
import { ProductTable } from '../components/organisms/ProductTable'
import { useAppStore } from '../store/useAppStore'

export function Inventario() {
  const [query, setQuery] = useState('')

  const productos = useAppStore((s) => s.productos)

  const products = useMemo(
    () =>
      productos.map((p) => ({
        sku: p.codigo,
        name: p.nombre,
        stock: p.stock,
        min: p.minimo,
        price: p.precio,
        category: p.categoria,
      })),
    [productos],
  )

  return (
    <ProductTable
      title="Inventario"
      subtitle="Productos y stock actual (mock)."
      products={products}
      query={query}
      onQueryChange={setQuery}
    />
  )
}
