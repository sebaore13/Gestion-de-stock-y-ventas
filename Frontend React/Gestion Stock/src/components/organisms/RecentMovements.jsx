import { Card, CardBody, CardHeader } from '../atoms/Card'
import { Badge } from '../atoms/Badge'
import { cn } from '../../design/cn'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.max(0, Math.round(diff / 60000))
  if (mins < 60) return `${mins}m`
  const hrs = Math.round(mins / 60)
  return `${hrs}h`
}

export function RecentMovements({ movimientos, productosById }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <div className="text-sm font-semibold">Actividad</div>
          <div className="text-xs text-[var(--muted)] pt-1">Movimientos recientes.</div>
        </div>
        <Badge variant="neutral">Hoy</Badge>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {movimientos.slice(0, 6).map((m) => {
            const p = productosById.get(m.productoId)
            const tag = m.tipo === 'INGRESO' ? 'success' : m.tipo === 'SALIDA' ? 'info' : 'danger'
            const label =
              m.tipo === 'INGRESO'
                ? `Ingreso: ${p?.nombre ?? 'Producto'} (+${m.cantidad})`
                : m.tipo === 'SALIDA'
                  ? `Salida: ${p?.nombre ?? 'Producto'} (-${m.cantidad})`
                  : `Ajuste: ${p?.nombre ?? 'Producto'} (${m.cantidad})`

            return (
              <div
                key={m.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl',
                  'border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3',
                )}
              >
                <Badge variant={tag} className="shrink-0">
                  {m.tipo}
                </Badge>
                <div className="text-sm text-zinc-100 min-w-0 truncate">{label}</div>
                <div className="ml-auto text-xs text-[var(--muted)]">{timeAgo(m.fecha)}</div>
              </div>
            )
          })}
          {movimientos.length === 0 ? (
            <div className="py-6 text-sm text-[var(--muted)]">Sin movimientos.</div>
          ) : null}
        </div>
      </CardBody>
    </Card>
  )
}
