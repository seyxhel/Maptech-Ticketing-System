import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { SLATimer } from '../components/ui/SLATimer';
import { Eye } from 'lucide-react';
import { fetchTickets } from '../services/api';
import { mapBackendTicketToEmployee } from '../services/ticketMapper';
import type { UIEmployeeTicket } from '../services/ticketMapper';

/** Returns an array of page numbers and 'ellipsis' markers for smart pagination. */
function getPaginationPages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const siblings = 1;
  const left = Math.max(2, current - siblings);
  const right = Math.min(total - 1, current + siblings);
  const pages: (number | 'ellipsis')[] = [1];
  if (left > 2) pages.push('ellipsis');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

export function EmployeeMyTickets() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tickets, setTickets] = useState<UIEmployeeTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tickets from backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await fetchTickets();
        if (cancelled) return;
        setTickets(raw.map(mapBackendTicketToEmployee));
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || t.id.toLowerCase().includes(q) || t.issue.toLowerCase().includes(q);
      const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, filterStatus, tickets]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pageTickets = useMemo(() => {
    const page = Math.min(Math.max(1, currentPage), totalPages);
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize, totalPages]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3BC25B]"></div>
          <span className="ml-3 text-gray-500">Loading tickets...</span>
        </div>
      ) : (
      <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assigned Tickets</h1>
          <p className="text-gray-500 dark:text-gray-400">Tickets assigned to you</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-72">
            <input
              placeholder="Search ticket id or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-40 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Assigned">Assigned</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>
      <Card accent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">SLA</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pageTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900 dark:text-white">{ticket.id}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{ticket.issue}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{ticket.client}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                  <td className="px-4 py-3">
                    {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                      <SLATimer hoursRemaining={ticket.sla} totalHours={ticket.total} />
                    )}
                    {ticket.status === 'Resolved' && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Resolved</span>
                    )}
                    {ticket.status === 'Closed' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">✓ Closed</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      aria-label={`View ${ticket.id}`}
                      onClick={() => navigate(`/employee/ticket-details?stf=${encodeURIComponent(ticket.id)}`)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full text-[#63D44A] dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {total === 0 ? 'No results' : `Showing ${Math.min(total, (currentPage - 1) * pageSize + 1)}–${Math.min(total, currentPage * pageSize)} of ${total}`}
          </div>
          {total > 5 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Per page</label>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {[5, 10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={`px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm ${currentPage <= 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >Prev</button>
            {getPaginationPages(currentPage, totalPages).map((p, idx) =>
              p === 'ellipsis' ? (
                <span key={`e-${idx}`} className="px-1.5 text-gray-400 select-none">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-9 h-9 flex items-center justify-center rounded-md text-sm transition-colors ${currentPage === p ? 'bg-[#0E8F79] text-white font-bold shadow-md' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >{p}</button>
              )
            )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={`px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm ${currentPage >= totalPages ? 'opacity-40 cursor-not-allowed' : ''}`}
            >Next</button>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
