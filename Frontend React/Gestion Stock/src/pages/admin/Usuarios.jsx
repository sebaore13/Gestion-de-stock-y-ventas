import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'
import { Badge } from '../../components/atoms/Badge'
import { Button } from '../../components/atoms/Button'
import { Input } from '../../components/atoms/Input'
import { Select } from '../../components/atoms/Select'
import { SearchBar } from '../../components/molecules/SearchBar'
import { useAppStore } from '../../store/useAppStore'

export function AdminUsuarios() {
  const usuarios = useAppStore((s) => s.usuarios)
  const usuarioActivoId = useAppStore((s) => s.usuarioActivoId)
  const setUsuarioActivoId = useAppStore((s) => s.setUsuarioActivoId)
  const crearUsuario = useAppStore((s) => s.crearUsuario)
  const editarUsuario = useAppStore((s) => s.editarUsuario)
  const borrarUsuario = useAppStore((s) => s.borrarUsuario)

  const [q, setQ] = useState('')
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState('Vendedor')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return usuarios
    return usuarios.filter((u) => `${u.nombre} ${u.rol}`.toLowerCase().includes(needle))
  }, [usuarios, q])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Crear usuario</div>
            <div className="text-xs text-[var(--muted)] pt-1">Mock (sin backend).</div>
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
            <Button
              variant="primary"
              onClick={() => {
                const res = crearUsuario({ nombre, rol })
                if (!res.ok) {
                  toast.error('No se pudo crear', { description: res.error })
                  return
                }
                setNombre('')
                toast.success('Usuario creado', { description: res.usuario.nombre })
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
            <div className="text-sm font-semibold">Administrar usuarios</div>
            <div className="text-xs text-[var(--muted)] pt-1">Editar rol, cambiar usuario activo (demo).</div>
          </div>
          <Badge variant="neutral">{usuarios.length}</Badge>
        </CardHeader>
        <CardBody>
          <div className="pb-4">
            <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar usuario..." />
          </div>

          <div className="space-y-2">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="flex flex-col md:flex-row md:items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-zinc-100 truncate">{u.nombre}</div>
                    {u.id === usuarioActivoId ? <Badge variant="info">Activo</Badge> : null}
                  </div>
                  <div className="text-xs text-[var(--muted)] pt-0.5">Rol: {u.rol}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={u.rol}
                    onChange={(e) => {
                      const res = editarUsuario({ id: u.id, nombre: u.nombre, rol: e.target.value })
                      if (!res.ok) toast.error('No se pudo editar', { description: res.error })
                      else toast.success('Usuario actualizado')
                    }}
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Vendedor">Vendedor</option>
                  </Select>

                  <Button variant="secondary" onClick={() => setUsuarioActivoId(u.id)}>
                    Usar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      const res = borrarUsuario({ id: u.id })
                      if (!res.ok) toast.error('No se pudo borrar', { description: res.error })
                      else toast.success('Usuario eliminado')
                    }}
                  >
                    Borrar
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
