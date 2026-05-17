import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { Badge } from '../../components/atoms/Badge'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'
import { SearchBar } from '../../components/molecules/SearchBar'

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
  const [movements, setMovements] = useState([])
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState('')

  useEffect(() => {
    api.get('/movements?limit=500').then((res) => setMovements(res.movements || [])).catch(() => {})
  }, [])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return movements
      .filter((m) => (tipo ? m.tipo === tipo : true))
      .filter((m) => {
        if (!needle) return true
        return `${m.tipo} ${m.cantidad} ${m.productoNombre ?? ''} ${m.productoCodigo ?? ''} ${m.usuarioNombre ?? ''}`
          .toLowerCase().includes(needle)
      })
  }, [movements, q, tipo])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Historial</div>
            <div className="text-xs text-[var(--muted)] pt-1">Movimientos del sistema.</div>
          </div>
          <Badge variant="neutral">{movements.length}</Badge>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 pb-4">
            <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por producto, usuario, tipo..." />
            <label className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[rgba(24,24,27,0.75)] backdrop-blur px-3 h-11">
              <span className="text-xs text-[var(--muted)]">Tipo</span>
              <select className="w-full bg-transparent border-0 outline-none text-sm text-[var(--text)]" value={tipo} onChange={(e) => setTipo(e.target.value)}>
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
                    <td className="px-4 py-3 text-zinc-300">{new Date(m.fecha).toLocaleString('es-CL')}</td>
                    <td className="px-4 py-3"><Badge variant={variantTipo(m.tipo)}>{labelTipo(m.tipo)}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-100 font-medium">{m.productoNombre ?? 'Producto eliminado'}</div>
                      <div className="text-xs text-[var(--muted)] pt-0.5">{m.productoCodigo ?? `ID ${m.productoId}`}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-100">{m.cantidad}</td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-100">{m.usuarioNombre ?? `ID ${m.usuarioId}`}</div>
                      <div className="text-xs text-[var(--muted)] pt-0.5">{m.usuarioRol ?? 'N/A'}</div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr><td className="px-4 py-10 text-[var(--muted)]" colSpan={5}>Sin resultados.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
