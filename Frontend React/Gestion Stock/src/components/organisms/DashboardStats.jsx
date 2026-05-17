import { motion } from 'framer-motion'
import { Boxes, Barcode, ShoppingCart, TriangleAlert } from 'lucide-react'
import { StatCard } from '../molecules/StatCard'
import { motionTokens } from '../../design/motion'
import { useAppStore } from '../../store/useAppStore'

export function DashboardStats({ stockPulse = 0 }) {
  const productos = useAppStore((s) => s.productos)
  const movimientos = useAppStore((s) => s.movimientos)

  const productosActivos = productos.length
  const unidades = productos.reduce((acc, p) => acc + p.stock, 0) + stockPulse
  const bajoMinimo = productos.filter((p) => p.stock <= p.minimo).length

  const today = new Date()
  const hoyKey = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join(
    '-',
  )
  const movsHoy = movimientos.filter((m) => m.fecha.slice(0, 10) === hoyKey).length

  const kpis = [
    {
      title: 'Unidades en stock',
      value: new Intl.NumberFormat('es-CL').format(unidades),
      delta: 6,
      icon: Boxes,
      accent: 'orange',
    },
    {
      title: 'Productos activos',
      value: new Intl.NumberFormat('es-CL').format(productosActivos),
      delta: 0,
      icon: Barcode,
      accent: 'blue',
    },
    {
      title: 'Movimientos hoy',
      value: new Intl.NumberFormat('es-CL').format(movsHoy),
      delta: 12,
      icon: ShoppingCart,
      accent: 'green',
    },
    {
      title: 'Bajo minimo',
      value: new Intl.NumberFormat('es-CL').format(bajoMinimo),
      delta: -4,
      icon: TriangleAlert,
      accent: 'red',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={kpi.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: motionTokens.duration.slow,
            ease: motionTokens.ease.standard,
            delay: 0.03 * idx,
          }}
        >
          <StatCard {...kpi} />
        </motion.div>
      ))}
    </div>
  )
}
