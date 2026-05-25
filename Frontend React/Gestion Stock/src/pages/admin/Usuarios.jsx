import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../services/api'
import { useAuthStore } from '../../services/auth.store'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'
import { Badge } from '../../components/atoms/Badge'
import { Button } from '../../components/atoms/Button'
import { Input } from '../../components/atoms/Input'
import { SearchBar } from '../../components/molecules/SearchBar'
import { Modal } from '../../components/atoms/Modal'
import { cn } from '../../design/cn'
import { motionTokens } from '../../design/motion'

const CREATE_ROLE = 'Vendedor'

export function AdminUsuarios() {
  const currentUser = useAuthStore((s) => s.user)
  const [users, setUsers] = useState([])
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editOpenId, setEditOpenId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [resetPwdTarget, setResetPwdTarget] = useState(null)
  const [resetPwdValue, setResetPwdValue] = useState('')
  const [pendingEdit, setPendingEdit] = useState(null)
  const [addForm, setAddForm] = useState({ nombre: '', email: '', password: '', rol: CREATE_ROLE })

  async function load() {
    try {
      const res = await api.get('/users')
      setUsers(res.users || [])
    } catch {
      toast.error('Error al cargar usuarios')
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return users
    return users.filter((u) => `${u.nombre} ${u.email || ''} ${u.rol}`.toLowerCase().includes(needle))
  }, [users, q])

  function resetAddForm() {
    setAddForm({ nombre: '', email: '', password: '', rol: CREATE_ROLE })
  }

  async function handleCreate() {
    const nombre = addForm.nombre.trim()
    const email = addForm.email.trim().toLowerCase()
    const password = addForm.password
    if (!nombre) { toast.error('Nombre requerido'); return }
    if (!email) { toast.error('Email requerido'); return }
    if (!password || password.length < 8) { toast.error('Contraseña mínimo 8 caracteres'); return }
    try {
      await api.post('/users', { nombre, email, password, rol: CREATE_ROLE })
      toast.success('Usuario creado')
      resetAddForm()
      setAddOpen(false)
      load()
    } catch (err) {
      toast.error('No se pudo crear', { description: err.message })
    }
  }

  async function handleUpdate(id, patch) {
    try {
      await api.put(`/users/${id}`, patch)
      toast.success('Usuario actualizado')
      load()
    } catch (err) {
      toast.error('No se pudo actualizar', { description: err.message })
    }
  }

  function stageEdit(id, patch) {
    setPendingEdit({ id, patch })
  }

  async function confirmEdit() {
    if (!pendingEdit) return
    const { id, patch } = pendingEdit
    await handleUpdate(id, patch)
    setPendingEdit(null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = users.find((u) => u.id === deleteTarget)
    if (!target) {
      setDeleteTarget(null)
      return
    }
    if (target.rol === 'Administrador') {
      toast.error('No se puede eliminar el administrador')
      setDeleteTarget(null)
      return
    }
    if (target.rol !== 'Vendedor') {
      toast.error('Solo se pueden eliminar vendedores')
      setDeleteTarget(null)
      return
    }
    try {
      await api.del(`/users/${deleteTarget}`)
      toast.success('Usuario eliminado')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error('No se pudo eliminar', { description: err.message })
    }
  }

  async function confirmResetPwd() {
    if (!resetPwdTarget || !resetPwdValue || resetPwdValue.length < 8) {
      toast.error('Contraseña mínimo 8 caracteres')
      return
    }
    try {
      await api.post(`/users/${resetPwdTarget}/reset-password`, { password: resetPwdValue })
      toast.success('Contraseña restablecida')
      setResetPwdTarget(null)
      setResetPwdValue('')
    } catch (err) {
      toast.error('No se pudo restablecer', { description: err.message })
    }
  }

  function isSelf(id) {
    return Number(currentUser?.id) === Number(id)
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
              <div className="text-sm font-semibold">Agregar Usuario</div>
              <div className="text-xs text-[var(--muted)] pt-1">Nuevo usuario en el sistema.</div>
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
                    <div className="text-xs text-zinc-400">Nombre</div>
                    <Input value={addForm.nombre} onChange={(e) => setAddForm((s) => ({ ...s, nombre: e.target.value }))} placeholder="Ej: Juan Perez" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Email</div>
                    <Input value={addForm.email} onChange={(e) => setAddForm((s) => ({ ...s, email: e.target.value }))} placeholder="ej@correo.cl" type="email" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Rol</div>
                    <div className="h-11 rounded-xl border border-[var(--border)] bg-white/3 px-3 grid items-center text-sm text-zinc-100">
                      {CREATE_ROLE}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Contraseña</div>
                    <Input value={addForm.password} onChange={(e) => setAddForm((s) => ({ ...s, password: e.target.value }))} type="password" placeholder="Mínimo 8 caracteres" />
                  </div>
                </div>
                <div className="pt-3 flex gap-2">
                  <Button variant="primary" onClick={handleCreate}>Crear</Button>
                  <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancelar</Button>
                </div>
              </CardBody>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Administrar usuarios</div>
            <div className="text-xs text-[var(--muted)] pt-1">Editar, desactivar, restablecer contraseña.</div>
          </div>
          <Badge variant="neutral">{users.length}</Badge>
        </CardHeader>
        <CardBody>
          <div className="pb-4">
            <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar usuario..." />
          </div>

          <div className="space-y-2">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="flex flex-col gap-4 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-zinc-100">{u.nombre}</div>
                    {isSelf(u.id) ? <Badge variant="info">Tú</Badge> : null}
                    {!u.activo ? <Badge variant="danger">Inactivo</Badge> : null}
                  </div>
                  <div className="text-xs text-[var(--muted)] pt-0.5 truncate">{u.email || 'Sin email'} · {u.rol}</div>
                </div>

                <div className="border-t border-[rgba(255,255,255,0.06)]" />

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditOpenId((prev) => (prev === u.id ? null : u.id))}
                  >
                    {editOpenId === u.id ? 'Cerrar edición' : 'Editar'}
                  </Button>
                  {!isSelf(u.id) && u.rol === 'Vendedor' ? (
                    <Button variant="secondary" size="sm" onClick={() => { setResetPwdTarget(u.id); setResetPwdValue('') }}>
                      Restablecer contraseña
                    </Button>
                  ) : null}
                  {!isSelf(u.id) && u.rol === 'Vendedor' ? (
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(u.id)}>
                      Eliminar
                    </Button>
                  ) : null}
                </div>

                <AnimatePresence initial={false}>
                  {editOpenId === u.id ? (
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
                            defaultValue={u.nombre}
                            onBlur={(e) => {
                              const v = e.target.value.trim()
                              if (v && v !== u.nombre) stageEdit(u.id, { nombre: v })
                            }}
                          />
                        </div>
                        {u.rol === 'Administrador' ? (
                          <div className="space-y-1">
                            <div className="text-xs text-zinc-400">Email</div>
                            <div className="h-11 rounded-xl border border-[var(--border)] bg-white/3 px-3 grid items-center text-sm text-zinc-100 truncate">
                              {u.email || 'Sin email'}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-xs text-zinc-400">Email</div>
                            <Input
                              defaultValue={u.email || ''}
                              type="email"
                              onBlur={(e) => {
                                const v = e.target.value.trim().toLowerCase()
                                if (v && v !== u.email) stageEdit(u.id, { email: v })
                              }}
                            />
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="text-xs text-zinc-400">Rol</div>
                          <div className="h-11 rounded-xl border border-[var(--border)] bg-white/3 px-3 grid items-center text-sm text-zinc-100">
                            {u.rol}
                          </div>
                          <div className="text-[11px] text-[var(--muted)] pt-1">Rol fijo (no modificable).</div>
                        </div>

                        {!isSelf(u.id) && u.rol === 'Vendedor' ? (
                          <div className="sm:col-span-2 pt-1 flex justify-end">
                            <Button variant="danger" size="sm" onClick={() => setDeleteTarget(u.id)} disabled={pendingEdit !== null}>
                              Eliminar usuario
                            </Button>
                          </div>
                        ) : null}
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
        title="Eliminar usuario"
      >
        <div className="text-sm text-[var(--muted)] pb-4">
          ¿Estás seguro de eliminar este usuario?
          <div className="pt-2 text-zinc-100 font-medium truncate">
            {users.find((u) => u.id === deleteTarget)?.nombre || 'Usuario'}
          </div>
          <div className="pt-2">Esta acción no se puede deshacer.</div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="danger" onClick={confirmDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>

      <Modal
        open={resetPwdTarget !== null}
        onClose={() => { setResetPwdTarget(null); setResetPwdValue('') }}
        title="Restablecer contraseña"
      >
        <div className="text-sm text-[var(--muted)] pb-4">
          Ingresa la nueva contraseña para este usuario.
        </div>
        <div className="pb-4">
          <Input
            value={resetPwdValue}
            onChange={(e) => setResetPwdValue(e.target.value)}
            type="password"
            placeholder="Mínimo 8 caracteres"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => { setResetPwdTarget(null); setResetPwdValue('') }}>Cancelar</Button>
          <Button variant="primary" onClick={confirmResetPwd}>Guardar</Button>
        </div>
      </Modal>

      <Modal
        open={pendingEdit !== null}
        onClose={() => setPendingEdit(null)}
        title="Confirmar cambios"
      >
        <div className="text-sm text-[var(--muted)] pb-4">
          ¿Deseas guardar los cambios realizados a este usuario?
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingEdit(null)}>Cancelar</Button>
          <Button variant="primary" onClick={confirmEdit}>Guardar cambios</Button>
        </div>
      </Modal>
    </div>
  )
}
