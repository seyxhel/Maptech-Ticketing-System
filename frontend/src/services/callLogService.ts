import { API_BASE, authHeaders } from './api'

export interface CallLog {
  id: number
  ticket: number | null
  admin: number
  admin_name: string
  client_name: string
  phone_number: string
  call_start: string
  call_end: string | null
  duration_seconds: number | null
  notes: string
  created_at: string
}

export async function fetchCallLogs(ticketId?: number, search?: string): Promise<CallLog[]> {
  const params = new URLSearchParams()
  if (ticketId) params.set('ticket', String(ticketId))
  if (search) params.set('search', search)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_BASE}/call-logs/${qs}`, { headers: authHeaders() })
  return res.json()
}

export async function createCallLog(payload: { client_name: string; phone_number: string; call_start: string; ticket?: number; notes?: string }): Promise<CallLog> {
  const res = await fetch(`${API_BASE}/call-logs/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function endCallLog(id: number, notes?: string): Promise<CallLog> {
  const res = await fetch(`${API_BASE}/call-logs/${id}/end_call/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ notes: notes || '' }),
  })
  return res.json()
}

export async function deleteCallLog(id: number): Promise<void> {
  await fetch(`${API_BASE}/call-logs/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}
