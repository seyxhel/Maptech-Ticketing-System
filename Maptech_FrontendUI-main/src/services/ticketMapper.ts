/**
 * ticketMapper.ts – Converts backend API ticket data to the shapes used by UI components.
 */
import type { BackendTicket } from './api';

// ── Status mapping (backend → UI) ──

const STATUS_MAP: Record<string, string> = {
  open: 'New',
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

// ── Assignee name ──

export function getAssigneeName(ticket: BackendTicket): string | null {
  if (!ticket.assigned_to) return null;
  const { first_name, last_name, username } = ticket.assigned_to;
  if (first_name || last_name) {
    const fn = first_name || '';
    const ln = last_name ? `${last_name.charAt(0)}.` : '';
    return `${fn} ${ln}`.trim();
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
  created: string;
}

/** Compute rough SLA hours remaining based on created_at. */
function computeSla(ticket: BackendTicket): { sla: number; totalSla: number } {
  const prioritySlaHours: Record<string, number> = {
    critical: 4,
    high: 8,
    medium: 24,
    low: 48,
  };
  const totalSla = prioritySlaHours[ticket.priority] || 24;
  const created = new Date(ticket.created_at).getTime();
  const elapsed = (Date.now() - created) / (1000 * 60 * 60);
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
    created: new Date(bt.created_at).toLocaleDateString(),
  };
}

// ── Map for employee ticket list (uses slightly different field names) ──

export interface UIEmployeeTicket {
  backendId: number;
  id: string;
  issue: string;
  client: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'In Progress' | 'Assigned' | 'Resolved' | 'Closed' | 'Pending';
  sla: number;
  total: number;
  created: string;
  contact: string;
  description: string;
  assignedTo: string;
}

export function mapBackendTicketToEmployee(bt: BackendTicket): UIEmployeeTicket {
  const { sla, totalSla } = computeSla(bt);
  const status = mapStatus(bt.status, bt.assigned_to) as UIEmployeeTicket['status'];
  return {
    backendId: bt.id,
    id: bt.stf_no,
    issue: bt.description_of_problem || bt.type_of_service_others || bt.type_of_service_detail?.name || 'No description',
    client: bt.client || 'N/A',
    priority: mapPriority(bt.priority) as UIEmployeeTicket['priority'],
    status,
    sla,
    total: totalSla,
    created: new Date(bt.created_at).toLocaleDateString(),
    contact: bt.contact_person || 'N/A',
    description: bt.description_of_problem || '',
    assignedTo: getAssigneeName(bt) || 'unassigned',
  };
}
