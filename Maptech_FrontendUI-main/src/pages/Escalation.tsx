import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { GreenButton } from '../components/ui/GreenButton';
import {
  ArrowUpRight,
  Share2,
  Building2,
  History,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Search,
  Loader2,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  Ticket,
} from 'lucide-react';
import { toast } from 'sonner';
import { validateReason, MAX_REASON } from '../utils/validation';
import { fetchTicketByStf, type BackendTicket } from '../services/api';

const ITEMS_PER_PAGE = 4;

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  in_progress: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  escalated: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  escalated_external: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  pending_closure: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  closed: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  for_observation: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  unresolved: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-xs text-gray-500 dark:text-gray-400 block">{label}</span>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{value}</span>
      </div>
    </div>
  );
}

export function Escalation() {
  const [escalationType, setEscalationType] = useState<'Higher' | 'Distributor' | 'Principal'>('Higher');
  const [escalationReason, setEscalationReason] = useState('');
  const [selectedTicket, setSelectedTicket] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [reasonError, setReasonError] = useState('');

  // Ticket search
  const [searching, setSearching] = useState(false);
  const [foundTicket, setFoundTicket] = useState<BackendTicket | null>(null);
  const [searchError, setSearchError] = useState('');

  const totalPages = Math.max(1, Math.ceil(escalations.length / ITEMS_PER_PAGE));
  const paged = escalations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toLabel: Record<string, string> = {
    Higher: 'IT Director / Senior Engineer',
    Distributor: 'Local Distributor',
    Principal: 'Principal Vendor',
  };

  const handleSearch = async () => {
    const stf = selectedTicket.trim();
    if (!stf) { setSearchError('Please enter a Ticket STF No.'); return; }
    setSearchError('');
    setSearching(true);
    setFoundTicket(null);
    try {
      const ticket = await fetchTicketByStf(stf);
      if (!ticket) {
        setSearchError('No ticket found with that STF number.');
      } else {
        setFoundTicket(ticket);
      }
    } catch {
      setSearchError('Failed to fetch ticket. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleEscalate = () => {
    const err = validateReason(escalationReason, 'Escalation reason');
    if (err) { setReasonError(err); toast.error(err); return; }
    if (!selectedTicket.trim()) { toast.error('Please enter a Ticket STF No.'); return; }
    setReasonError('');
    const newEntry = {
      id: Date.now(),
      ticketId: selectedTicket,
      type: (escalationType === 'Higher' ? 'Escalated' : 'Cascaded') as 'Escalated' | 'Cascaded',
      to: toLabel[escalationType],
      reason: escalationReason.trim(),
      time: 'just now',
      status: 'pending' as const,
    };
    setEscalations((prev) => [newEntry, ...prev]);
    setCurrentPage(1);
    toast.success(`Ticket ${selectedTicket} escalated successfully`);
    setEscalationReason('');
  };

  const statusIcon = (s: string) => {
    if (s === 'pending') return <Clock className="w-4 h-4 text-yellow-500" />;
    if (s === 'in-progress') return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  };
  const statusLabel = (s: string) => {
    if (s === 'pending') return 'Pending';
    if (s === 'in-progress') return 'In Progress';
    return 'Resolved';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Escalation Management</h1>
        <p className="text-gray-500 dark:text-gray-400">Escalate or cascade tickets to appropriate parties</p>
      </div>

      {/* Row 1: Escalation Module + Ticket to Escalate Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Escalation Module */}
        <Card className="border-t-4 border-t-orange-500">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Escalation Module</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ticket STF No.</label>
              <input
                type="text"
                value={selectedTicket}
                onChange={(e) => {
                  setSelectedTicket(e.target.value.toUpperCase());
                  setSearchError('');
                  if (!e.target.value.trim()) setFoundTicket(null);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="e.g. STF-MT-20260305000001"
                className={`w-full px-3 py-2 border ${searchError ? 'border-red-400 ring-2 ring-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm`}
              />
              {searchError && <p className="text-red-500 text-xs mt-1">{searchError}</p>}
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {searching ? 'Searching…' : 'Search Ticket'}
              </button>
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
              <textarea value={escalationReason} onChange={(e) => { setEscalationReason(e.target.value); if (e.target.value.trim()) setReasonError(''); }} rows={3} maxLength={MAX_REASON} className={`w-full px-3 py-2 border ${reasonError ? 'border-red-400 ring-2 ring-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none resize-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`} placeholder="Explain why this ticket needs escalation..." />
              {reasonError && <p className="text-red-500 text-xs mt-1">{reasonError}</p>}
              <p className="text-xs text-gray-400 text-right mt-0.5">{escalationReason.length}/{MAX_REASON}</p>
            </div>
            <GreenButton onClick={handleEscalate} fullWidth>Submit Escalation</GreenButton>
          </div>
        </Card>

        {/* Ticket to Escalate Details */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">Ticket to Escalate Details</h3>
          </div>

          {!foundTicket ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center flex flex-col items-center gap-3">
              <Ticket className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No ticket loaded</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Enter a Ticket STF No. and click <strong>Search Ticket</strong> to view its details here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{foundTicket.stf_no}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase ${STATUS_COLORS[foundTicket.status] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {foundTicket.status.replace(/_/g, ' ')}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase ${PRIORITY_COLORS[foundTicket.priority] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {foundTicket.priority}
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div>
                  <DetailRow icon={User} label="Client" value={foundTicket.client} />
                  <DetailRow icon={User} label="Contact Person" value={foundTicket.contact_person} />
                  <DetailRow icon={Tag} label="Designation" value={foundTicket.designation} />
                  <DetailRow icon={User} label="Department / Organization" value={foundTicket.department_organization} />
                  <DetailRow icon={Phone} label="Mobile No." value={foundTicket.mobile_no} />
                  <DetailRow icon={Phone} label="Landline" value={foundTicket.landline} />
                  <DetailRow icon={Mail} label="Email" value={foundTicket.email_address} />
                  <DetailRow icon={MapPin} label="Address" value={foundTicket.address} />
                </div>
                <div>
                  <DetailRow
                    icon={Tag}
                    label="Type of Service"
                    value={foundTicket.type_of_service_detail?.name ?? foundTicket.type_of_service_others ?? null}
                  />
                  <DetailRow icon={Tag} label="Support Type" value={foundTicket.preferred_support_type?.replace(/_/g, ' ')} />
                  <DetailRow
                    icon={User}
                    label="Assigned To"
                    value={
                      foundTicket.assigned_to
                        ? `${foundTicket.assigned_to.first_name} ${foundTicket.assigned_to.last_name}`.trim() || foundTicket.assigned_to.username
                        : 'Unassigned'
                    }
                  />
                  <DetailRow icon={Tag} label="Date Created" value={foundTicket.date} />
                  <DetailRow icon={Tag} label="Time In" value={foundTicket.time_in ?? null} />
                  {foundTicket.external_escalated_to && (
                    <DetailRow icon={Share2} label="Escalated To (External)" value={foundTicket.external_escalated_to} />
                  )}
                </div>
              </div>

              {/* Description */}
              {foundTicket.description_of_problem && (
                <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Description of Problem</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{foundTicket.description_of_problem}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Row 2: Escalation History (full width) */}
      <Card>
        <div className="flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="font-bold text-gray-900 dark:text-white">Escalation History</h3>
        </div>
        <div className="space-y-4">
          {paged.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No escalation history.</p>
            </div>
          ) : (
            paged.map((item) => (
              <div key={item.id} className={`p-4 rounded-lg border ${item.type === 'Escalated' ? 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10' : 'border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/10'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{item.ticketId}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.type === 'Escalated' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' : 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'}`}>{item.type}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-1 font-medium">To: {item.to}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{item.reason}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.time}</div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-100">{statusLabel(item.status)}</div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">{statusIcon(item.status)}</div>
                </div>
              </div>
            ))
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1 mt-4">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#3BC25B] hover:text-white dark:hover:bg-[#3BC25B] text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-[#3BC25B] text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#3BC25B] hover:text-white dark:hover:bg-[#3BC25B] text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-colors"><ChevronRightIcon className="w-4 h-4" /></button>
          </div>
        )}
      </Card>
    </div>
  );
}
