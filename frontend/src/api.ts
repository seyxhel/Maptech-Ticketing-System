const API_BASE = '/api'

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function authHeaders() {
  const token = getCookie('access')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

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

export async function register(payload: { username: string; email: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function login(payload: { username: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function getCurrentUser() {
  const res = await fetch(`${API_BASE}/auth/me/`, { headers: authHeaders() })
  return res.json()
}

export async function sendPasswordReset(email: string) {
  const res = await fetch(`${API_BASE}/auth/password-reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return res.json()
}

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

export async function fetchTasks() {
  // tasks are nested under tickets in this simple API - reuse tickets endpoint
  const tickets = await fetchTickets()
  let tasks: any[] = []
  tickets.forEach((t: any) => {
    (t.tasks || []).forEach((task: any) => tasks.push({ ...task, ticket: t }))
  })
  return tasks
}
