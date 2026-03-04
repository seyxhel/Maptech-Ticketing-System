import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import {
  Search,
  Paperclip,
  FileCheck,
  Clock,
  RefreshCw,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  Image as ImageIcon,
  Film,
  File as FileIcon,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import type { KnowledgeHubAttachment, KnowledgeHubSummary } from '../services/api';
import {
  fetchKnowledgeHubAttachments,
  fetchKnowledgeHubSummary,
  deleteKnowledgeHubAttachment,
} from '../services/api';

const ITEMS_PER_PAGE = 12;

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  escalated: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  escalated_external: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  pending_closure: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
  escalated: 'Escalated',
  escalated_external: 'Ext. Escalated',
  pending_closure: 'Pending Closure',
};

function getFileExtension(url: string): string {
  const name = url.split('/').pop() || '';
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ext;
}

function isImageFile(url: string): boolean {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(getFileExtension(url));
}

function isVideoFile(url: string): boolean {
  return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(getFileExtension(url));
}

function getFileName(url: string): string {
  const name = url.split('/').pop() || 'attachment';
  return decodeURIComponent(name);
}

function FileTypeIcon({ url }: { url: string }) {
  if (isImageFile(url)) return <ImageIcon className="w-5 h-5 text-emerald-500" />;
  if (isVideoFile(url)) return <Film className="w-5 h-5 text-purple-500" />;
  const ext = getFileExtension(url);
  if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'].includes(ext))
    return <FileText className="w-5 h-5 text-blue-500" />;
  return <FileIcon className="w-5 h-5 text-gray-500" />;
}

// ── Mock data (used until real backend is wired up) ──

const MOCK_USER = (first: string, last: string, role = 'employee') => ({
  id: Math.floor(Math.random() * 1000),
  username: `${first.toLowerCase()}.${last.toLowerCase()}`,
  email: `${first.toLowerCase()}.${last.toLowerCase()}@maptech.com`,
  role,
  first_name: first,
  last_name: last,
});

const MOCK_ATTACHMENTS: KnowledgeHubAttachment[] = [
  {
    id: 1,
    file: '/ticket_attachments/2026/02/28/motherboard_burnt_capacitor.jpg',
    uploaded_by: MOCK_USER('Juan', 'Dela Cruz'),
    uploaded_at: '2026-02-28T14:32:00Z',
    is_resolution_proof: true,
    ticket_id: 101,
    stf_no: 'STF-MP-20260228000001',
    ticket_status: 'closed',
    client: 'Barangay San Isidro',
    description_of_problem: 'Desktop PC not powering on. Burnt smell coming from the motherboard area.',
    type_of_service_name: 'Hardware Repair',
    assigned_to_name: 'Juan Dela Cruz',
  },
  {
    id: 2,
    file: '/ticket_attachments/2026/02/27/network_switch_config.pdf',
    uploaded_by: MOCK_USER('Maria', 'Santos'),
    uploaded_at: '2026-02-27T10:15:00Z',
    is_resolution_proof: true,
    ticket_id: 98,
    stf_no: 'STF-MP-20260227000003',
    ticket_status: 'closed',
    client: 'DENR Region IV',
    description_of_problem: 'Network switch needs reconfiguration after office relocation.',
    type_of_service_name: 'Network Setup',
    assigned_to_name: 'Maria Santos',
  },
  {
    id: 3,
    file: '/ticket_attachments/2026/02/27/printer_error_screenshot.png',
    uploaded_by: MOCK_USER('Pedro', 'Reyes'),
    uploaded_at: '2026-02-27T08:45:00Z',
    is_resolution_proof: true,
    ticket_id: 95,
    stf_no: 'STF-MP-20260227000001',
    ticket_status: 'in_progress',
    client: 'Municipal Hall of Tanauan',
    description_of_problem: 'Printer constantly showing "Paper Jam" error even when no paper is jammed.',
    type_of_service_name: 'Printer Maintenance',
    assigned_to_name: 'Pedro Reyes',
  },
  {
    id: 4,
    file: '/ticket_attachments/2026/02/26/server_rack_wiring.jpg',
    uploaded_by: MOCK_USER('Ana', 'Garcia'),
    uploaded_at: '2026-02-26T16:20:00Z',
    is_resolution_proof: true,
    ticket_id: 90,
    stf_no: 'STF-MP-20260226000002',
    ticket_status: 'closed',
    client: 'PhilHealth Regional Office',
    description_of_problem: 'Server rack cabling is disorganized causing intermittent connectivity issues.',
    type_of_service_name: 'Server Maintenance',
    assigned_to_name: 'Ana Garcia',
  },
  {
    id: 5,
    file: '/ticket_attachments/2026/02/26/bsod_dump_analysis.docx',
    uploaded_by: MOCK_USER('Carlos', 'Mendoza'),
    uploaded_at: '2026-02-26T11:05:00Z',
    is_resolution_proof: true,
    ticket_id: 88,
    stf_no: 'STF-MP-20260226000001',
    ticket_status: 'pending_closure',
    client: 'DepEd Division of Batangas',
    description_of_problem: 'Multiple workstations experiencing BSOD with KERNEL_DATA_INPAGE_ERROR stop code.',
    type_of_service_name: 'Software Troubleshooting',
    assigned_to_name: 'Carlos Mendoza',
  },
  {
    id: 6,
    file: '/ticket_attachments/2026/02/25/cctv_installation_proof.mp4',
    uploaded_by: MOCK_USER('Rico', 'Bautista'),
    uploaded_at: '2026-02-25T09:30:00Z',
    is_resolution_proof: true,
    ticket_id: 85,
    stf_no: 'STF-MP-20260225000004',
    ticket_status: 'closed',
    client: 'Lipa City Hall',
    description_of_problem: 'Request for CCTV installation in the new annex building, 8 cameras total.',
    type_of_service_name: 'CCTV Installation',
    assigned_to_name: 'Rico Bautista',
  },
  {
    id: 7,
    file: '/ticket_attachments/2026/02/25/firewall_rules_export.xlsx',
    uploaded_by: MOCK_USER('Liza', 'Aquino'),
    uploaded_at: '2026-02-25T07:55:00Z',
    is_resolution_proof: true,
    ticket_id: 83,
    stf_no: 'STF-MP-20260225000002',
    ticket_status: 'escalated',
    client: 'PNP Provincial Office',
    description_of_problem: 'Firewall showing unusual traffic patterns. Possible intrusion attempt detected.',
    type_of_service_name: 'Network Security',
    assigned_to_name: 'Liza Aquino',
  },
  {
    id: 8,
    file: '/ticket_attachments/2026/02/24/ups_replacement_receipt.pdf',
    uploaded_by: MOCK_USER('Mark', 'Villanueva'),
    uploaded_at: '2026-02-24T15:10:00Z',
    is_resolution_proof: true,
    ticket_id: 80,
    stf_no: 'STF-MP-20260224000003',
    ticket_status: 'closed',
    client: 'Bureau of Fire Protection',
    description_of_problem: 'UPS unit for the main server constantly beeping and battery not holding charge.',
    type_of_service_name: 'Hardware Replacement',
    assigned_to_name: 'Mark Villanueva',
  },
  {
    id: 9,
    file: '/ticket_attachments/2026/02/24/os_reinstall_checklist.png',
    uploaded_by: MOCK_USER('Grace', 'Tan'),
    uploaded_at: '2026-02-24T13:40:00Z',
    is_resolution_proof: true,
    ticket_id: 78,
    stf_no: 'STF-MP-20260224000001',
    ticket_status: 'closed',
    client: 'DSWD Field Office',
    description_of_problem: 'Workstation corrupted by malware. Requires full OS reinstallation and data recovery.',
    type_of_service_name: 'OS Installation',
    assigned_to_name: 'Grace Tan',
  },
  {
    id: 10,
    file: '/ticket_attachments/2026/02/23/email_migration_report.pdf',
    uploaded_by: MOCK_USER('James', 'Lim'),
    uploaded_at: '2026-02-23T11:20:00Z',
    is_resolution_proof: true,
    ticket_id: 75,
    stf_no: 'STF-MP-20260223000002',
    ticket_status: 'closed',
    client: 'DTI Regional Office',
    description_of_problem: 'Migrate 50 email accounts from on-prem Exchange to Microsoft 365.',
    type_of_service_name: 'Email Migration',
    assigned_to_name: 'James Lim',
  },
  {
    id: 11,
    file: '/ticket_attachments/2026/02/22/biometrics_device_test.jpg',
    uploaded_by: MOCK_USER('Juan', 'Dela Cruz'),
    uploaded_at: '2026-02-22T09:00:00Z',
    is_resolution_proof: true,
    ticket_id: 72,
    stf_no: 'STF-MP-20260222000001',
    ticket_status: 'in_progress',
    client: 'Batangas Provincial Capitol',
    description_of_problem: 'Biometrics attendance device not syncing with the DTR system.',
    type_of_service_name: 'Biometrics Setup',
    assigned_to_name: 'Juan Dela Cruz',
  },
  {
    id: 12,
    file: '/ticket_attachments/2026/02/21/data_backup_log.txt',
    uploaded_by: MOCK_USER('Maria', 'Santos'),
    uploaded_at: '2026-02-21T17:30:00Z',
    is_resolution_proof: true,
    ticket_id: 70,
    stf_no: 'STF-MP-20260221000005',
    ticket_status: 'closed',
    client: 'COMELEC Municipal Office',
    description_of_problem: 'Weekly backup job failing due to insufficient disk space on NAS.',
    type_of_service_name: 'Data Backup',
    assigned_to_name: 'Maria Santos',
  },
  {
    id: 13,
    file: '/ticket_attachments/2026/02/20/wifi_heatmap_scan.png',
    uploaded_by: MOCK_USER('Pedro', 'Reyes'),
    uploaded_at: '2026-02-20T14:15:00Z',
    is_resolution_proof: true,
    ticket_id: 68,
    stf_no: 'STF-MP-20260220000003',
    ticket_status: 'closed',
    client: 'Rosario Municipal Hall',
    description_of_problem: 'Wifi dead spots in 2nd floor offices. Need access point repositioning.',
    type_of_service_name: 'Wifi Optimization',
    assigned_to_name: 'Pedro Reyes',
  },
  {
    id: 14,
    file: '/ticket_attachments/2026/02/19/projector_repair_invoice.pdf',
    uploaded_by: MOCK_USER('Ana', 'Garcia'),
    uploaded_at: '2026-02-19T10:50:00Z',
    is_resolution_proof: true,
    ticket_id: 65,
    stf_no: 'STF-MP-20260219000001',
    ticket_status: 'escalated_external',
    client: 'Tanauan City Library',
    description_of_problem: 'Projector lamp burnt out during presentation. Needs urgent replacement.',
    type_of_service_name: 'Equipment Repair',
    assigned_to_name: 'Ana Garcia',
  },
  {
    id: 15,
    file: '/ticket_attachments/2026/02/18/antivirus_deployment_log.docx',
    uploaded_by: MOCK_USER('Carlos', 'Mendoza'),
    uploaded_at: '2026-02-18T16:00:00Z',
    is_resolution_proof: true,
    ticket_id: 62,
    stf_no: 'STF-MP-20260218000002',
    ticket_status: 'closed',
    client: 'NBI Regional Office',
    description_of_problem: 'Deploy enterprise antivirus to 30 workstations and configure central management.',
    type_of_service_name: 'Software Deployment',
    assigned_to_name: 'Carlos Mendoza',
  },
];

const MOCK_SUMMARY: KnowledgeHubSummary = {
  total_attachments: 42,
  proof_attachments: 15,
  recent_7_days: 9,
  by_ticket_status: {
    closed: 9,
    in_progress: 2,
    pending_closure: 1,
    escalated: 1,
    escalated_external: 1,
    open: 1,
  },
};

export default function KnowledgeHub() {
  const [attachments, setAttachments] = useState<KnowledgeHubAttachment[]>([]);
  const [summary, setSummary] = useState<KnowledgeHubSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProofs, setShowProofs] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<KnowledgeHubAttachment | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [items, stats] = await Promise.all([
        fetchKnowledgeHubAttachments({
          search: search || undefined,
          ticket_status: statusFilter || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
        fetchKnowledgeHubSummary(),
      ]);
      setAttachments(items.length ? items : MOCK_ATTACHMENTS);
      setSummary(stats.total_attachments ? stats : MOCK_SUMMARY);
    } catch {
      // Fallback to mock data when backend is unavailable
      let filtered = [...MOCK_ATTACHMENTS];
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.stf_no.toLowerCase().includes(q) ||
            a.client.toLowerCase().includes(q) ||
            a.description_of_problem.toLowerCase().includes(q) ||
            getFileName(a.file).toLowerCase().includes(q)
        );
      }
      if (statusFilter) {
        filtered = filtered.filter((a) => a.ticket_status === statusFilter);
      }
      if (dateFrom) {
        filtered = filtered.filter((a) => a.uploaded_at.slice(0, 10) >= dateFrom);
      }
      if (dateTo) {
        filtered = filtered.filter((a) => a.uploaded_at.slice(0, 10) <= dateTo);
      }
      setAttachments(filtered);
      setSummary(MOCK_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (showProofs) loadData();
  }, [loadData, showProofs]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    setDeleting(id);
    try {
      await deleteKnowledgeHubAttachment(id);
    } catch {
      // Mock mode — just remove locally
    }
    toast.success('Attachment deleted');
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    if (selected?.id === id) setSelected(null);
    setDeleting(null);
  };

  // Pagination
  const totalPages = Math.ceil(attachments.length / ITEMS_PER_PAGE);
  const paged = attachments.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Hub</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Proof attachments submitted through STF Ticket forms
          </p>
        </div>
        {showProofs && (
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>

        </div>
        )}
      </div>

      {/* Landing state — show button before proofs are revealed */}
      {!showProofs ? (
        <Card className="p-0 overflow-hidden">
          <div className="relative bg-gradient-to-br from-[#0E8F79] via-[#0b7a67] to-[#0a0a0a]">
            <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3), transparent 60%)' }} />
            <div className="relative flex flex-col items-center text-center py-16 px-6">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6">
                <FileCheck className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Submitted Required Proofs</h2>
              <p className="text-white/70 text-sm max-w-md mb-8">
                View all submitted required proof attachments from STF Ticket forms. These include resolution proofs, documentation, photos, and other evidence uploaded by technicals during ticket resolution.
              </p>
              <button
                onClick={() => setShowProofs(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#0E8F79] text-sm font-semibold hover:bg-white/90 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
              >
                <Eye className="w-5 h-5" />
                View Submitted Proofs
              </button>
              <p className="text-white/40 text-xs mt-4">{MOCK_ATTACHMENTS.length} proof attachments available</p>
            </div>
          </div>
        </Card>
      ) : (
      <>
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Attachments"
            value={String(summary.total_attachments)}
            icon={Paperclip}
            color="blue"
          />
          <StatCard
            title="Proof Attachments"
            value={String(summary.proof_attachments)}
            icon={FileCheck}
            color="green"
          />
          <StatCard
            title="Recent (7 days)"
            value={String(summary.recent_7_days)}
            icon={Clock}
            color="orange"
          />
          <StatCard
            title="From Closed Tickets"
            value={String(summary.by_ticket_status?.closed || 0)}
            icon={FileText}
            color="purple"
          />
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by STF no, client, description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-[#3BC25B] dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-[#3BC25B] dark:text-white"
              >
                <option value="">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-[#3BC25B] dark:text-white"
              title="From date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-[#3BC25B] dark:text-white"
              title="To date"
            />
          </div>
        </div>
      </Card>

      {/* Attachments Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : paged.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No proof attachments found</p>
            <p className="text-sm mt-1">Proof attachments from STF ticket forms will appear here.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paged.map((att) => (
            <Card key={att.id} className="p-0 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Preview Area */}
              <div
                className="h-40 bg-gray-50 dark:bg-gray-900 flex items-center justify-center cursor-pointer relative group"
                onClick={() => setSelected(att)}
              >
                {isImageFile(att.file) ? (
                  <img
                    src={att.file}
                    alt={getFileName(att.file)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.classList.add('flex', 'items-center', 'justify-center');
                        const icon = document.createElement('div');
                        icon.innerHTML = '📎';
                        icon.className = 'text-4xl';
                        parent.appendChild(icon);
                      }
                    }}
                  />
                ) : isVideoFile(att.file) ? (
                  <div className="flex flex-col items-center gap-2">
                    <Film className="w-10 h-10 text-purple-400" />
                    <span className="text-xs text-gray-400">Video</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileTypeIcon url={att.file} />
                    <span className="text-xs text-gray-400 uppercase">{getFileExtension(att.file)}</span>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                {/* Status badge */}
                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[att.ticket_status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[att.ticket_status] || att.ticket_status}
                </span>
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={getFileName(att.file)}>
                      {getFileName(att.file)}
                    </p>
                    <p className="text-xs text-[#0E8F79] font-medium">{att.stf_no}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={att.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Open in new tab"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(att.id); }}
                      disabled={deleting === att.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                  {att.client && <p><span className="font-medium">Client:</span> {att.client}</p>}
                  {att.assigned_to_name && <p><span className="font-medium">Assigned:</span> {att.assigned_to_name}</p>}
                  {att.type_of_service_name && <p><span className="font-medium">Service:</span> {att.type_of_service_name}</p>}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] text-gray-400">
                    {att.uploaded_by ? `${att.uploaded_by.first_name} ${att.uploaded_by.last_name}` : 'Unknown'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(att.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, attachments.length)} of {attachments.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && (
                    <span className="px-1 text-gray-400">…</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-[#0E8F79] text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      )}
      </>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Attachment Details</h2>
                <p className="text-sm text-[#0E8F79] font-medium">{selected.stf_no}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Preview */}
              <div className="rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                {isImageFile(selected.file) ? (
                  <img
                    src={selected.file}
                    alt={getFileName(selected.file)}
                    className="w-full max-h-96 object-contain"
                  />
                ) : isVideoFile(selected.file) ? (
                  <video controls className="w-full max-h-96">
                    <source src={selected.file} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <FileTypeIcon url={selected.file} />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getFileName(selected.file)}</p>
                    <a
                      href={selected.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E8F79] text-white text-sm font-medium hover:bg-[#0b7a67] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Open File
                    </a>
                  </div>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="File Name" value={getFileName(selected.file)} />
                <DetailRow label="STF Number" value={selected.stf_no} />
                <DetailRow label="Client" value={selected.client || '—'} />
                <DetailRow
                  label="Ticket Status"
                  value={
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[selected.ticket_status] || ''}`}>
                      {STATUS_LABELS[selected.ticket_status] || selected.ticket_status}
                    </span>
                  }
                />
                <DetailRow label="Type of Service" value={selected.type_of_service_name || '—'} />
                <DetailRow label="Assigned To" value={selected.assigned_to_name || '—'} />
                <DetailRow
                  label="Uploaded By"
                  value={selected.uploaded_by ? `${selected.uploaded_by.first_name} ${selected.uploaded_by.last_name}` : '—'}
                />
                <DetailRow
                  label="Uploaded At"
                  value={new Date(selected.uploaded_at).toLocaleString()}
                />
                <DetailRow
                  label="Resolution Proof"
                  value={selected.is_resolution_proof ? 'Yes' : 'No'}
                />
              </div>

              {/* Description */}
              {selected.description_of_problem && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Description of Problem
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    {selected.description_of_problem}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <a
                  href={selected.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E8F79] text-white text-sm font-medium hover:bg-[#0b7a67] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Open File
                </a>
                <button
                  onClick={() => { handleDelete(selected.id); }}
                  disabled={deleting === selected.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">{typeof value === 'string' ? value : value}</dd>
    </div>
  );
}
