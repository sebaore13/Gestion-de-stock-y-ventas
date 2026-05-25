import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { Badge } from '../../components/atoms/Badge'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'
import { Button } from '../../components/atoms/Button'
import { Input } from '../../components/atoms/Input'
import { Select } from '../../components/atoms/Select'
import { SearchBar } from '../../components/molecules/SearchBar'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  const [movements, setMovements] = useState([])
  const [sales, setSales] = useState([])
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState('')
  const [qSales, setQSales] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

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
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      params.set('limit', '500')
      const qs = params.toString()
      const [m, s] = await Promise.all([
        api.get(`/movements?${qs}`),
        api.get(`/sales?${qs}`),
      ])
      setMovements(m.movements || [])
      setSales(s.sales || [])
      setLoadError('')
    } catch (err) {
      setMovements([])
      setSales([])
      setLoadError(err?.message || 'Error de conexion con el servidor')
    } finally {
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
      head: [['Fecha', 'Vendedor', 'Rol', 'Metodo', 'Otros', 'Total', 'Nota']],
      body: saleRows.map((s) => [
        new Date(s.fecha).toLocaleString('es-CL'),
        s.usuarioNombre ?? `ID ${s.usuarioId}`,
        s.usuarioRol ?? 'N/A',
        s.metodoPago ?? 'N/A',
        String(Number(s.otrosCargos) || 0),
        String(Number(s.total) || 0),
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
      body: rows.map((m) => [
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
    if (!from && !to) setPresetToday()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to])

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

  const saleRows = useMemo(() => {
    const needle = qSales.trim().toLowerCase()
    if (!needle) return sales
    return sales.filter((s) => {
      return `${s.id} ${s.usuarioNombre ?? ''} ${s.usuarioRol ?? ''} ${s.metodoPago ?? ''} ${s.nota ?? ''} ${s.total ?? ''}`
        .toLowerCase().includes(needle)
    })
  }, [sales, qSales])

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
            <div className="text-xs text-[var(--muted)] pt-1">Filtra por rango de fechas (ventas + movimientos).</div>
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
              Ventas: {resumen.totalVentas} · Movimientos: {resumen.totalMov} · Total ventas: ${' '}
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
            <div className="text-sm font-semibold">Ventas</div>
            <div className="text-xs text-[var(--muted)] pt-1">Todas las ventas en el rango.</div>
          </div>
          <Badge variant="neutral">$ {new Intl.NumberFormat('es-CL').format(resumen.totalCLP)}</Badge>
        </CardHeader>
        <CardBody>
          <div className="pb-4">
            <SearchBar value={qSales} onChange={(e) => setQSales(e.target.value)} placeholder="Buscar ventas por usuario, metodo, nota, total..." />
          </div>
          <div className="overflow-auto rounded-2xl border border-[rgba(255,255,255,0.06)]">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-white/3">
                <tr className="text-left text-xs uppercase tracking-[0.14em] text-zinc-400">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Vendedor</th>
                  <th className="px-4 py-3">Metodo</th>
                  <th className="px-4 py-3">Otros</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Nota</th>
                </tr>
              </thead>
              <tbody>
                {saleRows.map((s) => (
                  <tr key={s.id} className="border-t border-[rgba(255,255,255,0.06)]">
                    <td className="px-4 py-3 text-zinc-300">{new Date(s.fecha).toLocaleString('es-CL')}</td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-100">{s.usuarioNombre ?? `ID ${s.usuarioId}`}</div>
                      <div className="text-xs text-[var(--muted)] pt-0.5">{s.usuarioRol ?? 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-100">{s.metodoPago ?? 'N/A'}</td>
                    <td className="px-4 py-3 text-zinc-100">{new Intl.NumberFormat('es-CL').format(Number(s.otrosCargos) || 0)}</td>
                    <td className="px-4 py-3 text-zinc-100 font-semibold">{new Intl.NumberFormat('es-CL').format(Number(s.total) || 0)}</td>
                    <td className="px-4 py-3 text-[var(--muted)] truncate max-w-[180px]">{s.nota || '-'}</td>
                  </tr>
                ))}
                {saleRows.length === 0 ? (
                  <tr><td className="px-4 py-10 text-[var(--muted)]" colSpan={6}>Sin resultados.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Historial</div>
            <div className="text-xs text-[var(--muted)] pt-1">Movimientos del sistema (rango).</div>
          </div>
          <Badge variant="neutral">{movements.length}</Badge>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 pb-4">
            <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por producto, usuario, tipo..." className="flex-1 min-w-0" />
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
