import { useEffect, useMemo, useState } from 'react'
import { Card, CardBody, CardHeader } from '../atoms/Card'
import { Badge } from '../atoms/Badge'
import { ProductRow } from '../molecules/ProductRow'
import { SearchBar } from '../molecules/SearchBar'
import { Select } from '../atoms/Select'

export function ProductTable({
  title = 'Inventario',
  subtitle = 'Lista de productos (mock).',
  products,
  query,
  onQueryChange,
  categoryOptions,
}) {
  const [category, setCategory] = useState('Todas')
  const [stockFilter, setStockFilter] = useState('Todos')

  const categories = useMemo(() => {
    const names = Array.isArray(categoryOptions) && categoryOptions.length
      ? categoryOptions
      : products.map((p) => p.category).filter(Boolean)
    const set = new Set(names)
    return ['Todas', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [products, categoryOptions])

  useEffect(() => {
    if (!categories.includes(category)) setCategory('Todas')
  }, [categories, category])

  const filtered = useMemo(() => {
    const q = query?.trim().toLowerCase()
    return products
      .filter((p) => {
        if (category === 'Todas') return true
        return p.category === category
      })
      .filter((p) => {
        if (stockFilter === 'Todos') return true
        const low = p.stock <= p.min
        return stockFilter === 'Bajo' ? low : !low
      })
      .filter((p) => (q ? `${p.sku} ${p.name}`.toLowerCase().includes(q) : true))
  }, [products, query, category, stockFilter])

  const lowCount = useMemo(() => filtered.filter((p) => p.stock <= p.min).length, [filtered])

  return (
    <Card>
      <CardHeader>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-[var(--muted)] pt-1">{subtitle}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={lowCount ? 'danger' : 'success'}>
            {lowCount ? `${lowCount} bajo minimo` : 'OK'}
          </Badge>
        </div>
      </CardHeader>
      <CardBody>
        <div className="pb-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_200px] gap-3">
            <SearchBar
              value={query}
              onChange={(e) => onQueryChange?.(e.target.value)}
              placeholder="Buscar por codigo o nombre..."
            />
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
              <option value="Todos">Stock: Todos</option>
              <option value="Bajo">Stock: Bajo</option>
              <option value="OK">Stock: OK</option>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          {filtered.map((p) => (
            <ProductRow key={p.sku} product={p} />
          ))}
          {filtered.length === 0 ? (
            <div className="py-6 text-sm text-[var(--muted)]">Sin resultados.</div>
          ) : null}
        </div>
      </CardBody>
    </Card>
  )
}
