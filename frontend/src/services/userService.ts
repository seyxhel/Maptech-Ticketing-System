import { API_BASE, authHeaders } from './api'

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users/list_users/`, { headers: authHeaders() })
  return res.json()
}

export async function createUser(payload: {
  first_name: string
  middle_name?: string
  last_name: string
  suffix?: string
  email: string
  phone?: string
  role: string
}) {
  const res = await fetch(`${API_BASE}/users/create_user/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, data: await res.json() }
}
