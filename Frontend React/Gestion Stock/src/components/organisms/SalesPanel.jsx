import { useMemo, useState } from 'react'
import { Card, CardBody, CardHeader } from '../atoms/Card'
import { Badge } from '../atoms/Badge'
import { Button } from '../atoms/Button'
import { SearchBar } from '../molecules/SearchBar'
import { ProductRow } from '../molecules/ProductRow'
import { Modal } from '../atoms/Modal'
import { Subtle, Title } from '../atoms/Title'
import { useAppStore } from '../../store/useAppStore'
import { toast } from 'sonner'

function moneyARS(value) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

export function SalesPanel({ products }) {
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const registrarSalida = useAppStore((s) => s.registrarSalida)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => `${p.sku} ${p.name}`.toLowerCase().includes(q))
  }, [products, query])

  const totals = useMemo(() => {
    const unique = cart.length
    const items = cart.reduce((acc, row) => acc + row.qty, 0)
    const total = cart.reduce((acc, row) => acc + row.qty * row.product.price, 0)
    return { unique, items, total }
  }, [cart])

  function addToCart(product) {
    setCart((prev) => {
      const idx = prev.findIndex((r) => r.product.sku === product.sku)
      if (idx === -1) return [...prev, { product, qty: 1 }]
      const next = [...prev]
      next[idx] = { ...next[idx], qty: next[idx].qty + 1 }
      return next
    })

    toast.success('Producto agregado', {
      description: `${product.name} (${product.sku})`,
    })
  }

  function inc(sku) {
    setCart((prev) => prev.map((r) => (r.product.sku === sku ? { ...r, qty: r.qty + 1 } : r)))
  }

  function dec(sku) {
    setCart((prev) =>
      prev
        .map((r) => (r.product.sku === sku ? { ...r, qty: Math.max(0, r.qty - 1) } : r))
        .filter((r) => r.qty > 0),
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Ventas</div>
            <div className="text-xs text-[var(--muted)] pt-1">Buscar producto o escanear (mock).</div>
          </div>
          <Badge variant="neutral">Modo demo</Badge>
        </CardHeader>
        <CardBody>
          <div className="pb-4">
            <SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto o escanear..." />
          </div>
          <div className="space-y-2">
            {filtered.slice(0, 6).map((p) => (
              <button key={p.sku} className="w-full text-left" onClick={() => addToCart(p)}>
                <ProductRow product={p} />
              </button>
            ))}
            {filtered.length === 0 ? (
              <div className="py-6 text-sm text-[var(--muted)]">Sin resultados.</div>
            ) : null}
          </div>
          <div className="pt-4 text-xs text-[var(--muted)]">
            Tip: clic en un producto para agregarlo.
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-semibold">Resumen</div>
            <div className="text-xs text-[var(--muted)] pt-1">Carrito (mock).</div>
          </div>
          <Badge variant={totals.items ? 'info' : 'neutral'}>{totals.items} items</Badge>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            {cart.map((row) => (
              <div
                key={row.product.sku}
                className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-zinc-100 truncate">{row.product.name}</div>
                  <div className="text-xs text-[var(--muted)] pt-0.5">
                    {row.product.sku} · {moneyARS(row.product.price)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => dec(row.product.sku)}>
                    -
                  </Button>
                  <Badge variant="neutral">{row.qty}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => inc(row.product.sku)}>
                    +
                  </Button>
                </div>
              </div>
            ))}
            {cart.length === 0 ? (
              <div className="py-6 text-sm text-[var(--muted)]">Aun no agregaste productos.</div>
            ) : null}
          </div>

          <div className="pt-5 border-t border-[rgba(255,255,255,0.06)] mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">Productos</span>
              <span className="text-zinc-100 font-medium">{totals.unique}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-[var(--muted)]">Total items</span>
              <span className="text-zinc-100 font-medium">{totals.items}</span>
            </div>
            <div className="flex items-center justify-between text-base pt-3">
              <span className="text-zinc-200 font-semibold">Total</span>
              <span className="text-zinc-100 font-semibold">{moneyARS(totals.total)}</span>
            </div>

            <div className="pt-4 flex gap-2">
              <Button
                variant="secondary"
                className="w-full justify-center"
                onClick={() => setCart([])}
                disabled={cart.length === 0}
              >
                Limpiar
              </Button>
              <Button
                variant="primary"
                className="w-full justify-center"
                onClick={() => setConfirmOpen(true)}
                disabled={cart.length === 0}
              >
                Registrar salida
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Registrar salida (demo)">
        <div className="space-y-3">
          <Title as="h2" className="text-lg">
            Confirmacion
          </Title>
          <Subtle>
            En el proximo paso, esto va a descontar stock, generar comprobante y registrar movimiento.
          </Subtle>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Total</div>
            <div className="pt-2 text-base font-semibold text-zinc-100">{moneyARS(totals.total)}</div>
            <div className="pt-1 text-xs text-[var(--muted)]">{totals.items} items</div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const items = cart
                  .map((r) => ({ productoId: r.product.id, cantidad: r.qty }))
                  .filter((i) => Number.isFinite(i.productoId) && i.cantidad > 0)

                registrarSalida({ items })
                setConfirmOpen(false)
                setCart([])

                toast('Stock actualizado', {
                  description: `Se registraron ${totals.items} items`,
                })
              }}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
