import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../lib/store.jsx'
import { formatCurrencyCLP } from '../lib/format.js'

function findProduct(store, raw) {
  const code = String(raw ?? '').trim()
  if (!code) return null
  // Pistola lectora: normalmente manda el codigo completo y un Enter.
  // Soportamos buscar por codigo exacto y tambien por ID.
  const byBarcode = store.productsByBarcode.get(code)
  if (byBarcode) return byBarcode
  const asId = Number(code)
  if (Number.isFinite(asId)) return store.productsById.get(asId) ?? null
  return null
}

export default function Scan() {
  const store = useAppStore()
  const { actions, user } = store

  const inputRef = useRef(null)
  const [scanValue, setScanValue] = useState('')
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('Venta por escaneo')
  const [lastResult, setLastResult] = useState(null)

  const product = useMemo(() => findProduct(store, scanValue), [store, scanValue])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function sellCurrent() {
    if (!product) {
      setLastResult({ ok: false, message: 'Producto no encontrado' })
      return
    }
    const q = Math.max(1, Number(qty) || 1)
    const res = actions.updateProductStock(product.id, -q, {
      type: 'VENTA',
      user: user?.name,
      note,
    })
    if (res.ok) {
      setLastResult({ ok: true, message: `Venta registrada: ${product.name} x${q}` })
      setScanValue('')
      setQty(1)
      // Mantener foco para flujo de escaneo continuo.
      queueMicrotask(() => inputRef.current?.focus())
    } else {
      setLastResult({ ok: false, message: res.error ?? 'Error' })
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      sellCurrent()
    }
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h2>Escaneo de productos</h2>
          <p>Escanea (o pega) un codigo de barras y presiona Enter</p>
        </div>
      </div>

      <div className="grid">
        <div className="col-6">
          <div className="panel">
            <div className="stack">
              <label className="stack" style={{ gap: 6 }}>
                <span className="hint">Input scanner</span>
                <input
                  ref={inputRef}
                  className="input"
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ej: 7801234567890"
                />
              </label>

              <div className="row" style={{ flexWrap: 'wrap' }}>
                <label className="stack" style={{ gap: 6 }}>
                  <span className="hint">Cantidad</span>
                  <input
                    className="input"
                    style={{ width: 160 }}
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    inputMode="numeric"
                  />
                </label>
                <label className="stack" style={{ gap: 6, flex: '1 1 260px' }}>
                  <span className="hint">Observacion</span>
                  <input
                    className="input"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ej: Venta mostrador"
                  />
                </label>
              </div>

              <div className="row row-between">
                <div className="hint">Enter = vender</div>
                <button className="btn btn-primary" type="button" onClick={sellCurrent}>
                  Descontar / vender
                </button>
              </div>

              {lastResult ? (
                <div className={lastResult.ok ? 'badge badge-ok' : 'badge badge-danger'}>
                  {lastResult.message}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col-6">
          <div className="panel">
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Resultado inmediato</div>
            {!scanValue ? (
              <div className="hint">Escanea un producto para ver detalles</div>
            ) : !product ? (
              <div className="badge badge-danger">No encontrado: {scanValue}</div>
            ) : (
              <div className="stack">
                <div>
                  <div className="hint">Producto</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{product.name}</div>
                </div>
                <div className="row" style={{ flexWrap: 'wrap' }}>
                  <div className="stat" style={{ flex: '1 1 160px' }}>
                    <div className="label">Stock</div>
                    <div className="value">{product.stock}</div>
                  </div>
                  <div className="stat" style={{ flex: '1 1 200px' }}>
                    <div className="label">Precio</div>
                    <div className="value">{formatCurrencyCLP(product.price)}</div>
                  </div>
                </div>
                <div className="hint">Codigo: {product.barcode}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
