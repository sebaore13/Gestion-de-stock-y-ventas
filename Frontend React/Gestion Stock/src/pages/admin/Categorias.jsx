import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../services/api'
import { useCatalogStore } from '../../store/catalog.store'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'
import { Badge } from '../../components/atoms/Badge'
import { Button } from '../../components/atoms/Button'
import { Input } from '../../components/atoms/Input'
import { Modal } from '../../components/atoms/Modal'
import { SearchBar } from '../../components/molecules/SearchBar'

export function AdminCategorias() {
  const [categories, setCategories] = useState([])
  const [loadError, setLoadError] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [editing, setEditing] = useState(null)
  const [editNombre, setEditNombre] = useState('')
  const [busy, setBusy] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState(null)
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

  function requestCreate() {
    const name = formNombre.trim()
    if (!name) return toast.error('Nombre requerido')
    setPendingConfirm({ type: 'create', name })
  }

  async function performCreate(name) {
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

  function requestUpdate(id) {
    const name = editNombre.trim()
    if (!name) return toast.error('Nombre requerido')
    setPendingConfirm({ type: 'update', id, name })
  }

  async function performUpdate(id, name) {
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

  function requestDelete(cat) {
    setPendingConfirm({ type: 'delete', id: cat.id, name: cat.nombre })
  }

  async function performDelete(id) {
    setBusy(true)
    try {
      await api.del(`/categories/${id}`)
      toast.success('Categoria eliminada')
      await Promise.all([load(), loadCategoriesStore()])
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Error al eliminar')
    } finally {
      setBusy(false)
    }
  }

  async function confirmPending() {
    if (!pendingConfirm || busy) return
    const p = pendingConfirm
    try {
      if (p.type === 'create') await performCreate(p.name)
      if (p.type === 'update') await performUpdate(p.id, p.name)
      if (p.type === 'delete') await performDelete(p.id)
    } finally {
      setPendingConfirm(null)
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
              onKeyDown={(e) => e.key === 'Enter' && requestCreate()}
            />
            <Button variant="primary" onClick={requestCreate} disabled={busy || pendingConfirm !== null}>Crear</Button>
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
                        onKeyDown={(e) => e.key === 'Enter' && requestUpdate(c.id)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="primary" onClick={() => requestUpdate(c.id)} disabled={busy || pendingConfirm !== null}>Guardar</Button>
                      <Button variant="secondary" onClick={cancelEdit}>Cancelar</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-zinc-100">{c.nombre}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => startEdit(c)}>Editar</Button>
                      <Button
                        variant="danger"
                        onClick={() => requestDelete(c)}
                        disabled={busy || pendingConfirm !== null}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {filtered.length === 0 ? <div className="py-6 text-sm text-[var(--muted)]">Sin resultados.</div> : null}
          </div>
        </CardBody>
      </Card>

      <Modal
        open={pendingConfirm !== null}
        onClose={() => (busy ? null : setPendingConfirm(null))}
        title={
          pendingConfirm?.type === 'delete'
            ? 'Eliminar categoria'
            : pendingConfirm?.type === 'update'
              ? 'Guardar cambios'
              : 'Crear categoria'
        }
      >
        {pendingConfirm?.type === 'delete' ? (
          <div className="text-sm text-[var(--muted)] pb-4">
            ¿Estas seguro de eliminar la categoria <span className="text-zinc-100 font-medium">{pendingConfirm.name}</span>?
            <div className="pt-2">Esta accion no se puede deshacer.</div>
            <div className="pt-2">Los productos asociados conservaran la categoria anterior.</div>
          </div>
        ) : pendingConfirm?.type === 'create' ? (
          <div className="text-sm text-[var(--muted)] pb-4">
            ¿Deseas crear la categoria <span className="text-zinc-100 font-medium">{pendingConfirm.name}</span>?
          </div>
        ) : (
          <div className="text-sm text-[var(--muted)] pb-4">¿Deseas guardar los cambios realizados?</div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingConfirm(null)} disabled={busy}>Cancelar</Button>
          <Button
            variant={pendingConfirm?.type === 'delete' ? 'danger' : 'primary'}
            onClick={confirmPending}
            disabled={busy}
          >
            {busy ? 'Procesando...' : 'Confirmar'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
