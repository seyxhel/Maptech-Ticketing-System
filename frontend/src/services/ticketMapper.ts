/**
 * ticketMapper.ts – Converts backend API ticket data to the shapes used by UI components.
 */
import type { BackendTicket } from './api';

// ── Status mapping (backend → UI) ──

const STATUS_MAP: Record<string, string> = {
  open: 'Pending',
  in_progress: 'In Progress',
  closed: 'Closed',
  escalated: 'Escalated',
  escalated_external: 'Escalated',
  pending_closure: 'Resolved',
  for_observation: 'For Observation',
  unresolved: 'Unresolved',
};

const STATUS_REVERSE_MAP: Record<string, string> = {
  New: 'open',
  Pending: 'open',
  Assigned: 'open',        // 'Assigned' isn't a real backend status; open + assigned_to != null
  'In Progress': 'in_progress',
  Escalated: 'escalated',
  Closed: 'closed',
  Resolved: 'pending_closure',
  'For Observation': 'for_observation',
  Unresolved: 'unresolved',
};

export function mapStatus(backendStatus: string, assignedTo: unknown): string {
  if (backendStatus === 'open' && assignedTo) return 'Assigned';
  return STATUS_MAP[backendStatus] || backendStatus;
}

export function reverseMapStatus(uiStatus: string): string {
  return STATUS_REVERSE_MAP[uiStatus] || uiStatus;
}

// ── Priority mapping ──

export function mapPriority(p: string): string {
  if (!p) return 'Low';
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function reverseMapPriority(p: string): string {
  return p.toLowerCase();
}

export function getUserDisplayName(user: { first_name?: string; last_name?: string; username?: string } | null | undefined): string {
  if (!user) return 'N/A';
  const firstName = String(user.first_name || '').trim();
  const lastName = String(user.last_name || '').trim();
  const username = String(user.username || '').trim();
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || username || 'N/A';
}

// ── Assignee name ──

export function getAssigneeName(ticket: BackendTicket): string | null {
  if (!ticket.assigned_to) return null;
  const { first_name, last_name, username } = ticket.assigned_to;
  if (first_name || last_name) {
    return `${first_name || ''} ${last_name || ''}`.trim();
  }
  return username;
}

// ── Full ticket mapping for list pages ──

export interface UITicket {
  /** Numeric backend ID */
  backendId: number;
  /** STF number shown as the ticket ID */
  id: string;
  subject: string;
  client: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: string;
  sla: number;
  totalSla: number;
  assignee: string | null;
  assigneeId: number | null;
  createdBy: string;
  created: string;
}

/** Compute SLA hours remaining based on estimated resolution days from the backend. */
function computeSla(ticket: BackendTicket): { sla: number; totalSla: number } {
  // SLA should only run after call verification is confirmed and priority is identified.
  if (!ticket.confirmed_by_admin || !String(ticket.priority || '').trim()) {
    return { sla: 0, totalSla: 0 };
  }
  const totalSla = (ticket.sla_estimated_days || 0) * 24;
  if (totalSla === 0) return { sla: 0, totalSla: 0 };
  const startedAt = ticket.time_in ? new Date(ticket.time_in).getTime() : null;
  const elapsed = startedAt ? (Date.now() - startedAt) / (1000 * 60 * 60) : 0;
  const remaining = Math.max(0, Math.round(totalSla - elapsed));
  return { sla: remaining, totalSla };
}

export function mapBackendTicketToUI(bt: BackendTicket): UITicket {
  const { sla, totalSla } = computeSla(bt);
  return {
    backendId: bt.id,
    id: bt.stf_no,
    subject: bt.description_of_problem || bt.type_of_service_others || bt.type_of_service_detail?.name || 'No description',
    client: bt.client || 'N/A',
    priority: mapPriority(bt.priority) as UITicket['priority'],
    status: mapStatus(bt.status, bt.assigned_to),
    sla,
    totalSla,
    assignee: getAssigneeName(bt),
    assigneeId: bt.assigned_to?.id ?? null,
    createdBy: getUserDisplayName(bt.created_by),
    created: new Date(bt.created_at).toLocaleDateString(),
  };
}

// ── Map for technical staff ticket list (uses slightly different field names) ──

export interface UITechnicalStaffTicket {
  backendId: number;
  id: string;
  issue: string;
  client: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'In Progress' | 'Assigned' | 'Resolved' | 'Closed' | 'Pending';
  sla: number;
  total: number;
  createdBy: string;
  created: string;
  contact: string;
  description: string;
  assignedTo: string;
  job_status?: string;
  time_in?: string | null;
}

export function mapBackendTicketToTechnicalStaff(bt: BackendTicket): UITechnicalStaffTicket {
  const { sla, totalSla } = computeSla(bt);
  const status = mapStatus(bt.status, bt.assigned_to) as UITechnicalStaffTicket['status'];
  return {
    backendId: bt.id,
    id: bt.stf_no,
    issue: bt.description_of_problem || bt.type_of_service_others || bt.type_of_service_detail?.name || 'No description',
    client: bt.client || 'N/A',
    priority: mapPriority(bt.priority) as UITechnicalStaffTicket['priority'],
    status,
    sla,
    total: totalSla,
    createdBy: getUserDisplayName(bt.created_by),
    created: new Date(bt.created_at).toLocaleDateString(),
    contact: bt.contact_person || 'N/A',
    description: bt.description_of_problem || '',
    assignedTo: getAssigneeName(bt) || 'unassigned',
    job_status: bt.job_status,
    time_in: bt.time_in,
  };
}
