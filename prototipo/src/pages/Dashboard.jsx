import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../lib/store.jsx'
import { formatCurrencyCLP, formatDateTime } from '../lib/format.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const { productsEnriched, lowStock, movements } = useAppStore()

  const stats = useMemo(() => {
    const totalProducts = productsEnriched.length
    const critical = productsEnriched.filter((p) => p.stock <= 2).length
    const low = productsEnriched.filter((p) => p.stock > 2 && p.stock <= 5).length
    const totalStock = productsEnriched.reduce((acc, p) => acc + p.stock, 0)
    return { totalProducts, critical, low, totalStock }
  }, [productsEnriched])

  const lastMovements = movements.slice(0, 6)
  const hot = productsEnriched
    .slice()
    .sort((a, b) => (a.stock < b.stock ? 1 : -1))
    .slice(0, 5)

  return (
    <>
      <div className="page-title">
        <div>
          <h2>Dashboard</h2>
          <p>Resumen rapido: stock, alertas y movimientos recientes</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => navigate('/escaneo')}>
          Escanear y vender
        </button>
      </div>

      <div className="grid">
        <div className="col-3">
          <div className="stat">
            <div className="label">Total productos</div>
            <div className="value">{stats.totalProducts}</div>
          </div>
        </div>
        <div className="col-3">
          <div className="stat">
            <div className="label">Stock total</div>
            <div className="value">{stats.totalStock}</div>
          </div>
        </div>
        <div className="col-3">
          <div className="stat">
            <div className="label">Critico</div>
            <div className="value" style={{ color: 'var(--danger)' }}>
              {stats.critical}
            </div>
          </div>
        </div>
        <div className="col-3">
          <div className="stat">
            <div className="label">Bajo</div>
            <div className="value" style={{ color: 'var(--warn)' }}>
              {stats.low}
            </div>
          </div>
        </div>

        <div className="col-6">
          <div className="panel">
            <div className="row row-between" style={{ marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700 }}>Alertas de stock</div>
                <div className="hint">Productos con stock menor o igual a 5</div>
              </div>
              <button className="btn" type="button" onClick={() => navigate('/inventario')}>
                Ver inventario
              </button>
            </div>

            {lowStock.length === 0 ? (
              <div className="badge badge-ok">Sin alertas</div>
            ) : (
              <table className="table" aria-label="Alertas">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.slice(0, 6).map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.stock}</td>
                      <td>
                        {p.stock <= 0 ? (
                          <span className="badge badge-danger">Sin stock</span>
                        ) : p.stock <= 2 ? (
                          <span className="badge badge-danger">Critico</span>
                        ) : (
                          <span className="badge badge-warn">Bajo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="col-6">
          <div className="panel">
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Ultimos movimientos</div>
            {lastMovements.length === 0 ? (
              <div className="badge">Sin movimientos</div>
            ) : (
              <table className="table" aria-label="Movimientos recientes">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Usuario</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {lastMovements.map((m) => (
                    <tr key={m.id}>
                      <td>{formatDateTime(m.at)}</td>
                      <td>
                        <span className="badge">{m.type}</span>
                      </td>
                      <td>{m.user}</td>
                      <td className="hint">{m.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="col-12">
          <div className="panel">
            <div className="row row-between" style={{ marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700 }}>Productos (muestra)</div>
                <div className="hint">Top por stock (solo para mostrar tabla)</div>
              </div>
              <button className="btn" type="button" onClick={() => navigate('/inventario')}>
                Gestionar
              </button>
            </div>
            <table className="table" aria-label="Productos">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Nombre</th>
                  <th>Categoria</th>
                  <th>Stock</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {hot.map((p) => (
                  <tr key={p.id}>
                    <td className="hint">{p.barcode}</td>
                    <td>{p.name}</td>
                    <td className="hint">{p.category}</td>
                    <td>{p.stock}</td>
                    <td>{formatCurrencyCLP(p.price)}</td>
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
