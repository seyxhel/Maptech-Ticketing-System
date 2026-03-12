import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { GreenButton } from '../../components/ui/GreenButton';
import {
  Search,
  RefreshCw,
  PhoneCall,
  PhoneOff,
  Phone,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  User,
  Download,
  FileDown,
  FileSpreadsheet,
  ChevronDown,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchCallLogs, fetchRetentionPolicy, type CallLog, type RetentionPolicyData } from '../../services/api';
// @ts-ignore
import XLSXStyle from 'xlsx-js-style';
import { buildPdfDocument, openPrintWindow } from '../../utils/pdfTemplate';

const PAGE_SIZE = 15;

function exportToXlsx(
  logs: CallLog[],
  stats: { totalCalls: number; activeCalls: number; completedCalls: number; avgDuration: number | null },
  filters: { searchTerm: string; statusFilter: string; dateFrom: string; dateTo: string },
) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  // Color palette (same as AuditLogs)
  const C = {
    GREEN_DARK: '154734', GREEN_MID: '2FAD52', GREEN_PALE: 'E8FAF0',
    GREEN_TEXT: '065F46', WHITE: 'FFFFFF', ALT_ROW: 'F0FDF4', BORDER_CLR: 'D1FAE5',
  };

  const STATUS_CLR: Record<string, [string, string]> = {
    Active: ['FEF9C3', 'A16207'], Completed: ['DCFCE7', '166534'],
  };

  const THIN = (clr = C.BORDER_CLR) => ({ style: 'thin' as const, color: { rgb: clr } });
  const allBorders = (clr = C.BORDER_CLR) => ({ top: THIN(clr), bottom: THIN(clr), left: THIN(clr), right: THIN(clr) });

  type CellOpts = { bold?: boolean; italic?: boolean; sz?: number; center?: boolean; wrap?: boolean; border?: boolean };
  const cellStyle = (bg: string, fg: string, opts?: CellOpts) => ({
    fill: { fgColor: { rgb: bg } },
    font: { name: 'Calibri', sz: opts?.sz ?? 11, color: { rgb: fg }, bold: !!opts?.bold, italic: !!opts?.italic },
    alignment: { horizontal: opts?.center ? 'center' : 'left', vertical: 'center', wrapText: !!opts?.wrap },
    ...(opts?.border !== false ? { border: allBorders() } : {}),
  });

  type XCell = { v: string | number; t: 's' | 'n'; s: object };
  const sc = (v: string | number, bg: string, fg: string, opts?: CellOpts): XCell =>
    ({ v, t: typeof v === 'number' ? 'n' : 's', s: cellStyle(bg, fg, opts) });

  const ws: Record<string, unknown> = {};
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
  const COLS = 10;
  const colWidths = [{ wch: 6 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 40 }];
  const rowHeights: { hpt: number }[] = [];
  let R = 0;

  const setCell = (r: number, c: number, cell: XCell) => {
    ws[XLSXStyle.utils.encode_cell({ r, c })] = cell;
  };

  const mergeRow = (r: number, v: string, bg: string, fg: string, opts?: CellOpts) => {
    setCell(r, 0, sc(v, bg, fg, { ...opts, border: false }));
    for (let c = 1; c < COLS; c++) setCell(r, c, sc('', bg, fg, { ...opts, border: false }));
    merges.push({ s: { r, c: 0 }, e: { r, c: COLS - 1 } });
  };

  const twoCol = (r: number, lbl: string, val: string, lOpts?: CellOpts, vOpts?: CellOpts) => {
    setCell(r, 0, sc(lbl, C.GREEN_PALE, C.GREEN_TEXT, { bold: true, sz: 10, ...lOpts, border: false }));
    for (let c = 1; c < 5; c++) setCell(r, c, sc('', C.GREEN_PALE, C.GREEN_TEXT, { ...lOpts, border: false }));
    merges.push({ s: { r, c: 0 }, e: { r, c: 4 } });
    setCell(r, 5, sc(val, C.WHITE, '000000', { center: true, sz: 11, ...vOpts, border: false }));
    for (let c = 6; c < COLS; c++) setCell(r, c, sc('', C.WHITE, '000000', { ...vOpts, border: false }));
    merges.push({ s: { r, c: 5 }, e: { r, c: COLS - 1 } });
  };

  // ─── Title ───
  mergeRow(R, 'MAPTECH TICKETING SYSTEM  —  CALL LOGS REPORT', C.GREEN_DARK, C.WHITE, { bold: true, sz: 18, center: true });
  rowHeights[R] = { hpt: 52 }; R++;
  mergeRow(R, 'Call Logging Summary & Records', C.GREEN_MID, '000000', { italic: true, sz: 11, center: true });
  rowHeights[R] = { hpt: 28 }; R++;

  // Info rows
  twoCol(R, '   Generated', `${dateStr}  ${timeStr}`); rowHeights[R] = { hpt: 22 }; R++;
  twoCol(R, '   Total Records', String(logs.length)); rowHeights[R] = { hpt: 22 }; R++;

  // Active filters
  const filterParts: string[] = [];
  if (filters.statusFilter) filterParts.push(`Status: ${filters.statusFilter}`);
  if (filters.dateFrom) filterParts.push(`From: ${filters.dateFrom}`);
  if (filters.dateTo) filterParts.push(`To: ${filters.dateTo}`);
  if (filters.searchTerm) filterParts.push(`Search: "${filters.searchTerm}"`);
  if (filterParts.length > 0) {
    twoCol(R, '   Filters Applied', filterParts.join('  |  ')); rowHeights[R] = { hpt: 22 }; R++;
  }

  // Spacer
  mergeRow(R, '', C.WHITE, C.WHITE, { border: false }); rowHeights[R] = { hpt: 16 }; R++;

  // ─── SUMMARY ───
  mergeRow(R, '     SUMMARY', C.GREEN_DARK, C.WHITE, { bold: true, sz: 13 }); rowHeights[R] = { hpt: 32 }; R++;
  twoCol(R, '    Total Calls', String(stats.totalCalls), { sz: 11 }, { bold: true, sz: 12 }); rowHeights[R] = { hpt: 24 }; R++;
  twoCol(R, '    Active / Ongoing', String(stats.activeCalls), { sz: 11 }, { bold: true, sz: 12 }); rowHeights[R] = { hpt: 24 }; R++;
  twoCol(R, '    Completed', String(stats.completedCalls), { sz: 11 }, { bold: true, sz: 12 }); rowHeights[R] = { hpt: 24 }; R++;
  const avgStr = stats.avgDuration !== null ? `${Math.round(stats.avgDuration)}s` : 'N/A';
  twoCol(R, '    Average Duration', avgStr, { sz: 11 }, { bold: true, sz: 12 }); rowHeights[R] = { hpt: 24 }; R++;

  // Spacer
  mergeRow(R, '', C.WHITE, C.WHITE, { border: false }); rowHeights[R] = { hpt: 20 }; R++;

  // ─── DATA SECTION HEADER ───
  mergeRow(R, '     CALL LOG RECORDS', C.GREEN_DARK, C.WHITE, { bold: true, sz: 13 }); rowHeights[R] = { hpt: 34 }; R++;

  // Column headers
  const headers = ['#', 'Status', 'Admin', 'Client', 'Phone', 'Call Start', 'Call End', 'Duration', 'Ticket ID', 'Notes'];
  headers.forEach((h, c) => setCell(R, c, sc(h, C.GREEN_MID, '000000', { bold: true, sz: 10, center: true })));
  rowHeights[R] = { hpt: 28 }; R++;

  // Data rows
  logs.forEach((l, i) => {
    const bg = i % 2 === 0 ? C.WHITE : C.ALT_ROW;
    const status = l.call_end ? 'Completed' : 'Active';
    const [sBg, sFg] = STATUS_CLR[status] ?? [bg, '000000'];

    setCell(R, 0, sc(i + 1, bg, '000000', { center: true, sz: 10 }));
    setCell(R, 1, sc(status, sBg, sFg, { bold: true, center: true, sz: 10 }));
    setCell(R, 2, sc(l.admin_name || '', bg, '000000', { sz: 10 }));
    setCell(R, 3, sc(l.client_name || '', bg, '000000', { sz: 10 }));
    setCell(R, 4, sc(l.phone_number || '', bg, '000000', { sz: 10 }));
    setCell(R, 5, sc(l.call_start ? new Date(l.call_start).toLocaleString() : '', bg, '000000', { sz: 9 }));
    setCell(R, 6, sc(l.call_end ? new Date(l.call_end).toLocaleString() : '', bg, '000000', { sz: 9 }));
    setCell(R, 7, sc(l.duration_seconds != null ? `${l.duration_seconds}s` : '', bg, '000000', { center: true, sz: 10 }));
    setCell(R, 8, sc(l.ticket != null ? String(l.ticket) : '', bg, '1D4ED8', { center: true, sz: 10 }));
    setCell(R, 9, sc(l.notes || '', bg, '000000', { sz: 9, wrap: true }));

    const notesLen = (l.notes || '').length;
    rowHeights[R] = { hpt: notesLen > 120 ? 48 : notesLen > 60 ? 36 : 28 };
    R++;
  });

  // Footer
  mergeRow(R, `   End of Call Logs Report  •  ${logs.length} records  •  Generated ${dateStr} ${timeStr}`, C.GREEN_DARK, C.WHITE, { italic: true, sz: 9, center: true, border: false });
  rowHeights[R] = { hpt: 26 }; R++;

  // Sheet metadata
  ws['!ref'] = XLSXStyle.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: R - 1, c: COLS - 1 } });
  ws['!cols'] = colWidths;
  ws['!rows'] = rowHeights;
  ws['!merges'] = merges;

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Call Logs');
  XLSXStyle.writeFile(wb, `call_logs_${dateStr}.xlsx`);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} ${d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })}`;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function CallLogs() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [retentionPolicy, setRetentionPolicy] = useState<RetentionPolicyData | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'completed'>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCallLogs();
      setLogs(data);
    } catch {
      toast.error('Failed to load call logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load retention policy once
  useEffect(() => {
    fetchRetentionPolicy().then(setRetentionPolicy).catch(() => {});
  }, []);

  // Client-side filtering
  const filtered = useMemo(() => {
    let result = logs;

    if (statusFilter === 'active') {
      result = result.filter((l) => !l.call_end);
    } else if (statusFilter === 'completed') {
      result = result.filter((l) => !!l.call_end);
    }

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter((l) => new Date(l.call_start).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((l) => new Date(l.call_start).getTime() <= to.getTime());
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.client_name?.toLowerCase().includes(q) ||
          l.phone_number?.toLowerCase().includes(q) ||
          l.admin_name?.toLowerCase().includes(q) ||
          l.notes?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [logs, searchTerm, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  // Summary stats
  const totalCalls = logs.length;
  const activeCalls = logs.filter((l) => !l.call_end).length;
  const completedCalls = logs.filter((l) => !!l.call_end).length;
  const durations = logs
    .filter((l) => l.duration_seconds !== null)
    .map((l) => l.duration_seconds as number);
  const avgDuration =
    durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null;

  const hasActiveFilters = statusFilter || dateFrom || dateTo;

  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = () => {
    setShowExportMenu(false);
    if (filtered.length === 0) {
      toast.error('No records to export.');
      return;
    }
    setExporting(true);
    try {
      exportToXlsx(
        filtered,
        { totalCalls, activeCalls, completedCalls, avgDuration },
        { searchTerm, statusFilter, dateFrom, dateTo },
      );
      toast.success(`Exported ${filtered.length} call log${filtered.length !== 1 ? 's' : ''}.`);
    } catch {
      toast.error('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    setShowExportMenu(false);
    if (filtered.length === 0) {
      toast.error('No records to export.');
      return;
    }
    const body = `
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-label">Total Calls</div><div class="stat-value">${totalCalls}</div></div>
        <div class="stat-card"><div class="stat-label">Active / Ongoing</div><div class="stat-value">${activeCalls}</div></div>
        <div class="stat-card"><div class="stat-label">Completed</div><div class="stat-value">${completedCalls}</div></div>
        <div class="stat-card"><div class="stat-label">Avg Duration</div><div class="stat-value">${formatDuration(avgDuration)}</div></div>
      </div>
      <h2>Call Log Records</h2>
      <table>
        <thead><tr><th>#</th><th>Status</th><th>Admin</th><th>Client</th><th>Phone</th><th>Call Start</th><th>Call End</th><th>Duration</th><th>Ticket ID</th><th>Notes</th></tr></thead>
        <tbody>
          ${filtered.map((l, i) => {
            const status = l.call_end ? 'Completed' : 'Active';
            return `<tr><td>${i + 1}</td><td><strong>${status}</strong></td><td>${l.admin_name || '\u2014'}</td><td>${l.client_name || '\u2014'}</td><td>${l.phone_number || '\u2014'}</td><td>${l.call_start ? new Date(l.call_start).toLocaleString() : '\u2014'}</td><td>${l.call_end ? new Date(l.call_end).toLocaleString() : '\u2014'}</td><td>${l.duration_seconds != null ? formatDuration(l.duration_seconds) : '\u2014'}</td><td>${l.ticket != null ? l.ticket : ''}</td><td>${l.notes || ''}</td></tr>`;
          }).join('')}
        </tbody>
      </table>`;
    const html = buildPdfDocument('Call Logs Report - Maptech Ticketing System', 'Call Logs Report', body, `${filtered.length} records`);
    openPrintWindow(html);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Call Logs</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Records of all client calls made during ticket creation
          </p>
        </div>
        <div className="relative">
          <GreenButton
            onClick={() => setShowExportMenu((v) => !v)}
            isLoading={exporting}
            className="flex items-center gap-2 self-start md:self-auto"
          >
            <Download className="w-4 h-4" />
            Export Call Logs
            <ChevronDown className="w-4 h-4 ml-1" />
          </GreenButton>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-50 overflow-hidden">
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <FileDown className="w-4 h-4 text-red-500" />
                  Export as PDF
                </button>
                <button
                  onClick={handleExport}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#0E8F79]" />
                  Export as XLSX
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Retention Policy Notice */}
      {retentionPolicy && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-sm">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Retention Policy:</strong>{' '}
            {retentionPolicy.call_log_retention_days > 0
              ? `Call logs are retained for ${retentionPolicy.call_log_retention_days} day${retentionPolicy.call_log_retention_days !== 1 ? 's' : ''} and automatically removed thereafter.`
              : 'Call logs are retained indefinitely (no automatic cleanup).'}
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 dark:bg-gray-700 text-white rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Phone className="w-4 h-4 opacity-70" />
            <p className="text-sm opacity-80">Total Calls</p>
          </div>
          <p className="text-2xl font-bold">{totalCalls.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <PhoneCall className="w-4 h-4 opacity-70" />
            <p className="text-sm opacity-80">Active / Ongoing</p>
          </div>
          <p className="text-2xl font-bold">{activeCalls}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <PhoneOff className="w-4 h-4 opacity-70" />
            <p className="text-sm opacity-80">Completed</p>
          </div>
          <p className="text-2xl font-bold">{completedCalls}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 opacity-70" />
            <p className="text-sm opacity-80">Avg Duration</p>
          </div>
          <p className="text-2xl font-bold">{formatDuration(avgDuration)}</p>
        </div>
      </div>

      <Card accent>
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-[#ecfdf5] dark:bg-green-900/40 text-[#0E8F79] dark:text-green-400 border-[#0E8F79] dark:border-green-500'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              {hasActiveFilters && <span className="ml-1 w-2 h-2 bg-[#0E8F79] rounded-full" />}
            </button>

            {(hasActiveFilters || searchTerm) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500 transition-all"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}

            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search client, phone, admin, notes..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
            />
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as '' | 'active' | 'completed'); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
              >
                <option value="">All Status</option>
                <option value="active">Active / Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
              />
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 font-semibold">Admin</th>
                <th className="px-4 py-4 font-semibold">Client</th>
                <th className="px-4 py-4 font-semibold">Phone</th>
                <th className="px-4 py-4 font-semibold">Call Start</th>
                <th className="px-4 py-4 font-semibold">Call End</th>
                <th className="px-4 py-4 font-semibold">Duration</th>
                <th className="px-4 py-4 font-semibold">Ticket</th>
                <th className="px-4 py-4 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 text-gray-300 dark:text-gray-600 animate-spin" />
                      <span className="text-gray-400 dark:text-gray-500">Loading call logs...</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <PhoneOff className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                      <span className="text-gray-400 dark:text-gray-500 text-base">No call logs found</span>
                      <span className="text-gray-400 dark:text-gray-600 text-xs">
                        {hasActiveFilters || searchTerm
                          ? 'Try adjusting your filters or search term'
                          : 'Call logs will appear here when admins start calls during ticket creation'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((log) => {
                  const isActive = !log.call_end;
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      {/* Status */}
                      <td className="px-4 py-3">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                            <PhoneOff className="w-3 h-3" />
                            Ended
                          </span>
                        )}
                      </td>
                      {/* Admin */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#0E8F79]/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-[#0E8F79]" />
                          </div>
                          <span className="text-gray-900 dark:text-gray-100 text-sm font-medium truncate max-w-[120px]" title={log.admin_name}>
                            {log.admin_name || '—'}
                          </span>
                        </div>
                      </td>
                      {/* Client */}
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                        {log.client_name || '—'}
                      </td>
                      {/* Phone */}
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">
                        {log.phone_number || '—'}
                      </td>
                      {/* Call Start */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(log.call_start)}
                      </td>
                      {/* Call End */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {log.call_end ? formatDate(log.call_end) : (
                          <span className="text-green-600 dark:text-green-400 text-xs font-medium">In progress…</span>
                        )}
                      </td>
                      {/* Duration */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                          isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {formatDuration(log.duration_seconds)}
                        </span>
                      </td>
                      {/* Ticket */}
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {log.ticket ? (
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 font-mono">
                            #{log.ticket}
                          </span>
                        ) : '—'}
                      </td>
                      {/* Notes */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={log.notes}>
                          {log.notes || <span className="italic text-gray-300 dark:text-gray-600">No notes</span>}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of{' '}
              {filtered.length} records
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
