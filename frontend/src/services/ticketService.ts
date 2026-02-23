import { API_BASE, authHeaders } from './api'

export async function fetchTickets() {
  const res = await fetch(`${API_BASE}/tickets/`, { headers: authHeaders() })
  return res.json()
}

export async function fetchTicket(id: number) {
  const res = await fetch(`${API_BASE}/tickets/${id}/`, { headers: authHeaders() })
  return res.json()
}

export async function createTicket(payload: Record<string, any>) {
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

export async function reviewTicket(ticketId: number, payload: { priority?: string } = {}) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/review/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function updateEmployeeFields(ticketId: number, payload: Record<string, any>) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/update_employee_fields/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function uploadAttachments(ticketId: number, files: File[]) {
  const formData = new FormData()
  files.forEach((f) => formData.append('files', f))
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/upload_attachment/`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  })
  return res.json()
}

export async function deleteAttachment(ticketId: number, attachmentId: number) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/delete_attachment/${attachmentId}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return res
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
