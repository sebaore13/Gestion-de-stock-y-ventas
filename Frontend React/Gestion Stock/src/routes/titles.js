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
    default:
      return 'OreStock'
  }
}
