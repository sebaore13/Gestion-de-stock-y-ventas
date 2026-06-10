import { useEffect, useMemo, useState } from 'react'
import { Plus, ScanLine, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../services/api'
import { Badge } from '../components/atoms/Badge'
import { Button } from '../components/atoms/Button'
import { Card, CardBody, CardHeader } from '../components/atoms/Card'
import { Input } from '../components/atoms/Input'
import { Modal } from '../components/atoms/Modal'
import { Subtle, Title } from '../components/atoms/Title'
import { PriceBlock } from '../components/atoms/PriceBlock'
import { SearchBar } from '../components/molecules/SearchBar'
import { useCatalogStore } from '../store/catalog.store'
import { moneyCLP } from '../design/format'

export function Cotizaciones() {
  const [query, setQuery] = useState('')
  const [categoria, setCategoria] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState('')
  const [items, setItems] = useState([])
  const [knownProductsById, setKnownProductsById] = useState({})
  const [otrosCostos, setOtrosCostos] = useState([])

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
    return items
      .filter((i) => i.cantidad > 0)
      .map((i) => {
        const p = knownProductsById[i.productoId]
        if (!p) return null
        return { product: p, qty: i.cantidad }
      })
      .filter(Boolean)
  }, [items, knownProductsById])

  const totals = useMemo(() => {
    const unique = cart.length
    const itemsCount = cart.reduce((acc, row) => acc + row.qty, 0)
    const productsTotal = cart.reduce((acc, row) => acc + row.qty * row.product.precio, 0)
    const otrosTotal = otrosCostos.reduce((acc, oc) => acc + oc.monto, 0)
    return { unique, items: itemsCount, productsTotal, otrosTotal, total: productsTotal + otrosTotal }
  }, [cart, otrosCostos])

  function add(product) {
    setKnownProductsById((prev) => ({ ...prev, [product.id]: product }))
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productoId === product.id)
      if (idx === -1) return [...prev, { productoId: product.id, cantidad: 1 }]
      const next = [...prev]
      next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 }
      return next
    })
    toast.success('Producto agregado', {
      description: `${product.nombre} (${product.codigo})`,
      duration: 1000,
    })
  }

  function inc(id) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productoId === id)
      if (idx === -1) return prev
      const next = [...prev]
      next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 }
      return next
    })
  }

  function dec(id) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productoId === id)
      if (idx === -1) return prev
      const qty = prev[idx].cantidad - 1
      if (qty <= 0) return prev.filter((i) => i.productoId !== id)
      const next = [...prev]
      next[idx] = { ...next[idx], cantidad: qty }
      return next
    })
  }

  function remove(id) {
    setItems((prev) => prev.filter((i) => i.productoId !== id))
  }

  function addOtroCosto() {
    setOtrosCostos((prev) => [...prev, { descripcion: '', monto: 0 }])
  }

  function updateOtroCosto(idx, field, value) {
    setOtrosCostos((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: field === 'monto' ? Math.max(0, Math.trunc(Number(value) || 0)) : value }
      return next
    })
  }

  function removeOtroCosto(idx) {
    setOtrosCostos((prev) => prev.filter((_, i) => i !== idx))
  }

  function clearAll() {
    setItems([])
    setNote('')
    setOtrosCostos([])
  }

  async function confirm() {
    const payload = items.filter((i) => i.cantidad > 0)
    const costos = otrosCostos.filter((oc) => oc.descripcion.trim() && oc.monto > 0)
    if (payload.length === 0 && costos.length === 0) return
    setSubmitting(true)
    try {
      await api.post('/quotations', { items: payload, otrosCostos: costos, nota: note })
      clearAll()
      setConfirmOpen(false)
      toast.success('Cotizacion registrada', {
        description: `Total ${moneyCLP(totals.total)}`,
      })
    } catch (err) {
      toast.error('Error al registrar cotizacion', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const hasAnyItem = items.length > 0 || otrosCostos.some((oc) => oc.descripcion.trim() && oc.monto > 0)

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4">
        <Card className="min-w-0">
          <CardHeader>
            <div>
              <div className="text-sm font-semibold">Cotizaciones</div>
              <div className="text-xs text-[var(--muted)] pt-1">
                Buscar o escanear producto para cotizar.
              </div>
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
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="">Todas las categorias</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
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
                results.slice(0, 10).map((p) => (
                  <button key={p.id} className="w-full text-left" onClick={() => add(p)}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border bg-white/3 px-4 py-3 transition border-[rgba(255,255,255,0.06)] hover:bg-white/5">
                      <div className="min-w-0 flex-1">
                        <div className="min-w-0 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-zinc-100 truncate">{p.nombre}</div>
                            <div className="text-xs text-[var(--muted)] pt-0.5 truncate">
                              {p.codigo} · {p.categoria}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-full sm:w-auto flex items-center justify-center sm:justify-end">
                        <PriceBlock value={p.precio} align="right" />
                      </div>
                    </div>
                  </button>
                ))
              )}
              {!searching && results.length === 0 ? (
                <div className="py-6 text-xs text-[var(--muted)]">
                  {query.trim() || categoria
                    ? 'Sin resultados.'
                    : 'Ingresa un codigo o escribe el nombre de un producto.'}
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
              <div className="text-xs text-[var(--muted)] pt-1">Productos cotizados.</div>
            </div>
            <Badge variant={totals.items ? 'info' : 'neutral'}>{totals.items} items</Badge>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {cart.map((row) => {
                const prod = row.product
                return (
                  <div
                    key={prod.id}
                    className="flex flex-col gap-2 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-100 truncate">{prod.nombre}</div>
                      <div className="text-xs text-[var(--muted)] pt-0.5 truncate">{prod.codigo}</div>
                    </div>
                    <div className="pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <PriceBlock value={prod.precio} align="left" />
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => dec(prod.id)}>-</Button>
                        <Badge variant="neutral">{row.qty}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => inc(prod.id)}>+</Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(prod.id)} aria-label="Quitar">
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {items.length === 0 ? (
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

              <div className="pt-5 border-t border-[rgba(255,255,255,0.06)] mt-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-zinc-200">Otros Costos</span>
                  <Button variant="ghost" size="sm" onClick={addOtroCosto}>
                    <Plus size={14} />
                    Agregar
                  </Button>
                </div>
                <div className="space-y-2">
                  {otrosCostos.map((oc, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <Input
                          value={oc.descripcion}
                          placeholder="Descripcion"
                          maxLength={255}
                          onChange={(e) => updateOtroCosto(idx, 'descripcion', e.target.value)}
                        />
                      </div>
                      <div className="w-28 shrink-0">
                        <Input
                          value={oc.monto || ''}
                          type="number"
                          min={0}
                          step={1}
                          placeholder="Monto"
                          onChange={(e) => {
                            const raw = e.target.value
                            updateOtroCosto(idx, 'monto', raw === '' ? 0 : raw)
                          }}
                        />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeOtroCosto(idx)} aria-label="Quitar costo">
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                  {otrosCostos.length === 0 ? (
                    <div className="text-xs text-[var(--muted)] py-1">
                      Agrega costos adicionales como mano de obra, transporte, etc.
                    </div>
                  ) : null}
                </div>
              </div>

              {totals.otrosTotal > 0 ? (
                <div className="flex items-center justify-between text-sm pt-3">
                  <span className="text-[var(--muted)]">Subtotal productos</span>
                  <span className="text-zinc-100 font-medium">{moneyCLP(totals.productsTotal)}</span>
                </div>
              ) : null}
              {totals.otrosTotal > 0 ? (
                <div className="flex items-center justify-between text-sm pt-1">
                  <span className="text-[var(--muted)]">Costos adicionales</span>
                  <span className="text-zinc-100 font-medium">{moneyCLP(totals.otrosTotal)}</span>
                </div>
              ) : null}

              <div className="grid grid-cols-[1fr_140px] items-center gap-2 pt-3">
                <div className="text-sm text-[var(--muted)]">Nota</div>
                <Input
                  value={note}
                  placeholder="Opcional"
                  maxLength={255}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between text-base pt-3">
                <span className="text-zinc-200 font-semibold">Total</span>
                <span className="text-zinc-100 font-semibold">{moneyCLP(totals.total)}</span>
              </div>

              <div className="pt-4 flex gap-2">
                <Button variant="secondary" className="w-full justify-center" onClick={clearAll} disabled={!hasAnyItem}>
                  Limpiar
                </Button>
                <Button variant="primary" className="w-full justify-center" onClick={() => setConfirmOpen(true)} disabled={!hasAnyItem || submitting}>
                  {submitting ? 'Registrando...' : 'Crear cotizacion'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex justify-center pt-6">
        <a href="#/cotizaciones/historial">
          <Button variant="secondary">Ver Historial de Cotizaciones</Button>
        </a>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Crear cotizacion">
        <div className="space-y-3">
          <Title as="h2" className="text-lg">Confirmacion</Title>
          <Subtle>Confirma la cotizacion por {moneyCLP(totals.total)}.</Subtle>
          {cart.length > 0 ? (
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)] mb-2">Productos</div>
              <div className="space-y-1">
                {cart.map((row) => (
                  <div key={row.product.id} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-100 truncate">{row.product.nombre} x{row.qty}</span>
                    <span className="text-zinc-100 font-medium tabular-nums">{moneyCLP(row.qty * row.product.precio)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {totals.otrosTotal > 0 ? (
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)] mb-2">Costos adicionales</div>
              <div className="space-y-1">
                {otrosCostos.filter((oc) => oc.descripcion.trim() && oc.monto > 0).map((oc, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-100 truncate">{oc.descripcion}</span>
                    <span className="text-zinc-100 font-medium tabular-nums">{moneyCLP(oc.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {note ? <Subtle>Nota: {note}</Subtle> : null}
          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Total</div>
            <div className="pt-2 text-base font-semibold text-zinc-100">{moneyCLP(totals.total)}</div>
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
