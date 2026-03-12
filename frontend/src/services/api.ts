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
    // Try `detail` or `message` first (standard DRF error keys)
    let msg = (errData.detail as string) || (errData.message as string);
    // If not found, extract DRF field-level validation errors
    if (!msg) {
      const fieldErrors: string[] = [];
      for (const [key, val] of Object.entries(errData)) {
        if (Array.isArray(val)) {
          const label = key.replace(/_/g, ' ');
          fieldErrors.push(`${label}: ${val.join(', ')}`);
        } else if (typeof val === 'string') {
          fieldErrors.push(val);
        }
      }
      msg = fieldErrors.length > 0 ? fieldErrors.join('; ') : `API error ${res.status}`;
    }
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
  recovery_key?: string;
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
  sales_no: string;
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
  // New fields
  client_record: number | null;
  client_record_detail: ClientRecord | null;
  product_record: number | null;
  product_record_detail: Product | null;
  cascade_type: string;
  observation: string;
  was_for_observation: boolean;
  signature: string;
  signed_by_name: string;
  estimated_resolution_days_override: number | null;
  progress_percentage: number;
  sla_estimated_days: number;
  csat_feedback: CSATFeedback | null;
  [key: string]: unknown;
}

export interface TypeOfService {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  estimated_resolution_days: number;
}

export interface DeviceEquipment {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  category: number | null;
  category_detail: DeviceEquipment | null;
  device_equipment: string;
  version_no: string;
  date_purchased: string | null;
  serial_no: string;
  has_warranty: boolean;
  product_name: string;
  brand: string;
  model_name: string;
  sales_no: string;
  others: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientRecord {
  id: number;
  client_name: string;
  contact_person: string;
  landline: string;
  mobile_no: string;
  designation: string;
  department_organization: string;
  email_address: string;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CallLog {
  id: number;
  ticket: number | null;
  admin: number;
  admin_name: string;
  client_name: string;
  phone_number: string;
  call_start: string;
  call_end: string | null;
  duration_seconds: number | null;
  notes: string;
  created_at: string;
}

export interface CSATFeedback {
  id: number;
  ticket: number;
  stf_no: string;
  employee: number;
  employee_name: string;
  admin: number;
  admin_name: string;
  rating: number;
  comments: string;
  created_at: string;
}

export interface EscalationLog {
  id: number;
  ticket: number;
  escalation_type: 'internal' | 'external';
  from_user: { id: number; first_name: string; last_name: string; username: string } | null;
  to_user: { id: number; first_name: string; last_name: string; username: string } | null;
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
    throw new Error((data as Record<string, string>).detail || `Delete failed (${res.status}).`);
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

/** Close a ticket (admin). Requires CSAT to be submitted first if ticket has an assignee. */
export async function closeTicket(ticketId: number): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/close_ticket/`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<BackendTicket>(res);
}

/** Start work on a ticket (employee). Sets time_in and status to in_progress. */
export async function startWork(ticketId: number): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/start_work/`, {
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
export async function escalateExternal(ticketId: number, data: { escalated_to: string; notes: string }): Promise<BackendTicket> {
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

/** Save product detail fields without resolving the ticket. */
export async function saveProductDetails(ticketId: number, data: Record<string, unknown>): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/save_product_details/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
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

/** Submit ticket for observation (employee). */
export async function submitForObservation(ticketId: number, data: Record<string, unknown>): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/submit_for_observation/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<BackendTicket>(res);
}

/** Mark ticket as unresolved (employee). */
export async function markUnresolved(ticketId: number, data: Record<string, unknown>): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/mark_unresolved/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<BackendTicket>(res);
}

/** Link tickets together (supervisor). */
export async function linkTickets(ticketId: number, ticketIds: number[]): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/link_tickets/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ticket_ids: ticketIds }),
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
    throw new Error((data as Record<string, string>).detail || `Delete failed (${res.status}).`);
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

/** Fetch the list of employees (for assignment dropdowns). Sorted by fewest active tickets. */
export async function fetchEmployees(): Promise<{ id: number; username: string; email: string; first_name: string; last_name: string; active_ticket_count: number; is_active: boolean }[]> {
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
    throw new Error((data as Record<string, string>).detail || `Delete failed (${res.status}).`);
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
  if (!res.ok) throw new Error('Export failed.');
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
  published_tags: string[];
  published_by_detail: { id: number; username: string; email: string; role: string; first_name: string; last_name: string } | null;
  published_at: string | null;
  // archive field
  is_archived: boolean;
}

export interface KnowledgeHubSummary {
  total_proofs: number;
  published: number;
  unpublished: number;
  archived: number;
  by_ticket_status: Record<string, number>;
}

export interface PublishedArticle {
  id: number;
  published_title: string;
  published_description: string;
  published_tags: string[];
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
  archived?: string;
  all?: boolean;
}): Promise<KnowledgeHubAttachment[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.stf_no) query.set('stf_no', params.stf_no);
  if (params?.ticket_status) query.set('ticket_status', params.ticket_status);
  if (params?.published) query.set('published', params.published);
  if (params?.archived) query.set('archived', params.archived);
  if (params?.all) query.set('all', 'true');
  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/knowledge-hub/${qs}`, { headers: authHeaders() });
  return handleResponse<KnowledgeHubAttachment[]>(res);
}

/** Publish an attachment to the employee Knowledge Hub. */
export async function publishAttachment(id: number, data: { published_title: string; published_description: string; published_tags?: string[] }): Promise<KnowledgeHubAttachment> {
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
export async function updateKnowledgeHubAttachment(id: number, data: { published_title?: string; published_description?: string; published_tags?: string[] }): Promise<KnowledgeHubAttachment> {
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
    throw new Error((data as Record<string, string>).detail || `Delete failed (${res.status}).`);
  }
}

/** Archive an attachment. */
export async function archiveAttachment(id: number): Promise<KnowledgeHubAttachment> {
  const res = await fetch(`${API_BASE}/knowledge-hub/${id}/archive/`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<KnowledgeHubAttachment>(res);
}

/** Unarchive an attachment. */
export async function unarchiveAttachment(id: number): Promise<KnowledgeHubAttachment> {
  const res = await fetch(`${API_BASE}/knowledge-hub/${id}/unarchive/`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<KnowledgeHubAttachment>(res);
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

// ── Product endpoints ──

/** Fetch all device/equipment categories. */
export async function fetchDeviceEquipment(): Promise<DeviceEquipment[]> {
  const res = await fetch(`${API_BASE}/device-equipment/`, { headers: authHeaders() });
  return handleResponse<DeviceEquipment[]>(res);
}

/** Create a device/equipment category. */
export async function createDeviceEquipment(data: Partial<DeviceEquipment>): Promise<DeviceEquipment> {
  const res = await fetch(`${API_BASE}/device-equipment/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<DeviceEquipment>(res);
}

/** Update a device/equipment category. */
export async function updateDeviceEquipment(id: number, data: Partial<DeviceEquipment>): Promise<DeviceEquipment> {
  const res = await fetch(`${API_BASE}/device-equipment/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<DeviceEquipment>(res);
}

/** Delete a device/equipment category. */
export async function deleteDeviceEquipment(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/device-equipment/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete category');
  }
}

/** Fetch all products. */
export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products/`, { headers: authHeaders() });
  return handleResponse<Product[]>(res);
}

/** Create a product. */
export async function createProduct(data: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Product>(res);
}

/** Update a product. */
export async function updateProduct(id: number, data: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Product>(res);
}

/** Delete a product. */
export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as Record<string, string>).detail || `Delete failed (${res.status}).`);
  }
}

// ── Client endpoints ──

/** Fetch all clients. */
export async function fetchClients(): Promise<ClientRecord[]> {
  const res = await fetch(`${API_BASE}/clients/`, { headers: authHeaders() });
  return handleResponse<ClientRecord[]>(res);
}

/** Create a client. */
export async function createClient(data: Partial<ClientRecord>): Promise<ClientRecord> {
  const res = await fetch(`${API_BASE}/clients/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<ClientRecord>(res);
}

/** Update a client. */
export async function updateClient(id: number, data: Partial<ClientRecord>): Promise<ClientRecord> {
  const res = await fetch(`${API_BASE}/clients/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<ClientRecord>(res);
}

/** Delete a client. */
export async function deleteClient(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/clients/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as Record<string, string>).detail || `Delete failed (${res.status}).`);
  }
}

// ── Call Log endpoints ──

/** Create a call log entry (start a call). */
export async function createCallLog(data: { ticket?: number; client_name: string; phone_number: string; call_start: string; notes?: string }): Promise<CallLog> {
  const res = await fetch(`${API_BASE}/call-logs/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<CallLog>(res);
}

/** End a call (update call_end). */
export async function endCallLog(id: number, data: { call_end: string; notes?: string }): Promise<CallLog> {
  const res = await fetch(`${API_BASE}/call-logs/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<CallLog>(res);
}

/** Fetch call logs. */
export async function fetchCallLogs(): Promise<CallLog[]> {
  const res = await fetch(`${API_BASE}/call-logs/`, { headers: authHeaders() });
  return handleResponse<CallLog[]>(res);
}

// ── Retention Policy endpoints ──

export interface RetentionPolicyData {
  id: number;
  audit_log_retention_days: number;
  call_log_retention_days: number;
  updated_at: string;
  updated_by: number | null;
  updated_by_name: string | null;
}

/** Fetch the current retention policy (superadmin only). */
export async function fetchRetentionPolicy(): Promise<RetentionPolicyData> {
  const res = await fetch(`${API_BASE}/retention-policy/`, { headers: authHeaders() });
  const data = await handleResponse<RetentionPolicyData[] | RetentionPolicyData>(res);
  // ViewSet.list returns an array for router-registered viewsets
  return Array.isArray(data) ? data[0] ?? { id: 1, audit_log_retention_days: 365, call_log_retention_days: 365, updated_at: '', updated_by: null, updated_by_name: null } : data;
}

/** Update the retention policy (superadmin only). */
export async function updateRetentionPolicy(data: { audit_log_retention_days?: number; call_log_retention_days?: number }): Promise<RetentionPolicyData> {
  const res = await fetch(`${API_BASE}/retention-policy/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<RetentionPolicyData>(res);
}

// ── CSAT Feedback endpoints ──

/** Submit CSAT feedback (admin rates employee before closing). */
export async function createCSATFeedback(data: { ticket: number; employee: number; rating: number; comments?: string }): Promise<CSATFeedback> {
  const res = await fetch(`${API_BASE}/csat-feedback/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<CSATFeedback>(res);
}

/** Fetch CSAT feedback entries. */
export async function fetchCSATFeedbacks(): Promise<CSATFeedback[]> {
  const res = await fetch(`${API_BASE}/csat-feedback/`, { headers: authHeaders() });
  return handleResponse<CSATFeedback[]>(res);
}

// ── Notification types & endpoints ──

export interface BackendNotification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  ticket: number | null;
  ticket_stf_no: string | null;
  is_read: boolean;
  created_at: string;
}

/** Fetch all notifications for the current user (most recent 100). */
export async function fetchNotifications(params?: { is_read?: boolean }): Promise<BackendNotification[]> {
  const query = new URLSearchParams();
  if (params?.is_read !== undefined) query.set('is_read', String(params.is_read));
  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/notifications/${qs}`, { headers: authHeaders() });
  return handleResponse<BackendNotification[]>(res);
}

/** Get unread notification count. */
export async function fetchUnreadNotificationCount(): Promise<{ count: number }> {
  const res = await fetch(`${API_BASE}/notifications/unread_count/`, { headers: authHeaders() });
  return handleResponse<{ count: number }>(res);
}

/** Mark specific notifications as read. */
export async function markNotificationsRead(notificationIds: number[]): Promise<{ updated: number }> {
  const res = await fetch(`${API_BASE}/notifications/mark_read/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ notification_ids: notificationIds }),
  });
  return handleResponse<{ updated: number }>(res);
}

/** Mark all notifications as read. */
export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const res = await fetch(`${API_BASE}/notifications/mark_all_read/`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<{ updated: number }>(res);
}

/** Delete a single notification. */
export async function deleteNotification(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as Record<string, string>).detail || `Delete failed (${res.status})`);
  }
}

/** Clear all notifications. */
export async function clearAllNotifications(): Promise<{ deleted: number }> {
  const res = await fetch(`${API_BASE}/notifications/clear_all/`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<{ deleted: number }>(res);
}

// ── Announcement endpoints ──

export interface AnnouncementData {
  id: number;
  title: string;
  description: string;
  announcement_type: 'info' | 'warning' | 'success' | 'critical';
  visibility: 'all' | 'admin' | 'employee';
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  created_by: number | null;
  created_by_name: string | null;
  is_currently_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Fetch announcements (filtered by role on the backend). */
export async function fetchAnnouncements(): Promise<AnnouncementData[]> {
  const res = await fetch(`${API_BASE}/announcements/`, { headers: authHeaders() });
  return handleResponse<AnnouncementData[]>(res);
}

/** Create a new announcement (superadmin only). */
export async function createAnnouncement(data: {
  title: string;
  description: string;
  announcement_type: string;
  visibility: string;
  is_active?: boolean;
  start_date?: string;
  end_date?: string | null;
}): Promise<AnnouncementData> {
  const res = await fetch(`${API_BASE}/announcements/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<AnnouncementData>(res);
}

/** Update an announcement (superadmin only). */
export async function updateAnnouncement(id: number, data: Partial<{
  title: string;
  description: string;
  announcement_type: string;
  visibility: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
}>): Promise<AnnouncementData> {
  const res = await fetch(`${API_BASE}/announcements/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<AnnouncementData>(res);
}

/** Delete an announcement (superadmin only). */
export async function deleteAnnouncement(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/announcements/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as Record<string, string>).detail || `Delete failed (${res.status})`);
  }
}
