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
  Filter,
  MoreHorizontal,
  ArrowUpRight,
  Share2,
  Building2,
  History,
  X,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchTickets,
  fetchTicketStats,
  fetchEscalationLogs,
  deleteTicket as apiDeleteTicket,
  updateTicket as apiUpdateTicket,
  escalateExternal,
} from '../services/api';
import type { BackendTicket, TicketStats } from '../services/api';
import { mapBackendTicketToUI, reverseMapStatus, reverseMapPriority } from '../services/ticketMapper';
import type { UITicket } from '../services/ticketMapper';

const ITEMS_PER_PAGE = 5;
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['New', 'Assigned', 'In Progress', 'Escalated', 'Resolved', 'Closed', 'Pending'];

export function AdminDashboard() {
  const navigate = useNavigate();
  const [escalationType, setEscalationType] = useState<'Higher' | 'Distributor' | 'Principal'>('Higher');
  const [escalationReason, setEscalationReason] = useState('');
  const [selectedEscalationTicket, setSelectedEscalationTicket] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<UITicket[]>([]);
  const [backendTickets, setBackendTickets] = useState<BackendTicket[]>([]);
  const [editTicket, setEditTicket] = useState<UITicket | null>(null);
  const [editFields, setEditFields] = useState({ status: '', priority: '', assignee: '' });
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

  // Close open menu when clicking anywhere outside
  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const openEdit = (ticket: UITicket) => {
    setEditTicket(ticket);
    setEditFields({ status: ticket.status, priority: ticket.priority, assignee: ticket.assignee || '' });
    setOpenMenuId(null);
  };

  const saveEdit = async () => {
    if (!editTicket) return;
    try {
      await apiUpdateTicket(editTicket.backendId, {
        status: reverseMapStatus(editFields.status),
        priority: reverseMapPriority(editFields.priority),
      } as any);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === editTicket.id
            ? { ...t, status: editFields.status, priority: editFields.priority as UITicket['priority'], assignee: editFields.assignee || null }
            : t
        )
      );
      toast.success(`Ticket ${editTicket.id} updated.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update ticket.');
    }
    setEditTicket(null);
  };

  const deleteTicket = async (id: string) => {
    const bt = backendTickets.find((t) => t.stf_no === id);
    if (!bt) return;
    try {
      await apiDeleteTicket(bt.id);
      setTickets((prev) => prev.filter((t) => t.id !== id));
      toast.success(`Ticket ${id} deleted.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete ticket.');
    }
    setOpenMenuId(null);
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterPriority.length > 0 && !filterPriority.includes(t.priority)) return false;
    if (filterStatus.length > 0 && !filterStatus.includes(t.status)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (!t.id.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q) && !t.client.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ITEMS_PER_PAGE));
  const pagedTickets = filteredTickets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const toggleFilter = (arr: string[], val: string) => arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const handleEscalate = async () => {
    if (!escalationReason) { toast.error('Please provide a reason for escalation'); return; }
    const bt = backendTickets.find((t) => t.stf_no === selectedEscalationTicket);
    if (!bt) { toast.error('Ticket not found'); return; }
    try {
      const targetName = escalationType === 'Distributor' ? 'Distributor' : escalationType === 'Principal' ? 'Principal' : 'Higher Position';
      await escalateExternal(bt.id, { external_escalated_to: targetName, external_escalation_notes: escalationReason } as any);
      toast.success(`Ticket ${selectedEscalationTicket} escalated successfully`);
      setEscalationReason('');
    } catch (err: any) {
      toast.error(err?.message || 'Escalation failed');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Console</h1>
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
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Search tickets..." className="w-full pl-4 pr-10 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]" />
              </div>
              <button onClick={() => setShowFilter(true)} className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Ticket Details</th>
                  <th className="px-6 py-4 font-semibold">Client</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">SLA Timer</th>
                  <th className="px-6 py-4 font-semibold">Assignee</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {pagedTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 dark:text-white text-xs block mb-1">{ticket.id}</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{ticket.subject}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{ticket.client}</td>
                    <td className="px-6 py-4"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="px-6 py-4"><StatusBadge status={ticket.status} /></td>
                    <td className="px-6 py-4">
                      {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && <SLATimer hoursRemaining={ticket.sla} totalHours={ticket.totalSla} />}
                    </td>
                    <td className="px-6 py-4">
                      {ticket.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300">{ticket.assignee.charAt(0)}</div>
                          <span className="text-gray-600 dark:text-gray-400">{ticket.assignee}</span>
                        </div>
                      ) : (
                        <button className="text-xs font-medium text-[#0E8F79] dark:text-green-400 hover:underline">+ Assign Agent</button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === ticket.id ? null : ticket.id); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      {openMenuId === ticket.id && (
                        <div onClick={(e) => e.stopPropagation()} className="absolute right-6 top-12 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[140px]">
                          <button onClick={() => { setOpenMenuId(null); navigate(`/admin/ticket-details?stf=${ticket.id}`); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"><Eye className="w-4 h-4" /> View</button>
                          <button onClick={() => openEdit(ticket)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"><Pencil className="w-4 h-4" /> Edit</button>
                          <button onClick={() => deleteTicket(ticket.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /> Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredTickets.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredTickets.length)} of {filteredTickets.length} tickets</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#3BC25B] hover:text-white dark:hover:bg-[#3BC25B] text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-[#3BC25B] text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#3BC25B] hover:text-white dark:hover:bg-[#3BC25B] text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-colors"><ChevronRightIcon className="w-4 h-4" /></button>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border-t-4 border-t-orange-500">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Escalation Module</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Ticket</label>
                <select value={selectedEscalationTicket} onChange={(e) => setSelectedEscalationTicket(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm">
                  {tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').map(t => (
                    <option key={t.id} value={t.id}>{t.id} — {t.subject.slice(0, 28)}{t.subject.length > 28 ? '…' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Escalation Type</label>
                <div className="flex flex-col gap-2">
                  {[
                    { key: 'Higher' as const, label: 'Escalate to Higher Position', icon: ArrowUpRight, active: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300' },
                    { key: 'Distributor' as const, label: 'Cascade to Distributor', icon: Share2, active: 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300' },
                    { key: 'Principal' as const, label: 'Cascade to Principal', icon: Building2, active: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-[#0E8F79] dark:text-green-400' },
                  ].map(({ key, label, icon: Icon, active }) => (
                    <button key={key} onClick={() => setEscalationType(key)} className={`flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-all ${escalationType === key ? active : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'}`}><Icon className="w-4 h-4 mr-2" />{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason <span className="text-red-500">*</span></label>
                <textarea value={escalationReason} onChange={(e) => setEscalationReason(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none resize-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="Explain why this ticket needs escalation..." />
              </div>
              <GreenButton onClick={handleEscalate} fullWidth>Submit Escalation</GreenButton>
            </div>
          </Card>
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

      {/* Edit Ticket Modal */}
      {editTicket && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditTicket(null)}>
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
                <input value={editFields.assignee} onChange={(e) => setEditFields((p) => ({ ...p, assignee: e.target.value }))} placeholder="e.g. John D." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#3BC25B] outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditTicket(null)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={saveEdit} className="flex-1 px-4 py-2 bg-[#3BC25B] hover:bg-[#2ea34a] text-white text-sm font-medium rounded-lg transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilter && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowFilter(false)}>
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
              <button onClick={() => { setCurrentPage(1); setShowFilter(false); }} className="flex-1 px-4 py-2 rounded-lg bg-[#3BC25B] hover:bg-[#2ea34a] text-white text-sm font-medium">Apply Filters</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
