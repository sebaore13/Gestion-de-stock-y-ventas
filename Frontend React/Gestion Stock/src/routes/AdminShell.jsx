import { Outlet, useLocation } from 'react-router-dom'
import { MainLayout } from '../components/templates/MainLayout'
import { Toaster } from '../components/organisms/Toaster'

function adminTitleFor(pathname) {
  if (pathname === '/admin' || pathname === '/admin/') return 'Admin Dashboard'
  if (pathname.startsWith('/admin/productos')) return 'Productos'
  if (pathname.startsWith('/admin/categorias')) return 'Categorias'
  if (pathname.startsWith('/admin/usuarios')) return 'Usuarios'
  if (pathname.startsWith('/admin/historial')) return 'Historial'
  return 'Admin'
}

export function AdminShell() {
  const location = useLocation()

  return (
    <>
      <MainLayout brand="OreStock" title={adminTitleFor(location.pathname)} basePath="/admin">
        <Outlet />
      </MainLayout>
      <Toaster />
    </>
  )
}
