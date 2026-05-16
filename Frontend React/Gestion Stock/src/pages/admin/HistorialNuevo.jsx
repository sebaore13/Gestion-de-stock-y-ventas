import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '../../components/atoms/Badge'
import { Button } from '../../components/atoms/Button'
import { Card, CardBody, CardHeader } from '../../components/atoms/Card'
import { Input } from '../../components/atoms/Input'
import { Select } from '../../components/atoms/Select'
import { useAppStore } from '../../store/useAppStore'

export function AdminHistorialNuevo() {
  const productos = useAppStore((s) => s.productos)
  const usuarios = useAppStore((s) => s.usuarios)
  const usuarioActivoId = useAppStore((s) => s.usuarioActivoId)
  const crearMovimiento = useAppStore((s) => s.crearMovimiento)

  const [tipo, setTipo] = useState('INGRESO')
  const [productoId, setProductoId] = useState(productos[0]?.id ?? 1)
  const [cantidad, setCantidad] = useState(1)
  const [usuarioId, setUsuarioId] = useState(usuarioActivoId)

  const producto = useMemo(() => productos.find((p) => p.id === Number(productoId)), [productos, productoId])
  const usuario = useMemo(() => usuarios.find((u) => u.id === Number(usuarioId)), [usuarios, usuarioId])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Crear historial</div>
            <div className="text-xs text-[var(--muted)] pt-1">
              Crea un movimiento y ajusta stock automaticamente.
            </div>
          </div>
          <Badge variant="neutral">Admin</Badge>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="INGRESO">Ingreso (suma stock)</option>
              <option value="SALIDA">Salida (resta stock)</option>
              <option value="AJUSTE">Ajuste (+/- stock)</option>
            </Select>

            <Select value={productoId} onChange={(e) => setProductoId(Number(e.target.value))}>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} · {p.nombre}
                </option>
              ))}
            </Select>

            <Input
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              type="number"
              placeholder={tipo === 'AJUSTE' ? 'Cantidad (+/-)' : 'Cantidad'}
            />

            <Select value={usuarioId} onChange={(e) => setUsuarioId(Number(e.target.value))}>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.rol})
                </option>
              ))}
            </Select>
          </div>

          <div className="pt-4 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
            <div className="text-xs text-[var(--muted)]">
              Preview: {producto?.nombre ?? 'N/A'} · stock actual {producto?.stock ?? 'N/A'} · usuario {usuario?.nombre ?? 'N/A'}
            </div>
            <Button
              variant="primary"
              onClick={() => {
                const res = crearMovimiento({
                  tipo,
                  productoId: Number(productoId),
                  cantidad: Number(cantidad),
                  usuarioId: Number(usuarioId),
                })

                if (!res.ok) {
                  toast.error('No se pudo crear', { description: res.error })
                  return
                }

                toast.success('Movimiento creado')
                setCantidad(1)
              }}
            >
              Crear movimiento
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
