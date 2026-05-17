import { useMemo } from 'react'
import { Boxes, TriangleAlert, ShoppingCart, Users, History, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard } from '../../components/molecules/StatCard'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'
import { Button } from '../../components/atoms/Button'
import { useAppStore } from '../../store/useAppStore'

function todayKeyLocal() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

export function AdminDashboard() {
  const productos = useAppStore((s) => s.productos)
  const movimientos = useAppStore((s) => s.movimientos)
  const usuarios = useAppStore((s) => s.usuarios)

  const totalProductos = productos.length
  const criticos = productos.filter((p) => p.stock <= p.minimo).length
  const ventasHoy = useMemo(() => {
    const k = todayKeyLocal()
    return movimientos.filter((m) => m.tipo === 'SALIDA' && m.fecha.slice(0, 10) === k).length
  }, [movimientos])

  const movimientosHoy = useMemo(() => {
    const k = todayKeyLocal()
    return movimientos.filter((m) => m.fecha.slice(0, 10) === k).length
  }, [movimientos])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total productos"
          value={new Intl.NumberFormat('es-CL').format(totalProductos)}
          delta={0}
          icon={Boxes}
          accent="red"
        />
        <StatCard
          title="Stock critico"
          value={new Intl.NumberFormat('es-CL').format(criticos)}
          delta={criticos ? -4 : 0}
          icon={TriangleAlert}
          accent="red"
        />
        <StatCard
          title="Ventas del dia"
          value={new Intl.NumberFormat('es-CL').format(ventasHoy)}
          delta={12}
          icon={ShoppingCart}
          accent="green"
        />
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
                    <div className="flex items-center gap-2 text-zinc-100 font-semibold">
                      <Users size={16} /> Usuarios
                    </div>
                    <ArrowRight size={16} className="text-zinc-400" />
                  </div>
                  <div className="text-xs text-[var(--muted)] pt-1">Crear, editar roles y administrar acceso.</div>
                </div>
              </Link>
              <Link to="/admin/productos" className="block">
                <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-4 hover:bg-white/5 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-zinc-100 font-semibold">
                      <Boxes size={16} /> Productos
                    </div>
                    <ArrowRight size={16} className="text-zinc-400" />
                  </div>
                  <div className="text-xs text-[var(--muted)] pt-1">CRUD de catalogo, precios y stock minimo.</div>
                </div>
              </Link>
              <Link to="/admin/historial" className="block">
                <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-4 hover:bg-white/5 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-zinc-100 font-semibold">
                      <History size={16} /> Historial
                    </div>
                    <ArrowRight size={16} className="text-zinc-400" />
                  </div>
                  <div className="text-xs text-[var(--muted)] pt-1">Auditoria de ingresos/salidas/ajustes.</div>
                </div>
              </Link>
              <Link to="/admin/historial/nuevo" className="block">
                <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-4 hover:bg-white/5 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-zinc-100 font-semibold">
                      <History size={16} /> Crear historial
                    </div>
                    <ArrowRight size={16} className="text-zinc-400" />
                  </div>
                  <div className="text-xs text-[var(--muted)] pt-1">Registrar movimiento manual (impacta stock).</div>
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
                <div className="flex items-center gap-2 text-sm text-zinc-100 font-semibold">
                  <Users size={16} /> Usuarios
                </div>
                <div className="text-sm text-zinc-200">{usuarios.length}</div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-zinc-100 font-semibold">
                  <History size={16} /> Mov. hoy
                </div>
                <div className="text-sm text-zinc-200">{movimientosHoy}</div>
              </div>
              <Link to="/admin/historial/nuevo" className="block">
                <Button variant="primary" className="w-full justify-center">
                  Crear movimiento
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
