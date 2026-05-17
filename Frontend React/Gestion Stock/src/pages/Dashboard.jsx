import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Barcode, ShoppingCart, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { Button } from '../components/atoms/Button'
import { Subtle, Title } from '../components/atoms/Title'
import { Card, CardBody, CardHeader } from '../components/atoms/Card'
import { Input } from '../components/atoms/Input'
import { Badge } from '../components/atoms/Badge'
import { ProductRow } from '../components/molecules/ProductRow'
import { motionTokens } from '../design/motion'
import { moneyCLP } from '../design/format'

export function Dashboard() {
  const [codigo, setCodigo] = useState('')
  const [productoEncontrado, setProductoEncontrado] = useState(null)
  const [lookupError, setLookupError] = useState(false)
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])

  useEffect(() => {
    api.get('/products?limit=500').then((res) => setProducts(res.products || [])).catch(() => {})
    api.get('/movements?limit=20').then((res) => setMovements(res.movements || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const needle = String(codigo || '').trim()
    if (!needle) {
      setProductoEncontrado(null)
      setLookupError(false)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/products/by-codigo/${encodeURIComponent(needle)}`)
        setProductoEncontrado(res.product)
        setLookupError(false)
      } catch (err) {
        if (err.status === 404) {
          setProductoEncontrado(null)
          setLookupError(true)
        }
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [codigo])

  const lowStock = useMemo(() => products.filter((p) => p.stock <= p.minimo), [products])

  const ultimasVentas = useMemo(() => {
    return movements.filter((m) => m.tipo === 'SALIDA').slice(0, 4)
  }, [movements])

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
          <Subtle>Atajos rapidos para consultas.</Subtle>
        </div>
      </motion.div>

      <Card className="border-[rgb(var(--primary-rgb)/0.28)] bg-[rgba(24,24,27,0.70)]">
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Consultar precio</div>
            <div className="text-xs text-[var(--muted)] pt-1">Busca por codigo.</div>
          </div>
          <Badge variant="info">
            <span className="inline-flex items-center gap-2">
              <Barcode size={14} /> Codigo
            </span>
          </Badge>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-start gap-3">
            <div>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej: 780123456"
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                }}
              />
              {codigo.trim() ? (
                <div className="pt-2">
                  <Button variant="secondary" onClick={() => setCodigo('')} aria-label="Limpiar codigo">
                    <X size={16} />
                    Limpiar Busqueda
                  </Button>
                </div>
              ) : null}
            </div>

            <Link to="/ventas" className="block">
              <Button variant="primary" className="w-full justify-center">
                Ir a venta <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          <div className="pt-4">
            {codigo.trim() ? (
              productoEncontrado ? (
                <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-zinc-100 truncate">{productoEncontrado.nombre}</div>
                      <div className="text-xs text-[var(--muted)] pt-0.5">
                        {productoEncontrado.codigo} · {productoEncontrado.categoria}
                      </div>
                      <div className="text-xs text-[var(--muted)] pt-1">
                        Ingreso:{' '}
                        {productoEncontrado.fechaIngreso
                          ? new Date(productoEncontrado.fechaIngreso).toLocaleDateString('es-CL')
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">Stock {productoEncontrado.stock}</Badge>
                      <Badge variant={productoEncontrado.stock <= productoEncontrado.minimo ? 'danger' : 'success'}>
                        {productoEncontrado.stock <= productoEncontrado.minimo ? 'Stock Bajo' : 'OK'}
                      </Badge>
                      <Badge variant="neutral">{moneyCLP(productoEncontrado.precio)}</Badge>
                    </div>
                  </div>
                </div>
              ) : lookupError ? (
                <div className="py-2 text-sm text-[var(--muted)]">No encontre un producto con ese codigo.</div>
              ) : null
            ) : (
              <div className="py-2 text-sm text-[var(--muted)]">Ingresa un codigo o escribe el nombre para ver precio y stock.</div>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div>
              <div className="text-sm font-semibold">Ultimas ventas</div>
              <div className="text-xs text-[var(--muted)] pt-1">Ultimas 4 salidas registradas.</div>
            </div>
            <Badge variant="neutral">
              <span className="inline-flex items-center gap-2">
                <ShoppingCart size={14} /> SALIDA
              </span>
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {ultimasVentas.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3"
                >
                  <Badge variant="info" className="shrink-0">-{m.cantidad}</Badge>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-100 truncate">{m.productoNombre ?? 'Producto'}</div>
                    <div className="text-xs text-[var(--muted)] pt-0.5">
                      {m.productoCodigo ?? `ID ${m.productoId}`} · {new Date(m.fecha).toLocaleString('es-CL')}
                    </div>
                  </div>
                </div>
              ))}
              {ultimasVentas.length === 0 ? (
                <div className="py-6 text-sm text-[var(--muted)]">Todavia no se registraron ventas.</div>
              ) : null}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <div className="text-sm font-semibold">Productos con stock bajo</div>
              <div className="text-xs text-[var(--muted)] pt-1">Para avisar o reponer.</div>
            </div>
            <Badge variant={lowStock.length ? 'danger' : 'success'}>{lowStock.length}</Badge>
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
                <div className="py-6 text-sm text-[var(--muted)]">No hay productos con stock bajo.</div>
              ) : null}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
