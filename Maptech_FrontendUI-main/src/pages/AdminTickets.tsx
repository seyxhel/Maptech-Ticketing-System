import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { SLATimer } from '../components/ui/SLATimer';
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

function makeSTF(n: number) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `STF-MT-${date}${String(100000 + n).slice(1)}`;
}

const ALL_TICKETS = [
  { id: makeSTF(1), subject: 'System outage in North Wing', client: 'TechCorp Inc.', priority: 'Critical' as const, status: 'New' as const, sla: 2, totalSla: 4, assignee: null as string | null, created: '2025-06-01' },
  { id: makeSTF(2), subject: 'Printer configuration error', client: 'Logistics Ltd.', priority: 'Medium' as const, status: 'Assigned' as const, sla: 18, totalSla: 24, assignee: 'John D.', created: '2025-06-01' },
  { id: makeSTF(3), subject: 'Software license renewal', client: 'Alpha Group', priority: 'Low' as const, status: 'In Progress' as const, sla: 45, totalSla: 48, assignee: 'Sarah M.', created: '2025-05-31' },
  { id: makeSTF(4), subject: 'Network latency issues', client: 'Beta Systems', priority: 'High' as const, status: 'Escalated' as const, sla: 1, totalSla: 8, assignee: 'Mike R.', created: '2025-05-31' },
  { id: makeSTF(5), subject: 'New user onboarding', client: 'Gamma Corp', priority: 'Low' as const, status: 'Resolved' as const, sla: 0, totalSla: 24, assignee: 'Jenny L.', created: '2025-05-30' },
  { id: makeSTF(6), subject: 'Server backup failure', client: 'DataFlow Ltd.', priority: 'High' as const, status: 'New' as const, sla: 3, totalSla: 8, assignee: null, created: '2025-05-30' },
  { id: makeSTF(7), subject: 'Email gateway down', client: 'CloudNine', priority: 'Critical' as const, status: 'In Progress' as const, sla: 1, totalSla: 4, assignee: 'Mike R.', created: '2025-05-29' },
  { id: makeSTF(8), subject: 'VPN connectivity issue', client: 'NovaStar', priority: 'Medium' as const, status: 'Assigned' as const, sla: 10, totalSla: 24, assignee: 'Sarah M.', created: '2025-05-29' },
  { id: makeSTF(9), subject: 'Hardware replacement', client: 'PrimeTech', priority: 'Low' as const, status: 'Pending' as const, sla: 20, totalSla: 48, assignee: null, created: '2025-05-28' },
  { id: makeSTF(10), subject: 'Database migration request', client: 'UrbanSoft', priority: 'High' as const, status: 'New' as const, sla: 5, totalSla: 12, assignee: null, created: '2025-05-28' },
  { id: makeSTF(11), subject: 'Firewall rule update', client: 'SecureNet', priority: 'Medium' as const, status: 'In Progress' as const, sla: 12, totalSla: 24, assignee: 'John D.', created: '2025-05-27' },
  { id: makeSTF(12), subject: 'Desktop setup for new hire', client: 'PixelWorks', priority: 'Low' as const, status: 'Assigned' as const, sla: 30, totalSla: 48, assignee: 'Jenny L.', created: '2025-05-27' },
];

const ITEMS_PER_PAGE = 5;
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['New', 'Assigned', 'In Progress', 'Escalated', 'Resolved', 'Pending'];

export function AdminTickets() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = ALL_TICKETS.filter((t) => {
    if (filterPriority.length > 0 && !filterPriority.includes(t.priority)) return false;
    if (filterStatus.length > 0 && !filterStatus.includes(t.status)) return false;
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase()) && !t.client.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const toggleFilter = (arr: string[], val: string) => arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tickets</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage and assign all tickets</p>
      </div>

      <Card accent>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} type="text" placeholder="Search by ticket ID, subject or client..." className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]" />
          </div>
          <button onClick={() => setShowFilter(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium">
            <Filter className="w-4 h-4" /> Filter {(filterPriority.length + filterStatus.length > 0) && <span className="bg-[#3BC25B] text-white text-xs rounded-full px-1.5">{filterPriority.length + filterStatus.length}</span>}
          </button>
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
                    {ticket.status !== 'Resolved' && <SLATimer hoursRemaining={ticket.sla} totalHours={ticket.totalSla} />}
                  </td>
                  <td className="px-6 py-4">
                    {ticket.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300">{ticket.assignee.charAt(0)}</div>
                        <span className="text-gray-600 dark:text-gray-400">{ticket.assignee}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">{ticket.created}</td>
                  <td className="px-6 py-4 text-right relative" ref={openMenuId === ticket.id ? menuRef : undefined}>
                    <button onClick={() => setOpenMenuId(openMenuId === ticket.id ? null : ticket.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><MoreHorizontal className="w-5 h-5" /></button>
                    {openMenuId === ticket.id && (
                      <div className="absolute right-6 top-12 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[140px]">
                        <button onClick={() => { setOpenMenuId(null); navigate(`/admin/ticket-details?stf=${ticket.id}`); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"><Eye className="w-4 h-4" /> View</button>
                        <button onClick={() => { setOpenMenuId(null); toast.info(`Editing ${ticket.id}`); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"><Pencil className="w-4 h-4" /> Edit</button>
                        <button onClick={() => { setOpenMenuId(null); toast.success(`Deleted ${ticket.id}`); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /> Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">Showing {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} tickets</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#3BC25B] hover:text-white dark:hover:bg-[#3BC25B] text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-[#3BC25B] text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#3BC25B] hover:text-white dark:hover:bg-[#3BC25B] text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-colors"><ChevronRightIcon className="w-4 h-4" /></button>
          </div>
        </div>
      </Card>

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
