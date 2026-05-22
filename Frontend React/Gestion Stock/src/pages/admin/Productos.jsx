import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../services/api'
import { useCatalogStore } from '../../store/catalog.store'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'
import { Badge } from '../../components/atoms/Badge'
import { Button } from '../../components/atoms/Button'
import { Input } from '../../components/atoms/Input'
import { Select } from '../../components/atoms/Select'
import { SearchBar } from '../../components/molecules/SearchBar'
import { PriceBlock } from '../../components/atoms/PriceBlock'
import { Modal } from '../../components/atoms/Modal'
import { cn } from '../../design/cn'
import { motionTokens } from '../../design/motion'

export function AdminProductos() {
  const [products, setProducts] = useState([])
  const categories = useCatalogStore((s) => s.categories)
  const loadCategories = useCatalogStore((s) => s.loadCategories)
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editOpenId, setEditOpenId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [pendingEdit, setPendingEdit] = useState(null)
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    categoriaId: '',
    stock: 0,
    minimo: 0,
    precio: 0,
    fechaIngreso: '',
  })

  async function load() {
    try {
      const [p] = await Promise.all([
        api.get('/products?limit=500'),
        loadCategories(),
      ])
      setProducts(p.products || [])
    } catch {
      toast.error('Error al cargar datos')
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!form.categoriaId && categories.length) {
      setForm((s) => ({ ...s, categoriaId: String(categories[0].id) }))
    }
  }, [categories, form.categoriaId])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return products
    return products.filter((p) => `${p.codigo} ${p.nombre} ${p.categoria}`.toLowerCase().includes(needle))
  }, [products, q])

  async function handleCreate() {
    if (!form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Codigo y nombre requeridos')
      return
    }
    if (!form.categoriaId) {
      toast.error('Categoria requerida')
      return
    }
    try {
      const body = {
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        categoriaId: Number(form.categoriaId),
        precio: Number(form.precio) || 0,
        stock: Number(form.stock) || 0,
        minimo: Number(form.minimo) || 0,
      }
      if (form.fechaIngreso) body.fechaIngreso = form.fechaIngreso
      await api.post('/products', body)
      toast.success('Producto creado')
      setForm({ codigo: '', nombre: '', categoriaId: form.categoriaId, stock: 0, minimo: 0, precio: 0, fechaIngreso: '' })
      load()
    } catch (err) {
      toast.error('No se pudo crear', { description: err.message })
    }
  }

  async function handleUpdate(id, patch) {
    try {
      await api.put(`/products/${id}`, patch)
      toast.success('Producto actualizado')
      load()
    } catch (err) {
      toast.error('No se pudo actualizar', { description: err.message })
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await api.del(`/products/${deleteTarget}`)
      toast.success('Producto eliminado')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error('No se pudo eliminar', { description: err.message })
    }
  }

  async function confirmEdit() {
    if (!pendingEdit) return
    const { id, patch } = pendingEdit
    await handleUpdate(id, patch)
    setPendingEdit(null)
  }

  function stageEdit(id, patch) {
    setPendingEdit({ id, patch })
  }

  return (
    <div className="space-y-4">
      <Card>
        <button
          type="button"
          className="w-full text-left"
          onClick={() => setAddOpen((v) => !v)}
        >
          <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Agregar Producto</div>
              <div className="text-xs text-[var(--muted)] pt-1">Nuevo producto en el sistema.</div>
            </div>
            <ChevronDown size={16} className={cn('shrink-0 text-zinc-400 transition-transform', addOpen && 'rotate-180')} />
          </div>
        </button>
        <AnimatePresence initial={false}>
          {addOpen ? (
            <motion.div
              key="add-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: motionTokens.duration.slow, ease: motionTokens.ease.standard }}
              className="overflow-hidden"
            >
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Codigo</div>
                    <Input value={form.codigo} onChange={(e) => setForm((s) => ({ ...s, codigo: e.target.value }))} placeholder="Ej: 779000111" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Nombre</div>
                    <Input value={form.nombre} onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))} placeholder="Ej: Filtro de aire" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Categoria</div>
                    <Select value={form.categoriaId} onChange={(e) => setForm((s) => ({ ...s, categoriaId: e.target.value }))}>
                      <option value="">Seleccionar...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Fecha de ingreso</div>
                    <Input value={form.fechaIngreso} onChange={(e) => setForm((s) => ({ ...s, fechaIngreso: e.target.value }))} type="date" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Precio</div>
                    <Input value={form.precio} onChange={(e) => setForm((s) => ({ ...s, precio: Number(e.target.value) }))} placeholder="0" type="number" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Stock</div>
                    <Input value={form.stock} onChange={(e) => setForm((s) => ({ ...s, stock: Number(e.target.value) }))} placeholder="0" type="number" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Minimo</div>
                    <Input value={form.minimo} onChange={(e) => setForm((s) => ({ ...s, minimo: Number(e.target.value) }))} placeholder="0" type="number" />
                  </div>
                </div>
                <div className="pt-3 flex gap-2">
                  <Button variant="primary" onClick={handleCreate}>Crear</Button>
                  <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancelar</Button>
                </div>
              </CardBody>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Administrar productos</div>
            <div className="text-xs text-[var(--muted)] pt-1">Editar, borrar.</div>
          </div>
          <Badge variant="neutral">{products.length}</Badge>
        </CardHeader>
        <CardBody>
          <div className="pb-4">
            <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto..." />
          </div>

          <div className="space-y-2">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-4 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-4"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-100 line-clamp-2">{p.nombre}</div>
                  <div className="text-xs text-[var(--muted)] pt-0.5 truncate">{p.codigo} · {p.categoria}</div>
                  <div className="text-xs text-[var(--muted)] pt-1">
                    Ingreso: {p.fechaIngreso ? new Date(p.fechaIngreso).toLocaleDateString('es-CL') : 'N/A'}
                  </div>

                  <div className="flex flex-wrap items-end gap-x-4 gap-y-2 pt-2">
                    <PriceBlock value={p.precio} align="left" />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={p.stock <= p.minimo ? 'danger' : 'success'}>
                        {p.stock <= p.minimo ? 'Stock Bajo' : 'OK'}
                      </Badge>
                      <Badge variant="neutral">Stock {p.stock}</Badge>
                      <Badge variant="neutral">Min {p.minimo}</Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[rgba(255,255,255,0.06)]" />

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditOpenId((prev) => (prev === p.id ? null : p.id))}
                  >
                    {editOpenId === p.id ? 'Cerrar edicion' : 'Editar'}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(p.id)}>
                    Borrar
                  </Button>
                </div>

                <AnimatePresence initial={false}>
                  {editOpenId === p.id ? (
                    <motion.div
                      key="edit-form"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: motionTokens.duration.slow, ease: motionTokens.ease.standard }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-xs text-zinc-400">Nombre</div>
                          <Input
                            defaultValue={p.nombre}
                            onBlur={(e) => {
                              if (e.target.value.trim() && e.target.value.trim() !== p.nombre) {
                                stageEdit(p.id, { nombre: e.target.value.trim() })
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-zinc-400">Fecha ingreso</div>
                          <Input
                            defaultValue={p.fechaIngreso ? p.fechaIngreso.slice(0, 10) : ''}
                            type="date"
                            onBlur={(e) => {
                              if (e.target.value !== (p.fechaIngreso ? p.fechaIngreso.slice(0, 10) : '')) {
                                stageEdit(p.id, { fechaIngreso: e.target.value || null })
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-zinc-400">Stock</div>
                          <Input
                            defaultValue={p.stock}
                            type="number"
                            onBlur={(e) => {
                              const v = Number(e.target.value)
                              if (v !== p.stock) stageEdit(p.id, { stock: v })
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-zinc-400">Minimo</div>
                          <Input
                            defaultValue={p.minimo}
                            type="number"
                            onBlur={(e) => {
                              const v = Number(e.target.value)
                              if (v !== p.minimo) stageEdit(p.id, { minimo: v })
                            }}
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <div className="text-xs text-zinc-400">Precio</div>
                          <Input
                            defaultValue={p.precio}
                            type="number"
                            onBlur={(e) => {
                              const v = Number(e.target.value)
                              if (v !== p.precio) stageEdit(p.id, { precio: v })
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ))}

            {filtered.length === 0 ? (
              <div className="py-6 text-sm text-[var(--muted)]">Sin resultados.</div>
            ) : null}
          </div>
        </CardBody>
      </Card>
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar producto"
      >
        <div className="text-sm text-[var(--muted)] pb-4">
          ¿Estas seguro de que deseas eliminar este producto? Esta accion no se puede deshacer.
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="danger" onClick={confirmDelete}>Eliminar</Button>
        </div>
      </Modal>

      <Modal
        open={pendingEdit !== null}
        onClose={() => setPendingEdit(null)}
        title="Confirmar cambios"
      >
        <div className="text-sm text-[var(--muted)] pb-4">
          ¿Deseas guardar los cambios realizados a este producto?
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPendingEdit(null)}>Cancelar</Button>
          <Button variant="primary" onClick={confirmEdit}>Guardar cambios</Button>
        </div>
      </Modal>
    </div>
  )
}
