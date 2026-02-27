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

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
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
  // Nested
  tasks: unknown[];
  attachments: unknown[];
  escalation_logs: unknown[];
  csat_survey: unknown | null;
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

/** Update ticket fields (PATCH). */
export async function updateTicket(id: number, data: Partial<BackendTicket>): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/tickets/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<BackendTicket>(res);
}

/** Fetch the list of employees (for assignment dropdowns). */
export async function fetchEmployees(): Promise<{ id: number; username: string; email: string; first_name: string; last_name: string }[]> {
  const res = await fetch(`${API_BASE}/employees/`, { headers: authHeaders() });
  return handleResponse(res);
}
