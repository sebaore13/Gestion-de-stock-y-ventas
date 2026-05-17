import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'
import { Badge } from '../../components/atoms/Badge'
import { Button } from '../../components/atoms/Button'
import { Input } from '../../components/atoms/Input'
import { SearchBar } from '../../components/molecules/SearchBar'
import { useAppStore } from '../../store/useAppStore'

export function AdminProductos() {
  const productos = useAppStore((s) => s.productos)
  const crearProducto = useAppStore((s) => s.crearProducto)
  const editarProducto = useAppStore((s) => s.editarProducto)
  const borrarProducto = useAppStore((s) => s.borrarProducto)

  const [q, setQ] = useState('')
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    categoria: 'General',
    stock: 0,
    minimo: 0,
    precio: 0,
    fechaIngreso: '',
  })

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return productos
    return productos.filter((p) => `${p.codigo} ${p.nombre} ${p.categoria}`.toLowerCase().includes(needle))
  }, [productos, q])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Crear producto</div>
            <div className="text-xs text-[var(--muted)] pt-1">Mock (sin backend).</div>
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
              <Input value={form.categoria} onChange={(e) => setForm((s) => ({ ...s, categoria: e.target.value }))} placeholder="Ej: Filtros" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-zinc-400">Fecha de ingreso</div>
              <Input
                value={form.fechaIngreso}
                onChange={(e) => setForm((s) => ({ ...s, fechaIngreso: e.target.value }))}
                type="date"
              />
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
            <Button
              variant="primary"
              onClick={() => {
                const res = crearProducto(form)
                if (!res.ok) {
                  toast.error('No se pudo crear', { description: res.error })
                  return
                }
                toast.success('Producto creado', { description: res.producto.nombre })
                setForm({ codigo: '', nombre: '', categoria: 'General', stock: 0, minimo: 0, precio: 0, fechaIngreso: '' })
              }}
            >
              Crear
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Administrar productos</div>
            <div className="text-xs text-[var(--muted)] pt-1">Editar, borrar (mock).</div>
          </div>
          <Badge variant="neutral">{productos.length}</Badge>
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
                  <div className="text-xs text-[var(--muted)] pt-0.5">
                    {p.codigo} · {p.categoria}
                  </div>
                  <div className="text-xs text-[var(--muted)] pt-1">
                    Ingreso:{' '}
                    {p.fechaIngreso ? new Date(p.fechaIngreso).toLocaleDateString('es-CL') : 'N/A'}
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
                        const res = editarProducto({
                          id: p.id,
                          codigo: p.codigo,
                          nombre: e.target.value,
                          categoria: p.categoria,
                          stock: p.stock,
                          minimo: p.minimo,
                          precio: p.precio,
                          fechaIngreso: p.fechaIngreso,
                        })
                        if (!res.ok) toast.error('No se pudo editar', { description: res.error })
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Fecha de ingreso</div>
                    <Input
                      defaultValue={p.fechaIngreso ? p.fechaIngreso.slice(0, 10) : ''}
                      type="date"
                      onBlur={(e) => {
                        const res = editarProducto({
                          id: p.id,
                          codigo: p.codigo,
                          nombre: p.nombre,
                          categoria: p.categoria,
                          stock: p.stock,
                          minimo: p.minimo,
                          precio: p.precio,
                          fechaIngreso: e.target.value,
                        })
                        if (!res.ok) toast.error('No se pudo editar', { description: res.error })
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Stock</div>
                    <Input
                      defaultValue={p.stock}
                      type="number"
                      onBlur={(e) => {
                        const res = editarProducto({
                          id: p.id,
                          codigo: p.codigo,
                          nombre: p.nombre,
                          categoria: p.categoria,
                          stock: Number(e.target.value),
                          minimo: p.minimo,
                          precio: p.precio,
                          fechaIngreso: p.fechaIngreso,
                        })
                        if (res.ok) toast('Stock actualizado')
                        else toast.error('No se pudo editar', { description: res.error })
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Minimo</div>
                    <Input
                      defaultValue={p.minimo}
                      type="number"
                      onBlur={(e) => {
                        const res = editarProducto({
                          id: p.id,
                          codigo: p.codigo,
                          nombre: p.nombre,
                          categoria: p.categoria,
                          stock: p.stock,
                          minimo: Number(e.target.value),
                          precio: p.precio,
                          fechaIngreso: p.fechaIngreso,
                        })
                        if (!res.ok) toast.error('No se pudo editar', { description: res.error })
                      }}
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <div className="text-xs text-zinc-400">Precio</div>
                    <Input
                      defaultValue={p.precio}
                      type="number"
                      onBlur={(e) => {
                        const res = editarProducto({
                          id: p.id,
                          codigo: p.codigo,
                          nombre: p.nombre,
                          categoria: p.categoria,
                          stock: p.stock,
                          minimo: p.minimo,
                          precio: Number(e.target.value),
                          fechaIngreso: p.fechaIngreso,
                        })
                        if (!res.ok) toast.error('No se pudo editar', { description: res.error })
                      }}
                    />
                  </div>
                  <Button
                    variant="danger"
                    className="col-span-2 justify-center"
                    onClick={() => {
                      borrarProducto({ id: p.id })
                      toast.success('Producto eliminado')
                    }}
                  >
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
