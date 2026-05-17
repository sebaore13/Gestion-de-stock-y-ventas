import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'
import { Badge } from '../../components/atoms/Badge'
import { Button } from '../../components/atoms/Button'
import { Input } from '../../components/atoms/Input'
import { Select } from '../../components/atoms/Select'
import { SearchBar } from '../../components/molecules/SearchBar'
import { useAuthStore } from '../../services/auth.store'

const INITIAL = [
  { id: 1, nombre: 'Seba Ore', rol: 'Administrador' },
  { id: 2, nombre: 'Operador', rol: 'Vendedor' },
]

export function AdminUsuarios() {
  const user = useAuthStore((s) => s.user)
  const [usuarios, setUsuarios] = useState(INITIAL)
  const [q, setQ] = useState('')
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState('Vendedor')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return usuarios
    return usuarios.filter((u) => `${u.nombre} ${u.rol}`.toLowerCase().includes(needle))
  }, [usuarios, q])

  function crearUsuario() {
    const name = String(nombre || '').trim()
    if (!name) return toast.error('Nombre requerido')
    const nuevo = { id: Math.max(0, ...usuarios.map((u) => u.id)) + 1, nombre: name, rol }
    setUsuarios((prev) => [...prev, nuevo])
    setNombre('')
    toast.success('Usuario creado', { description: name })
  }

  function editarUsuario(id, patch) {
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
    toast.success('Usuario actualizado')
  }

  function borrarUsuario(id) {
    if (user?.id === id) return toast.error('No se puede borrar el usuario activo')
    setUsuarios((prev) => prev.filter((u) => u.id !== id))
    toast.success('Usuario eliminado')
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Crear usuario</div>
            <div className="text-xs text-[var(--muted)] pt-1">Mock (sin backend de usuarios).</div>
          </div>
          <Badge variant="neutral">Admin</Badge>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_160px] gap-3">
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" />
            <Select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="Administrador">Administrador</option>
              <option value="Vendedor">Vendedor</option>
            </Select>
            <Button variant="primary" onClick={crearUsuario}>Crear</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Administrar usuarios</div>
            <div className="text-xs text-[var(--muted)] pt-1">Editar rol, gestion (mock).</div>
          </div>
          <Badge variant="neutral">{usuarios.length}</Badge>
        </CardHeader>
        <CardBody>
          <div className="pb-4">
            <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar usuario..." />
          </div>
          <div className="space-y-2">
            {filtered.map((u) => (
              <div key={u.id} className="flex flex-col md:flex-row md:items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-zinc-100 truncate">{u.nombre}</div>
                    {user?.id === u.id ? <Badge variant="info">Activo</Badge> : null}
                  </div>
                  <div className="text-xs text-[var(--muted)] pt-0.5">Rol: {u.rol}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={u.rol} onChange={(e) => editarUsuario(u.id, { rol: e.target.value })}>
                    <option value="Administrador">Administrador</option>
                    <option value="Vendedor">Vendedor</option>
                  </Select>
                  <Button variant="danger" onClick={() => borrarUsuario(u.id)}>Borrar</Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 ? <div className="py-6 text-sm text-[var(--muted)]">Sin resultados.</div> : null}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
