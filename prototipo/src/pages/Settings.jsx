import { useState } from 'react'
import { useAppStore } from '../lib/store.jsx'

export default function Settings() {
  const { users, categories } = useAppStore()
  const [lowStockThreshold, setLowStockThreshold] = useState(5)

  return (
    <>
      <div className="page-title">
        <div>
          <h2>Configuracion</h2>
          <p>Usuarios, categorias y alertas (mock)</p>
        </div>
      </div>

      <div className="grid">
        <div className="col-6">
          <div className="panel">
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Usuarios</div>
            <table className="table" aria-label="Usuarios">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td className="hint">{u.email}</td>
                    <td>
                      <span className="badge">{u.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="hint" style={{ marginTop: 8 }}>
              En la version real: CRUD, roles/permisos y JWT.
            </div>
          </div>
        </div>

        <div className="col-6">
          <div className="panel">
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Categorias</div>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {categories.map((c) => (
                <span key={c.id} className="badge">
                  {c.name}
                </span>
              ))}
            </div>
            <div style={{ height: 14 }} />
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Alertas</div>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <label className="stack" style={{ gap: 6 }}>
                <span className="hint">Umbral stock bajo</span>
                <input
                  className="input"
                  style={{ width: 220 }}
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  inputMode="numeric"
                />
              </label>
              <div className="hint" style={{ maxWidth: 320 }}>
                Este control es visual (mock). En el backend real se guardaria por usuario/empresa.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
