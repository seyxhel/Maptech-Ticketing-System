import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { GreenButton } from '../components/ui/GreenButton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { SLATimer } from '../components/ui/SLATimer';
import {
  Ticket,
  UserCheck,
  Clock,
  AlertOctagon,
  ArrowUpRight,
  Share2,
  Building2,
  History,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchTickets,
  fetchTicketStats,
  fetchEscalationLogs,
  escalateExternal,
} from '../services/api';
import type { BackendTicket, TicketStats } from '../services/api';
import { mapBackendTicketToUI } from '../services/ticketMapper';
import type { UITicket } from '../services/ticketMapper';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [escalationType, setEscalationType] = useState<'Higher' | 'Distributor' | 'Principal'>('Higher');
  const [escalationReason, setEscalationReason] = useState('');
  const [selectedEscalationTicket, setSelectedEscalationTicket] = useState('');
  const [tickets, setTickets] = useState<UITicket[]>([]);
  const [backendTickets, setBackendTickets] = useState<BackendTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [escalationHistory, setEscalationHistory] = useState<
    { id: number; ticketId: string; type: string; to: string; reason: string; time: string }[]
  >([]);

  // Fetch tickets from backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [raw, statsData, escLogs] = await Promise.all([
          fetchTickets(),
          fetchTicketStats().catch(() => null),
          fetchEscalationLogs().catch(() => []),
        ]);
        if (cancelled) return;
        setBackendTickets(raw);
        const mapped = raw.map(mapBackendTicketToUI);
        setTickets(mapped);
        if (mapped.length > 0) setSelectedEscalationTicket(mapped[0].id);
        if (statsData) setStats(statsData);
        // Map escalation logs
        const escMapped = (escLogs as any[]).map((log: any) => {
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

  const latestBackendTickets = [...backendTickets]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const latestTicketCards = latestBackendTickets.map(mapBackendTicketToUI);

  const getLastUpdatedText = (stfNo: string) => {
    const bt = latestBackendTickets.find((t) => t.stf_no === stfNo);
    if (!bt?.updated_at) return 'Unknown';
    return new Date(bt.updated_at).toLocaleString();
  };

  const handleEscalate = async () => {
    if (!escalationReason) { toast.error('Please provide a reason for escalation.'); return; }
    const bt = backendTickets.find((t) => t.stf_no === selectedEscalationTicket);
    if (!bt) { toast.error('Ticket not found.'); return; }
    try {
      const targetName = escalationType === 'Distributor' ? 'Distributor' : escalationType === 'Principal' ? 'Principal' : 'Higher Position';
      await escalateExternal(bt.id, { external_escalated_to: targetName, external_escalation_notes: escalationReason } as any);
      toast.success(`Ticket ${selectedEscalationTicket} escalated successfully`);
      setEscalationReason('');
    } catch (err: any) {
      toast.error(err?.message || 'Escalation failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3BC25B]"></div>
        <span className="ml-3 text-gray-500">Loading tickets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Supervisor Console</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage tickets, assignments, and team performance</p>
        </div>
        <GreenButton onClick={() => navigate('/admin/create-ticket')}>+ Create Ticket</GreenButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Unassigned" value={String(tickets.filter(t => !t.assignee).length)} icon={Ticket} color="orange" subtext="Needs immediate assignment" />
        <StatCard title="Open" value={String(stats?.open ?? tickets.filter(t => t.status === 'New').length)} icon={Clock} color="blue" subtext="Waiting for action" />
        <StatCard title="In Progress" value={String(stats?.in_progress ?? tickets.filter(t => t.status === 'In Progress' || t.status === 'Assigned').length)} icon={UserCheck} color="green" />
        <StatCard title="Escalated" value={String(stats?.escalated ?? tickets.filter(t => t.status === 'Escalated').length)} icon={AlertOctagon} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" accent>
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Submitted Tickets</h3>
            <GreenButton variant="outline" onClick={() => navigate('/admin/tickets')}>
              View All
            </GreenButton>
          </div>
          <div className="space-y-4">
            {latestTicketCards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No submitted tickets yet.</p>
              </div>
            ) : (
              latestTicketCards.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-[#0E8F79] dark:text-green-400 mb-1">{ticket.id}</p>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{ticket.subject}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Client: {ticket.client}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last Updated: {getLastUpdatedText(ticket.id)}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/admin/ticket-details?stf=${ticket.id}`)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-[#0E8F79] text-white hover:bg-[#0b7463] transition-colors"
                    >
                      View Details
                      <ChevronRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Priority</p>
                      <div className="mt-1"><PriorityBadge priority={ticket.priority} /></div>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</p>
                      <div className="mt-1"><StatusBadge status={ticket.status} /></div>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Assignee</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{ticket.assignee || 'Unassigned'}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Progress</p>
                      <div className="mt-1">
                        {(() => {
                          const bt = latestBackendTickets.find((b) => b.stf_no === ticket.id);
                          const progress = bt?.progress_percentage ?? bt?.progressPercentage ?? 0;
                          return (
                            <>
                              <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                <span>Progress</span>
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
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">Escalation History</h3>
            </div>
            <div className="space-y-4">
              {escalationHistory.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No escalation history yet.</p>
              )}
              {escalationHistory.map((item) => (
                <div key={item.id} className={`pl-3 border-l-4 ${item.type === 'Escalated' ? 'border-orange-400' : 'border-[#0E8F79]'}`}>
                  <div className="flex justify-between items-start"><span className="text-xs font-bold text-gray-900 dark:text-white">{item.ticketId}</span><span className="text-[10px] text-gray-500 dark:text-gray-400">{item.time}</span></div>
                  <div className="flex items-center gap-2 mt-1"><span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.type === 'Escalated' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' : 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'}`}>{item.type}</span><span className="text-xs text-gray-600 dark:text-gray-400">to {item.to}</span></div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">&ldquo;{item.reason}&rdquo;</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
}
