import { useMemo, useState } from 'react'
import { useAppStore } from '../lib/store.jsx'
import { formatCurrencyCLP } from '../lib/format.js'

function criticalBadge(stock) {
  if (stock <= 0) return <span className="badge badge-danger">Sin stock</span>
  if (stock <= 2) return <span className="badge badge-danger">Critico</span>
  if (stock <= 5) return <span className="badge badge-warn">Bajo</span>
  return <span className="badge badge-ok">OK</span>
}

export default function Inventory() {
  const { productsEnriched, categories, actions } = useAppStore()
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [draft, setDraft] = useState({
    barcode: '',
    name: '',
    categoryId: categories[0]?.id ?? 1,
    price: 0,
    stock: 0,
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return productsEnriched.filter((p) => {
      const catOk = categoryId ? String(p.categoryId) === String(categoryId) : true
      const qOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      return catOk && qOk
    })
  }, [productsEnriched, query, categoryId])

  function addProduct(e) {
    e.preventDefault()
    if (!draft.name.trim()) return
    actions.upsertProduct({
      barcode: String(draft.barcode).trim(),
      name: draft.name.trim(),
      categoryId: Number(draft.categoryId),
      price: Number(draft.price) || 0,
      stock: Number(draft.stock) || 0,
    })
    setDraft({
      barcode: '',
      name: '',
      categoryId: categories[0]?.id ?? 1,
      price: 0,
      stock: 0,
    })
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h2>Inventario</h2>
          <p>Buscar, filtrar y ver stock actual</p>
        </div>
      </div>

      <div className="grid">
        <div className="col-12">
          <div className="panel">
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <input
                className="input"
                style={{ maxWidth: 460 }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por codigo, nombre o categoria"
              />
              <select
                className="input"
                style={{ width: 260 }}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Todas las categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="hint">Mostrando {filtered.length} productos</div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="panel">
            <table className="table" aria-label="Inventario">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Nombre</th>
                  <th>Categoria</th>
                  <th>Stock</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="hint">{p.barcode}</td>
                    <td>{p.name}</td>
                    <td className="hint">{p.category}</td>
                    <td>{p.stock}</td>
                    <td>{formatCurrencyCLP(p.price)}</td>
                    <td>{criticalBadge(p.stock)}</td>
                    <td>
                      <div className="row">
                        <button
                          type="button"
                          className="btn"
                          onClick={() => actions.updateProductStock(p.id, +1, { type: 'AJUSTE', note: 'Ingreso manual' })}
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => actions.updateProductStock(p.id, -1, { type: 'AJUSTE', note: 'Salida manual' })}
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => actions.deleteProduct(p.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-12">
          <div className="panel">
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Crear producto (MVP)</div>
            <form className="row" style={{ flexWrap: 'wrap' }} onSubmit={addProduct}>
              <input
                className="input"
                style={{ width: 220 }}
                value={draft.barcode}
                onChange={(e) => setDraft((d) => ({ ...d, barcode: e.target.value }))}
                placeholder="Codigo barras"
              />
              <input
                className="input"
                style={{ width: 320 }}
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Nombre"
              />
              <select
                className="input"
                style={{ width: 220 }}
                value={draft.categoryId}
                onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value }))}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                className="input"
                style={{ width: 160 }}
                value={draft.price}
                onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                placeholder="Precio"
                inputMode="numeric"
              />
              <input
                className="input"
                style={{ width: 140 }}
                value={draft.stock}
                onChange={(e) => setDraft((d) => ({ ...d, stock: e.target.value }))}
                placeholder="Stock"
                inputMode="numeric"
              />
              <button className="btn btn-primary" type="submit">
                Agregar
              </button>
            </form>
            <div className="hint" style={{ marginTop: 8 }}>
              Nota: en la version real esto iria al backend y quedaria en BD.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
