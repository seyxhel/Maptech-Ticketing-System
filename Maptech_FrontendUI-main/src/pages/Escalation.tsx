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
} from 'lucide-react';
import { toast } from 'sonner';

function makeSTF(n: number) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `STF-MT-${date}${String(100000 + n).slice(1)}`;
}

const MOCK_ESCALATIONS = [
  { id: 1, ticketId: makeSTF(4), type: 'Escalated' as const, to: 'Senior Network Engineer', reason: 'Complex network configuration requiring advanced Cisco CCNP-level diagnostics', time: '2h ago', status: 'pending' as const },
  { id: 2, ticketId: makeSTF(2), type: 'Cascaded' as const, to: 'Cisco Support (Principal)', reason: 'Hardware failure confirmed, warranty claim needed for switch replacement', time: '5h ago', status: 'in-progress' as const },
  { id: 3, ticketId: makeSTF(8), type: 'Cascaded' as const, to: 'Local Distributor (CompuTrader)', reason: 'VPN appliance part replacement via warranty', time: '1d ago', status: 'resolved' as const },
  { id: 4, ticketId: makeSTF(1), type: 'Escalated' as const, to: 'IT Director', reason: 'System-wide outage affecting entire North Wing — executive attention required', time: '3h ago', status: 'pending' as const },
  { id: 5, ticketId: makeSTF(7), type: 'Cascaded' as const, to: 'Microsoft Support (Principal)', reason: 'Exchange Online gateway issue traced to Microsoft service health', time: '6h ago', status: 'in-progress' as const },
  { id: 6, ticketId: makeSTF(10), type: 'Escalated' as const, to: 'Database Administrator', reason: 'Migration requires DBA expertise for schema changes', time: '8h ago', status: 'resolved' as const },
  { id: 7, ticketId: makeSTF(6), type: 'Cascaded' as const, to: 'Dell Support (Principal)', reason: 'Server hardware failure under ProSupport warranty', time: '1d ago', status: 'pending' as const },
];

const ITEMS_PER_PAGE = 4;

export function Escalation() {
  const [escalationType, setEscalationType] = useState<'Higher' | 'Distributor' | 'Principal'>('Higher');
  const [escalationReason, setEscalationReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(MOCK_ESCALATIONS.length / ITEMS_PER_PAGE));
  const paged = MOCK_ESCALATIONS.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleEscalate = () => {
    if (!escalationReason) { toast.error('Please provide a reason for escalation'); return; }
    toast.success('Ticket escalated successfully');
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Escalation Module */}
        <Card className="border-t-4 border-t-orange-500">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Escalation Module</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Ticket</label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm">
                <option>{makeSTF(1)} - System outage...</option>
                <option>{makeSTF(4)} - Network latency...</option>
                <option>{makeSTF(7)} - Email gateway...</option>
                <option>{makeSTF(10)} - Database migration...</option>
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

        {/* Escalation History */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">Escalation History</h3>
          </div>
          <div className="space-y-4">
            {paged.map((item) => (
              <div key={item.id} className={`p-4 rounded-lg border ${item.type === 'Escalated' ? 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10' : 'border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/10'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{item.ticketId}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.type === 'Escalated' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' : 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'}`}>{item.type}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">To: <span className="font-medium text-gray-800 dark:text-gray-200">{item.to}</span></p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">&ldquo;{item.reason}&rdquo;</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-400">{item.time}</span>
                    <div className="flex items-center gap-1">
                      {statusIcon(item.status)}
                      <span className="text-xs text-gray-600 dark:text-gray-400">{statusLabel(item.status)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, MOCK_ESCALATIONS.length)} of {MOCK_ESCALATIONS.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#3BC25B] hover:text-white dark:hover:bg-[#3BC25B] text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-[#3BC25B] text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#3BC25B] hover:text-white dark:hover:bg-[#3BC25B] text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-colors"><ChevronRightIcon className="w-4 h-4" /></button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
