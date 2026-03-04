import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { fetchProducts, createProduct, updateProduct, deleteProduct, Product } from '../../../services/productService'

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#374151' }
const btnPrimary: React.CSSProperties = { padding: '8px 18px', borderRadius: 6, border: 'none', background: '#3BC25B', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }
const btnSecondary: React.CSSProperties = { padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }
const btnDanger: React.CSSProperties = { padding: '8px 18px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }

const emptyProduct = (): Partial<Product> => ({
  device_equipment: '', version_no: '', date_purchased: null, serial_no: '',
  has_warranty: false, product_name: '', brand: '', model_name: '', sales_no: '',
})

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<Partial<Product>>(emptyProduct())

  useEffect(() => { load() }, [])

  const load = async () => {
    try { setProducts(await fetchProducts(search || undefined)) } catch { toast.error('Failed to load products') }
  }

  const handleSearch = () => load()

  const openCreate = () => { setEditing(null); setForm(emptyProduct()); setShowForm(true) }
  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      device_equipment: p.device_equipment, version_no: p.version_no,
      date_purchased: p.date_purchased, serial_no: p.serial_no,
      has_warranty: p.has_warranty, product_name: p.product_name,
      brand: p.brand, model_name: p.model_name, sales_no: p.sales_no,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await updateProduct(editing.id, form)
        toast.success('Product updated')
      } else {
        await createProduct(form)
        toast.success('Product created')
      }
      setShowForm(false)
      load()
    } catch { toast.error('Failed to save product') }
  }

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete product "${p.product_name || p.serial_no}"?`)) return
    try { await deleteProduct(p.id); toast.success('Product deleted'); load() } catch { toast.error('Failed to delete') }
  }

  const setField = (name: string, value: any) => setForm(prev => ({ ...prev, [name]: value }))

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Products</h1>
        <button style={btnPrimary} onClick={openCreate}>+ Add Product</button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input style={{ ...inputStyle, maxWidth: 300 }} placeholder="Search products..." value={search}
          onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button style={btnSecondary} onClick={handleSearch}>Search</button>
      </div>

      {/* Table */}
      <div style={cardStyle}>
        {products.length === 0 ? <p style={{ color: '#888' }}>No products found.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                  {['Product Name', 'Brand', 'Model', 'Device/Equipment', 'Serial No.', 'Sales No.', 'Warranty', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{p.product_name || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{p.brand || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{p.model_name || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{p.device_equipment || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13, fontFamily: 'monospace' }}>{p.serial_no || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{p.sales_no || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                      <span style={{ padding: '2px 10px', borderRadius: 9999, fontSize: 12, background: p.has_warranty ? '#dcfce7' : '#fee2e2', color: p.has_warranty ? '#15803d' : '#dc2626' }}>
                        {p.has_warranty ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ ...btnSecondary, padding: '4px 10px', fontSize: 12 }} onClick={() => openEdit(p)}>Edit</button>
                        <button style={{ ...btnDanger, padding: '4px 10px', fontSize: 12 }} onClick={() => handleDelete(p)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Device/Equipment</label>
                  <input style={inputStyle} value={form.device_equipment || ''} onChange={e => setField('device_equipment', e.target.value)} placeholder="e.g. Laptop" />
                </div>
                <div>
                  <label style={labelStyle}>Version No.</label>
                  <input style={inputStyle} value={form.version_no || ''} onChange={e => setField('version_no', e.target.value)} placeholder="e.g. v2.1" />
                </div>
                <div>
                  <label style={labelStyle}>Date Purchased</label>
                  <input type="date" style={inputStyle} value={form.date_purchased || ''} onChange={e => setField('date_purchased', e.target.value || null)} />
                </div>
                <div>
                  <label style={labelStyle}>Serial No.</label>
                  <input style={inputStyle} value={form.serial_no || ''} onChange={e => setField('serial_no', e.target.value)} placeholder="e.g. SN-12345" />
                </div>
                <div>
                  <label style={labelStyle}>Product Name (optional)</label>
                  <input style={inputStyle} value={form.product_name || ''} onChange={e => setField('product_name', e.target.value)} placeholder="e.g. ThinkPad" />
                </div>
                <div>
                  <label style={labelStyle}>Brand (optional)</label>
                  <input style={inputStyle} value={form.brand || ''} onChange={e => setField('brand', e.target.value)} placeholder="e.g. Lenovo" />
                </div>
                <div>
                  <label style={labelStyle}>Model (optional)</label>
                  <input style={inputStyle} value={form.model_name || ''} onChange={e => setField('model_name', e.target.value)} placeholder="e.g. X1 Carbon" />
                </div>
                <div>
                  <label style={labelStyle}>Sales No.</label>
                  <input style={inputStyle} value={form.sales_no || ''} onChange={e => setField('sales_no', e.target.value)} placeholder="e.g. INV-2026-001" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: '1 / -1' }}>
                  <input type="checkbox" id="hasWarranty" checked={!!form.has_warranty} onChange={e => setField('has_warranty', e.target.checked)} />
                  <label htmlFor="hasWarranty" style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Has Warranty</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button type="submit" style={btnPrimary}>{editing ? 'Update' : 'Create'} Product</button>
                <button type="button" style={btnSecondary} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
