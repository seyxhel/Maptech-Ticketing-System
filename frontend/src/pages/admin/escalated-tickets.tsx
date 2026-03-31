import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { SLATimer } from '../../components/ui/SLATimer';
import {
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  X,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchTickets } from '../../services/api';
import type { BackendTicket } from '../../services/api';
import { mapBackendTicketToUI } from '../../services/ticketMapper';
import type { UITicket } from '../../services/ticketMapper';

const ITEMS_PER_PAGE = 5;
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

export default function AdminEscalatedTickets() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [tickets, setTickets] = useState<UITicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await fetchTickets();
        const escalatedTickets = raw
          .filter((ticket: BackendTicket) => ticket.status === 'escalated' || ticket.status === 'escalated_external')
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        if (cancelled) return;
        setTickets(escalatedTickets.map(mapBackendTicketToUI));
      } catch {
        if (!cancelled) toast.error('Failed to load escalated tickets.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = tickets.filter((ticket) => {
    if (filterPriority.length > 0 && !filterPriority.includes(ticket.priority)) return false;
    if (
      search &&
      !ticket.subject.toLowerCase().includes(search.toLowerCase()) &&
      !ticket.id.toLowerCase().includes(search.toLowerCase()) &&
      !ticket.client.toLowerCase().includes(search.toLowerCase())
    ) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const toggleFilter = (arr: string[], val: string) => arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3BC25B]"></div>
        <span className="ml-3 text-gray-500">Loading escalated tickets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Escalated Tickets</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400">View all tickets currently escalated to supervisor level</p>
      </div>

      <Card accent>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} type="text" placeholder="Search by ticket ID, subject or client..." className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]" />
          </div>
          <button onClick={() => setShowFilter(true)} className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium">
            <Filter className="w-4 h-4" /> Filter {filterPriority.length > 0 && <span className="bg-[#3BC25B] text-white text-xs rounded-full px-1.5">{filterPriority.length}</span>}
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
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">No escalated tickets match your filters.</td></tr>
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

      {showFilter && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowFilter(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filter Escalated Tickets</h3>
              <button onClick={() => setShowFilter(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Priority</h4>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map((priority) => (
                    <button key={priority} onClick={() => setFilterPriority((prev) => toggleFilter(prev, priority))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filterPriority.includes(priority) ? 'bg-[#0E8F79] text-white border-[#0E8F79]' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-[#0E8F79]/50'}`}>{priority}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setFilterPriority([]); }} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Clear All</button>
              <button onClick={() => { setCurrentPage(1); setShowFilter(false); }} className="flex-1 px-4 py-2 rounded-lg bg-[#3BC25B] hover:bg-[#2ea34a] text-white text-sm font-medium">Apply Filters</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
