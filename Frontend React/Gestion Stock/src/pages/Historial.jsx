import { Card, CardBody, CardHeader } from '../components/atoms/Card'
import { Badge } from '../components/atoms/Badge'
import { useMemo, useState } from 'react'
import { SearchBar } from '../components/molecules/SearchBar'
import { useAppStore } from '../store/useAppStore'
import { usuarios } from '../data/usuarios'

function formatDate(iso) {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function Historial() {
  const [q, setQ] = useState('')

  const productos = useAppStore((s) => s.productos)
  const movimientos = useAppStore((s) => s.movimientos)

  const productosById = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos])
  const usuariosById = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const base = movimientos.map((m) => {
      const p = productosById.get(m.productoId)
      const u = usuariosById.get(m.usuarioId)
      return {
        id: m.id,
        tipo: m.tipo,
        cantidad: m.cantidad,
        fecha: m.fecha,
        producto: p ? `${p.nombre} (${p.codigo})` : `Producto #${m.productoId}`,
        usuario: u ? u.nombre : `Usuario #${m.usuarioId}`,
      }
    })

    if (!needle) return base
    return base.filter((r) => `${r.tipo} ${r.producto} ${r.usuario}`.toLowerCase().includes(needle))
  }, [movimientos, productosById, usuariosById, q])

  return (
    <Card>
      <CardHeader>
        <div>
          <div className="text-sm font-semibold">Historial</div>
          <div className="text-xs text-[var(--muted)] pt-1">Movimientos del sistema (arrays fake).</div>
        </div>
        <Badge variant="neutral">{rows.length}</Badge>
      </CardHeader>
      <CardBody>
        <div className="pb-4">
          <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar movimientos..." />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)]">
                <th className="py-2 pr-4 font-medium">Tipo</th>
                <th className="py-2 pr-4 font-medium">Producto</th>
                <th className="py-2 pr-4 font-medium">Cant.</th>
                <th className="py-2 pr-4 font-medium">Fecha</th>
                <th className="py-2 pr-0 font-medium">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[rgba(255,255,255,0.06)]">
                  <td className="py-3 pr-4">
                    <Badge variant={r.tipo === 'INGRESO' ? 'success' : r.tipo === 'SALIDA' ? 'info' : 'danger'}>
                      {r.tipo}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-zinc-100">{r.producto}</td>
                  <td className="py-3 pr-4 text-zinc-100 font-medium">{r.cantidad}</td>
                  <td className="py-3 pr-4 text-[var(--muted)]">{formatDate(r.fecha)}</td>
                  <td className="py-3 pr-0 text-[var(--muted)]">{r.usuario}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-sm text-[var(--muted)]">
                    Sin resultados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}
