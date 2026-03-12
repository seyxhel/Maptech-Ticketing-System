import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { GreenButton } from '../../components/ui/GreenButton';
import {
  ArrowUpRight,
  Share2,
  History,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  RefreshCw,
  User,
  AlertTriangle,
  Play,
  Eye,
  XCircle,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchTickets,
  fetchEmployees,
  assignTicket,
  updateTicket,
  fetchEscalationLogs,
  type BackendTicket,
  type EscalationLog,
} from '../../services/api';

const ITEMS_PER_PAGE = 4;
type FilterType = 'All' | 'Internal' | 'External';

function userName(u: { first_name: string; last_name: string; username: string } | null): string {
  if (!u) return 'Unknown';
  return `${u.first_name} ${u.last_name}`.trim() || u.username;
}

export default function AdminEscalation() {
  const [escalatedTickets, setEscalatedTickets] = useState<BackendTicket[]>([]);
  const [logs, setLogs] = useState<EscalationLog[]>([]);
  const [ticketMap, setTicketMap] = useState<Record<number, string>>({});
  const [employees, setEmployees] = useState<{ id: number; first_name: string; last_name: string; username: string; active_ticket_count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [processingAction, setProcessingAction] = useState<{ ticketId: number; action: string } | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Record<number, string>>({});
  const [filterType, setFilterType] = useState<FilterType>('All');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tickets, emps, escalationLogs] = await Promise.all([
        fetchTickets(),
        fetchEmployees().catch(() => []),
        fetchEscalationLogs(),
      ]);
      const escalated = tickets.filter((t) => t.status === 'escalated' || t.status === 'escalated_external');
      setEscalatedTickets(escalated);
      setEmployees(emps);
      setLogs(escalationLogs);
      const map: Record<number, string> = {};
      tickets.forEach((t) => { map[t.id] = t.stf_no; });
      setTicketMap(map);
    } catch {
      toast.error('Failed to load escalation data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAssign = async (ticketId: number) => {
    const empId = selectedEmployee[ticketId];
    if (!empId) { toast.error('Please select an employee to assign.'); return; }
    setAssigningId(ticketId);
    try {
      await assignTicket(ticketId, Number(empId));
      toast.success('Ticket reassigned successfully.');
      // Remove from escalated list
      setEscalatedTickets((prev) => prev.filter((t) => t.id !== ticketId));
      await loadData();
    } catch {
      toast.error('Failed to reassign ticket.');
    } finally {
      setAssigningId(null);
    }
  };

  const handleStatusChange = async (ticketId: number, newStatus: string, label: string) => {
    setProcessingAction({ ticketId, action: newStatus });
    try {
      await updateTicket(ticketId, { status: newStatus } as Partial<BackendTicket>);
      toast.success(`Ticket ${label} successfully.`);
      setEscalatedTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } catch {
      toast.error(`Failed to set ticket as ${label}.`);
    } finally {
      setProcessingAction(null);
    }
  };

  const filtered = logs.filter((item) => {
    if (filterType === 'Internal') return item.escalation_type === 'internal';
    if (filterType === 'External') return item.escalation_type === 'external';
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ticket Escalation</h1>
          <p className="text-gray-500 dark:text-gray-400">Handle internally escalated tickets and view escalation history</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* ── Escalation History ── */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">Escalation History</h3>
          </div>
          <div className="flex items-center gap-2">
            {(['All', 'Internal', 'External'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => { setFilterType(f); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  filterType === f
                    ? f === 'Internal'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : f === 'External'
                      ? 'bg-purple-500 text-white border-purple-500'
                      : 'bg-[#3BC25B] text-white border-[#3BC25B]'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {f}
              </button>
            ))}
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{filtered.length} total</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#3BC25B]"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {paged.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center flex flex-col items-center gap-3">
                <History className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No escalations yet.</p>
              </div>
            ) : (
              paged.map((item) => {
                const isInternal = item.escalation_type === 'internal';
                const stfNo = ticketMap[item.ticket] || `Ticket #${item.ticket}`;
                const toLabel = isInternal
                  ? (item.to_user ? userName(item.to_user) : 'Supervisor')
                  : (item.to_external || 'External Party');
                return (
                  <div key={item.id} className={`p-4 rounded-lg border ${isInternal ? 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10' : 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{stfNo}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${isInternal ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'}`}>
                            {isInternal ? <ArrowUpRight className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                            {isInternal ? 'Internal' : 'External'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 mb-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium">From:</span> {userName(item.from_user)}
                          <span className="mx-1 text-gray-300">→</span>
                          <span className="font-medium">To:</span> {toLabel}
                        </div>
                        {item.notes && <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.notes}</div>}
                        <div className="text-xs text-gray-400 dark:text-gray-500">{new Date(item.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center gap-1 mt-4">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#3BC25B] hover:text-white text-gray-600 dark:text-gray-400 disabled:opacity-40 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-[#3BC25B] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#3BC25B] hover:text-white text-gray-600 dark:text-gray-400 disabled:opacity-40 transition-colors"><ChevronRightIcon className="w-4 h-4" /></button>
          </div>
        )}
      </Card>
    </div>
  );
}

