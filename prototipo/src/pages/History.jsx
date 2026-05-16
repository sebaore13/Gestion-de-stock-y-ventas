import { useMemo, useState } from 'react'
import { useAppStore } from '../lib/store.jsx'
import { formatDateTime } from '../lib/format.js'

function movementTotalItems(m) {
  return (m.items ?? []).reduce((acc, it) => acc + (it.qty ?? 0), 0)
}

export default function History() {
  const { movements, productsById } = useAppStore()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return movements
    return movements.filter((m) => {
      const noteOk = (m.note ?? '').toLowerCase().includes(query)
      const userOk = (m.user ?? '').toLowerCase().includes(query)
      const typeOk = (m.type ?? '').toLowerCase().includes(query)
      const itemOk = (m.items ?? []).some((it) => {
        const p = productsById.get(it.productId)
        return (
          String(p?.barcode ?? '').toLowerCase().includes(query) ||
          String(p?.name ?? '').toLowerCase().includes(query)
        )
      })
      return noteOk || userOk || typeOk || itemOk
    })
  }, [movements, productsById, q])

  return (
    <>
      <div className="page-title">
        <div>
          <h2>Historial</h2>
          <p>Movimientos y ventas registradas</p>
        </div>
      </div>

      <div className="grid">
        <div className="col-12">
          <div className="panel">
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <input
                className="input"
                style={{ maxWidth: 520 }}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por usuario, tipo, producto o nota"
              />
              <div className="hint">Mostrando {filtered.length} movimientos</div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="panel">
            <table className="table" aria-label="Historial">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Usuario</th>
                  <th>Items</th>
                  <th>Detalle</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id}>
                    <td>{formatDateTime(m.at)}</td>
                    <td>
                      <span className="badge">{m.type}</span>
                    </td>
                    <td>{m.user}</td>
                    <td>{movementTotalItems(m)}</td>
                    <td className="hint">
                      {(m.items ?? [])
                        .map((it) => {
                          const p = productsById.get(it.productId)
                          return `${p?.name ?? 'Producto'} x${it.qty}`
                        })
                        .join(', ')}
                    </td>
                    <td className="hint">{m.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
