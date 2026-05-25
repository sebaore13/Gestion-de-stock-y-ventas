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
import { PriceBlock } from '../components/atoms/PriceBlock'
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
  const [otrosCargos, setOtrosCargos] = useState('')
  const [knownProductsById, setKnownProductsById] = useState({})

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
        const products = res.products || []
        setResults(products)
        // Cache products seen/added so the cart doesn't depend on current search results.
        setKnownProductsById((prev) => {
          const next = { ...prev }
          for (const p of products) next[p.id] = p
          return next
        })
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, categoria])

  const cart = useMemo(() => {
    return ventaItems
      .filter((i) => i.cantidad > 0)
      .map((i) => {
        const p = knownProductsById[i.productoId]
        if (!p) {
          return {
            product: {
              id: i.productoId,
              nombre: 'Producto',
              codigo: `ID ${i.productoId}`,
              categoria: '',
              precio: 0,
              stock: 0,
              minimo: 0,
            },
            qty: i.cantidad,
            missing: true,
          }
        }
        return { product: p, qty: i.cantidad, missing: false }
      })
  }, [ventaItems, knownProductsById])

  const totals = useMemo(() => {
    const unique = cart.length
    const items = cart.reduce((acc, row) => acc + row.qty, 0)
    const subtotal = cart.reduce((acc, row) => acc + row.qty * row.product.precio, 0)
    const extras = otrosCargos === '' ? 0 : Math.max(0, Math.trunc(Number(otrosCargos) || 0))
    const total = subtotal + extras
    return { unique, items, subtotal, extras, total }
  }, [cart, otrosCargos])

  function add(product) {
    setKnownProductsById((prev) => ({ ...prev, [product.id]: product }))
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
      setOtrosCargos('')
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
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4">
      <Card className="min-w-0">
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
                        'flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border bg-white/3 px-4 py-3 transition',
                        'border-[rgba(255,255,255,0.06)] hover:bg-white/5',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="min-w-0 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-zinc-100 truncate">{p.nombre}</div>
                            <div className="text-xs text-[var(--muted)] pt-0.5 truncate">
                              {p.codigo} · {p.categoria}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 pt-0.5 sm:hidden">
                            <Badge variant={isLow ? 'danger' : 'success'}>{isLow ? 'Bajo' : 'OK'}</Badge>
                            <Badge variant={isLow ? 'danger' : 'neutral'}>{p.stock}</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto flex items-center justify-center sm:justify-end">
                        <PriceBlock value={p.precio} align="center" className="shrink-0 sm:hidden" />

                        <div className="hidden sm:flex items-center gap-3">
                          <PriceBlock value={p.precio} align="right" />
                          <Badge variant={isLow ? 'danger' : 'success'}>{isLow ? 'Bajo' : 'OK'}</Badge>
                          <Badge variant={isLow ? 'danger' : 'neutral'}>{p.stock}</Badge>
                        </div>
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

      <Card className="min-w-0">
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Resumen</div>
            <div className="text-xs text-[var(--muted)] pt-1">Productos agregados.</div>
          </div>
          <Badge variant={totals.items ? 'info' : 'neutral'}>{totals.items} items</Badge>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            {cart.map((row) => {
              const prod = row.product
              const controls = (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => dec(prod.id)} disabled={row.missing}>-</Button>
                  <Badge variant="neutral">{row.qty}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => inc(prod.id)} disabled={row.missing}>+</Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(prod.id)} aria-label="Quitar">
                    <X size={16} />
                  </Button>
                </div>
              )

              return (
                <div
                  key={prod.id}
                  className="flex flex-col gap-2 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-100 truncate">{prod.nombre}</div>
                    <div className="text-xs text-[var(--muted)] pt-0.5 truncate">{prod.codigo}</div>
                    {row.missing ? (
                      <div className="text-[11px] text-[var(--muted)] pt-1">Este producto ya no esta en la busqueda actual.</div>
                    ) : null}
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <PriceBlock value={prod.precio} align="center" className="sm:hidden self-center" />
                    <PriceBlock value={prod.precio} align="left" className="hidden sm:flex" />
                    <div className="flex items-center justify-center sm:justify-end">{controls}</div>
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
                  step={1}
                  placeholder="Ej: 2000"
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === '') {
                      setOtrosCargos('')
                      return
                    }
                    setOtrosCargos(String(Math.max(0, Math.trunc(Number(raw) || 0))))
                  }}
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
              <Input
                value={otrosCargos}
                type="number"
                min={0}
                step={1}
                placeholder="Ej: 2000"
                onChange={(e) => {
                  const raw = e.target.value
                  if (raw === '') {
                    setOtrosCargos('')
                    return
                  }
                  setOtrosCargos(String(Math.max(0, Math.trunc(Number(raw) || 0))))
                }}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Total</div>
            <div className="pt-2 text-base font-semibold text-zinc-100">{moneyCLP(totals.total)}</div>
            <div className="pt-1 text-xs text-[var(--muted)]">{totals.items} items</div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={confirm} disabled={submitting}>
              {submitting ? 'Registrando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
