import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Shell from './shell/Shell.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Inventory from './pages/Inventory.jsx'
import Scan from './pages/Scan.jsx'
import History from './pages/History.jsx'
import Settings from './pages/Settings.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventario" element={<Inventory />} />
        <Route path="/escaneo" element={<Scan />} />
        <Route path="/historial" element={<History />} />
        <Route path="/configuracion" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
