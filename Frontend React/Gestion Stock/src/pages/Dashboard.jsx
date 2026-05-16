import { useEffect, useMemo, useState } from 'react'
import { ScanLine } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../components/atoms/Button'
import { Modal } from '../components/atoms/Modal'
import { Subtle, Title } from '../components/atoms/Title'
import { Card, CardBody, CardHeader } from '../components/atoms/Card'
import { ProductRow } from '../components/molecules/ProductRow'
import { DashboardStats } from '../components/organisms/DashboardStats'
import { RecentMovements } from '../components/organisms/RecentMovements'
import { motionTokens } from '../design/motion'
import { useAppStore } from '../store/useAppStore'

export function Dashboard() {
  const [stockPulse, setStockPulse] = useState(0)
  const [scannerOpen, setScannerOpen] = useState(false)

  const productos = useAppStore((s) => s.productos)
  const movimientos = useAppStore((s) => s.movimientos)

  useEffect(() => {
    const id = setInterval(() => setStockPulse((p) => (p + 1) % 9999), 1600)
    return () => clearInterval(id)
  }, [])

  const productosById = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos])
  const lowStock = useMemo(() => productos.filter((p) => p.stock <= p.minimo), [productos])

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: motionTokens.duration.slow, ease: motionTokens.ease.standard }}
        className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6"
      >
        <div className="min-w-0">
          <Title>Dashboard</Title>
          <Subtle>Vista general del sistema (modo demo).</Subtle>
        </div>

        <div className="md:ml-auto">
          <Button variant="primary" onClick={() => setScannerOpen(true)} className="justify-center">
            <ScanLine size={18} />
            Scanner
          </Button>
        </div>
      </motion.div>

      <DashboardStats stockPulse={stockPulse} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <Card>
          <CardHeader>
            <div>
              <div className="text-sm font-semibold">Productos bajo minimo</div>
              <div className="text-xs text-[var(--muted)] pt-1">Accion recomendada: reponer.</div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {lowStock.slice(0, 6).map((p) => (
                <ProductRow
                  key={p.id}
                  product={{
                    sku: p.codigo,
                    name: p.nombre,
                    stock: p.stock,
                    min: p.minimo,
                    price: p.precio,
                  }}
                />
              ))}
              {lowStock.length === 0 ? (
                <div className="py-6 text-sm text-[var(--muted)]">No hay productos en bajo minimo.</div>
              ) : null}
            </div>
          </CardBody>
        </Card>

        <RecentMovements movimientos={movimientos} productosById={productosById} />
      </div>

      <ScannerDemoModal open={scannerOpen} onClose={() => setScannerOpen(false)} />
    </div>
  )
}

export function ScannerDemoModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Scanner (demo)">
      <div className="space-y-3">
        <Title as="h2" className="text-lg">
          Simulacion
        </Title>
        <Subtle>
          Esto es una ilusion de funcionalidad: mas adelante conectamos camara / lector y la logica de ingreso.
        </Subtle>
        <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Lectura</div>
          <div className="pt-2 font-mono text-sm text-zinc-100">EAN: 7790000001234</div>
          <div className="pt-1 text-xs text-[var(--muted)]">Producto: Aceite 1L</div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={onClose}>
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
