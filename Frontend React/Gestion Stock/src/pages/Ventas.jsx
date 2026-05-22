import { useEffect, useMemo, useState } from 'react'
import { ScanLine, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../services/api'
import { Badge } from '../components/atoms/Badge'
import { Button } from '../components/atoms/Button'
import { Card, CardBody, CardHeader } from '../components/atoms/Card'
import { Input } from '../components/atoms/Input'
import { Modal } from '../components/atoms/Modal'
import { Select } from '../components/atoms/Select'
import { Subtle, Title } from '../components/atoms/Title'
import { SearchBar } from '../components/molecules/SearchBar'
import { cn } from '../design/cn'
import { moneyCLP } from '../design/format'
import { useAppStore } from '../store/useAppStore'
import { useCatalogStore } from '../store/catalog.store'

export function Ventas() {
  return <VentasPage />
}

function VentasPage() {
  const ventaItems = useAppStore((s) => s.ventaItems)
  const setVentaCantidad = useAppStore((s) => s.setVentaCantidad)
  const clearVenta = useAppStore((s) => s.clearVenta)

  const [query, setQuery] = useState('')
  const [categoria, setCategoria] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [otrosCargos, setOtrosCargos] = useState(0)

  const categories = useCatalogStore((s) => s.categories)
  const loadCategories = useCatalogStore((s) => s.loadCategories)

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    const q = query.trim()
    if (!q && !categoria) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const params = new URLSearchParams()
        if (q) params.set('query', q)
        if (categoria) params.set('categoriaId', categoria)
        const res = await api.get(`/products?${params.toString()}`)
        setResults(res.products || [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, categoria])

  const cart = useMemo(() => {
    const byId = new Map(results.map((p) => [p.id, p]))
    return ventaItems.map((i) => {
      const p = byId.get(i.productoId)
      return p ? { product: p, qty: i.cantidad } : null
    }).filter(Boolean)
  }, [ventaItems, results])

  const totals = useMemo(() => {
    const unique = cart.length
    const items = cart.reduce((acc, row) => acc + row.qty, 0)
    const subtotal = cart.reduce((acc, row) => acc + row.qty * row.product.precio, 0)
    const extras = Number.isFinite(otrosCargos) ? Math.max(0, Math.trunc(otrosCargos)) : 0
    const total = subtotal + extras
    return { unique, items, subtotal, extras, total }
  }, [cart, otrosCargos])

  function add(product) {
    const existing = ventaItems.find((i) => i.productoId === product.id)
    const nextQty = (existing?.cantidad ?? 0) + 1
    setVentaCantidad({ productoId: product.id, cantidad: nextQty })
    toast.success('Producto agregado', { description: `${product.nombre} (${product.codigo})` })
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

  async function confirm() {
    const items = ventaItems.filter((i) => i.cantidad > 0)
    if (items.length === 0) return
    setSubmitting(true)
    try {
      await api.post('/sales', { items, metodoPago, otrosCargos: totals.extras })
      clearVenta()
      setConfirmOpen(false)
      setOtrosCargos(0)
      setMetodoPago('EFECTIVO')
      toast.success('Venta registrada', { description: `Se vendieron ${totals.items} items` })
    } catch (err) {
      if (err.status === 409) {
        const details = err.data?.details || []
        toast.error('Stock insuficiente', {
          description: details.map((d) => `${d.nombre}: disponible ${d.disponible}, solicitado ${d.solicitado}`).join(', '),
        })
      } else {
        toast.error('Error al registrar venta', { description: err.message })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Ventas</div>
            <div className="text-xs text-[var(--muted)] pt-1">Buscar o escanear producto.</div>
          </div>
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
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
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
            {searching ? (
              <div className="py-6 text-xs text-[var(--muted)]">Buscando...</div>
            ) : (
              results.slice(0, 10).map((p) => {
                const isLow = p.stock <= p.minimo
                return (
                  <button key={p.id} className="w-full text-left" onClick={() => add(p)}>
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border bg-white/3 px-4 py-3 transition',
                        'border-[rgba(255,255,255,0.06)] hover:bg-white/5',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-zinc-100 truncate">{p.nombre}</div>
                        <div className="text-xs text-[var(--muted)] pt-0.5">
                          {p.codigo} · {moneyCLP(p.precio)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isLow ? 'danger' : 'success'}>{isLow ? 'Bajo' : 'OK'}</Badge>
                        <Badge variant={isLow ? 'danger' : 'neutral'}>{p.stock}</Badge>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
            {!searching && results.length === 0 ? (
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
            {ventaItems.map((item) => {
              const prod = results.find((p) => p.id === item.productoId)
              if (!prod) return null
              return (
                <div
                  key={prod.id}
                  className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-zinc-100 truncate">{prod.nombre}</div>
                    <div className="text-xs text-[var(--muted)] pt-0.5">
                      {prod.codigo} · {moneyCLP(prod.precio)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => dec(prod.id)}>-</Button>
                    <Badge variant="neutral">{item.cantidad}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => inc(prod.id)}>+</Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(prod.id)}>
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              )
            })}
            {ventaItems.length === 0 ? (
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

            <div className="pt-4 grid grid-cols-1 gap-2">
              <div className="grid grid-cols-[1fr_140px] items-center gap-2">
                <div className="text-sm text-[var(--muted)]">Metodo de pago</div>
                <Select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="FACTURA">Factura</option>
                </Select>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Subtotal productos</span>
                <span className="text-zinc-100 font-medium">{moneyCLP(totals.subtotal)}</span>
              </div>
              <div className="grid grid-cols-[1fr_140px] items-center gap-2">
                <div className="text-sm text-[var(--muted)]">Otros cobros</div>
                <Input
                  value={otrosCargos}
                  type="number"
                  min={0}
                  onChange={(e) => setOtrosCargos(Math.max(0, Math.trunc(Number(e.target.value) || 0)))}
                />
              </div>
              <div className="flex items-center justify-between text-base pt-1">
                <span className="text-zinc-200 font-semibold">Total</span>
                <span className="text-zinc-100 font-semibold">{moneyCLP(totals.total)}</span>
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <Button variant="secondary" className="w-full justify-center" onClick={clearVenta} disabled={ventaItems.length === 0}>
                Limpiar
              </Button>
              <Button variant="primary" className="w-full justify-center" onClick={() => setConfirmOpen(true)} disabled={ventaItems.length === 0 || submitting}>
                {submitting ? 'Registrando...' : 'Registrar salida'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Registrar salida">
        <div className="space-y-3">
          <Title as="h2" className="text-lg">Confirmacion</Title>
          <Subtle>Confirma la venta de {totals.items} items por {moneyCLP(totals.total)}.</Subtle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-zinc-400">Metodo de pago</div>
              <Select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="FACTURA">Factura</option>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-zinc-400">Otros cobros</div>
              <Input value={otrosCargos} type="number" min={0} onChange={(e) => setOtrosCargos(Math.max(0, Math.trunc(Number(e.target.value) || 0)))} />
            </div>
          </div>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Total</div>
            <div className="pt-2 text-base font-semibold text-zinc-100">{moneyCLP(totals.total)}</div>
            <div className="pt-1 text-xs text-[var(--muted)]">{totals.items} items</div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={confirm} disabled={submitting}>
              {submitting ? 'Registrando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
