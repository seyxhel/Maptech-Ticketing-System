const API_BASE = '/api'

export async function fetchTickets() {
  const res = await fetch(`${API_BASE}/tickets/`)
  return res.json()
}

export async function createTicket(payload: { title: string; description?: string }) {
  const res = await fetch(`${API_BASE}/tickets/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function updateTicket(id: number, payload: any) {
  const res = await fetch(`${API_BASE}/tickets/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}
