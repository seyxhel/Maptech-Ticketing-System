import { API_BASE, authHeaders } from './api'

export async function fetchTemplates() {
  const res = await fetch(`${API_BASE}/templates/`, { headers: authHeaders() })
  return res.json()
}

export async function createTemplate(payload: { name: string; steps: string }) {
  const res = await fetch(`${API_BASE}/templates/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}
