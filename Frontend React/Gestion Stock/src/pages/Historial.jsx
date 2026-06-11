import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../services/api'
import { Card, CardBody, CardHeader } from '../components/atoms/Card'
import { Badge } from '../components/atoms/Badge'
import { Button } from '../components/atoms/Button'
import { SearchBar } from '../components/molecules/SearchBar'
import { motionTokens } from '../design/motion'

export function Historial() {
  const [q, setQ] = useState('')
  const [sales, setSales] = useState([])
  const [loadError, setLoadError] = useState('')
  const [openSaleId, setOpenSaleId] = useState(null)
  const [reprintingId, setReprintingId] = useState(null)

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

  async function reprint(id) {
    setReprintingId(id)
    try {
      await api.post(`/sales/${id}/reprint`)
      toast.success('Reenviada a impresion')
    } catch (err) {
      toast.error('Error al reimprimir', { description: err.message })
    } finally {
      setReprintingId(null)
    }
  }

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
            <div key={s.id} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3">
              <button
                type="button"
                className="w-full text-left px-3 py-3 sm:px-4 sm:py-4"
                aria-expanded={openSaleId === s.id}
                onClick={() => setOpenSaleId((prev) => (prev === s.id ? null : s.id))}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-zinc-100">Venta #{s.id}</div>
                      <div className="flex sm:hidden items-center gap-1">
                        <div className="text-base font-semibold text-zinc-100 tabular-nums">
                          $ {new Intl.NumberFormat('es-CL').format(Number(s.total) || 0)}
                        </div>
                        <ChevronDown
                          size={16}
                          className={openSaleId === s.id ? 'text-zinc-300 transition-transform rotate-180' : 'text-zinc-300 transition-transform'}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                    <div className="pt-1 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-x-4 sm:gap-y-1 text-xs text-[var(--muted)]">
                      <span className="leading-snug">{new Date(s.fecha).toLocaleString('es-CL')}</span>
                      <span className="hidden sm:inline text-zinc-500">·</span>
                      <span className="hidden sm:inline">{s.metodoPago ?? 'N/A'}</span>
                      <span className="hidden sm:inline text-zinc-500">·</span>
                      <span className="hidden sm:inline">
                        Productos:{' '}
                        {(s.items || []).reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0)}
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:flex shrink-0 items-start gap-3">
                    <div className="text-right">
                      <div className="text-xs text-zinc-400">Total</div>
                      <div className="text-lg font-semibold text-zinc-100 tabular-nums">
                        $ {new Intl.NumberFormat('es-CL').format(Number(s.total) || 0)}
                      </div>
                    </div>
                    <ChevronDown
                      size={18}
                      className={openSaleId === s.id ? 'text-zinc-300 transition-transform rotate-180 mt-1' : 'text-zinc-300 transition-transform mt-1'}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {openSaleId === s.id ? (
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

                        <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                          <div>Metodo: {s.metodoPago ?? 'N/A'}</div>
                          <div>Otros: $ {new Intl.NumberFormat('es-CL').format(Number(s.otrosCargos) || 0)}</div>
                          {s.nota ? <div className="sm:col-span-2 truncate">Nota: {s.nota}</div> : null}
                        </div>
                        <div className="pt-3 flex justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => reprint(s.id)}
                            disabled={reprintingId === s.id}
                          >
                            <Printer size={14} />
                            {reprintingId === s.id ? 'Reenviando...' : 'Reimprimir'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
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
