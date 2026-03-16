import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { SLATimer } from '../../components/ui/SLATimer';
import {
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  X,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchTickets,
  fetchEmployees,
  deleteTicket as apiDeleteTicket,
  updateTicket as apiUpdateTicket,
  assignTicket,
} from '../../services/api';
import type { BackendTicket } from '../../services/api';
import { mapBackendTicketToUI, reverseMapStatus, reverseMapPriority } from '../../services/ticketMapper';
import type { UITicket } from '../../services/ticketMapper';

const ITEMS_PER_PAGE = 5;
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['New', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Pending'];

export default function AdminTickets() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<UITicket[]>([]);
  const [backendTickets, setBackendTickets] = useState<BackendTicket[]>([]);
  const [editTicket, setEditTicket] = useState<UITicket | null>(null);
  const [editFields, setEditFields] = useState({ status: '', priority: '', assigneeId: '' });
  const [employees, setEmployees] = useState<{ id: number; first_name: string; last_name: string; username: string; active_ticket_count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tickets from backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [raw, emps] = await Promise.all([
          fetchTickets(),
          fetchEmployees().catch(() => []),
        ]);
        const visibleTickets = raw.filter((ticket) => ticket.status !== 'escalated' && ticket.status !== 'escalated_external');
        if (cancelled) return;
        setBackendTickets(visibleTickets);
        setTickets(visibleTickets.map(mapBackendTicketToUI));
        if (emps) setEmployees(emps);
      } catch (err) {
        if (!cancelled) toast.error('Failed to load tickets.');
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
    setEditFields({ status: ticket.status, priority: ticket.priority, assigneeId: ticket.assigneeId != null ? String(ticket.assigneeId) : '' });
    setOpenMenuId(null);
  };

  const saveEdit = async () => {
    if (!editTicket) return;
    try {
      const assignedToId = editFields.assigneeId ? Number(editFields.assigneeId) : null;

      // Update status & priority via PATCH
      await apiUpdateTicket(editTicket.backendId, {
        status: reverseMapStatus(editFields.status),
        priority: reverseMapPriority(editFields.priority),
      } as any);

      // Assign employee via dedicated endpoint (if changed)
      if (assignedToId && assignedToId !== editTicket.assigneeId) {
        await assignTicket(editTicket.backendId, assignedToId);
      }

      const emp = employees.find((e) => e.id === assignedToId);
      const assigneeName = emp ? `${emp.first_name} ${emp.last_name}`.trim() : null;
      setTickets((prev) =>
        prev.map((t) =>
          t.id === editTicket.id
            ? { ...t, status: editFields.status, priority: editFields.priority as UITicket['priority'], assignee: assigneeName, assigneeId: assignedToId }
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

  const filtered = tickets.filter((t) => {
    if (filterPriority.length > 0 && !filterPriority.includes(t.priority)) return false;
    if (filterStatus.length > 0 && !filterStatus.includes(t.status)) return false;
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase()) && !t.client.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const toggleFilter = (arr: string[], val: string) => arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tickets</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage and assign all tickets</p>
      </div>

      <Card accent>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} type="text" placeholder="Search by ticket ID, subject or client..." className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]" />
          </div>
          <button onClick={() => setShowFilter(true)} className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium">
            <Filter className="w-4 h-4" /> Filter {(filterPriority.length + filterStatus.length > 0) && <span className="bg-[#3BC25B] text-white text-xs rounded-full px-1.5">{filterPriority.length + filterStatus.length}</span>}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Ticket Details</th>
                <th className="px-6 py-4 font-semibold">Client</th>
                <th className="px-6 py-4 font-semibold">Priority</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">SLA Timer</th>
                <th className="px-6 py-4 font-semibold min-w-[180px]">Assignee</th>
                <th className="px-6 py-4 font-semibold">Created</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paged.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">No tickets match your filters.</td></tr>
              )}
              {paged.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900 dark:text-white text-xs block mb-1">{ticket.id}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{ticket.subject}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{ticket.client}</td>
                  <td className="px-6 py-4"><PriorityBadge priority={ticket.priority} /></td>
                  <td className="px-6 py-4"><StatusBadge status={ticket.status} /></td>
                  <td className="px-6 py-4">
                    {ticket.status === 'Resolved' || ticket.status === 'Closed' ? (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Completed</span>
                    ) : ticket.totalSla === 0 ? (
                      <span className="text-xs text-gray-400 dark:text-gray-500">No SLA</span>
                    ) : (
                      <SLATimer hoursRemaining={ticket.sla} totalHours={ticket.totalSla} status={ticket.status} />
                    )}
                  </td>
                  <td className="px-6 py-4 min-w-[180px]">
                    {ticket.assignee ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 aspect-square shrink-0 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300">{ticket.assignee.charAt(0)}</div>
                        <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">{ticket.assignee}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">{ticket.created}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => navigate(`/admin/ticket-details?stf=${ticket.id}`)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><Eye className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">Showing {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} tickets</span>
          <div className="flex items-center gap-1 flex-wrap justify-end">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#3BC25B] hover:text-white dark:hover:bg-[#3BC25B] text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-[#3BC25B] text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#3BC25B] hover:text-white dark:hover:bg-[#3BC25B] text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-colors"><ChevronRightIcon className="w-4 h-4" /></button>
          </div>
        </div>
      </Card>

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
                {editTicket && !['New', 'Assigned'].includes(editTicket.status) ? (
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
