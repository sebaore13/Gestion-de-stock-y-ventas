import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAppStore } from '../lib/store.jsx'

export default function Shell() {
  const { user, actions } = useAppStore()
  const navigate = useNavigate()

  function onLogout() {
    actions.logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div>
            <h1>Gestion Taller</h1>
            <div className="hint">{user ? `${user.name} · ${user.role}` : 'Sin sesion'}</div>
          </div>
          <span className="pill">MVP</span>
        </div>

        <nav className="nav" aria-label="Navegacion">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span>Dashboard</span>
            <span className="kbd">D</span>
          </NavLink>
          <NavLink
            to="/inventario"
            end
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span>Inventario</span>
            <span className="kbd">I</span>
          </NavLink>
          <NavLink to="/escaneo" end className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>Escaneo</span>
            <span className="kbd">S</span>
          </NavLink>
          <NavLink
            to="/historial"
            end
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span>Historial</span>
            <span className="kbd">H</span>
          </NavLink>
          <NavLink
            to="/configuracion"
            end
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span>Configuracion</span>
            <span className="kbd">C</span>
          </NavLink>
        </nav>

        <div style={{ height: 14 }} />

        <div className="stack">
          <button type="button" className="btn" onClick={() => navigate('/escaneo')}>
            Ir a escaneo
          </button>
          <button type="button" className="btn btn-danger" onClick={onLogout}>
            Cerrar sesion
          </button>
          <div className="hint">
            Tip: una pistola lectora funciona como teclado. Escanea y envia el codigo al input.
          </div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
