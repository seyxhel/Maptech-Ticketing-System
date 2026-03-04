import { API_BASE, authHeaders } from './api'

export interface CSATFeedback {
  id: number
  ticket: number
  stf_no: string
  employee: number
  employee_name: string
  admin: number
  admin_name: string
  rating: number
  comments: string
  created_at: string
}

export async function fetchCSATFeedbacks(ticketId?: number, employeeId?: number): Promise<CSATFeedback[]> {
  const params = new URLSearchParams()
  if (ticketId) params.set('ticket', String(ticketId))
  if (employeeId) params.set('employee', String(employeeId))
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_BASE}/csat-feedback/${qs}`, { headers: authHeaders() })
  return res.json()
}

export async function createCSATFeedback(payload: { ticket: number; employee: number; rating: number; comments?: string }): Promise<CSATFeedback> {
  const res = await fetch(`${API_BASE}/csat-feedback/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function startWork(ticketId: number): Promise<any> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/start_work/`, {
    method: 'POST',
    headers: authHeaders(),
  })
  return res.json()
}
