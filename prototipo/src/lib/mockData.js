const now = () => new Date().toISOString()

export const categories = [
  { id: 1, name: 'Lubricantes' },
  { id: 2, name: 'Filtros' },
  { id: 3, name: 'Herramientas' },
  { id: 4, name: 'Repuestos' },
]

export const initialProducts = [
  {
    id: 1,
    barcode: '7801234567890',
    name: 'Aceite 10W-40 1L',
    categoryId: 1,
    price: 8990,
    stock: 12,
  },
  {
    id: 2,
    barcode: '7501031311309',
    name: 'Filtro de aire universal',
    categoryId: 2,
    price: 6490,
    stock: 4,
  },
  {
    id: 3,
    barcode: '8437011845112',
    name: 'Filtro de aceite',
    categoryId: 2,
    price: 5290,
    stock: 2,
  },
  {
    id: 4,
    barcode: '4006381333931',
    name: 'Set llaves allen',
    categoryId: 3,
    price: 11990,
    stock: 7,
  },
  {
    id: 5,
    barcode: '6901234567892',
    name: 'Bujia estandar',
    categoryId: 4,
    price: 3490,
    stock: 18,
  },
]

export const initialUsers = [
  { id: 1, name: 'Admin', email: 'admin@taller.local', role: 'Administrador' },
  { id: 2, name: 'Vendedor', email: 'venta@taller.local', role: 'Vendedor' },
]

export const initialMovements = [
  {
    id: 101,
    at: now(),
    user: 'Admin',
    type: 'VENTA',
    items: [{ productId: 2, qty: 1 }],
    note: 'Venta mostrador',
  },
  {
    id: 102,
    at: now(),
    user: 'Vendedor',
    type: 'VENTA',
    items: [
      { productId: 1, qty: 2 },
      { productId: 5, qty: 4 },
    ],
    note: 'Servicio rapido',
  },
]
