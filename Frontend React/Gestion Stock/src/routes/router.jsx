import { createHashRouter } from 'react-router-dom'
import { Login } from '../pages/Login'
import { RootGuard } from '../components/organisms/AuthGuard'
import { AppShell } from './AppShell'
import { RequireRole } from './RequireRole'
import { AdminShell } from './AdminShell'
import { Dashboard } from '../pages/Dashboard'
import { Inventario } from '../pages/Inventario'
import { Ventas } from '../pages/Ventas'
import { Historial } from '../pages/Historial'
import { Config } from '../pages/Config'
import { AdminDashboard } from '../pages/admin/Dashboard'
import { AdminProductos } from '../pages/admin/Productos'
import { AdminUsuarios } from '../pages/admin/Usuarios'
import { AdminHistorial } from '../pages/admin/Historial'
import { AdminHistorialNuevo } from '../pages/admin/HistorialNuevo'

export const router = createHashRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <RootGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Dashboard /> },
          { path: '/inventario', element: <Inventario /> },
          { path: '/ventas', element: <Ventas /> },
          { path: '/historial', element: <Historial /> },
          { path: '/config', element: <Config /> },
        ],
      },
      {
        path: '/admin',
        element: (
          <RequireRole allow={['Administrador']}>
            <AdminShell />
          </RequireRole>
        ),
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'productos', element: <AdminProductos /> },
          { path: 'usuarios', element: <AdminUsuarios /> },
          { path: 'historial', element: <AdminHistorial /> },
          { path: 'historial/nuevo', element: <AdminHistorialNuevo /> },
          { path: 'config', element: <Config /> },
        ],
      },
    ],
  },
])
