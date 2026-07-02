import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { api } from '../../services/api'
import { Badge } from '../../components/atoms/Badge'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'
import { Button } from '../../components/atoms/Button'
import { Input } from '../../components/atoms/Input'
import { Select } from '../../components/atoms/Select'
import { SearchBar } from '../../components/molecules/SearchBar'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { motionTokens } from '../../design/motion'

function ymdLocal(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

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
  const [sales, setSales] = useState([])
  const [movements, setMovements] = useState([])
  const [qMov, setQMov] = useState('')
  const [tipo, setTipo] = useState('')
  const [qSales, setQSales] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const loadSeq = useRef(0)
  const [openSaleId, setOpenSaleId] = useState(null)

  function setPresetToday() {
    const d = new Date()
    const k = ymdLocal(d)
    setFrom(k)
    setTo(k)
  }

  function setPresetLastWeek() {
    const d = new Date()
    const end = ymdLocal(d)
    const startD = new Date(d)
    startD.setDate(startD.getDate() - 6)
    const start = ymdLocal(startD)
    setFrom(start)
    setTo(end)
  }

  function setPresetThisMonth() {
    const d = new Date()
    const end = ymdLocal(d)
    const start = ymdLocal(new Date(d.getFullYear(), d.getMonth(), 1))
    setFrom(start)
    setTo(end)
  }

  async function load() {
    const seq = ++loadSeq.current
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      params.set('limit', '500')
      params.set('includeItems', '1')
      const qs = params.toString()
      const [s, m] = await Promise.all([
        api.get(`/sales?${qs}`),
        api.get(`/movements?${qs}`),
      ])
      if (seq !== loadSeq.current) return

      setSales(s.sales || [])
      setMovements(m.movements || [])
      setLoadError('')
    } catch (err) {
      if (seq !== loadSeq.current) return
      setSales([])
      setMovements([])
      setLoadError(err?.message || 'Error de conexion con el servidor')
    } finally {
      if (seq !== loadSeq.current) return
      setLoading(false)
    }
  }

  function downloadPdf() {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })

    const title = 'Reporte de Ventas y Movimientos'
    const subtitle = `Rango: ${from || 'N/A'} a ${to || 'N/A'} · Ventas: ${resumen.totalVentas} · Mov: ${resumen.totalMov} · Total: $ ${new Intl.NumberFormat('es-CL').format(resumen.totalCLP)}`

    doc.setFontSize(14)
    doc.text(title, 40, 40)
    doc.setFontSize(10)
    doc.text(subtitle, 40, 58)

    autoTable(doc, {
      startY: 78,
      head: [['Venta', 'Fecha', 'Vendedor', 'Metodo', 'Otros', 'Total', 'Items', 'Nota']],
      body: saleRows.map((s) => [
        `#${s.id}`,
        new Date(s.fecha).toLocaleString('es-CL'),
        s.usuarioNombre ?? `ID ${s.usuarioId}`,
        s.metodoPago ?? 'N/A',
        String(Number(s.otrosCargos) || 0),
        String(Number(s.total) || 0),
        (s.items || []).map((it) => `${it.nombre_snapshot} x${it.cantidad}`).join(' | '),
        s.nota || '',
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [245, 245, 245], textColor: 0 },
      theme: 'grid',
    })

    const afterSalesY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 18 : 96
    doc.setFontSize(11)
    doc.text('Movimientos', 40, afterSalesY)

    autoTable(doc, {
      startY: afterSalesY + 10,
      head: [['Fecha', 'Tipo', 'Producto', 'Codigo', 'Cantidad', 'Usuario']],
      body: movementRows.map((m) => [
        new Date(m.fecha).toLocaleString('es-CL'),
        m.tipo,
        m.productoNombre ?? 'Producto eliminado',
        m.productoCodigo ?? `ID ${m.productoId}`,
        String(m.cantidad),
        m.usuarioNombre ?? `ID ${m.usuarioId}`,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [245, 245, 245], textColor: 0 },
      theme: 'grid',
    })

    const name = `reporte_${(from || 'na')}_${(to || 'na')}.pdf`
    doc.save(name)
  }

  useEffect(() => {
    // Importante: evita doble request inicial (1) render con from/to vacios y (2) luego preset hoy.
    // Seteamos el rango una sola vez y el loader corre cuando el rango ya esta listo.
    setPresetToday()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!from || !to) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to])

  const saleRows = useMemo(() => {
    const needle = qSales.trim().toLowerCase()
    if (!needle) return sales
    return sales.filter((s) => {
      const itemsText = (s.items || []).map((it) => `${it.nombre_snapshot} ${it.codigo_snapshot} ${it.cantidad}`).join(' ')
      return `${s.id} ${s.usuarioNombre ?? ''} ${s.usuarioRol ?? ''} ${s.metodoPago ?? ''} ${s.nota ?? ''} ${s.total ?? ''} ${itemsText}`
        .toLowerCase().includes(needle)
    })
  }, [sales, qSales])

  const movementRows = useMemo(() => {
    const needle = qMov.trim().toLowerCase()
    return movements
      .filter((m) => (tipo ? m.tipo === tipo : true))
      .filter((m) => {
        if (!needle) return true
        return `${m.tipo} ${m.cantidad} ${m.productoNombre ?? ''} ${m.productoCodigo ?? ''} ${m.usuarioNombre ?? ''} ${m.motivo ?? ''} ${m.nota ?? ''}`
          .toLowerCase().includes(needle)
      })
  }, [movements, qMov, tipo])

  const resumen = useMemo(() => {
    const totalVentas = sales.length
    const totalCLP = sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0)
    const totalMov = movements.length
    return { totalVentas, totalCLP, totalMov }
  }, [sales, movements])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Reporte</div>
            <div className="text-xs text-[var(--muted)] pt-1">Filtra por rango de fechas (ventas).</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="print:hidden" onClick={downloadPdf} disabled={loading}>
              Descargar PDF
            </Button>
            <Badge variant={loading ? 'info' : 'neutral'}>{loading ? 'Cargando' : 'OK'}</Badge>
          </div>
        </CardHeader>
        <CardBody>
          {loadError ? (
            <div className="mb-4 rounded-xl bg-red-400/10 text-red-300 text-xs px-3 py-2">{loadError}</div>
          ) : null}
          <div className="print-only rounded-2xl border border-[rgba(0,0,0,0.12)] bg-white px-4 py-4">
            <div className="text-sm font-semibold">Reporte</div>
            <div className="text-xs text-zinc-600 pt-1">
              Rango: {from || 'N/A'} a {to || 'N/A'}
            </div>
            <div className="text-xs text-zinc-600 pt-1">
              Ventas: {resumen.totalVentas} · Total ventas: ${' '}
              {new Intl.NumberFormat('es-CL').format(resumen.totalCLP)}
            </div>
          </div>

          <div className="no-print space-y-3">
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 min-w-0">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="text-xs text-zinc-400">Desde</div>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="text-xs text-zinc-400">Hasta</div>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-end">
                <Button variant="secondary" onClick={setPresetToday}>Hoy</Button>
                <Button variant="secondary" onClick={setPresetLastWeek}>Ultima semana</Button>
                <Button variant="secondary" onClick={setPresetThisMonth}>Este mes</Button>
              </div>
            </div>
            <div
              className="w-full sm:w-fit max-w-full flex flex-wrap items-center gap-x-4 gap-y-1.5"
            >
              <div className="flex items-center gap-2 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-3 py-2">
                <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="text-[11px] text-[var(--muted)]">Ventas</span>
                  <span className="text-sm text-zinc-100 font-semibold tabular-nums">{resumen.totalVentas}</span>
                </div>
                <div className="h-4 w-px bg-[rgba(255,255,255,0.10)]" aria-hidden="true" />
                <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="text-[11px] text-[var(--muted)]">Mov</span>
                  <span className="text-sm text-zinc-100 font-semibold tabular-nums">{resumen.totalMov}</span>
                </div>
                <div className="h-4 w-px bg-[rgba(255,255,255,0.10)]" aria-hidden="true" />
                <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="text-[11px] text-[var(--muted)]">Total</span>
                  <span className="text-sm text-zinc-100 font-semibold tabular-nums">$ {new Intl.NumberFormat('es-CL').format(resumen.totalCLP)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Historial de ventas</div>
            <div className="text-xs text-[var(--muted)] pt-1">Cada venta se muestra como una transaccion con sus productos.</div>
          </div>
          <Badge variant="neutral">$ {new Intl.NumberFormat('es-CL').format(resumen.totalCLP)}</Badge>
        </CardHeader>
        <CardBody>
          <div className="pb-4">
            <SearchBar value={qSales} onChange={(e) => setQSales(e.target.value)} placeholder="Buscar ventas por usuario, metodo, nota, total..." />
          </div>
          <div className="space-y-2">
            {saleRows.map((s) => (
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
                        <span className="hidden sm:inline">{s.usuarioNombre ?? `ID ${s.usuarioId}`}</span>
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

                          {s.servicios && s.servicios.length > 0 ? (
                            <div className="pt-3">
                              <div className="text-xs text-zinc-400 pb-2">Servicios</div>
                              <div className="space-y-2">
                                {(s.servicios || []).map((sv, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                      <div className="text-sm text-zinc-100 truncate">{sv.descripcion}</div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                      <div className="text-sm text-zinc-100 font-medium tabular-nums">x{sv.cantidad}</div>
                                      <div className="text-xs text-[var(--muted)] tabular-nums">$ {new Intl.NumberFormat('es-CL').format(Number(sv.precio) || 0)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                            <div>
                              Vendedor: {s.usuarioNombre ?? `ID ${s.usuarioId}`} · {s.usuarioRol ?? 'N/A'}
                            </div>
                            <div>
                              Metodo: {s.metodoPago ?? 'N/A'} · Otros: $ {new Intl.NumberFormat('es-CL').format(Number(s.otrosCargos) || 0)}
                            </div>
                            {s.nota ? <div className="sm:col-span-2 truncate">Nota: {s.nota}</div> : null}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ))}
            {saleRows.length === 0 ? (
              <div className="py-6 text-sm text-[var(--muted)]">Sin resultados.</div>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Movimientos</div>
            <div className="text-xs text-[var(--muted)] pt-1">Historial de cambios de stock (ingresos/ajustes/salidas).</div>
          </div>
          <Badge variant="neutral">{movements.length}</Badge>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 pb-4">
            <SearchBar value={qMov} onChange={(e) => setQMov(e.target.value)} placeholder="Buscar por producto, usuario, tipo..." className="flex-1 min-w-0" />
            <div className="space-y-1 shrink-0">
              <div className="text-xs text-zinc-400">Tipo</div>
              <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Todos</option>
                <option value="INGRESO">Ingreso</option>
                <option value="SALIDA">Salida</option>
                <option value="AJUSTE">Ajuste</option>
              </Select>
            </div>
          </div>

          <div className="overflow-auto rounded-2xl border border-[rgba(255,255,255,0.06)]">
            <table className="w-full text-sm whitespace-nowrap">
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
                {movementRows.map((m) => (
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
                {movementRows.length === 0 ? (
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
