import { Card, CardBody, CardHeader } from '../components/atoms/Card'
import { Badge } from '../components/atoms/Badge'
import { Subtle } from '../components/atoms/Title'

export function Config() {
  return (
    <Card>
      <CardHeader>
        <div>
          <div className="text-sm font-semibold">Configuracion</div>
          <div className="text-xs text-[var(--muted)] pt-1">Pantalla placeholder (mock).</div>
        </div>
        <Badge variant="neutral">Proximamente</Badge>
      </CardHeader>
      <CardBody>
        <Subtle>
          Aca pondremos: datos de negocio, usuarios/roles, impresora, impuestos, backups, etc.
        </Subtle>
      </CardBody>
    </Card>
  )
}
