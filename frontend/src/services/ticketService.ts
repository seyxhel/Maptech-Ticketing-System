import { API_BASE, authHeaders } from './api'

export async function fetchTickets() {
  const res = await fetch(`${API_BASE}/tickets/`, { headers: authHeaders() })
  return res.json()
}

export async function createTicket(payload: { title: string; description?: string }) {
  const res = await fetch(`${API_BASE}/tickets/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function updateTicket(id: number, payload: any) {
  const res = await fetch(`${API_BASE}/tickets/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function assignTicket(ticketId: number, payload: { employee_id: number; template_id?: number }) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/assign/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function escalateTicket(ticketId: number) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/escalate/`, {
    method: 'POST',
    headers: authHeaders(),
  })
  return res.json()
}

export async function passTicket(ticketId: number, payload: { employee_id: number }) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/pass_ticket/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}
