import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { GreenButton } from '../../components/ui/GreenButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import {
  Ticket,
  UserCheck,
  Clock,
  AlertOctagon,
  Building2,
  History,
  ChevronRight as ChevronRightIcon,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import { AnnouncementBanner } from '../../components/ui/AnnouncementBanner';
import { Calendar } from '../../components/ui/Calendar';
import {
  fetchTickets,
  fetchTicketStats,
  fetchEscalationLogs,
  fetchEmployees,
  updateTicket as apiUpdateTicket,
  assignTicket,
} from '../../services/api';
import type { BackendTicket, TicketStats, EscalationLog } from '../../services/api';
import { mapBackendTicketToUI, mapBackendTicketToTechnicalStaff, mapStatus, reverseMapStatus, reverseMapPriority } from '../../services/ticketMapper';
import type { UITicket } from '../../services/ticketMapper';

const STATUSES = ['Pending', 'Assigned', 'In Progress', 'Escalated', 'For Observation', 'Unresolved', 'Resolved', 'Closed'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const READ_ONLY_STATUSES = new Set(['Resolved', 'Closed']);

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...`;
}

function isTicketEditable(status: UITicket['status']): boolean {
  return !READ_ONLY_STATUSES.has(status);
}

function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`} />;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [statusChartRange, setStatusChartRange] = useState<'today' | 'weekly' | 'monthly' | 'yearly'>('today');
  const [tickets, setTickets] = useState<UITicket[]>([]);
  const [backendTickets, setBackendTickets] = useState<BackendTicket[]>([]);
  const [editTicket, setEditTicket] = useState<UITicket | null>(null);
  const [editFields, setEditFields] = useState({ status: '', priority: '', assigneeId: '' });
  const [employees, setEmployees] = useState<{ id: number; first_name: string; last_name: string; username: string; active_ticket_count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [ticketFeedView, setTicketFeedView] = useState<'submitted' | 'escalated'>('submitted');
  const [escalationHistory, setEscalationHistory] = useState<
    { id: number; ticketId: string; type: string; to: string; reason: string; time: string }[]
  >([]);

  // Fetch tickets from backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [raw, statsData, escLogs, emps] = await Promise.all([
          fetchTickets(),
          fetchTicketStats().catch(() => null),
          fetchEscalationLogs().catch(() => []),
          fetchEmployees().catch(() => []),
        ]);
        if (!cancelled && emps) setEmployees(emps);
        if (cancelled) return;
        setBackendTickets(raw);
        const mapped = raw.map(mapBackendTicketToUI);
        setTickets(mapped);
        if (statsData) setStats(statsData);
        // Map escalation logs
        const escMapped = (escLogs as EscalationLog[]).map((log) => {
          const ticketBt = raw.find((t) => t.id === log.ticket);
          const isExternal = log.escalation_type === 'external';
          const elapsed = Date.now() - new Date(log.created_at).getTime();
          const timeAgo = elapsed < 3600000
            ? `${Math.round(elapsed / 60000)}m ago`
            : elapsed < 86400000
            ? `${Math.round(elapsed / 3600000)}h ago`
            : `${Math.round(elapsed / 86400000)}d ago`;
          return {
            id: log.id,
            ticketId: ticketBt?.stf_no || `#${log.ticket}`,
            type: isExternal ? 'Cascaded' : 'Escalated',
            to: log.to_external || (log.to_user ? `${log.to_user.first_name || ''} ${log.to_user.last_name || ''}`.trim() || log.to_user.username : 'Higher Position'),
            reason: log.notes || 'No reason provided',
            time: timeAgo,
          };
        });
        setEscalationHistory(escMapped);
      } catch (err) {
        if (!cancelled) toast.error('Failed to load tickets from server.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const saveEdit = async () => {
    if (!editTicket) return;
    if (!isTicketEditable(editTicket.status)) {
      toast.error('Resolved or closed tickets cannot be edited.');
      setEditTicket(null);
      return;
    }
    try {
      const assignedToId = editFields.assigneeId ? Number(editFields.assigneeId) : null;
      let updatedBackendTicket = await apiUpdateTicket(editTicket.backendId, {
        status: reverseMapStatus(editFields.status),
        priority: reverseMapPriority(editFields.priority),
      });

      if (assignedToId && assignedToId !== editTicket.assigneeId) {
        updatedBackendTicket = await assignTicket(editTicket.backendId, assignedToId);
      }

      setBackendTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === updatedBackendTicket.id ? updatedBackendTicket : ticket
        )
      );
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === editTicket.id ? mapBackendTicketToUI(updatedBackendTicket) : ticket
        )
      );
      toast.success(`Ticket ${editTicket.id} updated.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update ticket.');
    }
    setEditTicket(null);
  };

  const toggleFilter = (arr: string[], val: string) => arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const sortedBackendTickets = [...backendTickets].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
  const submittedBackendTickets = sortedBackendTickets.filter((ticket) => ticket.status !== 'escalated' && ticket.status !== 'escalated_external');
  const escalatedBackendTickets = sortedBackendTickets.filter((ticket) => ticket.status === 'escalated' || ticket.status === 'escalated_external');
  const activeFeedBackendTickets = ticketFeedView === 'submitted' ? submittedBackendTickets : escalatedBackendTickets;
  const latestTicketCards = activeFeedBackendTickets.slice(0, 6).map(mapBackendTicketToUI);
  const supervisorCalendarTickets = backendTickets.map(mapBackendTicketToTechnicalStaff);

  const statusChartPalette: Record<string, string> = {
    Pending: '#F59E0B',
    Assigned: '#0EA5E9',
    'In Progress': '#22C55E',
    Escalated: '#F97316',
    'For Observation': '#A855F7',
    Unresolved: '#EF4444',
    Resolved: '#14B8A6',
    Closed: '#6B7280',
  };

  const getStatusRangeStart = (range: 'today' | 'weekly' | 'monthly' | 'yearly'): Date => {
    const now = new Date();
    const start = new Date(now);
    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
      return start;
    }
    if (range === 'weekly') {
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    if (range === 'monthly') {
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    start.setDate(now.getDate() - 364);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const statusRangeStart = getStatusRangeStart(statusChartRange);
  const statusRangeBackendTickets = backendTickets.filter((ticket) => {
    const createdAt = new Date(ticket.created_at);
    return !Number.isNaN(createdAt.getTime()) && createdAt >= statusRangeStart;
  });

  const statusPieData = Object.entries(
    statusRangeBackendTickets.reduce<Record<string, number>>((acc, ticket) => {
      const statusLabel = mapStatus(ticket.status, ticket.assigned_to);
      acc[statusLabel] = (acc[statusLabel] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({
    name,
    value,
    color: statusChartPalette[name] ?? '#94A3B8',
  }));

  const getLastUpdatedText = (stfNo: string) => {
    const bt = backendTickets.find((t) => t.stf_no === stfNo);
    if (!bt?.updated_at) return 'N/A';
    return new Date(bt.updated_at).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <AnnouncementBanner />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Supervisor Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage tickets, assignments, and team progress</p>
        </div>
        <GreenButton onClick={() => navigate('/admin/create-ticket')}>+ Create Ticket</GreenButton>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-3.5">
              <SkeletonBox className="h-3 w-20 mb-2" />
              <SkeletonBox className="h-7 w-14 mb-2" />
              <SkeletonBox className="h-9 w-9 rounded-xl" />
            </div>
          ))
        ) : (
          <>
            <StatCard title="Total Tickets" value={String(stats?.total ?? tickets.length)} icon={Building2} color="blue" compact />
            <StatCard title="Unassigned" value={String(tickets.filter(t => !t.assignee).length)} icon={Ticket} color="orange" compact />
            <StatCard title="Pending" value={String(stats?.open ?? tickets.filter(t => t.status === 'Pending').length)} icon={Clock} color="blue" compact />
            <StatCard title="In Progress" value={String(stats?.in_progress ?? tickets.filter(t => t.status === 'In Progress' || t.status === 'Assigned').length)} icon={UserCheck} color="green" compact />
            <StatCard title="Escalated" value={String(stats?.escalated ?? tickets.filter(t => t.status === 'Escalated').length)} icon={AlertOctagon} color="purple" compact />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" accent>
          <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
              <button
                onClick={() => setTicketFeedView('submitted')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${ticketFeedView === 'submitted' ? 'bg-white dark:bg-gray-700 text-[#0E8F79] shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Submitted Tickets
              </button>
              <button
                onClick={() => setTicketFeedView('escalated')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${ticketFeedView === 'escalated' ? 'bg-white dark:bg-gray-700 text-[#0E8F79] shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Escalated Tickets
              </button>
            </div>
            <GreenButton variant="outline" onClick={() => navigate(ticketFeedView === 'submitted' ? '/admin/tickets' : '/admin/tickets/escalated')}>
              {ticketFeedView === 'submitted' ? 'All Submitted Tickets' : 'All Escalated Tickets'}
            </GreenButton>
          </div>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                  <SkeletonBox className="h-3 w-36 mb-2" />
                  <SkeletonBox className="h-4 w-3/4 mb-2" />
                  <SkeletonBox className="h-3 w-1/2 mb-3" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <SkeletonBox className="h-14 w-full" />
                    <SkeletonBox className="h-14 w-full" />
                    <SkeletonBox className="h-14 w-full" />
                    <SkeletonBox className="h-14 w-full" />
                  </div>
                </div>
              ))
            ) : latestTicketCards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">{ticketFeedView === 'submitted' ? 'No submitted tickets yet.' : 'No escalated tickets yet.'}</p>
              </div>
            ) : (
              latestTicketCards.map((ticket) => {
                const bt = activeFeedBackendTickets.find((b) => b.stf_no === ticket.id);
                const latestEscalation = bt?.escalation_logs?.[0];
                const escalatedTo =
                  (bt?.external_escalated_to || '').trim() ||
                  (latestEscalation?.to_external || '').trim() ||
                  (latestEscalation?.to_user_name || '').trim() ||
                  (latestEscalation?.external_escalated_to || '').trim() ||
                  'Higher Position';

                return (
                <div key={ticket.id} className="rounded-xl border border-gray-100 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-[#0E8F79] dark:text-green-400 mb-1">{ticket.id}</p>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white break-all">{truncateText(ticket.subject, 73)}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Client: {ticket.client}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last Updated: {getLastUpdatedText(ticket.id)}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/admin/ticket-details?stf=${ticket.id}`)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-[#0E8F79] text-white hover:bg-[#0b7463] transition-colors self-end md:self-auto md:ml-auto"
                    >
                      View Details
                      <ChevronRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Priority</p>
                      <div className="mt-1"><PriorityBadge priority={ticket.priority} /></div>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {ticketFeedView === 'escalated' ? 'Escalated To' : 'Status'}
                      </p>
                      {ticketFeedView === 'escalated' ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 truncate" title={escalatedTo}>{escalatedTo}</p>
                      ) : (
                        <div className="mt-1"><StatusBadge status={ticket.status} /></div>
                      )}
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Assignee</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{ticket.assignee || 'Unassigned'}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Progress</p>
                      <div className="mt-1">
                        {(() => {
                          const rawProgress = bt?.progress_percentage ?? bt?.progressPercentage;
                          const progress = typeof rawProgress === 'number' ? rawProgress : 0;
                          return (
                            <>
                              <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                <span>Current Progress</span>
                                <span className="font-bold">{progress}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div className="h-full bg-[#3BC25B] rounded-full transition-all" style={{ width: `${progress}%` }} />
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )})
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">Tickets by Status</h3>
              <select
                value={statusChartRange}
                onChange={(e) => setStatusChartRange(e.target.value as 'today' | 'weekly' | 'monthly' | 'yearly')}
                className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#3BC25B]"
                aria-label="Filter tickets by status chart date range"
              >
                <option value="today">Today</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="h-60">
              {loading ? (
                <div className="h-full p-3">
                  <SkeletonBox className="h-full w-full rounded-xl" />
                </div>
              ) : statusPieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">No ticket data available.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="46%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {statusPieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        color: '#111827',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#6b7280', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {loading ? (
            <Card>
              <SkeletonBox className="h-5 w-40 mb-4" />
              <SkeletonBox className="h-56 w-full rounded-xl" />
            </Card>
          ) : (
            <Calendar tickets={supervisorCalendarTickets} />
          )}

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">Escalation History</h3>
            </div>
            <div className="space-y-2.5 max-h-[270px] overflow-y-auto pr-1">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="pl-2.5 border-l-4 border-gray-200 dark:border-gray-700">
                    <SkeletonBox className="h-3 w-24 mb-2" />
                    <SkeletonBox className="h-3 w-40 mb-2" />
                    <SkeletonBox className="h-3 w-3/4" />
                  </div>
                ))
              ) : escalationHistory.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No escalation history yet.</p>
              )}
              {!loading && escalationHistory.map((item) => (
                <div key={item.id} className={`pl-2.5 border-l-4 ${item.type === 'Escalated' ? 'border-orange-400' : 'border-[#0E8F79]'}`}>
                  <div className="flex justify-between items-start"><span className="text-xs font-bold text-gray-900 dark:text-white">{item.ticketId}</span><span className="text-[10px] text-gray-500 dark:text-gray-400">{item.time}</span></div>
                  <div className="flex items-center gap-2 mt-1"><span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.type === 'Escalated' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' : 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'}`}>{item.type}</span><span className="text-xs text-gray-600 dark:text-gray-400">to {item.to}</span></div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">&ldquo;{item.reason}&rdquo;</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Ticket Modal */}
      {editTicket && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={() => setEditTicket(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Ticket</h3>
              <button onClick={() => setEditTicket(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <p className="text-xs font-mono text-[#0E8F79] dark:text-green-400 bg-gray-50 dark:bg-gray-700/50 rounded px-2 py-1 mb-4">{editTicket.id}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-4 truncate">{editTicket.subject}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</label>
                <select value={editFields.status} onChange={(e) => setEditFields((p) => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#3BC25B] outline-none">
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Priority</label>
                <select value={editFields.priority} onChange={(e) => setEditFields((p) => ({ ...p, priority: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#3BC25B] outline-none">
                  {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Assignee</label>
                {editTicket && !['Pending', 'Assigned', 'Escalated'].includes(editTicket.status) ? (
                  <>
                    <select disabled className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none">
                      <option>{editTicket.assignee || 'Unassigned'}</option>
                    </select>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Cannot reassign after the employee has started working.</p>
                  </>
                ) : (
                  <select value={editFields.assigneeId} onChange={(e) => setEditFields((p) => ({ ...p, assigneeId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#3BC25B] outline-none">
                    <option value="">Unassigned</option>
                    {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                  </select>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditTicket(null)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={saveEdit} className="flex-1 px-4 py-2 bg-[#3BC25B] hover:bg-[#2ea34a] text-white text-sm font-medium rounded-lg transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Filter Modal */}
      {showFilter && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowFilter(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filter Tickets</h3>
              <button onClick={() => setShowFilter(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Priority</h4>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map((p) => (
                    <button key={p} onClick={() => setFilterPriority((prev) => toggleFilter(prev, p))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filterPriority.includes(p) ? 'bg-[#0E8F79] text-white border-[#0E8F79]' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-[#0E8F79]/50'}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Status</h4>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => setFilterStatus((prev) => toggleFilter(prev, s))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filterStatus.includes(s) ? 'bg-[#0E8F79] text-white border-[#0E8F79]' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-[#0E8F79]/50'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setFilterPriority([]); setFilterStatus([]); }} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Clear All</button>
              <button onClick={() => setShowFilter(false)} className="flex-1 px-4 py-2 rounded-lg bg-[#3BC25B] hover:bg-[#2ea34a] text-white text-sm font-medium">Apply Filters</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
