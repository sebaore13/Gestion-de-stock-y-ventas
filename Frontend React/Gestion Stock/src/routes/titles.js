export function titleForPath(pathname) {
  switch (pathname) {
    case '/':
      return 'Dashboard'
    case '/inventario':
      return 'Inventario'
    case '/ventas':
      return 'Ventas'
    case '/historial':
      return 'Historial'
    case '/config':
      return 'Configuracion'
    case '/admin':
      return 'Admin · Dashboard'
    case '/admin/productos':
      return 'Admin · Productos'
    case '/admin/usuarios':
      return 'Admin · Usuarios'
    case '/admin/historial':
      return 'Admin · Historial'
    case '/admin/historial/nuevo':
      return 'Admin · Crear historial'
    case '/admin/config':
      return 'Admin · Configuracion'
    default:
      return 'OreStock'
  }
}
