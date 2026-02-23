import { API_BASE, authHeaders } from './api'

export interface TypeOfService {
  id: number
  name: string
  description: string
  is_active: boolean
}

export async function fetchTypesOfService(): Promise<TypeOfService[]> {
  const res = await fetch(`${API_BASE}/type-of-service/`, { headers: authHeaders() })
  return res.json()
}

export async function createTypeOfService(payload: { name: string; description?: string; is_active?: boolean }) {
  const res = await fetch(`${API_BASE}/type-of-service/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, data: await res.json() }
}

export async function updateTypeOfService(id: number, payload: Partial<TypeOfService>) {
  const res = await fetch(`${API_BASE}/type-of-service/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, data: await res.json() }
}

export async function deleteTypeOfService(id: number) {
  const res = await fetch(`${API_BASE}/type-of-service/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return { ok: res.ok }
}
