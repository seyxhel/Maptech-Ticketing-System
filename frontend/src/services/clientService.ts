import { API_BASE, authHeaders } from './api'

export interface Client {
  id: number
  client_name: string
  contact_person: string
  landline: string
  mobile_no: string
  designation: string
  department_organization: string
  email_address: string
  address: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function fetchClients(search?: string): Promise<Client[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_BASE}/clients/${qs}`, { headers: authHeaders() })
  return res.json()
}

export async function fetchClient(id: number): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients/${id}/`, { headers: authHeaders() })
  return res.json()
}

export async function createClient(payload: Partial<Client>): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function updateClient(id: number, payload: Partial<Client>): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function deleteClient(id: number): Promise<void> {
  await fetch(`${API_BASE}/clients/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export async function fetchClientTickets(id: number): Promise<any[]> {
  const res = await fetch(`${API_BASE}/clients/${id}/tickets/`, { headers: authHeaders() })
  return res.json()
}
