import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import {
  History,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchTickets,
  fetchEscalationLogs,
  type BackendTicket,
  type EscalationLog,
} from '../../services/api';

const ITEMS_PER_PAGE = 4;

export default function TechnicalStaffEscalation() {
  /* ── Data ── */
  const [tickets, setTickets] = useState<BackendTicket[]>([]);
  const [logs, setLogs] = useState<EscalationLog[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  /* ── Pagination ── */
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [fetchedTickets, fetchedLogs] = await Promise.all([
        fetchTickets(),
        fetchEscalationLogs(),
      ]);
      setTickets(fetchedTickets);
      setLogs(fetchedLogs);
    } catch {
      toast.error('Failed to load tickets or escalation history.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── History pagination ── */
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / ITEMS_PER_PAGE));
  const pagedLogs = sortedLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /* ── Helpers ── */
  const getStfNo = (ticketId: number) =>
    tickets.find((t) => t.id === ticketId)?.stf_no ?? `#${ticketId}`;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  };

  const typeLabel = (log: EscalationLog) =>
    log.escalation_type === 'internal' ? 'Internal' : 'External';

  const toLabel = (log: EscalationLog) =>
    log.to_external || (log.to_user ? `User #${log.to_user}` : 'Supervisor');

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ticket Escalation</h1>
            <p className="text-gray-500 dark:text-gray-400">Escalation history for your tickets</p>
          </div>
          <button
            onClick={loadData}
            disabled={loadingData}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#3BC25B]" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading…</span>
          </div>
        ) : (
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">Escalation History</h3>
              <span className="ml-auto text-xs text-gray-400">{logs.length} total</span>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No escalations yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {pagedLogs.map((log) => {
                    const isInternal = log.escalation_type === 'internal';
                    return (
                      <div
                        key={log.id}
                        className={`p-4 rounded-lg border ${
                          isInternal
                              ? 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10'
                              : 'border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  {getStfNo(log.ticket)}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                    isInternal
                                      ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                                      : 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
                                  }`}
                                >
                                  {typeLabel(log)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                To: <span className="font-medium text-gray-800 dark:text-gray-200">{toLabel(log)}</span>
                              </p>
                              {log.notes && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                  &ldquo;{log.notes}&rdquo;
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {formatDate(log.created_at)}
                              </span>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                {isInternal ? (
                                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-teal-500" />
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {isInternal ? 'Pending reassignment' : 'Externally escalated'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
        </div>
    </>
  );
}
