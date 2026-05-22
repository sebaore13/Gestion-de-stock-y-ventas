import { useEffect, useMemo, useState } from 'react'
import { Boxes, TriangleAlert, ShoppingCart, Users, History, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { StatCard } from '../../components/molecules/StatCard'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'

function todayKeyLocal() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

function dateKeyLocal(value) {
  if (!value) return ''
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ''
    return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'), String(value.getDate()).padStart(2, '0')].join('-')
  }
  const s = String(value)
  // Date-only values can be compared directly.
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // MySQL DATETIME often comes as "YYYY-MM-DD HH:mm:ss" (no timezone). Treat it as local.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
    const d = new Date(s.replace(' ', 'T'))
    if (Number.isNaN(d.getTime())) return ''
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
  }

  // ISO strings (with timezone) parse reliably.
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

export function AdminDashboard() {
  const [productos, setProductos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [ventas, setVentas] = useState([])

  useEffect(() => {
    api.get('/products?limit=500').then((res) => setProductos(res.products || [])).catch(() => {})
    api.get('/movements?limit=500').then((res) => setMovimientos(res.movements || [])).catch(() => {})
    api.get('/sales?limit=500').then((res) => setVentas(res.sales || [])).catch(() => {})
  }, [])

  const totalProductos = productos.length
  const criticos = productos.filter((p) => p.stock <= p.minimo).length
  const ventasHoy = useMemo(() => {
    const k = todayKeyLocal()
    return ventas.filter((s) => dateKeyLocal(s.fecha) === k).length
  }, [ventas])

  const movimientosHoy = useMemo(() => {
    const k = todayKeyLocal()
    return movimientos.filter((m) => dateKeyLocal(m.fecha) === k).length
  }, [movimientos])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total productos" value={new Intl.NumberFormat('es-CL').format(totalProductos)} icon={Boxes} color="blue" />
        <StatCard title="Stock critico" value={new Intl.NumberFormat('es-CL').format(criticos)} icon={TriangleAlert} color="red" />
        <StatCard title="Ventas del dia" value={new Intl.NumberFormat('es-CL').format(ventasHoy)} icon={ShoppingCart} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <div className="text-sm font-semibold">Acciones rapidas</div>
              <div className="text-xs text-[var(--muted)] pt-1">Administracion principal del sistema.</div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link to="/admin/usuarios" className="block">
                <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-4 hover:bg-white/5 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-zinc-100 font-semibold"><Users size={16} /> Usuarios</div>
                    <ArrowRight size={16} className="text-zinc-400" />
                  </div>
                  <div className="text-xs text-[var(--muted)] pt-1">Crear, editar roles y administrar acceso.</div>
                </div>
              </Link>
              <Link to="/admin/productos" className="block">
                <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-4 hover:bg-white/5 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-zinc-100 font-semibold"><Boxes size={16} /> Productos</div>
                    <ArrowRight size={16} className="text-zinc-400" />
                  </div>
                  <div className="text-xs text-[var(--muted)] pt-1">CRUD de catalogo, precios y stock minimo.</div>
                </div>
              </Link>
              <Link to="/admin/historial" className="block">
                <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-4 hover:bg-white/5 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-zinc-100 font-semibold"><History size={16} /> Historial</div>
                    <ArrowRight size={16} className="text-zinc-400" />
                  </div>
                  <div className="text-xs text-[var(--muted)] pt-1">Auditoria de ingresos/salidas/ajustes.</div>
                </div>
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <div className="text-sm font-semibold">Estado</div>
              <div className="text-xs text-[var(--muted)] pt-1">Resumen operativo rapido.</div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-zinc-100 font-semibold"><Users size={16} /> Usuarios</div>
                <div className="text-sm text-zinc-200">--</div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-zinc-100 font-semibold"><History size={16} /> Mov. hoy</div>
                <div className="text-sm text-zinc-200">{movimientosHoy}</div>
              </div>
              <div className="py-2" />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
