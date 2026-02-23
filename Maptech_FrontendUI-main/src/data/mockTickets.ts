export type Ticket = {
  id: string;
  issue: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'In Progress' | 'Assigned' | 'Resolved' | 'Pending';
  sla: number; // hours remaining
  total: number; // total SLA hours
  created?: string;
  client?: string;
  description?: string;
  contact?: string;
  assignedTo?: string;
};

function makeSTF(n: number) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `STF-MP-${date}${String(100000 + n).slice(1)}`;
}

export const MOCK_TICKETS: Ticket[] = Array.from({ length: 20 }).map((_, i) => {
  const id = makeSTF(i + 1);
  const priorities: Ticket['priority'][] = ['Low', 'Medium', 'High', 'Critical'];
  const statuses: Ticket['status'][] = ['In Progress', 'Assigned', 'Resolved', 'Pending'];
  const priority = priorities[i % priorities.length];
  const status = statuses[i % statuses.length];
  return {
    id,
    issue: `Sample issue #${i + 1} - Unable to access resource ${i + 1}`,
    priority,
    status,
    sla: Math.max(1, 48 - i),
    total: 72,
    created: new Date(Date.now() - i * 86400000).toLocaleDateString(),
    client: `Client ${i + 1}`,
    description: `Mock description for ticket ${i + 1}. Please investigate and escalate if needed.`,
    contact: `Contact ${i + 1}`,
    assignedTo: i % 2 === 0 ? 'engineerA' : 'engineerB',
  };
});

export function getTicketById(id?: string) {
  if (!id) return undefined;
  // allow passing id that is already STF or a numeric index
  const found = MOCK_TICKETS.find((t) => t.id === id || t.id.toLowerCase() === id.toLowerCase());
  return found;
}
