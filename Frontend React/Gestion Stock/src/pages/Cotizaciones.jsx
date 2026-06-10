import { useEffect, useMemo, useState } from 'react'
import { Package, Wrench, PlusCircle, Plus, X, Pencil } from 'lucide-react'
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

  const [productos, setProductos] = useState([])
  const [knownProductsById, setKnownProductsById] = useState({})
  const [servicios, setServicios] = useState([])
  const [otrosCostos, setOtrosCostos] = useState([])

  const [svInput, setSvInput] = useState({ descripcion: '', monto: '' })
  const [ocInput, setOcInput] = useState({ descripcion: '', monto: '' })

  const [editingIdx, setEditingIdx] = useState(null)
  const [editingTipo, setEditingTipo] = useState(null)
  const [editSv, setEditSv] = useState({ descripcion: '', monto: '' })
  const [editOc, setEditOc] = useState({ descripcion: '', monto: '' })

  const categories = useCatalogStore((s) => s.categories)
  const loadCategories = useCatalogStore((s) => s.loadCategories)

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

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

  const totals = useMemo(() => {
    const subP = productos.reduce((acc, p) => acc + p.cantidad * (knownProductsById[p.productoId]?.precio || 0), 0)
    const subS = servicios.reduce((acc, s) => acc + s.monto, 0)
    const subO = otrosCostos.reduce((acc, o) => acc + o.monto, 0)
    return { subP, subS, subO, total: subP + subS + subO }
  }, [productos, servicios, otrosCostos, knownProductsById])

  function addProducto(p) {
    setKnownProductsById((prev) => ({ ...prev, [p.id]: p }))
    setProductos((prev) => {
      const idx = prev.findIndex((i) => i.productoId === p.id)
      if (idx === -1) return [...prev, { productoId: p.id, cantidad: 1 }]
      const next = [...prev]
      next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 }
      return next
    })
    toast.success(p.nombre, { description: 'Agregado a la cotizacion', duration: 1200 })
  }

  function qtyProducto(id, delta) {
    setProductos((prev) => {
      const idx = prev.findIndex((i) => i.productoId === id)
      if (idx === -1) return prev
      const qty = prev[idx].cantidad + delta
      if (qty <= 0) return prev.filter((i) => i.productoId !== id)
      const next = [...prev]
      next[idx] = { ...next[idx], cantidad: qty }
      return next
    })
  }

  function removeProducto(id) {
    setProductos((prev) => prev.filter((i) => i.productoId !== id))
  }

  function addServicio() {
    const desc = svInput.descripcion.trim()
    const monto = Math.trunc(Number(svInput.monto) || 0)
    if (!desc) { toast.error('Ingresa una descripcion'); return }
    if (monto <= 0) { toast.error('Ingresa un monto valido'); return }
    setServicios((prev) => [...prev, { descripcion: desc, monto }])
    setSvInput({ descripcion: '', monto: '' })
  }

  function startEditServicio(idx) {
    setEditingIdx(idx)
    setEditingTipo('servicio')
    setEditSv({ ...servicios[idx] })
  }

  function saveEditServicio() {
    const desc = editSv.descripcion.trim()
    const monto = Math.trunc(Number(editSv.monto) || 0)
    if (!desc || monto <= 0) { toast.error('Datos invalidos'); return }
    setServicios((prev) => {
      const next = [...prev]
      next[editingIdx] = { descripcion: desc, monto }
      return next
    })
    cancelEdit()
  }

  function removeServicio(idx) {
    setServicios((prev) => prev.filter((_, i) => i !== idx))
  }

  function addOtroCosto() {
    const desc = ocInput.descripcion.trim()
    const monto = Math.trunc(Number(ocInput.monto) || 0)
    if (!desc) { toast.error('Ingresa una descripcion'); return }
    if (monto <= 0) { toast.error('Ingresa un monto valido'); return }
    setOtrosCostos((prev) => [...prev, { descripcion: desc, monto }])
    setOcInput({ descripcion: '', monto: '' })
  }

  function startEditOtroCosto(idx) {
    setEditingIdx(idx)
    setEditingTipo('otrocosto')
    setEditOc({ ...otrosCostos[idx] })
  }

  function saveEditOtroCosto() {
    const desc = editOc.descripcion.trim()
    const monto = Math.trunc(Number(editOc.monto) || 0)
    if (!desc || monto <= 0) { toast.error('Datos invalidos'); return }
    setOtrosCostos((prev) => {
      const next = [...prev]
      next[editingIdx] = { descripcion: desc, monto }
      return next
    })
    cancelEdit()
  }

  function removeOtroCosto(idx) {
    setOtrosCostos((prev) => prev.filter((_, i) => i !== idx))
  }

  function cancelEdit() {
    setEditingIdx(null)
    setEditingTipo(null)
  }

  const hasAny = productos.length > 0 || servicios.length > 0 || otrosCostos.length > 0

  function clearAll() {
    setProductos([])
    setServicios([])
    setOtrosCostos([])
    setNote('')
    setSvInput({ descripcion: '', monto: '' })
    setOcInput({ descripcion: '', monto: '' })
    setQuery('')
    setCategoria('')
  }

  async function confirm() {
    const items = productos.map((p) => ({ productoId: p.productoId, cantidad: p.cantidad }))
    const svs = servicios.filter((s) => s.descripcion.trim() && s.monto > 0)
    const ocs = otrosCostos.filter((o) => o.descripcion.trim() && o.monto > 0)
    if (items.length === 0 && svs.length === 0 && ocs.length === 0) return
    setSubmitting(true)
    try {
      await api.post('/quotations', { items, servicios: svs, otrosCostos: ocs, nota: note })
      clearAll()
      setConfirmOpen(false)
      toast.success('Cotizacion registrada', { description: 'Total ' + moneyCLP(totals.total) })
    } catch (err) {
      toast.error('Error al registrar', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4">

        {/* LEFT: add items */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <div className="text-sm font-semibold">Cotizaciones</div>
                <div className="text-xs text-[var(--muted)] pt-1">Taller mecanico</div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-4 text-sm text-[var(--muted)] pb-4">
                <span>N° <span className="text-zinc-100 font-semibold">Auto</span></span>
                <span className="text-zinc-600">|</span>
                <span>{new Date().toLocaleDateString('es-CL')}</span>
              </div>

              <div className="pb-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_190px] gap-3">
                   <SearchBar
                    id="product-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar producto por nombre o codigo..."
                  />
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100"
                  >
                    <option value="">Todas las categorias</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                {query.trim() ? (
                  <div className="pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setQuery('')}>
                      <X size={16} /> Limpiar
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {searching ? (
                  <div className="py-4 text-xs text-[var(--muted)]">Buscando...</div>
                ) : (
                  results.slice(0, 10).map((p) => (
                    <button key={p.id} className="w-full text-left" onClick={() => addProducto(p)}>
                      <div className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3 hover:bg-white/5 transition">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-zinc-100 truncate">{p.nombre}</div>
                          <div className="text-xs text-[var(--muted)] truncate">{p.codigo} · {p.categoria}</div>
                        </div>
                        <PriceBlock value={p.precio} align="right" />
                      </div>
                    </button>
                  ))
                )}
                {!searching && results.length === 0 && (query.trim() || categoria) ? (
                  <div className="py-4 text-xs text-[var(--muted)]">Sin resultados.</div>
                ) : null}
              </div>

              <div className="border-t border-[rgba(255,255,255,0.06)] my-4" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold text-zinc-300 pb-2 flex items-center gap-2">
                    <Wrench size={14} /> Servicio
                  </div>
                  <div className="space-y-2">
                    <Input id="sv-desc" value={svInput.descripcion} placeholder="Descripcion" maxLength={255}
                      onChange={(e) => setSvInput((p) => ({ ...p, descripcion: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && addServicio()} />
                    <div className="flex gap-2">
                      <Input value={svInput.monto} type="number" min={0} step={1} placeholder="Valor $"
                        onChange={(e) => setSvInput((p) => ({ ...p, monto: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addServicio()} />
                      <Button variant="primary" size="sm" className="shrink-0" onClick={addServicio}>
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-300 pb-2 flex items-center gap-2">
                    <PlusCircle size={14} /> Otro Costo
                  </div>
                  <div className="space-y-2">
                    <Input id="oc-desc" value={ocInput.descripcion} placeholder="Descripcion" maxLength={255}
                      onChange={(e) => setOcInput((p) => ({ ...p, descripcion: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && addOtroCosto()} />
                    <div className="flex gap-2">
                      <Input value={ocInput.monto} type="number" min={0} step={1} placeholder="Valor $"
                        onChange={(e) => setOcInput((p) => ({ ...p, monto: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addOtroCosto()} />
                      <Button variant="primary" size="sm" className="shrink-0" onClick={addOtroCosto}>
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div className="text-xs text-[var(--muted)] pb-1">Observaciones</div>
                <Input value={note} placeholder="Opcional" maxLength={255}
                  onChange={(e) => setNote(e.target.value)} />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* RIGHT: items + totals */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <div className="text-sm font-semibold">Detalle</div>
                <div className="text-xs text-[var(--muted)] pt-1">Items agregados</div>
              </div>
              {hasAny ? <Badge variant="info">{productos.length + servicios.length + otrosCostos.length} items</Badge> : null}
            </CardHeader>
            <CardBody>
              {!hasAny ? (
                <div className="py-8 text-sm text-[var(--muted)] text-center">
                  Agrega productos, servicios u otros costos usando los botones de la izquierda.
                </div>
              ) : (
                <div className="space-y-5">

                  {productos.length > 0 ? (
                    <div>
                      <div className="text-xs uppercase tracking-[0.15em] text-[var(--muted)] pb-2 font-semibold">Productos</div>
                      <div className="space-y-2">
                        {productos.map((item) => {
                          const p = knownProductsById[item.productoId]
                          if (!p) return null
                          return (
                            <div key={item.productoId} className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-3 py-2">
                              <div className="min-w-0 flex-1">
                                <div className="text-sm text-zinc-100 truncate">{p.nombre}</div>
                                <div className="text-xs text-[var(--muted)]">{moneyCLP(p.precio)} c/u</div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => qtyProducto(item.productoId, -1)}>-</Button>
                                <span className="text-sm font-medium text-zinc-100 w-6 text-center tabular-nums">{item.cantidad}</span>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => qtyProducto(item.productoId, 1)}>+</Button>
                              </div>
                              <div className="text-sm font-medium text-zinc-100 tabular-nums w-20 text-right">
                                {moneyCLP(item.cantidad * p.precio)}
                              </div>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeProducto(item.productoId)} aria-label="Quitar">
                                <X size={14} />
                              </Button>
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
                            {editingTipo === 'servicio' && editingIdx === idx ? (
                              <>
                                <Input value={editSv.descripcion} maxLength={255}
                                  onChange={(e) => setEditSv((p) => ({ ...p, descripcion: e.target.value }))} />
                                <Input value={editSv.monto} type="number" min={0}
                                  onChange={(e) => setEditSv((p) => ({ ...p, monto: e.target.value }))}
                                  className="w-24" />
                                <Button variant="primary" size="sm" onClick={saveEditServicio}>Ok</Button>
                                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                                  <X size={14} />
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm text-zinc-100 truncate">{sv.descripcion}</div>
                                </div>
                                <div className="text-sm font-medium text-zinc-100 tabular-nums w-20 text-right">
                                  {moneyCLP(sv.monto)}
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => startEditServicio(idx)} aria-label="Editar servicio">
                                  <Pencil size={18} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => removeServicio(idx)} aria-label="Quitar servicio">
                                  <X size={18} />
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {otrosCostos.length > 0 ? (
                    <div>
                      <div className="text-xs uppercase tracking-[0.15em] text-[var(--muted)] pb-2 font-semibold">Otros Costos</div>
                      <div className="space-y-2">
                        {otrosCostos.map((oc, idx) => (
                          <div key={idx} className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-3 py-2">
                            {editingTipo === 'otrocosto' && editingIdx === idx ? (
                              <>
                                <Input value={editOc.descripcion} maxLength={255}
                                  onChange={(e) => setEditOc((p) => ({ ...p, descripcion: e.target.value }))} />
                                <Input value={editOc.monto} type="number" min={0}
                                  onChange={(e) => setEditOc((p) => ({ ...p, monto: e.target.value }))}
                                  className="w-24" />
                                <Button variant="primary" size="sm" onClick={saveEditOtroCosto}>Ok</Button>
                                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                                  <X size={14} />
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm text-zinc-100 truncate">{oc.descripcion}</div>
                                </div>
                                <div className="text-sm font-medium text-zinc-100 tabular-nums w-20 text-right">
                                  {moneyCLP(oc.monto)}
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => startEditOtroCosto(idx)} aria-label="Editar costo">
                                  <Pencil size={18} />
                                </Button>
                                 <Button variant="ghost" size="sm" onClick={() => removeOtroCosto(idx)} aria-label="Quitar costo">
                                  <X size={18} />
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="border-t border-[rgba(255,255,255,0.06)] pt-4 space-y-1">
                    {totals.subP > 0 ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--muted)]">Subtotal Productos</span>
                        <span className="text-zinc-100 font-medium tabular-nums">{moneyCLP(totals.subP)}</span>
                      </div>
                    ) : null}
                    {totals.subS > 0 ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--muted)]">Subtotal Servicios</span>
                        <span className="text-zinc-100 font-medium tabular-nums">{moneyCLP(totals.subS)}</span>
                      </div>
                    ) : null}
                    {totals.subO > 0 ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--muted)]">Subtotal Otros Costos</span>
                        <span className="text-zinc-100 font-medium tabular-nums">{moneyCLP(totals.subO)}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between text-base pt-2 border-t border-[rgba(255,255,255,0.06)]">
                      <span className="text-zinc-200 font-semibold">Total General</span>
                      <span className="text-zinc-100 font-bold text-lg tabular-nums">{moneyCLP(totals.total)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="secondary" className="w-full justify-center" onClick={clearAll}>
                      Limpiar
                    </Button>
                    <Button variant="primary" className="w-full justify-center" onClick={() => setConfirmOpen(true)} disabled={submitting}>
                      {submitting ? 'Guardando...' : 'Guardar Cotizacion'}
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="flex justify-center pt-6">
        <a href="#/cotizaciones/historial">
          <Button variant="secondary">Ver Historial de Cotizaciones</Button>
        </a>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Guardar Cotizacion">
        <div className="space-y-3">
          <Title as="h2" className="text-lg">Confirmacion</Title>
          <Subtle>Confirma la cotizacion por {moneyCLP(totals.total)}.</Subtle>

          {productos.length > 0 ? (
            <div>
              <div className="text-xs uppercase tracking-[0.15em] text-[var(--muted)] mb-1 font-semibold">Productos</div>
              {productos.map((item) => {
                const p = knownProductsById[item.productoId]
                if (!p) return null
                return (
                  <div key={item.productoId} className="flex justify-between text-sm py-0.5">
                    <span className="text-zinc-100">{p.nombre} x{item.cantidad}</span>
                    <span className="text-zinc-100 font-medium tabular-nums">{moneyCLP(item.cantidad * p.precio)}</span>
                  </div>
                )
              })}
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

          {otrosCostos.length > 0 ? (
            <div>
              <div className="text-xs uppercase tracking-[0.15em] text-[var(--muted)] mb-1 font-semibold">Otros Costos</div>
              {otrosCostos.map((oc, idx) => (
                <div key={idx} className="flex justify-between text-sm py-0.5">
                  <span className="text-zinc-100">{oc.descripcion}</span>
                  <span className="text-zinc-100 font-medium tabular-nums">{moneyCLP(oc.monto)}</span>
                </div>
              ))}
            </div>
          ) : null}

          {note ? <Subtle>Observaciones: {note}</Subtle> : null}

          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Total</div>
            <div className="pt-1 text-lg font-bold text-zinc-100">{moneyCLP(totals.total)}</div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={confirm} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
