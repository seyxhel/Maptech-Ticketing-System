import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { GreenButton } from '../../components/ui/GreenButton';
import {
  ArrowUpRight,
  Share2,
  History,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchTickets,
  escalateTicket,
  escalateExternal,
  fetchEscalationLogs,
  type BackendTicket,
  type EscalationLog,
} from '../../services/api';
import { validateReason, MAX_REASON } from '../../utils/validation';

const ESCALABLE_STATUSES = ['open', 'in_progress'];
const ITEMS_PER_PAGE = 4;

type EscalationType = 'internal' | 'external';

export default function EmployeeEscalation() {
  /* ── Data ── */
  const [tickets, setTickets] = useState<BackendTicket[]>([]);
  const [logs, setLogs] = useState<EscalationLog[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  /* ── Form ── */
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [escalationType, setEscalationType] = useState<EscalationType>('internal');
  const [escalateTo, setEscalateTo] = useState('');
  const [notes, setNotes] = useState('');
  const [notesError, setNotesError] = useState('');
  const [escalateToError, setEscalateToError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ── Pagination ── */
  const [currentPage, setCurrentPage] = useState(1);

  const escalableTickets = tickets.filter((t) =>
    ESCALABLE_STATUSES.includes(t.status)
  );

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [fetchedTickets, fetchedLogs] = await Promise.all([
        fetchTickets(),
        fetchEscalationLogs(),
      ]);
      setTickets(fetchedTickets);
      setLogs(fetchedLogs);
      // Default to first escalable ticket
      if (fetchedTickets.length > 0) {
        const first = fetchedTickets.find((t) => ESCALABLE_STATUSES.includes(t.status));
        if (first) setSelectedId(first.id);
      }
    } catch {
      toast.error('Failed to load tickets or escalation history.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async () => {
    let hasError = false;

    const notesErr = validateReason(notes, 'Notes / Reason');
    if (notesErr) { setNotesError(notesErr); hasError = true; }

    if (escalationType === 'external' && !escalateTo.trim()) {
      setEscalateToError('Distributors / vendor name is required.');
      hasError = true;
    }

    if (!selectedId) { toast.error('Please select a ticket.'); return; }
    if (hasError) return;

    setSubmitting(true);
    try {
      if (escalationType === 'internal') {
        await escalateTicket(selectedId as number, { notes });
        toast.success('Ticket escalated internally. A supervisor will reassign it.');
      } else {
        await escalateExternal(selectedId as number, {
          external_escalated_to: escalateTo.trim(),
          external_escalation_notes: notes,
        });
        toast.success(`Ticket escalated externally to "${escalateTo.trim()}".`);
      }
      setNotes('');
      setEscalateTo('');
      setNotesError('');
      setEscalateToError('');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit escalation.');
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ticket Escalation</h1>
          <p className="text-gray-500 dark:text-gray-400">Escalate tickets that need higher-level attention</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Escalation Form ── */}
          <Card className="border-t-4 border-t-orange-500">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Escalation Module</h3>

            {escalableTickets.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No tickets to escalate</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You have no open or in-progress tickets at this time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Ticket select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Ticket
                  </label>
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    {escalableTickets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.stf_no} — {t.contact_person || t.client || 'Ticket'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Escalation type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Escalation Type
                  </label>
                  <div className="flex flex-col gap-2">
                    {[
                      {
                        key: 'internal' as const,
                        label: 'Internal — Escalate to Supervisor',
                        icon: ArrowUpRight,
                        active: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300',
                      },
                      {
                        key: 'external' as const,
                        label: 'External — Cascade to Distributor / Vendor',
                        icon: Share2,
                        active: 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300',
                      },
                    ].map(({ key, label, icon: Icon, active }) => (
                      <button
                        key={key}
                        onClick={() => setEscalationType(key)}
                        className={`flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          escalationType === key
                            ? active
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* External: escalate-to field */}
                {escalationType === 'external' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Distributor / Vendor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={escalateTo}
                      onChange={(e) => { setEscalateTo(e.target.value); if (e.target.value.trim()) setEscalateToError(''); }}
                      placeholder="e.g. Dell Philippines, Cisco Support"
                      className={`w-full px-3 py-2 border ${escalateToError ? 'border-red-400 ring-2 ring-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400`}
                    />
                    {escalateToError && <p className="text-red-500 text-xs mt-1">{escalateToError}</p>}
                  </div>
                )}

                {/* Notes / reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes / Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value); if (e.target.value.trim()) setNotesError(''); }}
                    rows={3}
                    maxLength={MAX_REASON}
                    className={`w-full px-3 py-2 border ${notesError ? 'border-red-400 ring-2 ring-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none resize-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400`}
                    placeholder="Explain why this ticket needs escalation…"
                  />
                  {notesError && <p className="text-red-500 text-xs mt-1">{notesError}</p>}
                  <p className="text-xs text-gray-400 text-right mt-0.5">{notes.length}/{MAX_REASON}</p>
                </div>

                <GreenButton onClick={handleSubmit} disabled={submitting} fullWidth>
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  ) : (
                    'Submit Escalation'
                  )}
                </GreenButton>
              </div>
            )}
          </Card>

          {/* ── Escalation History ── */}
          <Card className="lg:col-span-2">
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
        </div>
      )}
    </div>
  );
}
