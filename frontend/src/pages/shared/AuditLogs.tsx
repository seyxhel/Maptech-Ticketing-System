import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../../components/ui/Card';
import { GreenButton } from '../../components/ui/GreenButton';
import {
  Search,
  Download,
  Filter,
  RefreshCw,
  Shield,
  Clock,
  Activity,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  FileDown,
  FileSpreadsheet,
  ChevronDown,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAuditLogs,
  fetchAuditLogSummary,
  fetchRetentionPolicy,
  type AuditLogEntry,
  type AuditLogSummary,
  type RetentionPolicyData,
} from '../../services/api';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import XLSXStyle from 'xlsx-js-style';
import { buildPdfDocument, openPrintWindow } from '../../utils/pdfTemplate';

// ── Constants ──

const ENTITY_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: 'User', label: 'User' },
  { value: 'Ticket', label: 'Ticket' },
  { value: 'TypeOfService', label: 'Type of Service' },
  { value: 'EscalationLog', label: 'Escalation Log' },
  { value: 'Attachment', label: 'Attachment' },
  { value: 'Session', label: 'Session' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'ASSIGN', label: 'Assign' },
  { value: 'ESCALATE', label: 'Escalate' },
  { value: 'CLOSE', label: 'Close' },
  { value: 'PASS', label: 'Pass' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'RESOLVE', label: 'Resolve' },
  { value: 'UPLOAD', label: 'Upload' },
  { value: 'CONFIRM', label: 'Confirm' },
  { value: 'STATUS_CHANGE', label: 'Status Change' },
  { value: 'PASSWORD_RESET', label: 'Password Reset' },
];

const PAGE_SIZE = 15;

// ── Badge helpers ──

function actionBadge(action: string) {
  const map: Record<string, string> = {
    CREATE: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
    UPDATE: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    DELETE: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
    LOGIN: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
    LOGOUT: 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600',
    ASSIGN: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700',
    ESCALATE: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700',
    CLOSE: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
    PASS: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700',
    REVIEW: 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700',
    RESOLVE: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
    UPLOAD: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700',
    CONFIRM: 'bg-lime-50 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-700',
    STATUS_CHANGE: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
    PASSWORD_RESET: 'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700',
  };
  return map[action] || 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600';
}

function entityBadge(entity: string) {
  const map: Record<string, string> = {
    User: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
    Ticket: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    TypeOfService: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700',
    EscalationLog: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700',
    Attachment: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
    Session: 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600',
  };
  return map[entity] || 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600';
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

// ── Component ──

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [retentionPolicy, setRetentionPolicy] = useState<RetentionPolicyData | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsData, summaryData] = await Promise.all([
        fetchAuditLogs({
          search: searchTerm || undefined,
          entity: entityFilter || undefined,
          action: actionFilter || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
        fetchAuditLogSummary(),
      ]);
      setLogs(logsData);
      setSummary(summaryData);
    } catch (err) {
      toast.error('Failed to load audit logs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, entityFilter, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load retention policy once
  useEffect(() => {
    fetchRetentionPolicy().then(setRetentionPolicy).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadData();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, entityFilter, actionFilter, dateFrom, dateTo, loadData]);

  // Pagination derived state
  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const paginatedLogs = useMemo(
    () => logs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [logs, currentPage]
  );

  const handleExport = () => {
    if (!logs.length) { toast.error('No logs to export.'); return; }
    setExporting(true);
    try {
      const now    = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      // ── Active filter string ──
      const filterParts: string[] = [];
      if (searchTerm)   filterParts.push(`Search: "${searchTerm}"`);
      if (entityFilter) filterParts.push(`Entity: ${entityFilter}`);
      if (actionFilter) filterParts.push(`Action: ${actionFilter}`);
      if (dateFrom)     filterParts.push(`From: ${dateFrom}`);
      if (dateTo)       filterParts.push(`To: ${dateTo}`);
      const filterStr = filterParts.length ? filterParts.join(' | ') : 'None — all records';

      // ── Color palette (no # prefix for xlsx-js-style) ──
      const C = {
        GREEN_DARK  : '154734',
        GREEN_MID   : '2FAD52',
        GREEN_PALE  : 'E8FAF0',
        GREEN_TEXT  : '065F46',
        WHITE       : 'FFFFFF',
        GRAY_ROW    : 'F9FAFB',
        ALT_ROW     : 'F0FDF4',
        HEADER_TEXT : 'FFFFFF',
        BORDER_CLR  : 'D1FAE5',
      };

      // ── Action color map [bgRGB, fgRGB] ──
      const ACTION_COLORS: Record<string, [string, string]> = {
        CREATE         : ['DCFCE7', '166534'],
        UPDATE         : ['DBEAFE', '1D4ED8'],
        DELETE         : ['FEE2E2', 'DC2626'],
        LOGIN          : ['EDE9FE', '7C3AED'],
        LOGOUT         : ['F3F4F6', '374151'],
        ASSIGN         : ['CCFBF1', '0F766E'],
        ESCALATE       : ['FFEDD5', 'C2410C'],
        CLOSE          : ['E0E7FF', '4338CA'],
        PASS           : ['CFFAFE', '0E7490'],
        REVIEW         : ['E0F2FE', '0369A1'],
        RESOLVE        : ['D1FAE5', '065F46'],
        UPLOAD         : ['EDE9FE', '6D28D9'],
        CONFIRM        : ['ECFCCB', '3F6212'],
        STATUS_CHANGE  : ['FEF9C3', 'A16207'],
        PASSWORD_RESET : ['FCE7F3', '9D174D'],
      };

      // ── Entity color map [bgRGB, fgRGB] ──
      const ENTITY_COLORS: Record<string, [string, string]> = {
        User          : ['EDE9FE', '6D28D9'],
        Ticket        : ['DBEAFE', '1D4ED8'],
        TypeOfService : ['CCFBF1', '0F766E'],
        EscalationLog : ['FFEDD5', 'C2410C'],
        Attachment    : ['D1FAE5', '065F46'],
        Session       : ['F3F4F6', '374151'],
      };

      // ── Style factories ──
      const THIN = (clr = C.BORDER_CLR) => ({ style: 'thin', color: { rgb: clr } });
      const allBorders = (clr = C.BORDER_CLR) => ({ top: THIN(clr), bottom: THIN(clr), left: THIN(clr), right: THIN(clr) });

      const cellStyle = (bg: string, fg: string, opts?: { bold?: boolean; italic?: boolean; sz?: number; center?: boolean; wrap?: boolean; border?: boolean }) => ({
        fill  : { fgColor: { rgb: bg } },
        font  : { name: 'Calibri', sz: opts?.sz ?? 11, color: { rgb: fg }, bold: !!opts?.bold, italic: !!opts?.italic },
        alignment: { horizontal: opts?.center ? 'center' : 'left', vertical: 'center', wrapText: !!opts?.wrap },
        ...(opts?.border !== false ? { border: allBorders() } : {}),
      });

      type XCell = { v: string | number; t: 's' | 'n'; s: object };
      const sc = (v: string | number, bg: string, fg: string, opts?: Parameters<typeof cellStyle>[2]): XCell =>
        ({ v, t: typeof v === 'number' ? 'n' : 's', s: cellStyle(bg, fg, opts) });

      const ws: Record<string, unknown> = {};
      const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
      const colWidths = [{ wch: 6 }, { wch: 26 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 62 }, { wch: 24 }, { wch: 30 }, { wch: 18 }, { wch: 50 }];
      const rowHeights: { hpt: number }[] = [];
      const COLS = 10;
      let   R    = 0; // current row index

      const setCell = (r: number, c: number, cell: XCell) => {
        const ref = XLSXStyle.utils.encode_cell({ r, c });
        ws[ref]   = cell;
      };

      const mergeRow = (r: number, v: string, bg: string, fg: string, opts?: Parameters<typeof cellStyle>[2]) => {
        setCell(r, 0, sc(v, bg, fg, { ...opts, border: false }));
        for (let c = 1; c < COLS; c++) setCell(r, c, sc('', bg, fg, { ...opts, border: false }));
        merges.push({ s: { r, c: 0 }, e: { r, c: COLS - 1 } });
      };

      // Two-column merged row helper: cols 0-4 = label, cols 5-9 = value
      const SPLIT = 5;
      const twoCol = (
        r: number,
        label: string, val: string | number,
        lBg: string, lFg: string,
        vBg: string, vFg: string,
        lOpts?: Parameters<typeof cellStyle>[2],
        vOpts?: Parameters<typeof cellStyle>[2],
      ) => {
        setCell(r, 0, sc(label, lBg, lFg, lOpts));
        for (let c = 1; c < SPLIT; c++) setCell(r, c, sc('', lBg, lFg, { ...lOpts, border: false }));
        merges.push({ s: { r, c: 0 }, e: { r, c: SPLIT - 1 } });
        setCell(r, SPLIT, sc(val, vBg, vFg, vOpts));
        for (let c = SPLIT + 1; c < COLS; c++) setCell(r, c, sc('', vBg, vFg, { ...vOpts, border: false }));
        merges.push({ s: { r, c: SPLIT }, e: { r, c: COLS - 1 } });
      };

      // ─── ROW 0: Main Title ───
      mergeRow(R, 'MAPTECH TICKETING SYSTEM  —  AUDIT LOG REPORT', C.GREEN_DARK, C.WHITE, { bold: true, sz: 18, center: true });
      rowHeights[R] = { hpt: 52 }; R++;

      // ─── ROW 1: Subtitle ───
      mergeRow(R, 'System Activity & Change Tracking Report', C.GREEN_MID, '000000', { italic: true, sz: 11, center: true });
      rowHeights[R] = { hpt: 28 }; R++;

      // ─── ROWS 2-4: Info rows ───
      const infoRows = [
        [`Generated`, `${dateStr}  ${timeStr}`],
        [`Filters`,   filterStr],
        [`Records`,   `${logs.length} entries`],
      ];
      infoRows.forEach(([label, val]) => {
        twoCol(R,
          `    ${label}:`, val,
          C.GREEN_PALE, C.GREEN_TEXT,
          C.GREEN_PALE, C.GREEN_TEXT,
          { sz: 10, bold: true, border: false },
          { sz: 10, border: false },
        );
        rowHeights[R] = { hpt: 22 }; R++;
      });

      // ─── Spacer ───
      mergeRow(R, '', C.WHITE, C.WHITE, { border: false }); rowHeights[R] = { hpt: 16 }; R++;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // SUMMARY SECTION
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      mergeRow(R, '    SUMMARY', C.GREEN_DARK, C.WHITE, { bold: true, sz: 13, border: false });
      rowHeights[R] = { hpt: 32 }; R++;

      // Summary col headers
      twoCol(R,
        '  Metric', 'Value',
        C.GREEN_DARK, C.WHITE,
        C.GREEN_DARK, C.WHITE,
        { bold: true, sz: 10, border: false },
        { bold: true, sz: 10, center: true, border: false },
      );
      rowHeights[R] = { hpt: 24 }; R++;

      const summaryData = [
        ['Total Logs',    summary?.total          ?? 0],
        ['Last 24 Hours', summary?.last_24h       ?? 0],
        ['User Actions',  summary?.by_entity?.User   ?? 0],
        ['Ticket Actions',summary?.by_entity?.Ticket ?? 0],
      ] as [string, number][];

      summaryData.forEach(([metric, val]) => {
        twoCol(R,
          `    ${metric}`, val,
          C.GREEN_PALE, C.GREEN_TEXT,
          C.GREEN_PALE, C.GREEN_DARK,
          { sz: 10, border: false },
          { bold: true, sz: 11, center: true, border: false },
        );
        rowHeights[R] = { hpt: 22 }; R++;
      });

      // ── Action Breakdown ──
      if (summary?.by_action && Object.keys(summary.by_action).length) {
        mergeRow(R, '', C.WHITE, C.WHITE, { border: false }); rowHeights[R] = { hpt: 12 }; R++;
        mergeRow(R, '    Action Breakdown', C.GREEN_MID, '000000', { bold: true, sz: 10, border: false });
        rowHeights[R] = { hpt: 24 }; R++;
        twoCol(R,
          '  Action', 'Count',
          C.GREEN_DARK, C.WHITE,
          C.GREEN_DARK, C.WHITE,
          { bold: true, sz: 10, border: false },
          { bold: true, sz: 10, center: true, border: false },
        );
        rowHeights[R] = { hpt: 22 }; R++;
        Object.entries(summary.by_action)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .forEach(([action, count]) => {
            const [abg, afg] = ACTION_COLORS[action] ?? ['F3F4F6', '000000'];
            twoCol(R,
              `    ${action}`, count as number,
              abg, afg,
              C.GREEN_PALE, C.GREEN_DARK,
              { bold: true, sz: 10, border: false },
              { bold: true, sz: 11, center: true, border: false },
            );
            rowHeights[R] = { hpt: 22 }; R++;
          });
      }

      // ── Entity Breakdown ──
      if (summary?.by_entity && Object.keys(summary.by_entity).length) {
        mergeRow(R, '', C.WHITE, C.WHITE, { border: false }); rowHeights[R] = { hpt: 12 }; R++;
        mergeRow(R, '    Entity Breakdown', C.GREEN_MID, '000000', { bold: true, sz: 10, border: false });
        rowHeights[R] = { hpt: 24 }; R++;
        twoCol(R,
          '  Entity', 'Count',
          C.GREEN_DARK, C.WHITE,
          C.GREEN_DARK, C.WHITE,
          { bold: true, sz: 10, border: false },
          { bold: true, sz: 10, center: true, border: false },
        );
        rowHeights[R] = { hpt: 22 }; R++;
        Object.entries(summary.by_entity)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .forEach(([entity, count]) => {
            const [ebg, efg] = ENTITY_COLORS[entity] ?? ['F3F4F6', '000000'];
            twoCol(R,
              `    ${entity}`, count as number,
              ebg, efg,
              C.GREEN_PALE, C.GREEN_DARK,
              { bold: true, sz: 10, border: false },
              { bold: true, sz: 11, center: true, border: false },
            );
            rowHeights[R] = { hpt: 22 }; R++;
          });
      }

      // ─── Spacer ───
      mergeRow(R, '', C.WHITE, C.WHITE, { border: false }); rowHeights[R] = { hpt: 20 }; R++;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // AUDIT LOG RECORDS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      mergeRow(R, '    AUDIT LOG RECORDS', C.GREEN_DARK, C.WHITE, { bold: true, sz: 13, border: false });
      rowHeights[R] = { hpt: 34 }; R++;

      // Column headers
      const COL_HEADERS = ['#', 'Timestamp', 'Entity', 'Entity ID', 'Action', 'Activity', 'Actor Name', 'Actor Email', 'IP Address', 'Changes (JSON)'];
      COL_HEADERS.forEach((h, c) => setCell(R, c, sc(h, C.GREEN_DARK, C.WHITE, { bold: true, center: true, sz: 10 })));
      rowHeights[R] = { hpt: 28 }; R++;

      // Data rows
      logs.forEach((log, i) => {
        const rowBg = i % 2 === 0 ? C.WHITE : C.ALT_ROW;
        const [abg, afg] = ACTION_COLORS[log.action] ?? ['F3F4F6', '000000'];
        const [ebg, efg] = ENTITY_COLORS[log.entity] ?? ['F3F4F6', '000000'];
        const changesStr = log.changes && Object.keys(log.changes).length ? JSON.stringify(log.changes) : '';

        setCell(R, 0, sc(i + 1,                        rowBg,  '000000', { center: true, sz: 10 }));
        setCell(R, 1, sc(formatDate(log.timestamp),    rowBg,  '000000', { sz: 10 }));
        setCell(R, 2, sc(log.entity,                   ebg,    efg,      { bold: true, sz: 10, center: true }));
        setCell(R, 3, sc(log.entity_id ?? '',          rowBg,  '000000', { center: true, sz: 10 }));
        setCell(R, 4, sc(log.action,                   abg,    afg,      { bold: true, sz: 10, center: true }));
        setCell(R, 5, sc(log.activity,                 rowBg,  '000000', { sz: 10, wrap: true }));
        setCell(R, 6, sc(log.actor_name,               rowBg,  '000000', { sz: 10 }));
        setCell(R, 7, sc(log.actor_email,              rowBg,  '6B7280', { sz: 10 }));
        setCell(R, 8, sc(log.ip_address ?? '',         rowBg,  '6B7280', { sz: 10, center: true }));
        setCell(R, 9, sc(changesStr,                   rowBg,  '000000', { sz: 9,  wrap: true }));
        // auto-size: longer content gets taller rows
        const actLen = (log.activity || '').length;
        const chgLen = changesStr.length;
        const maxLen = Math.max(actLen, chgLen);
        const rh = maxLen > 120 ? 48 : maxLen > 60 ? 36 : 28;
        rowHeights[R] = { hpt: rh }; R++;
      });

      // ─── Footer ───
      mergeRow(R, '', C.WHITE, C.WHITE, { border: false }); rowHeights[R] = { hpt: 16 }; R++;
      mergeRow(R, `   End of Report  •  ${logs.length} records exported  •  Generated ${dateStr} ${timeStr}`, C.GREEN_DARK, C.WHITE, { italic: true, sz: 9, center: true, border: false });
      rowHeights[R] = { hpt: 26 }; R++;

      // ─── Sheet metadata ───
      ws['!ref']    = XLSXStyle.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: R - 1, c: COLS - 1 } });
      ws['!cols']   = colWidths;
      ws['!rows']   = rowHeights;
      ws['!merges'] = merges;

      const wb = XLSXStyle.utils.book_new();
      XLSXStyle.utils.book_append_sheet(wb, ws, 'Audit Logs');
      XLSXStyle.writeFile(wb, `audit_logs_${dateStr}.xlsx`);

      toast.success(`Exported ${logs.length} audit log records to Excel.`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    setShowExportMenu(false);
    if (!logs.length) { toast.error('No logs to export.'); return; }
    const dateTag = new Date().toISOString().slice(0, 10);
    const body = `
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-label">Total Logs</div><div class="stat-value">${summary?.total ?? logs.length}</div></div>
        <div class="stat-card"><div class="stat-label">Last 24 Hours</div><div class="stat-value">${summary?.last_24h ?? 'N/A'}</div></div>
        <div class="stat-card"><div class="stat-label">User Actions</div><div class="stat-value">${summary?.by_entity?.User ?? 0}</div></div>
        <div class="stat-card"><div class="stat-label">Ticket Actions</div><div class="stat-value">${summary?.by_entity?.Ticket ?? 0}</div></div>
      </div>
      ${summary?.by_action && Object.keys(summary.by_action).length ? `<h2>Action Breakdown</h2><table><thead><tr><th>Action</th><th>Count</th></tr></thead><tbody>${Object.entries(summary.by_action).sort(([,a],[,b]) => (b as number) - (a as number)).map(([action, count]) => `<tr><td><strong>${action}</strong></td><td>${count}</td></tr>`).join('')}</tbody></table>` : ''}
      ${summary?.by_entity && Object.keys(summary.by_entity).length ? `<h2>Entity Breakdown</h2><table><thead><tr><th>Entity</th><th>Count</th></tr></thead><tbody>${Object.entries(summary.by_entity).sort(([,a],[,b]) => (b as number) - (a as number)).map(([entity, count]) => `<tr><td><strong>${entity}</strong></td><td>${count}</td></tr>`).join('')}</tbody></table>` : ''}
      <h2>Audit Log Records</h2>
      <table>
        <thead><tr><th>#</th><th>Timestamp</th><th>Entity</th><th>Action</th><th>Activity</th><th>Actor</th><th>IP Address</th></tr></thead>
        <tbody>
          ${logs.map((log, i) => `<tr><td>${i + 1}</td><td>${formatDate(log.timestamp)}</td><td><strong>${log.entity}</strong></td><td><strong>${log.action}</strong></td><td>${log.activity}</td><td>${log.actor_name}</td><td>${log.ip_address || ''}</td></tr>`).join('')}
        </tbody>
      </table>`;
    const html = buildPdfDocument('Audit Logs Report - Maptech Ticketing System', 'Audit Log Report', body, `${logs.length} records`);
    void openPrintWindow(html, `audit_logs_${dateTag}.pdf`)
      .then(() => toast.success('PDF downloaded.'))
      .catch((err) => {
        console.error('PDF export failed:', err);
        toast.error('PDF export failed.');
      });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setEntityFilter('');
    setActionFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const hasActiveFilters = entityFilter || actionFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audit Logs
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track all system activities and changes across the platform
          </p>
        </div>
        <div className="relative">
          <GreenButton
            onClick={() => setShowExportMenu((v) => !v)}
            isLoading={exporting}
            className="flex items-center gap-2 self-start md:self-auto"
          >
            <Download className="w-4 h-4" />
            Export Audit Logs
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
                  onClick={() => { setShowExportMenu(false); handleExport(); }}
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
            {retentionPolicy.audit_log_retention_days > 0
              ? `Audit logs are retained for ${retentionPolicy.audit_log_retention_days} day${retentionPolicy.audit_log_retention_days !== 1 ? 's' : ''} and automatically removed thereafter.`
              : 'Audit logs are retained indefinitely (no automatic cleanup).'}
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-gray-900 dark:bg-gray-700 text-white rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 opacity-70" />
            <p className="text-sm opacity-80">Total Logs</p>
          </div>
          <p className="text-2xl font-bold">{summary?.total?.toLocaleString() ?? '—'}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 opacity-70" />
            <p className="text-sm opacity-80">Last 24 Hours</p>
          </div>
          <p className="text-2xl font-bold">{summary?.last_24h?.toLocaleString() ?? '—'}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 opacity-70" />
            <p className="text-sm opacity-80">User Actions</p>
          </div>
          <p className="text-2xl font-bold">{summary?.by_entity?.User?.toLocaleString() ?? '0'}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 opacity-70" />
            <p className="text-sm opacity-80">Ticket Actions</p>
          </div>
          <p className="text-2xl font-bold">{summary?.by_entity?.Ticket?.toLocaleString() ?? '0'}</p>
        </div>
      </div>

      {/* Filters & Table */}
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
              {hasActiveFilters && (
                <span className="ml-1 w-2 h-2 bg-[#0E8F79] rounded-full" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500 transition-all"
              >
                <X className="w-3 h-3" />
                Clear Filters
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
              placeholder="Search logs by activity, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
            />
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Entity
              </label>
              <select
                value={entityFilter}
                onChange={(e) => { setEntityFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
              >
                {ENTITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
              >
                {ACTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
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
          <table className="w-full min-w-[980px] text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-4 py-4 font-semibold">Time</th>
                <th className="px-4 py-4 font-semibold">Entity</th>
                <th className="px-4 py-4 font-semibold">Activity</th>
                <th className="px-4 py-4 font-semibold">Action</th>
                <th className="px-4 py-4 font-semibold">Actor</th>
                <th className="px-4 py-4 font-semibold">IP</th>
                <th className="px-4 py-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 text-gray-300 dark:text-gray-600 animate-spin" />
                      <span className="text-gray-400 dark:text-gray-500">Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Activity className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                      <span className="text-gray-400 dark:text-gray-500 text-base">
                        No audit logs found
                      </span>
                      <span className="text-gray-400 dark:text-gray-600 text-xs">
                        {hasActiveFilters || searchTerm
                          ? 'Try adjusting your filters or search term'
                          : 'System activities will appear here as they occur'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${entityBadge(log.entity)}`}>
                        {log.entity}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-gray-900 dark:text-gray-100 text-sm truncate" title={log.activity}>
                        {log.activity}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${actionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-gray-100 text-sm font-medium truncate max-w-[120px] sm:max-w-[180px]" title={log.actor_name}>
                          {log.actor_name}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500 text-xs truncate max-w-[120px] sm:max-w-[180px]" title={log.actor_email}>
                          {log.actor_email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {log.ip_address || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-gray-400 hover:text-[#0E8F79] dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, logs.length)} of {logs.length} logs
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let page: number;
                if (totalPages <= 7) {
                  page = i + 1;
                } else if (currentPage <= 4) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  page = totalPages - 6 + i;
                } else {
                  page = currentPage - 3 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-gradient-to-r from-[#63D44A] to-[#0E8F79] text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedLog && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-[#63D44A]/10 to-[#0E8F79]/10 dark:from-[#63D44A]/5 dark:to-[#0E8F79]/5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Log Details</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Log #{selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="px-4 sm:px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Timestamp</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">IP Address</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-gray-100">{selectedLog.ip_address || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Entity</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${entityBadge(selectedLog.entity)}`}>
                    {selectedLog.entity}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Action</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${actionBadge(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Actor</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{selectedLog.actor_name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{selectedLog.actor_email}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Activity</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 break-words">
                  {selectedLog.activity}
                </p>
              </div>

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Changes</p>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                    <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
