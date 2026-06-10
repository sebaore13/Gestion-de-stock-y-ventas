import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../services/api'
import { Card, CardBody, CardHeader } from '../components/atoms/Card'
import { Badge } from '../components/atoms/Badge'
import { Button } from '../components/atoms/Button'
import { SearchBar } from '../components/molecules/SearchBar'
import { moneyCLP } from '../design/format'
import { motionTokens } from '../design/motion'

export function CotizacionesHistorial() {
  const [q, setQ] = useState('')
  const [quotations, setQuotations] = useState([])
  const [loadError, setLoadError] = useState('')
  const [openId, setOpenId] = useState(null)
  const [reprintingId, setReprintingId] = useState(null)

  useEffect(() => {
    api.get('/quotations?limit=200&includeItems=1')
      .then((res) => {
        setQuotations(res.quotations || [])
        setLoadError('')
      })
      .catch((err) => {
        setLoadError(err?.message || 'Error de conexion con el servidor')
      })
  }, [])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return quotations
    return quotations.filter((c) => {
      const itemsText = (c.items || []).map((it) => `${it.nombre_snapshot} ${it.codigo_snapshot} ${it.cantidad}`).join(' ')
      const costosText = (c.otros_costos || []).map((oc) => `${oc.descripcion} ${oc.monto}`).join(' ')
      return `${c.id} ${c.usuarioNombre ?? ''} ${c.nota ?? ''} ${c.total ?? ''} ${itemsText} ${costosText}`
        .toLowerCase().includes(needle)
    })
  }, [quotations, q])

  async function reprint(id) {
    setReprintingId(id)
    try {
      await api.post(`/quotations/${id}/reprint`)
      toast.success('Reenviada a impresion')
    } catch (err) {
      toast.error('Error al reimprimir', { description: err.message })
    } finally {
      setReprintingId(null)
    }
  }

  const estadoVariant = (estado) => {
    switch (estado) {
      case 'Aprobada': return 'success'
      case 'Rechazada': return 'danger'
      case 'Convertida': return 'info'
      default: return 'neutral'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <div className="text-sm font-semibold">Historial de Cotizaciones</div>
          <div className="text-xs text-[var(--muted)] pt-1">
            Cotizaciones registradas. <a href="#/cotizaciones" className="underline">Nueva cotizacion</a>
          </div>
        </div>
        <Badge variant="neutral">{rows.length}</Badge>
      </CardHeader>
      <CardBody>
        {loadError ? (
          <div className="mb-4 rounded-xl bg-red-400/10 text-red-300 text-xs px-3 py-2">{loadError}</div>
        ) : null}
        <div className="pb-4">
          <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cotizaciones..." />
        </div>
        <div className="space-y-2">
          {rows.map((c) => {
            const costos = c.otros_costos || []
            return (
            <div key={c.id} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3">
              <button
                type="button"
                className="w-full text-left px-3 py-3 sm:px-4 sm:py-4"
                aria-expanded={openId === c.id}
                onClick={() => setOpenId((prev) => (prev === c.id ? null : c.id))}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-zinc-100">Cotizacion #{c.id}</div>
                      <div className="flex sm:hidden items-center gap-1">
                        <div className="text-base font-semibold text-zinc-100 tabular-nums">
                          {moneyCLP(Number(c.total) || 0)}
                        </div>
                        <ChevronDown
                          size={16}
                          className={openId === c.id ? 'text-zinc-300 transition-transform rotate-180' : 'text-zinc-300 transition-transform'}
                        />
                      </div>
                    </div>
                    <div className="pt-1 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-x-4 sm:gap-y-1 text-xs text-[var(--muted)]">
                      <span className="leading-snug">{new Date(c.fecha).toLocaleString('es-CL')}</span>
                      <span className="hidden sm:inline text-zinc-500">·</span>
                      <span className="hidden sm:inline">
                        Items: {(c.items || []).reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0)}
                      </span>
                      {costos.length > 0 ? (
                        <><span className="hidden sm:inline text-zinc-500">·</span><span className="hidden sm:inline">+{costos.length} costos</span></>
                      ) : null}
                      <Badge variant={estadoVariant(c.estado)}>{c.estado}</Badge>
                    </div>
                  </div>
                  <div className="hidden sm:flex shrink-0 items-start gap-3">
                    <div className="text-right">
                      <div className="text-xs text-zinc-400">Total</div>
                      <div className="text-lg font-semibold text-zinc-100 tabular-nums">{moneyCLP(Number(c.total) || 0)}</div>
                    </div>
                    <ChevronDown
                      size={18}
                      className={openId === c.id ? 'text-zinc-300 transition-transform rotate-180 mt-1' : 'text-zinc-300 transition-transform mt-1'}
                    />
                  </div>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {openId === c.id ? (
                  <motion.div
                    key="details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: motionTokens.duration.slow, ease: motionTokens.ease.standard }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                      <div className="border-t border-[rgba(255,255,255,0.06)]" />
                      <div className="pt-3">
                        <div className="text-xs text-zinc-400 pb-2">Productos</div>
                        <div className="space-y-2">
                          {(c.items || []).map((it) => (
                            <div key={it.id} className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-sm text-zinc-100 truncate">{it.nombre_snapshot}</div>
                                <div className="text-xs text-[var(--muted)] truncate">{it.codigo_snapshot}</div>
                              </div>
                              <div className="shrink-0 text-right">
                                <div className="text-sm text-zinc-100 font-medium tabular-nums">x{it.cantidad}</div>
                                <div className="text-xs text-[var(--muted)] tabular-nums">{moneyCLP(Number(it.precio_snapshot) || 0)}</div>
                              </div>
                            </div>
                          ))}
                          {(c.items || []).length === 0 ? (
                            <div className="text-sm text-[var(--muted)]">Sin items.</div>
                          ) : null}
                        </div>

                        {costos.length > 0 ? (
                          <div className="pt-3">
                            <div className="text-xs text-zinc-400 pb-2">Costos adicionales</div>
                            <div className="space-y-2">
                              {costos.map((oc, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-4">
                                  <div className="text-sm text-zinc-100 truncate">{oc.descripcion}</div>
                                  <div className="shrink-0 text-right text-sm text-zinc-100 font-medium tabular-nums">{moneyCLP(Number(oc.monto) || 0)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="pt-3 flex items-center justify-between text-xs text-[var(--muted)]">
                          <div>
                            {c.nota ? <span>Nota: {c.nota}</span> : null}
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => reprint(c.id)}
                            disabled={reprintingId === c.id}
                          >
                            <Printer size={14} />
                            {reprintingId === c.id ? 'Reenviando...' : 'Reimprimir'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )})}
          {rows.length === 0 ? (
            <div className="py-6 text-sm text-[var(--muted)]">Sin resultados.</div>
          ) : null}
        </div>
      </CardBody>
    </Card>
  )
}
