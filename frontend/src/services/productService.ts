import { API_BASE, authHeaders } from './api'

export interface Product {
  id: number
  device_equipment: string
  version_no: string
  date_purchased: string | null
  serial_no: string
  has_warranty: boolean
  product_name: string
  brand: string
  model_name: string
  sales_no: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function fetchProducts(search?: string): Promise<Product[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_BASE}/products/${qs}`, { headers: authHeaders() })
  return res.json()
}

export async function fetchProduct(id: number): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}/`, { headers: authHeaders() })
  return res.json()
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function updateProduct(id: number, payload: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function deleteProduct(id: number): Promise<void> {
  await fetch(`${API_BASE}/products/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}
