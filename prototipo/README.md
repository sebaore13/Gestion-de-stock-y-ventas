# Prototipo: Gestion de Stock y Ventas

Prototipo web (MVP) basado en los documentos del proyecto: Login, Dashboard, Inventario, Escaneo (input tipo pistola lectora), Historial y Configuracion.

## Ejecutar

1. `cmd /c "npm install"`
2. `cmd /c "npm run dev"`

Luego abre `http://127.0.0.1:5173/`.

## Usuarios demo

- `admin@taller.local`
- `venta@taller.local`

La contrasena no se valida en este MVP.

## Codigos de barras demo (para Escaneo)

- `7801234567890` (Aceite 10W-40 1L)
- `7501031311309` (Filtro de aire universal)
- `8437011845112` (Filtro de aceite)
- `4006381333931` (Set llaves allen)
- `6901234567892` (Bujia estandar)

En la pantalla de Escaneo: escanea o pega el codigo y presiona Enter para registrar la venta y descontar stock.
