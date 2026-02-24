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

export async function confirmTicket(ticketId: number) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/confirm_ticket/`, {
    method: 'POST',
    headers: authHeaders(),
  })
  return res.json()
}

export async function closeTicket(ticketId: number) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/close_ticket/`, {
    method: 'POST',
    headers: authHeaders(),
  })
  return { ok: res.ok, data: await res.json() }
}

export async function escalateExternal(ticketId: number, payload: { escalated_to: string; notes?: string }) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/escalate_external/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function requestClosure(ticketId: number) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/request_closure/`, {
    method: 'POST',
    headers: authHeaders(),
  })
  return { ok: res.ok, data: await res.json() }
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

export async function uploadResolutionProof(ticketId: number, files: File[]) {
  const formData = new FormData()
  files.forEach((f) => formData.append('files', f))
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/upload_resolution_proof/`, {
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

export async function escalateTicket(ticketId: number, notes?: string) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/escalate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ notes: notes || '' }),
  })
  return res.json()
}

export async function passTicket(ticketId: number, payload: { employee_id: number; notes?: string }) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/pass_ticket/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function updateTaskStatus(ticketId: number, taskId: number, taskStatus: string) {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/update_task/${taskId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status: taskStatus }),
  })
  return res.json()
}

export async function submitCSAT(payload: { ticket: number; rating: number; comments?: string; has_other_concerns?: boolean; other_concerns_text?: string }) {
  const res = await fetch(`${API_BASE}/csat/submit/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, data: await res.json() }
}

export async function fetchCSAT(ticketId: number) {
  const res = await fetch(`${API_BASE}/csat/for_ticket/${ticketId}/`, { headers: authHeaders() })
  if (!res.ok) return null
  return res.json()
}

export async function fetchEmployees() {
  const res = await fetch(`${API_BASE}/employees/`, { headers: authHeaders() })
  return res.json()
}
