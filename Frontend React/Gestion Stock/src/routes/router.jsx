import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './AppShell'
import { Dashboard } from '../pages/Dashboard'
import { Inventario } from '../pages/Inventario'
import { Ventas } from '../pages/Ventas'
import { Historial } from '../pages/Historial'
import { Config } from '../pages/Config'

export const router = createBrowserRouter([
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
])
