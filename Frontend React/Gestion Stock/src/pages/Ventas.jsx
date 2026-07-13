import { useEffect, useMemo, useState } from 'react'
import { ScanLine, X, Pencil, Plus, Wrench } from 'lucide-react'
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
import { SERVICE_PRESETS } from '../data/servicePresets'

export function Ventas() {
  return <VentasPage />
}

function VentasPage() {
  useEffect(() => {
    return () => {
      useAppStore.getState().clearVenta()
    }
  }, [])

  return <ProductosView />
}

function ProductosView() {
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
  const [note, setNote] = useState('')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [descuento, setDescuento] = useState('')
  const [tipoDescuento, setTipoDescuento] = useState('$')
  const [knownProductsById, setKnownProductsById] = useState({})

  const [servicios, setServicios] = useState([])
  const [svInput, setSvInput] = useState({ descripcion: '', cantidad: '1', precio: '' })
  const [svSuggestions, setSvSuggestions] = useState([])

  const [editingIdx, setEditingIdx] = useState(null)
  const [editSv, setEditSv] = useState({ descripcion: '', cantidad: '1', precio: '' })

  const categories = useCatalogStore((s) => s.categories)
  const loadCategories = useCatalogStore((s) => s.loadCategories)

  useEffect(() => { loadCategories() }, [loadCategories])

  useEffect(() => {
    return () => { clearVenta() }
  }, [clearVenta])

  useEffect(() => {
    const q = query.trim()
    if (!q && !categoria) { setResults([]); return }
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
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, categoria])

  const cart = useMemo(() => {
    return ventaItems
      .filter((i) => i.cantidad > 0)
      .map((i) => {
        const p = knownProductsById[i.productoId]
        if (!p) return { product: { id: i.productoId, nombre: 'Producto', codigo: `ID ${i.productoId}`, categoria: '', precio: 0, stock: 0, minimo: 0 }, qty: i.cantidad, missing: true }
        return { product: p, qty: i.cantidad, missing: false }
      })
  }, [ventaItems, knownProductsById])

  const hasProducts = ventaItems.length > 0
  const hasServicios = servicios.length > 0
  const hasAny = hasProducts || hasServicios

  const totals = useMemo(() => {
    const unique = cart.length
    const items = cart.reduce((acc, row) => acc + row.qty, 0)
    const subP = cart.reduce((acc, row) => acc + row.qty * row.product.precio, 0)
    const subS = servicios.reduce((acc, s) => acc + s.monto, 0)
    const extras = otrosCargos === '' ? 0 : Math.max(0, Math.trunc(Number(otrosCargos) || 0))
    const subTotal = subP + subS + extras
    const descRaw = descuento === '' ? 0 : Math.max(0, Math.trunc(Number(descuento) || 0))
    const descMonto = tipoDescuento === '%' ? Math.trunc(subTotal * descRaw / 100) : Math.min(descRaw, subTotal)
    const total = Math.max(0, subTotal - descMonto)
    return { unique, items, subP, subS, extras, subTotal, descMonto, total }
  }, [cart, servicios, otrosCargos, descuento, tipoDescuento])

  function fmt(v) {
    if (!v) return ''
    return Number(v).toLocaleString('es-CL')
  }

  function addProduct(product) {
    setKnownProductsById((prev) => ({ ...prev, [product.id]: product }))
    const existing = ventaItems.find((i) => i.productoId === product.id)
    const nextQty = (existing?.cantidad ?? 0) + 1
    setVentaCantidad({ productoId: product.id, cantidad: nextQty })
    toast.success('Producto agregado', { description: `${product.nombre} (${product.codigo})`, duration: 1000 })
  }

  function inc(id) { const e = ventaItems.find((i) => i.productoId === id); setVentaCantidad({ productoId: id, cantidad: (e?.cantidad ?? 0) + 1 }) }
  function dec(id) { const e = ventaItems.find((i) => i.productoId === id); setVentaCantidad({ productoId: id, cantidad: Math.max(0, (e?.cantidad ?? 0) - 1) }) }
  function removeProduct(id) { setVentaCantidad({ productoId: id, cantidad: 0 }) }

  function addServicio() {
    const desc = svInput.descripcion.trim()
    const cantidad = Math.max(1, Math.trunc(Number(svInput.cantidad) || 1))
    const precio = Math.trunc(Number(svInput.precio) || 0)
    if (!desc) { toast.error('Ingresa una descripcion'); return }
    if (precio <= 0) { toast.error('Ingresa un precio valido'); return }
    setServicios((prev) => [...prev, { descripcion: desc, cantidad, precio, monto: cantidad * precio }])
    setSvInput({ descripcion: '', cantidad: '1', precio: '' })
    setSvSuggestions([])
    toast.success('Servicio agregado', { description: `${desc}`, duration: 1000 })
    setTimeout(() => document.getElementById('sv-desc')?.focus(), 0)
  }

  function handleDescChange(e) {
    const val = e.target.value
    setSvInput((p) => ({ ...p, descripcion: val }))
    if (val.trim().length < 2) { setSvSuggestions([]); return }
    const q = val.trim().toLowerCase()
    const matches = SERVICE_PRESETS.filter((s) => s.toLowerCase().includes(q)).slice(0, 8)
    setSvSuggestions(matches)
  }

  function selectSuggestion(desc) {
    setSvInput({ descripcion: desc, cantidad: '1', precio: '' })
    setSvSuggestions([])
    setTimeout(() => document.getElementById('sv-precio')?.focus(), 50)
  }

  function startEditServicio(idx) {
    setEditingIdx(idx)
    setEditSv({ descripcion: servicios[idx].descripcion, cantidad: String(servicios[idx].cantidad), precio: String(servicios[idx].precio) })
  }

  function saveEditServicio() {
    const desc = editSv.descripcion.trim()
    const cantidad = Math.max(1, Math.trunc(Number(editSv.cantidad) || 1))
    const precio = Math.trunc(Number(editSv.precio) || 0)
    if (!desc || precio <= 0) { toast.error('Datos invalidos'); return }
    setServicios((prev) => {
      const next = [...prev]
      next[editingIdx] = { descripcion: desc, cantidad, precio, monto: cantidad * precio }
      return next
    })
    setEditingIdx(null)
  }

  function removeServicio(idx) { setServicios((prev) => prev.filter((_, i) => i !== idx)) }

  function clearAll() {
    clearVenta()
    setServicios([])
    setOtrosCargos('')
    setMetodoPago('EFECTIVO')
    setNote('')
    setMontoRecibido('')
    setDescuento('')
    setTipoDescuento('$')
    setQuery('')
    setCategoria('')
    setSvInput({ descripcion: '', cantidad: '1', precio: '' })
    setSvSuggestions([])
  }

  async function confirm() {
    const items = ventaItems.filter((i) => i.cantidad > 0).map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }))
    const svs = servicios.filter((s) => s.descripcion.trim() && s.monto > 0)
    if (items.length === 0 && svs.length === 0) return
    setSubmitting(true)
    try {
      await api.post('/sales', { items, servicios: svs, metodoPago, otrosCargos: totals.extras, nota: note, montoRecibido, descuento, tipoDescuento })
      clearAll()
      setConfirmOpen(false)
      const vuelto = metodoPago === 'EFECTIVO' && montoRecibido && Number(montoRecibido) >= totals.total ? Number(montoRecibido) - totals.total : null
      toast.success('Venta registrada', {
        description: vuelto !== null ? `Total ${moneyCLP(totals.total)} · Vuelto ${moneyCLP(vuelto)}` : `Total ${moneyCLP(totals.total)}`,
      })
    } catch (err) {
      if (err.status === 409) {
        const details = err.data?.details || []
        toast.error('Stock insuficiente', {
          description: details.map((d) => `${d.nombre}: disponible ${d.disponible}, solicitado ${d.solicitado}`).join(', '),
        })
      } else {
        toast.error('Error al registrar venta', { description: err.message })
      }
    } finally { setSubmitting(false) }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4">
      <Card className="min-w-0">
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Venta de Productos</div>
            <div className="text-xs text-[var(--muted)] pt-1">Buscar o escanear producto. Tambien puedes agregar servicios.</div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="pb-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_190px] gap-3">
              <SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o codigo..." />
              <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">Todas las categorias</option>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
              </Select>
            </div>
            {query.trim() ? (<div className="pt-2"><Button variant="secondary" size="sm" onClick={() => setQuery('')}><X size={16} /> Limpiar busqueda</Button></div>) : null}
          </div>

          <div className="space-y-2">
            {searching ? (<div className="py-6 text-xs text-[var(--muted)]">Buscando...</div>) : (
              results.slice(0, 10).map((p) => {
                const isLow = p.stock <= p.minimo
                return (
                  <button key={p.id} className="w-full text-left" onClick={() => addProduct(p)}>
                    <div className={cn('flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border bg-white/3 px-4 py-3 transition', 'border-[rgba(255,255,255,0.06)] hover:bg-white/5')}>
                      <div className="min-w-0 flex-1">
                        <div className="min-w-0 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-zinc-100 truncate">{p.nombre}</div>
                            <div className="text-xs text-[var(--muted)] pt-0.5 truncate">{p.codigo} · {p.categoria}</div>
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
              <div className="py-6 text-xs text-[var(--muted)]">{query.trim() || categoria ? 'Sin resultados.' : 'Ingresa un codigo o escribe el nombre de un producto para ver precio y stock.'}</div>
            ) : null}
          </div>

          <div className="pt-4 text-xs text-[var(--muted)] flex items-center gap-2">
            <ScanLine size={14} /> Tip: pega un codigo (scanner) o busca por nombre.
          </div>

          <div className="border-t border-[rgba(255,255,255,0.06)] my-4" />

          <div>
            <div className="text-sm font-semibold ">Servicios</div>
            <div className="space-y-2 mt-3">
              <div className="relative">
                <Input id="sv-desc" value={svInput.descripcion} placeholder="Escribe para buscar servicio..." maxLength={255}
                  onChange={handleDescChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.target.value.trim() && svSuggestions.length > 0) {
                        selectSuggestion(svSuggestions[0])
                      } else if (svInput.precio.trim()) {
                        addServicio()
                      } else {
                        document.getElementById('sv-precio')?.focus()
                      }
                    }
                    if (e.key === 'Escape') setSvSuggestions([])
                  }}
                  onBlur={() => setTimeout(() => setSvSuggestions([]), 200)} />
                {svSuggestions.length > 0 ? (
                  <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden">
                    {svSuggestions.map((s, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-3 py-2 text-sm text-zinc-100 hover:bg-white/5 transition border-b border-[rgba(255,255,255,0.04)] last:border-0"
                        onMouseDown={() => selectSuggestion(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[60px_1fr] gap-2">
                <Input id="sv-cant" value={svInput.cantidad} type="number" min={1} step={1} placeholder="Cant"
                  onChange={(e) => setSvInput((p) => ({ ...p, cantidad: e.target.value }))} />
                <Input id="sv-precio" value={fmt(svInput.precio)} type="text" inputMode="numeric" placeholder="$ Precio Unitario"
                  onChange={(e) => setSvInput((p) => ({ ...p, precio: e.target.value.replace(/\D/g, '') }))}
                  onKeyDown={(e) => e.key === 'Enter' && addServicio()} />
              </div>
              <div className="flex justify-center pt-2">
                <Button variant="primary" size="sm" onClick={addServicio}>
                  <Plus size={16} /> Agregar servicio
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Resumen</div>
            <div className="text-xs text-[var(--muted)] pt-1">Productos y servicios agregados.</div>
          </div>
          {hasAny ? <Badge variant="info">{totals.items + servicios.length} items</Badge> : null}
        </CardHeader>
        <CardBody>
          {!hasAny ? (
            <div className="py-6 text-sm text-[var(--muted)]">Aun no has agregado nada.</div>
          ) : (
            <div className="space-y-4">
              {cart.length > 0 ? (
                <div>
                  <div className="text-xs uppercase tracking-[0.15em] text-[var(--muted)] pb-2 font-semibold">Productos</div>
                  <div className="space-y-2">
                    {cart.map((row) => {
                      const prod = row.product
                      return (
                        <div key={prod.id} className="flex flex-col gap-2 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-zinc-100 truncate">{prod.nombre}</div>
                            <div className="text-xs text-[var(--muted)] pt-0.5 truncate">{prod.codigo}</div>
                          </div>
                          <div className="pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <PriceBlock value={prod.precio} align="left" className="hidden sm:flex" />
                            <PriceBlock value={prod.precio} align="center" className="sm:hidden self-center" />
                            <div className="flex items-center justify-center sm:justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => dec(prod.id)} disabled={row.missing}>-</Button>
                              <Badge variant="neutral">{row.qty}</Badge>
                              <Button variant="ghost" size="sm" onClick={() => inc(prod.id)} disabled={row.missing}>+</Button>
                              <Button variant="ghost" size="sm" onClick={() => removeProduct(prod.id)} aria-label="Quitar"><X size={16} /></Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {servicios.length > 0 ? (
                <div>
                  <div className="text-xs uppercase tracking-[0.15em] text-[var(--muted)] pb-2 font-semibold">Servicios</div>
                  <div className="space-y-2">
                    {servicios.map((sv, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-3 py-2">
                        {editingIdx === idx ? (
                          <>
                            <Input value={editSv.descripcion} maxLength={255} onChange={(e) => setEditSv((p) => ({ ...p, descripcion: e.target.value }))} />
                            <Input value={editSv.cantidad} type="number" min={1} className="w-16" onChange={(e) => setEditSv((p) => ({ ...p, cantidad: e.target.value }))} />
                            <Input value={fmt(editSv.precio)} type="text" inputMode="numeric" className="w-20" onChange={(e) => setEditSv((p) => ({ ...p, precio: e.target.value.replace(/\D/g, '') }))} />
                            <Button variant="primary" size="sm" onClick={saveEditServicio}>Ok</Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingIdx(null)}><X size={14} /></Button>
                          </>
                        ) : (
                          <>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm text-zinc-100 truncate">{sv.descripcion}</div>
                              <div className="text-[11px] text-[var(--muted)]">{sv.cantidad} x {moneyCLP(sv.precio)}</div>
                            </div>
                            <div className="text-sm font-medium text-zinc-100 tabular-nums w-20 text-right">{moneyCLP(sv.monto)}</div>
                            <Button variant="ghost" size="sm" onClick={() => startEditServicio(idx)} aria-label="Editar"><Pencil size={18} /></Button>
                            <Button variant="ghost" size="sm" onClick={() => removeServicio(idx)} aria-label="Quitar"><X size={18} /></Button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="pt-5 border-t border-[rgba(255,255,255,0.06)] mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">Productos</span>
              <span className="text-zinc-100 font-medium">{cart.length}</span>
            </div>
            {servicios.length > 0 ? (
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-[var(--muted)]">Servicios</span>
                <span className="text-zinc-100 font-medium">{servicios.length}</span>
              </div>
            ) : null}
            <div className="pt-4 grid grid-cols-1 gap-2">
              <div className="grid grid-cols-[1fr_140px] items-center gap-2">
                <div className="text-sm text-[var(--muted)]">Metodo de pago</div>
                <Select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="FACTURA">Factura</option>
                </Select>
              </div>
              {totals.subP > 0 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">Subtotal productos</span>
                  <span className="text-zinc-100 font-medium">{moneyCLP(totals.subP)}</span>
                </div>
              ) : null}
              {totals.subS > 0 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">Subtotal servicios</span>
                  <span className="text-zinc-100 font-medium">{moneyCLP(totals.subS)}</span>
                </div>
              ) : null}
              <div className="grid grid-cols-[1fr_140px] items-center gap-2">
                <div className="text-sm text-[var(--muted)]">Otros cobros</div>
                <Input value={fmt(otrosCargos)} type="text" inputMode="numeric" placeholder="Ej: 2.000"
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '')
                    if (raw === '') { setOtrosCargos(''); return }
                    setOtrosCargos(String(Math.max(0, Math.trunc(Number(raw) || 0))))
                  }} />
              </div>
              <div className="grid grid-cols-[1fr_140px] items-center gap-2">
                <div className="text-sm text-[var(--muted)]">Descuento</div>
                <div className="flex gap-1">
                  <Input value={fmt(descuento)} type="text" inputMode="numeric" placeholder="0"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '')
                      if (raw === '') { setDescuento(''); return }
                      setDescuento(String(Math.max(0, Math.trunc(Number(raw) || 0))))
                    }} />
                  <Select value={tipoDescuento} onChange={(e) => setTipoDescuento(e.target.value)} className="w-14 shrink-0">
                    <option value="$">$</option>
                    <option value="%">%</option>
                  </Select>
                </div>
              </div>
              {totals.descMonto > 0 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">Descuento {tipoDescuento === '%' ? `(${fmt(descuento)}%)` : ''}</span>
                  <span className="text-red-400 font-medium">-{moneyCLP(totals.descMonto)}</span>
                </div>
              ) : null}
              <div className="text-sm text-[var(--muted)]">Notas</div>
              <Input value={note} placeholder="Opcional" maxLength={255} onChange={(e) => setNote(e.target.value)} />
              <div className="flex items-center justify-between text-base pt-1">
                <span className="text-zinc-200 font-semibold">Total</span>
                <span className="text-zinc-100 font-semibold">{moneyCLP(totals.total)}</span>
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <Button variant="secondary" className="w-full justify-center" onClick={clearAll} disabled={!hasAny}>
                Limpiar
              </Button>
              <Button variant="primary" className="w-full justify-center" onClick={() => setConfirmOpen(true)} disabled={!hasAny || submitting}>
                {submitting ? 'Registrando...' : 'Registrar salida'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Registrar salida">
        <div className="space-y-3">
          <Title as="h2" className="text-lg">Confirmacion</Title>
          <Subtle>Confirma la venta por {moneyCLP(totals.total)}.</Subtle>

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
              <Input value={fmt(otrosCargos)} type="text" inputMode="numeric" placeholder="Ej: 2.000"
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  if (raw === '') { setOtrosCargos(''); return }
                  setOtrosCargos(String(Math.max(0, Math.trunc(Number(raw) || 0))))
                }} />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-2">
            <div className="text-xs text-zinc-400">Descuento</div>
            <div className="flex gap-1">
              <Input value={fmt(descuento)} type="text" inputMode="numeric" className="w-20 text-right text-sm" placeholder="0"
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  if (raw === '') { setDescuento(''); return }
                  setDescuento(String(Math.max(0, Math.trunc(Number(raw) || 0))))
                }} />
              <Select value={tipoDescuento} onChange={(e) => setTipoDescuento(e.target.value)} className="w-14">
                <option value="$">$</option>
                <option value="%">%</option>
              </Select>
            </div>
          </div>

          {cart.length > 0 ? (
            <div>
              <div className="text-xs uppercase tracking-[0.15em] text-[var(--muted)] mb-1 font-semibold">Productos</div>
              {cart.map((row) => (
                <div key={row.product.id} className="flex justify-between text-sm py-0.5">
                  <span className="text-zinc-100">{row.product.nombre} x{row.qty}</span>
                  <span className="text-zinc-100 font-medium tabular-nums">{moneyCLP(row.qty * row.product.precio)}</span>
                </div>
              ))}
            </div>
          ) : null}

          {servicios.length > 0 ? (
            <div>
              <div className="text-xs uppercase tracking-[0.15em] text-[var(--muted)] mb-1 font-semibold">Servicios</div>
              {servicios.map((sv, idx) => (
                <div key={idx} className="flex justify-between text-sm py-0.5">
                  <span className="text-zinc-100">{sv.descripcion}</span>
                  <span className="text-zinc-100 font-medium tabular-nums">{moneyCLP(sv.monto)}</span>
                </div>
              ))}
            </div>
          ) : null}

          {note ? <Subtle>Notas: {note}</Subtle> : null}

          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Total</div>
            <div className="pt-2 text-base font-semibold text-zinc-100">{moneyCLP(totals.total)}</div>
            {metodoPago === 'EFECTIVO' ? (
              <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] mt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">Con cuanto paga?</span>
                  <Input value={fmt(montoRecibido)} type="text" inputMode="numeric" className="w-24 text-right text-sm"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '')
                      if (raw === '') { setMontoRecibido(''); return }
                      setMontoRecibido(String(Math.max(0, Math.trunc(Number(raw) || 0))))
                    }} />
                </div>
                {montoRecibido !== '' && Number(montoRecibido) > 0 ? (() => {
                  const r = Math.trunc(Number(montoRecibido))
                  const ok = r >= totals.total
                  return (
                    <div className="pt-4">
                      <div className={`text-xs uppercase tracking-[0.18em] ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
                        {ok ? 'VUELTO' : 'FALTA'}
                      </div>
                      <div className={`pt-1 text-base font-semibold tabular-nums ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
                        {ok ? moneyCLP(r - totals.total) : moneyCLP(totals.total - r)}
                      </div>
                    </div>
                  )
                })() : null}
              </div>
            ) : null}
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


