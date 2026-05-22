import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../services/api'
import { useCatalogStore } from '../../store/catalog.store'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'
import { Badge } from '../../components/atoms/Badge'
import { Button } from '../../components/atoms/Button'
import { Input } from '../../components/atoms/Input'
import { SearchBar } from '../../components/molecules/SearchBar'

export function AdminCategorias() {
  const [categories, setCategories] = useState([])
  const [loadError, setLoadError] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [editing, setEditing] = useState(null)
  const [editNombre, setEditNombre] = useState('')
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const loadCategoriesStore = useCatalogStore((s) => s.loadCategories)

  async function load() {
    setLoadError('')
    try {
      const res = await api.get('/categories')
      setCategories(res.categories || [])
    } catch (err) {
      const msg = err?.data?.error || err?.message || 'Error al cargar categorias'
      setLoadError(msg)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return categories
    return categories.filter((c) => c.nombre.toLowerCase().includes(needle))
  }, [categories, q])

  async function handleCreate() {
    const name = formNombre.trim()
    if (!name) return toast.error('Nombre requerido')
    setBusy(true)
    try {
      await api.post('/categories', { nombre: name })
      toast.success('Categoria creada', { description: name })
      setFormNombre('')
      await Promise.all([load(), loadCategoriesStore()])
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Error al crear')
    } finally {
      setBusy(false)
    }
  }

  function startEdit(cat) {
    setEditing(cat.id)
    setEditNombre(cat.nombre)
  }

  function cancelEdit() {
    setEditing(null)
    setEditNombre('')
  }

  async function handleUpdate(id) {
    const name = editNombre.trim()
    if (!name) return toast.error('Nombre requerido')
    setBusy(true)
    try {
      await api.put(`/categories/${id}`, { nombre: name })
      toast.success('Categoria actualizada')
      setEditing(null)
      await Promise.all([load(), loadCategoriesStore()])
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Error al actualizar')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminar esta categoria? Los productos asociados la conservaran.')) return
    setBusy(true)
    try {
      await api.delete(`/categories/${id}`)
      toast.success('Categoria eliminada')
      await Promise.all([load(), loadCategoriesStore()])
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Error al eliminar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {loadError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{loadError}</div>
      ) : null}

      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Crear categoria</div>
            <div className="text-xs text-[var(--muted)] pt-1">Agrega una nueva categoria de productos.</div>
          </div>
          <Badge variant="neutral">Admin</Badge>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-3">
            <Input
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              placeholder="Nombre de la categoria"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button variant="primary" onClick={handleCreate} disabled={busy}>Crear</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Categorias</div>
          </div>
          <Badge variant="neutral">{categories.length}</Badge>
        </CardHeader>
        <CardBody>
          <div className="pb-4">
            <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar categoria..." />
          </div>
          <div className="space-y-2">
            {filtered.map((c) => (
              <div key={c.id} className="flex flex-col md:flex-row md:items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3">
                {editing === c.id ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <Input
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate(c.id)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="primary" onClick={() => handleUpdate(c.id)} disabled={busy}>Guardar</Button>
                      <Button variant="ghost" onClick={cancelEdit}>Cancelar</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-zinc-100">{c.nombre}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => startEdit(c)}>Editar</Button>
                      <Button variant="danger" onClick={() => handleDelete(c.id)} disabled={busy}>Eliminar</Button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {filtered.length === 0 ? <div className="py-6 text-sm text-[var(--muted)]">Sin resultados.</div> : null}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
