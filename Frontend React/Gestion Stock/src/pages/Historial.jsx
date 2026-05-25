import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { Card, CardBody, CardHeader } from '../components/atoms/Card'
import { Badge } from '../components/atoms/Badge'
import { SearchBar } from '../components/molecules/SearchBar'

export function Historial() {
  const [q, setQ] = useState('')
  const [sales, setSales] = useState([])
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    api.get('/sales?limit=200&includeItems=1')
      .then((res) => {
        setSales(res.sales || [])
        setLoadError('')
      })
      .catch((err) => {
        setLoadError(err?.message || 'Error de conexion con el servidor')
      })
  }, [])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return sales
    return sales.filter((s) => {
      const itemsText = (s.items || []).map((it) => `${it.nombre_snapshot} ${it.codigo_snapshot} ${it.cantidad}`).join(' ')
      return `${s.id} ${s.usuarioNombre ?? ''} ${s.metodoPago ?? ''} ${s.nota ?? ''} ${s.total ?? ''} ${itemsText}`
        .toLowerCase().includes(needle)
    })
  }, [sales, q])

  return (
    <Card>
      <CardHeader>
        <div>
          <div className="text-sm font-semibold">Historial</div>
          <div className="text-xs text-[var(--muted)] pt-1">Tus ventas (transacciones) con detalle de productos.</div>
        </div>
        <Badge variant="neutral">{rows.length}</Badge>
      </CardHeader>
      <CardBody>
        {loadError ? (
          <div className="mb-4 rounded-xl bg-red-400/10 text-red-300 text-xs px-3 py-2">{loadError}</div>
        ) : null}
        <div className="pb-4">
          <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ventas por producto, metodo, nota..." />
        </div>
        <div className="space-y-2">
          {rows.map((s) => (
            <div key={s.id} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm font-semibold text-zinc-100">Venta #{s.id}</div>
                    <Badge variant="neutral">{new Date(s.fecha).toLocaleString('es-CL')}</Badge>
                  </div>
                  <div className="text-xs text-[var(--muted)] pt-1">{s.metodoPago ?? 'N/A'}</div>
                  {s.nota ? <div className="text-xs text-[var(--muted)] pt-1 truncate">Nota: {s.nota}</div> : null}
                </div>
                <div className="shrink-0">
                  <div className="text-xs text-zinc-400">Total</div>
                  <div className="text-lg font-semibold text-zinc-100 tabular-nums">
                    $ {new Intl.NumberFormat('es-CL').format(Number(s.total) || 0)}
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">
                    Otros: {new Intl.NumberFormat('es-CL').format(Number(s.otrosCargos) || 0)}
                  </div>
                </div>
              </div>

              <div className="mt-3 border-t border-[rgba(255,255,255,0.06)]" />
              <div className="pt-3">
                <div className="text-xs text-zinc-400 pb-2">Productos</div>
                <div className="space-y-2">
                  {(s.items || []).map((it) => (
                    <div key={it.id} className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm text-zinc-100 truncate">{it.nombre_snapshot}</div>
                        <div className="text-xs text-[var(--muted)] truncate">{it.codigo_snapshot}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm text-zinc-100 font-medium tabular-nums">x{it.cantidad}</div>
                        <div className="text-xs text-[var(--muted)] tabular-nums">$ {new Intl.NumberFormat('es-CL').format(Number(it.precio_snapshot) || 0)}</div>
                      </div>
                    </div>
                  ))}
                  {(s.items || []).length === 0 ? (
                    <div className="text-sm text-[var(--muted)]">Sin items.</div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 ? (
            <div className="py-6 text-sm text-[var(--muted)]">Sin resultados.</div>
          ) : null}
        </div>
      </CardBody>
    </Card>
  )
}
