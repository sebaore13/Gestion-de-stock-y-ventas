import { useEffect, useMemo, useState } from 'react'
import { ScanLine, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '../components/atoms/Badge'
import { Button } from '../components/atoms/Button'
import { Card, CardBody, CardHeader } from '../components/atoms/Card'
import { Modal } from '../components/atoms/Modal'
import { Select } from '../components/atoms/Select'
import { Subtle, Title } from '../components/atoms/Title'
import { SearchBar } from '../components/molecules/SearchBar'
import { cn } from '../design/cn'
import { moneyCLP } from '../design/format'
import { useAppStore } from '../store/useAppStore'

export function Ventas() {
  return <VentasPage />
}

function VentasPage() {
  const productos = useAppStore((s) => s.productos)
  const ventaItems = useAppStore((s) => s.ventaItems)
  const setVentaCantidad = useAppStore((s) => s.setVentaCantidad)
  const clearVenta = useAppStore((s) => s.clearVenta)
  const registrarSalida = useAppStore((s) => s.registrarSalida)

  const [query, setQuery] = useState('')
  const [categoria, setCategoria] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const productosMapped = useMemo(
    () =>
      productos.map((p) => ({
        id: p.id,
        sku: p.codigo,
        name: p.nombre,
        stock: p.stock,
        min: p.minimo,
        price: p.precio,
        category: p.categoria,
      })),
    [productos],
  )

  const categorias = useMemo(() => {
    const set = new Set(productos.map((p) => p.categoria).filter(Boolean))
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)))
  }, [productos])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const hasQuery = Boolean(q)
    const hasCategoria = Boolean(categoria)

    // No mostrar todo el catalogo en Ventas.
    if (!hasQuery && !hasCategoria) return []

    return productosMapped
      .filter((p) => (hasCategoria ? p.category === categoria : true))
      .filter((p) => (hasQuery ? `${p.sku} ${p.name}`.toLowerCase().includes(q) : true))
  }, [productosMapped, query, categoria])

  // UX: si el usuario escribe un codigo exacto (scanner), sugerimos auto-agregar.
  useEffect(() => {
    const q = query.trim()
    if (!q) return
    const exact = productosMapped.find((p) => p.sku === q)
    if (!exact) return
    // No auto-agregamos silenciosamente; mostramos CTA.
  }, [query, productosMapped])

  const cart = useMemo(() => {
    const byId = new Map(productosMapped.map((p) => [p.id, p]))
    return ventaItems
      .map((i) => {
        const p = byId.get(i.productoId)
        if (!p) return null
        return { product: p, qty: i.cantidad }
      })
      .filter(Boolean)
  }, [ventaItems, productosMapped])

  const totals = useMemo(() => {
    const unique = cart.length
    const items = cart.reduce((acc, row) => acc + row.qty, 0)
    const total = cart.reduce((acc, row) => acc + row.qty * row.product.price, 0)
    return { unique, items, total }
  }, [cart])

  function add(product) {
    const existing = ventaItems.find((i) => i.productoId === product.id)
    const nextQty = (existing?.cantidad ?? 0) + 1
    setVentaCantidad({ productoId: product.id, cantidad: nextQty })
    toast.success('Producto agregado', { description: `${product.name} (${product.sku})` })
  }

  function inc(id) {
    const existing = ventaItems.find((i) => i.productoId === id)
    setVentaCantidad({ productoId: id, cantidad: (existing?.cantidad ?? 0) + 1 })
  }

  function dec(id) {
    const existing = ventaItems.find((i) => i.productoId === id)
    setVentaCantidad({ productoId: id, cantidad: Math.max(0, (existing?.cantidad ?? 0) - 1) })
  }

  function remove(id) {
    setVentaCantidad({ productoId: id, cantidad: 0 })
  }

  function confirm() {
    const items = ventaItems.filter((i) => i.cantidad > 0)
    registrarSalida({ items })
    clearVenta()
    setConfirmOpen(false)
    toast('Stock actualizado', { description: `Se registraron ${totals.items} items` })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Ventas</div>
            <div className="text-xs text-[var(--muted)] pt-1">Buscar o escanear producto.</div>
          </div>
          <Badge variant="neutral">Demo</Badge>
        </CardHeader>
        <CardBody>
          <div className="pb-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_190px] gap-3">
              <SearchBar
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o codigo..."
              />
              <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">Todas las categorias</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            {query.trim() ? (
              <div className="pt-2">
                <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                  <X size={16} />
                  Limpiar busqueda
                </Button>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            {filtered.slice(0, 10).map((p) => {
              const isLow = p.stock <= p.min
              return (
                <button key={p.id} className="w-full text-left" onClick={() => add(p)}>
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border bg-white/3 px-4 py-3 transition',
                      'border-[rgba(255,255,255,0.06)] hover:bg-white/5',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-zinc-100 truncate">{p.name}</div>
                      <div className="text-xs text-[var(--muted)] pt-0.5">
                        {p.sku} · {moneyCLP(p.price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isLow ? 'danger' : 'success'}>{isLow ? 'Bajo' : 'OK'}</Badge>
                      <Badge variant={isLow ? 'danger' : 'neutral'}>{p.stock}</Badge>
                    </div>
                  </div>
                </button>
              )
            })}
            {filtered.length === 0 ? (
              <div className="py-6 text-xs text-[var(--muted)]">
                {query.trim() || categoria ? 'Sin resultados.' : 'Ingresa un codigo o escribe el nombre de un producto para ver precio y stock.'}
              </div>
            ) : null}
          </div>

          <div className="pt-4 text-xs text-[var(--muted)] flex items-center gap-2">
            <ScanLine size={14} />
            Tip: pega un codigo (scanner) o busca por nombre.
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Resumen</div>
            <div className="text-xs text-[var(--muted)] pt-1">Productos agregados.</div>
          </div>
          <Badge variant={totals.items ? 'info' : 'neutral'}>{totals.items} items</Badge>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            {cart.map((row) => (
              <div
                key={row.product.id}
                className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-zinc-100 truncate">{row.product.name}</div>
                  <div className="text-xs text-[var(--muted)] pt-0.5">
                    {row.product.sku} · {moneyCLP(row.product.price)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => dec(row.product.id)}>
                    -
                  </Button>
                  <Badge variant="neutral">{row.qty}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => inc(row.product.id)}>
                    +
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(row.product.id)}>
                    <X size={16} />
                  </Button>
                </div>
              </div>
            ))}
            {cart.length === 0 ? (
              <div className="py-6 text-sm text-[var(--muted)]">Aun no agregaste productos.</div>
            ) : null}
          </div>

          <div className="pt-5 border-t border-[rgba(255,255,255,0.06)] mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">Productos</span>
              <span className="text-zinc-100 font-medium">{totals.unique}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-[var(--muted)]">Total items</span>
              <span className="text-zinc-100 font-medium">{totals.items}</span>
            </div>
            <div className="flex items-center justify-between text-base pt-3">
              <span className="text-zinc-200 font-semibold">Total</span>
              <span className="text-zinc-100 font-semibold">{moneyCLP(totals.total)}</span>
            </div>

            <div className="pt-4 flex gap-2">
              <Button
                variant="secondary"
                className="w-full justify-center"
                onClick={() => {
                  clearVenta()
                  toast('Carrito limpio')
                }}
                disabled={cart.length === 0}
              >
                Limpiar
              </Button>
              <Button
                variant="primary"
                className="w-full justify-center"
                onClick={() => setConfirmOpen(true)}
                disabled={cart.length === 0}
              >
                Registrar salida
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Registrar salida (demo)">
        <div className="space-y-3">
          <Title as="h2" className="text-lg">
            Confirmacion
          </Title>
          <Subtle>Simulacion: descuenta stock y agrega un movimiento. El objetivo es UX y fluidez.</Subtle>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Total</div>
            <div className="pt-2 text-base font-semibold text-zinc-100">{moneyCLP(totals.total)}</div>
            <div className="pt-1 text-xs text-[var(--muted)]">{totals.items} items</div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={confirm}>
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
