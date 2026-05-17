import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../services/api'
import { Badge } from '../../components/atoms/Badge'
import { Button } from '../../components/atoms/Button'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'
import { Input } from '../../components/atoms/Input'
import { Select } from '../../components/atoms/Select'
import { useAuthStore } from '../../services/auth.store'

export function AdminHistorialNuevo() {
  const user = useAuthStore((s) => s.user)
  const [products, setProducts] = useState([])
  const [tipo, setTipo] = useState('INGRESO')
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState(1)

  useEffect(() => {
    api.get('/products?limit=500').then((res) => {
      const list = res.products || []
      setProducts(list)
      if (!productoId && list.length) setProductoId(String(list[0].id))
    }).catch(() => {})
  }, [])

  const producto = useMemo(() => products.find((p) => String(p.id) === productoId), [products, productoId])

  function handleCreate() {
    toast.error('Funcionalidad pendiente', { description: 'El endpoint para crear movimientos aun no esta implementado en el backend.' })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Crear historial</div>
            <div className="text-xs text-[var(--muted)] pt-1">Crea un movimiento y ajusta stock automaticamente.</div>
          </div>
          <Badge variant="neutral">Proximamente</Badge>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="INGRESO">Ingreso (suma stock)</option>
              <option value="SALIDA">Salida (resta stock)</option>
              <option value="AJUSTE">Ajuste (+/- stock)</option>
            </Select>
            <Select value={productoId} onChange={(e) => setProductoId(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.codigo} · {p.nombre}</option>
              ))}
            </Select>
            <Input value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} type="number" placeholder={tipo === 'AJUSTE' ? 'Cantidad (+/-)' : 'Cantidad'} />
            <Select value={user?.id ?? ''} disabled>
              <option value={user?.id}>{user?.nombre} ({user?.rol})</option>
            </Select>
          </div>
          <div className="pt-4 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
            <div className="text-xs text-[var(--muted)]">
              Preview: {producto?.nombre ?? 'N/A'} · stock actual {producto?.stock ?? 'N/A'} · usuario {user?.nombre ?? 'N/A'}
            </div>
            <Button variant="primary" onClick={handleCreate}>Crear movimiento</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
