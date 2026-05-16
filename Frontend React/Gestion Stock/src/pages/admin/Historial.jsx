import { useMemo, useState } from 'react'
import { Badge } from '../../components/atoms/Badge'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'
import { SearchBar } from '../../components/molecules/SearchBar'
import { useAppStore } from '../../store/useAppStore'

function labelTipo(tipo) {
  if (tipo === 'INGRESO') return 'Ingreso'
  if (tipo === 'SALIDA') return 'Salida'
  return 'Ajuste'
}

function variantTipo(tipo) {
  if (tipo === 'INGRESO') return 'success'
  if (tipo === 'SALIDA') return 'danger'
  return 'neutral'
}

export function AdminHistorial() {
  const movimientos = useAppStore((s) => s.movimientos)
  const productos = useAppStore((s) => s.productos)
  const usuarios = useAppStore((s) => s.usuarios)

  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState('')

  const productosById = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos])
  const usuariosById = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return movimientos
      .filter((m) => (tipo ? m.tipo === tipo : true))
      .filter((m) => {
        if (!needle) return true
        const p = productosById.get(m.productoId)
        const u = usuariosById.get(m.usuarioId)
        return `${m.tipo} ${m.cantidad} ${p?.nombre ?? ''} ${p?.codigo ?? ''} ${u?.nombre ?? ''}`
          .toLowerCase()
          .includes(needle)
      })
      .map((m) => ({
        ...m,
        producto: productosById.get(m.productoId),
        usuario: usuariosById.get(m.usuarioId),
      }))
  }, [movimientos, q, tipo, productosById, usuariosById])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Historial</div>
            <div className="text-xs text-[var(--muted)] pt-1">Movimientos del sistema (mock).</div>
          </div>
          <Badge variant="neutral">{movimientos.length}</Badge>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 pb-4">
            <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por producto, usuario, tipo..." />
            <label className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[rgba(24,24,27,0.75)] backdrop-blur px-3 h-11">
              <span className="text-xs text-[var(--muted)]">Tipo</span>
              <select
                className="w-full bg-transparent border-0 outline-none text-sm text-[var(--text)]"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="INGRESO">Ingreso</option>
                <option value="SALIDA">Salida</option>
                <option value="AJUSTE">Ajuste</option>
              </select>
            </label>
          </div>

          <div className="overflow-auto rounded-2xl border border-[rgba(255,255,255,0.06)]">
            <table className="min-w-[880px] w-full text-sm">
              <thead className="bg-white/3">
                <tr className="text-left text-xs uppercase tracking-[0.14em] text-zinc-400">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-t border-[rgba(255,255,255,0.06)]">
                    <td className="px-4 py-3 text-zinc-300">{new Date(m.fecha).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <Badge variant={variantTipo(m.tipo)}>{labelTipo(m.tipo)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-100 font-medium">{m.producto?.nombre ?? 'Producto eliminado'}</div>
                      <div className="text-xs text-[var(--muted)] pt-0.5">{m.producto?.codigo ?? `ID ${m.productoId}`}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-100">{m.cantidad}</td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-100">{m.usuario?.nombre ?? `ID ${m.usuarioId}`}</div>
                      <div className="text-xs text-[var(--muted)] pt-0.5">{m.usuario?.rol ?? 'N/A'}</div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-[var(--muted)]" colSpan={5}>
                      Sin resultados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
