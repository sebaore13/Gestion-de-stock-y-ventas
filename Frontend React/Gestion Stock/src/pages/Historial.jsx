import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { Card, CardBody, CardHeader } from '../components/atoms/Card'
import { Badge } from '../components/atoms/Badge'
import { SearchBar } from '../components/molecules/SearchBar'

function formatDate(iso) {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export function Historial() {
  const [q, setQ] = useState('')
  const [movements, setMovements] = useState([])
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    api.get('/movements?limit=200')
      .then((res) => {
        setMovements(res.movements || [])
        setLoadError('')
      })
      .catch((err) => {
        setLoadError(err?.message || 'Error de conexion con el servidor')
      })
  }, [])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const base = movements.map((m) => ({
      id: m.id, tipo: m.tipo, cantidad: m.cantidad, fecha: m.fecha,
      producto: m.productoNombre ? `${m.productoNombre} (${m.productoCodigo})` : `ID ${m.productoId}`,
      usuario: m.usuarioNombre || `ID ${m.usuarioId}`,
    }))
    if (!needle) return base
    return base.filter((r) => `${r.tipo} ${r.producto} ${r.usuario}`.toLowerCase().includes(needle))
  }, [movements, q])

  return (
    <Card>
      <CardHeader>
        <div>
          <div className="text-sm font-semibold">Historial</div>
          <div className="text-xs text-[var(--muted)] pt-1">Movimientos del sistema.</div>
        </div>
        <Badge variant="neutral">{rows.length}</Badge>
      </CardHeader>
      <CardBody>
        {loadError ? (
          <div className="mb-4 rounded-xl bg-red-400/10 text-red-300 text-xs px-3 py-2">{loadError}</div>
        ) : null}
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
                    <Badge variant={r.tipo === 'INGRESO' ? 'success' : r.tipo === 'SALIDA' ? 'info' : 'danger'}>{r.tipo}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-zinc-100">{r.producto}</td>
                  <td className="py-3 pr-4 text-zinc-100 font-medium">{r.cantidad}</td>
                  <td className="py-3 pr-4 text-[var(--muted)]">{formatDate(r.fecha)}</td>
                  <td className="py-3 pr-0 text-[var(--muted)]">{r.usuario}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-sm text-[var(--muted)]">Sin resultados.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}
