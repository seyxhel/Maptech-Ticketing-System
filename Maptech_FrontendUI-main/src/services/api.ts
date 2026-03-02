/**
 * api.ts – Backend REST helpers for the Maptech Ticketing System.
 *
 * All endpoints target /api/ which is proxied by Vite to http://localhost:8000.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'maptech_access';

// ── Auth helpers ──

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
}

function authHeaders(isJson = true): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data: T = await res.json().catch(() => ({}) as T);
  if (!res.ok) {
    const errData = data as Record<string, unknown>;
    const msg = (errData.detail as string) || (errData.message as string) || `API error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ── Types ──

export interface BackendUser {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  phone?: string;
  is_active: boolean;
  [key: string]: unknown;
}

export interface BackendTicket {
  id: number;
  stf_no: string;
  status: string;
  priority: string;
  client: string;
  contact_person: string;
  address: string;
  designation: string;
  landline: string;
  department_organization: string;
  mobile_no: string;
  email_address: string;
  type_of_service: number | null;
  type_of_service_detail: { id: number; name: string; description: string; is_active: boolean } | null;
  type_of_service_others: string;
  preferred_support_type: string;
  description_of_problem: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  created_at: string;
  updated_at: string;
  created_by: { id: number; username: string; email: string; role: string; first_name: string; last_name: string };
  assigned_to: { id: number; username: string; email: string; role: string; first_name: string; last_name: string } | null;
  confirmed_by_admin: boolean;
  // Employee fields
  has_warranty: boolean;
  product: string;
  brand: string;
  model_name: string;
  device_equipment: string;
  version_no: string;
  date_purchased: string | null;
  serial_no: string;
  action_taken: string;
  remarks: string;
  job_status: string;
  // External escalation
  external_escalated_to: string;
  external_escalation_notes: string;
  external_escalated_at: string | null;
  // Nested
  tasks: { id: number; description: string; assigned_to: number | null; status: string }[];
  attachments: { id: number; file: string; uploaded_by: number; uploaded_at: string; is_resolution_proof: boolean }[];
  escalation_logs: { id: number; escalation_type: string; from_user: number; to_user: number | null; to_external: string; notes: string; created_at: string }[];
  [key: string]: unknown;
}

export interface TypeOfService {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

export interface EscalationLog {
  id: number;
  ticket: number;
  escalation_type: string;
  from_user: number;
  to_user: number | null;
  to_external: string;
  notes: string;
  created_at: string;
}

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  closed: number;
  escalated: number;
  pending_closure: number;
  by_priority: Record<string, number>;
  avg_resolution_time: number | null;
  [key: string]: unknown;
}

// ── Ticket endpoints ──

/** Fetch all tickets (admin sees all, employee sees assigned). */
export async function fetchTickets(): Promise<BackendTicket[]> {
  const res = await fetch(`${API_BASE}/tickets/`, { headers: authHeaders() });
  return handleResponse<BackendTicket[]>(res);
}

/** Fetch a single ticket by numeric ID. */
export async function fetchTicketById(id: number): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${id}/`, { headers: authHeaders() });
  return handleResponse<BackendTicket>(res);
}

/** Fetch a ticket by its STF number (searches the list). */
export async function fetchTicketByStf(stfNo: string): Promise<BackendTicket | null> {
  try {
    const tickets = await fetchTickets();
    return tickets.find((t) => t.stf_no === stfNo) ?? null;
  } catch {
    return null;
  }
}

/** Create a new ticket. */
export async function createTicket(data: Partial<BackendTicket>): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<BackendTicket>(res);
}

/** Update ticket fields (PATCH). */
export async function updateTicket(id: number, data: Partial<BackendTicket>): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<BackendTicket>(res);
}

/** Delete a ticket. */
export async function deleteTicket(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/tickets/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as Record<string, string>).detail || `Delete failed (${res.status})`);
  }
}

/** Assign an employee to a ticket. */
export async function assignTicket(ticketId: number, employeeId: number): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/assign/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ employee_id: employeeId }),
  });
  return handleResponse<BackendTicket>(res);
}

/** Review a ticket (admin sets time_in + optional priority). */
export async function reviewTicket(ticketId: number, data: { time_in?: string; priority?: string }): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/review/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<BackendTicket>(res);
}

/** Confirm a ticket (admin). */
export async function confirmTicket(ticketId: number): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/confirm_ticket/`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<BackendTicket>(res);
}

/** Close a ticket (admin). */
export async function closeTicket(ticketId: number): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/close_ticket/`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<BackendTicket>(res);
}

/** Internal escalation (employee). */
export async function escalateTicket(ticketId: number, data: { notes: string }): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/escalate/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<BackendTicket>(res);
}

/** External escalation. */
export async function escalateExternal(ticketId: number, data: { external_escalated_to: string; external_escalation_notes: string }): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/escalate_external/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<BackendTicket>(res);
}

/** Pass ticket to another employee. */
export async function passTicket(ticketId: number, data: { employee_id: number; notes?: string }): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/pass_ticket/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<BackendTicket>(res);
}

/** Request closure (employee). */
export async function requestClosure(ticketId: number): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/request_closure/`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<BackendTicket>(res);
}

/** Update employee fields on a ticket. */
export async function updateEmployeeFields(ticketId: number, data: Record<string, unknown>): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/update_employee_fields/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<BackendTicket>(res);
}

/** Upload resolution proof (supports one or multiple files). */
export async function uploadResolutionProof(ticketId: number, files: File | File[]): Promise<unknown> {
  const formData = new FormData();
  const fileList = Array.isArray(files) ? files : [files];
  for (const f of fileList) {
    formData.append('files', f);
  }
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/upload_resolution_proof/`, {
    method: 'POST',
    headers: authHeaders(false),
    body: formData,
  });
  return handleResponse(res);
}

/** Delete an attachment. */
export async function deleteAttachment(ticketId: number, attachmentId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/delete_attachment/${attachmentId}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as Record<string, string>).detail || `Delete failed (${res.status})`);
  }
}

/** Update a task status. */
export async function updateTaskStatus(ticketId: number, taskId: number, status: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/update_task/${taskId}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

/** Fetch ticket statistics for dashboards. */
export async function fetchTicketStats(): Promise<TicketStats> {
  const res = await fetch(`${API_BASE}/tickets/stats/`, { headers: authHeaders() });
  return handleResponse<TicketStats>(res);
}

/** Fetch ticket messages (REST fallback for chat history). */
export async function fetchMessages(ticketId: number): Promise<unknown[]> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/messages/`, { headers: authHeaders() });
  return handleResponse<unknown[]>(res);
}

/** Fetch assignment history for a ticket. */
export async function fetchAssignmentHistory(ticketId: number): Promise<unknown[]> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/assignment_history/`, { headers: authHeaders() });
  return handleResponse<unknown[]>(res);
}

// ── Employee endpoints ──

/** Fetch the list of employees (for assignment dropdowns). */
export async function fetchEmployees(): Promise<{ id: number; username: string; email: string; first_name: string; last_name: string }[]> {
  const res = await fetch(`${API_BASE}/employees/`, { headers: authHeaders() });
  return handleResponse(res);
}

// ── User management endpoints ──

/** Fetch all users (superadmin). */
export async function fetchUsers(): Promise<BackendUser[]> {
  const res = await fetch(`${API_BASE}/users/list_users/`, { headers: authHeaders() });
  return handleResponse<BackendUser[]>(res);
}

/** Create a new user (superadmin). */
export interface CreateUserPayload {
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  email: string;
  phone?: string;
  role: 'employee' | 'admin';
}

export async function createUser(data: CreateUserPayload): Promise<BackendUser> {
  const res = await fetch(`${API_BASE}/users/create_user/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<BackendUser>(res);
}

/** Update a user (superadmin). */
export async function updateUser(userId: number, data: Partial<BackendUser>): Promise<BackendUser> {
  const res = await fetch(`${API_BASE}/users/${userId}/update_user/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<BackendUser>(res);
}

/** Toggle user active status. */
export async function toggleUserActive(userId: number): Promise<BackendUser> {
  const res = await fetch(`${API_BASE}/users/${userId}/toggle_active/`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<BackendUser>(res);
}

/** Admin reset password for a user. */
export async function adminResetPassword(userId: number, newPassword: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/users/${userId}/reset_password/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ new_password: newPassword }),
  });
  return handleResponse(res);
}

// ── Type of Service endpoints ──

/** Fetch all service types. */
export async function fetchTypesOfService(): Promise<TypeOfService[]> {
  const res = await fetch(`${API_BASE}/type-of-service/`, { headers: authHeaders() });
  return handleResponse<TypeOfService[]>(res);
}

/** Create a service type. */
export async function createTypeOfService(data: { name: string; description?: string }): Promise<TypeOfService> {
  const res = await fetch(`${API_BASE}/type-of-service/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<TypeOfService>(res);
}

/** Update a service type. */
export async function updateTypeOfService(id: number, data: Partial<TypeOfService>): Promise<TypeOfService> {
  const res = await fetch(`${API_BASE}/type-of-service/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<TypeOfService>(res);
}

/** Delete a service type. */
export async function deleteTypeOfService(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/type-of-service/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as Record<string, string>).detail || `Delete failed (${res.status})`);
  }
}

// ── Escalation log endpoints ──

/** Fetch escalation logs. */
export async function fetchEscalationLogs(): Promise<EscalationLog[]> {
  const res = await fetch(`${API_BASE}/escalation-logs/`, { headers: authHeaders() });
  return handleResponse<EscalationLog[]>(res);
}

// ── Audit Log types & endpoints ──

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  entity: string;
  entity_id: number | null;
  action: string;
  activity: string;
  actor: number | null;
  actor_email: string;
  actor_name: string;
  ip_address: string | null;
  changes: Record<string, unknown> | null;
}

export interface AuditLogSummary {
  total: number;
  last_24h: number;
  by_entity: Record<string, number>;
  by_action: Record<string, number>;
}

/** Fetch audit logs with optional filters (superadmin only). */
export async function fetchAuditLogs(params?: {
  search?: string;
  entity?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}): Promise<AuditLogEntry[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.entity) query.set('entity', params.entity);
  if (params?.action) query.set('action', params.action);
  if (params?.date_from) query.set('date_from', params.date_from);
  if (params?.date_to) query.set('date_to', params.date_to);
  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/audit-logs/${qs}`, { headers: authHeaders() });
  return handleResponse<AuditLogEntry[]>(res);
}

/** Fetch audit log summary stats (superadmin only). */
export async function fetchAuditLogSummary(): Promise<AuditLogSummary> {
  const res = await fetch(`${API_BASE}/audit-logs/summary/`, { headers: authHeaders() });
  return handleResponse<AuditLogSummary>(res);
}

/** Export audit logs as CSV download. */
export async function exportAuditLogs(params?: {
  search?: string;
  entity?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
}): Promise<void> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.entity) query.set('entity', params.entity);
  if (params?.action) query.set('action', params.action);
  if (params?.date_from) query.set('date_from', params.date_from);
  if (params?.date_to) query.set('date_to', params.date_to);
  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/audit-logs/export/${qs}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// ── Knowledge Hub types & endpoints ──

export interface KnowledgeHubAttachment {
  id: number;
  file: string;
  uploaded_by: { id: number; username: string; email: string; role: string; first_name: string; last_name: string } | null;
  uploaded_at: string;
  is_resolution_proof: boolean;
  ticket_id: number;
  stf_no: string;
  ticket_status: string;
  client: string;
  description_of_problem: string;
  type_of_service_name: string;
  assigned_to_name: string;
  // publish fields
  is_published: boolean;
  published_title: string;
  published_description: string;
  published_by_detail: { id: number; username: string; email: string; role: string; first_name: string; last_name: string } | null;
  published_at: string | null;
}

export interface KnowledgeHubSummary {
  total_proofs: number;
  published: number;
  unpublished: number;
  by_ticket_status: Record<string, number>;
}

export interface PublishedArticle {
  id: number;
  published_title: string;
  published_description: string;
  file_url: string;
  stf_no: string;
  uploaded_by_name: string;
  published_by_name: string;
  published_at: string;
  uploaded_at: string;
}

/** Fetch proof attachments with optional filters (admin). */
export async function fetchKnowledgeHubAttachments(params?: {
  search?: string;
  stf_no?: string;
  ticket_status?: string;
  published?: string;
  all?: boolean;
}): Promise<KnowledgeHubAttachment[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.stf_no) query.set('stf_no', params.stf_no);
  if (params?.ticket_status) query.set('ticket_status', params.ticket_status);
  if (params?.published) query.set('published', params.published);
  if (params?.all) query.set('all', 'true');
  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/knowledge-hub/${qs}`, { headers: authHeaders() });
  return handleResponse<KnowledgeHubAttachment[]>(res);
}

/** Publish an attachment to the employee Knowledge Hub. */
export async function publishAttachment(id: number, data: { published_title: string; published_description: string }): Promise<KnowledgeHubAttachment> {
  const res = await fetch(`${API_BASE}/knowledge-hub/${id}/publish/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<KnowledgeHubAttachment>(res);
}

/** Unpublish an attachment from the employee Knowledge Hub. */
export async function unpublishAttachment(id: number): Promise<KnowledgeHubAttachment> {
  const res = await fetch(`${API_BASE}/knowledge-hub/${id}/unpublish/`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<KnowledgeHubAttachment>(res);
}

/** Update published title/description on an attachment. */
export async function updateKnowledgeHubAttachment(id: number, data: { published_title?: string; published_description?: string }): Promise<KnowledgeHubAttachment> {
  const res = await fetch(`${API_BASE}/knowledge-hub/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<KnowledgeHubAttachment>(res);
}

/** Delete a proof attachment. */
export async function deleteKnowledgeHubAttachment(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/knowledge-hub/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as Record<string, string>).detail || `Delete failed (${res.status})`);
  }
}

/** Fetch Knowledge Hub summary stats. */
export async function fetchKnowledgeHubSummary(): Promise<KnowledgeHubSummary> {
  const res = await fetch(`${API_BASE}/knowledge-hub/summary/`, { headers: authHeaders() });
  return handleResponse<KnowledgeHubSummary>(res);
}

/** Fetch published articles (employee-facing, any authenticated user). */
export async function fetchPublishedArticles(params?: { search?: string }): Promise<PublishedArticle[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/published-articles/${qs}`, { headers: authHeaders() });
  return handleResponse<PublishedArticle[]>(res);
}
