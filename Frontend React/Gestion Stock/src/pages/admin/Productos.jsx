import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../services/api'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'
import { Badge } from '../../components/atoms/Badge'
import { Button } from '../../components/atoms/Button'
import { Input } from '../../components/atoms/Input'
import { Select } from '../../components/atoms/Select'
import { SearchBar } from '../../components/molecules/SearchBar'

export function AdminProductos() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [q, setQ] = useState('')
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
      const [p, c] = await Promise.all([
        api.get('/products?limit=500'),
        api.get('/categories'),
      ])
      setProducts(p.products || [])
      setCategories(c.categories || [])
      if (!form.categoriaId && c.categories?.length) {
        setForm((s) => ({ ...s, categoriaId: String(c.categories[0].id) }))
      }
    } catch {
      toast.error('Error al cargar datos')
    }
  }

  useEffect(() => { load() }, [])

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

  async function handleDelete(id) {
    try {
      await api.del(`/products/${id}`)
      toast.success('Producto eliminado')
      load()
    } catch (err) {
      toast.error('No se pudo eliminar', { description: err.message })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Crear producto</div>
            <div className="text-xs text-[var(--muted)] pt-1">Nuevo producto en el sistema.</div>
          </div>
          <Badge variant="neutral">Admin</Badge>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          <div className="pt-3">
            <Button variant="primary" onClick={handleCreate}>Crear</Button>
          </div>
        </CardBody>
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
                className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-4"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-100 truncate">{p.nombre}</div>
                  <div className="text-xs text-[var(--muted)] pt-0.5">{p.codigo} · {p.categoria}</div>
                  <div className="text-xs text-[var(--muted)] pt-1">
                    Ingreso: {p.fechaIngreso ? new Date(p.fechaIngreso).toLocaleDateString('es-CL') : 'N/A'}
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    <Badge variant={p.stock <= p.minimo ? 'danger' : 'success'}>
                      {p.stock <= p.minimo ? 'Stock Bajo' : 'OK'}
                    </Badge>
                    <Badge variant="neutral">Stock {p.stock}</Badge>
                    <Badge variant="neutral">Min {p.minimo}</Badge>
                    <Badge variant="neutral">$ {p.precio}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Nombre</div>
                    <Input
                      defaultValue={p.nombre}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value.trim() !== p.nombre) {
                          handleUpdate(p.id, { nombre: e.target.value.trim() })
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
                          handleUpdate(p.id, { fechaIngreso: e.target.value || null })
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
                        if (v !== p.stock) handleUpdate(p.id, { stock: v })
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
                        if (v !== p.minimo) handleUpdate(p.id, { minimo: v })
                      }}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <div className="text-xs text-zinc-400">Precio</div>
                    <Input
                      defaultValue={p.precio}
                      type="number"
                      onBlur={(e) => {
                        const v = Number(e.target.value)
                        if (v !== p.precio) handleUpdate(p.id, { precio: v })
                      }}
                    />
                  </div>
                  <Button variant="danger" className="col-span-2 justify-center" onClick={() => handleDelete(p.id)}>
                    Borrar producto
                  </Button>
                </div>
              </div>
            ))}

            {filtered.length === 0 ? (
              <div className="py-6 text-sm text-[var(--muted)]">Sin resultados.</div>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
