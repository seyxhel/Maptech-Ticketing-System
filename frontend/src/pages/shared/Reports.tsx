import { useRef, useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { GreenButton } from '../../components/ui/GreenButton';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  FileDown,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import XLSXStyle from 'xlsx-js-style';
import { buildPdfDocument, openPrintWindow } from '../../utils/pdfTemplate';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { fetchTickets, fetchTicketStats } from '../../services/api';
import type { BackendTicket, TicketStats } from '../../services/api';

// Placeholders until data loads
const emptyMonthly: { name: string; tickets: number; resolved: number }[] = [];
const emptySla: { name: string; withinSla: number; breached: number }[] = [];
const emptyCategory: { name: string; count: number }[] = [];
const ROLE_COLORS = ['#0E8F79', '#3BC25B', '#3B82F6', '#F59E0B', '#6B7280'];

function normalizeRole(value: string | null | undefined) {
  return (value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function Reports() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [tickets, setTickets] = useState<BackendTicket[] | null>(null);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [monthlyData, setMonthlyData] = useState(emptyMonthly);
  const [slaData, setSlaData] = useState(emptySla);
  const [categoryData, setCategoryData] = useState(emptyCategory);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // ── Computed stat values (shared by both export paths) ──
  const totalTicketsVal = stats?.total ?? (tickets ? tickets.length : 0);
  const resolvedVal = stats?.pending_closure ?? (tickets ? tickets.filter((t) => ['pending_closure', 'closed', 'resolved'].includes(t.status)).length : 0);
  const avgResVal = stats?.avg_resolution_time != null ? `${Math.round(stats.avg_resolution_time)}h` : 'N/A';
  const slaComplianceVal = slaData.length ? `${Math.round(slaData.reduce((s, x) => s + x.withinSla, 0) / slaData.length)}%` : 'N/A';

  const creatorRoleData = useMemo(() => {
    if (!tickets) return [] as { name: string; value: number; color: string }[];
    const buckets: Record<string, number> = {};
    tickets.forEach((t) => {
      const role = normalizeRole(String(t.created_by?.role || 'other'));
      const label = role === 'admin'
        ? 'Supervisor'
        : role === 'sales'
          ? 'Sales'
          : role === 'employee'
            ? 'Technical'
            : role === 'superadmin'
              ? 'Superadmin'
              : 'Other';
      buckets[label] = (buckets[label] || 0) + 1;
    });

    return Object.entries(buckets)
      .map(([name, value], index) => ({ name, value, color: ROLE_COLORS[index % ROLE_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [tickets]);

  const supervisorTicketData = useMemo(() => {
    if (!tickets) return [] as { name: string; tickets: number }[];
    const buckets: Record<string, number> = {};
    tickets.forEach((t) => {
      if (!t.supervisor) return;
      const name = `${t.supervisor.first_name || ''} ${t.supervisor.last_name || ''}`.trim() || t.supervisor.username || `Supervisor #${t.supervisor.id}`;
      buckets[name] = (buckets[name] || 0) + 1;
    });

    return Object.entries(buckets)
      .map(([name, value]) => ({ name, tickets: value }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 10);
  }, [tickets]);

  const salesCreatedData = useMemo(() => {
    if (!tickets) return [] as { name: string; tickets: number }[];
    const buckets: Record<string, number> = {};
    tickets.forEach((t) => {
      if (normalizeRole(t.created_by?.role) !== 'sales') return;
      const name = `${t.created_by.first_name || ''} ${t.created_by.last_name || ''}`.trim() || t.created_by.username || `Sales #${t.created_by.id}`;
      buckets[name] = (buckets[name] || 0) + 1;
    });

    return Object.entries(buckets)
      .map(([name, value]) => ({ name, tickets: value }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 10);
  }, [tickets]);

  const supervisorTicketTotal = useMemo(() => supervisorTicketData.reduce((sum, item) => sum + item.tickets, 0), [supervisorTicketData]);
  const salesCreatedTotal = useMemo(() => salesCreatedData.reduce((sum, item) => sum + item.tickets, 0), [salesCreatedData]);

  const handleExportPDF = () => {
    setShowExportMenu(false);
    const printContents = reportRef.current;
    if (!printContents) return;
    const dateTag = new Date().toISOString().slice(0, 10);
    const body = `
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-label">Total Tickets</div><div class="stat-value">${totalTicketsVal}</div></div>
        <div class="stat-card"><div class="stat-label">Resolved</div><div class="stat-value">${resolvedVal}</div></div>
        <div class="stat-card"><div class="stat-label">Avg Resolution</div><div class="stat-value">${avgResVal}</div></div>
        <div class="stat-card"><div class="stat-label">SLA Compliance</div><div class="stat-value">${slaComplianceVal}</div></div>
      </div>
      <h2>Monthly Ticket Volume</h2>
      <table>
        <thead><tr><th>Month</th><th>Total Tickets</th><th>Resolved</th><th>Resolution Rate</th></tr></thead>
        <tbody>
          ${monthlyData.map((d) => `<tr><td>${d.name}</td><td>${d.tickets}</td><td>${d.resolved}</td><td>${d.tickets > 0 ? Math.round((d.resolved / d.tickets) * 100) : 0}%</td></tr>`).join('')}
        </tbody>
      </table>
      <h2>SLA Compliance</h2>
      <table>
        <thead><tr><th>Month</th><th>Within SLA (%)</th><th>Breached (%)</th></tr></thead>
        <tbody>
          ${slaData.map((d) => `<tr><td>${d.name}</td><td>${d.withinSla}%</td><td>${d.breached}%</td></tr>`).join('')}
        </tbody>
      </table>
      <h2>Tickets by Category</h2>
      <table>
        <thead><tr><th>Category</th><th>Count</th></tr></thead>
        <tbody>
          ${categoryData.map((d) => `<tr><td>${d.name}</td><td>${d.count}</td></tr>`).join('')}
        </tbody>
      </table>
      <h2>Tickets Created by Role</h2>
      <table>
        <thead><tr><th>Role</th><th>Ticket Count</th></tr></thead>
        <tbody>
          ${creatorRoleData.map((d) => `<tr><td>${d.name}</td><td>${d.value}</td></tr>`).join('')}
        </tbody>
      </table>
      <h2>Supervisor Ticket Ownership</h2>
      <table>
        <thead><tr><th>Supervisor</th><th>Ticket Count</th></tr></thead>
        <tbody>
          ${supervisorTicketData.map((d) => `<tr><td>${d.name}</td><td>${d.tickets}</td></tr>`).join('')}
        </tbody>
      </table>
      <h2>Sales Ticket Creation</h2>
      <table>
        <thead><tr><th>Sales User</th><th>Created Tickets</th></tr></thead>
        <tbody>
          ${salesCreatedData.map((d) => `<tr><td>${d.name}</td><td>${d.tickets}</td></tr>`).join('')}
        </tbody>
      </table>`;
    const html = buildPdfDocument('Supervisor Reports - Maptech Ticketing System', 'Supervisor Reports', body, `${totalTicketsVal} total tickets`);
    void openPrintWindow(html, `supervisor_reports_${dateTag}.pdf`)
      .then(() => toast.success('PDF downloaded.'))
      .catch((err) => {
        console.error('PDF export failed:', err);
        toast.error('PDF export failed.');
      });
  };

  // ── XLSX Export ──
  const handleExportXLSX = () => {
    setShowExportMenu(false);
    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      const C = {
        GREEN_DARK: '154734', GREEN_MID: '2FAD52', GREEN_PALE: 'E8FAF0',
        GREEN_TEXT: '065F46', WHITE: 'FFFFFF', ALT_ROW: 'F0FDF4', BORDER_CLR: 'D1FAE5',
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
      const colWidths = [{ wch: 6 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 6 }];
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
      mergeRow(R, 'MAPTECH TICKETING SYSTEM  —  REPORTS', C.GREEN_DARK, C.WHITE, { bold: true, sz: 18, center: true });
      rowHeights[R] = { hpt: 52 }; R++;
      mergeRow(R, 'Analytics and Performance Overview', C.GREEN_MID, '000000', { italic: true, sz: 11, center: true });
      rowHeights[R] = { hpt: 28 }; R++;

      // Info
      twoCol(R, '   Generated', `${dateStr}  ${timeStr}`); rowHeights[R] = { hpt: 22 }; R++;
      twoCol(R, '   Total Tickets', String(totalTicketsVal)); rowHeights[R] = { hpt: 22 }; R++;

      // Spacer
      mergeRow(R, '', C.WHITE, C.WHITE, { border: false }); rowHeights[R] = { hpt: 16 }; R++;

      // ─── SUMMARY ───
      mergeRow(R, '     SUMMARY', C.GREEN_DARK, C.WHITE, { bold: true, sz: 13 }); rowHeights[R] = { hpt: 32 }; R++;
      twoCol(R, '    Total Tickets', String(totalTicketsVal), { sz: 11 }, { bold: true, sz: 12 }); rowHeights[R] = { hpt: 24 }; R++;
      twoCol(R, '    Resolved', String(resolvedVal), { sz: 11 }, { bold: true, sz: 12 }); rowHeights[R] = { hpt: 24 }; R++;
      twoCol(R, '    Avg Resolution Time', avgResVal, { sz: 11 }, { bold: true, sz: 12 }); rowHeights[R] = { hpt: 24 }; R++;
      twoCol(R, '    SLA Compliance', slaComplianceVal, { sz: 11 }, { bold: true, sz: 12 }); rowHeights[R] = { hpt: 24 }; R++;

      // Spacer
      mergeRow(R, '', C.WHITE, C.WHITE, { border: false }); rowHeights[R] = { hpt: 20 }; R++;

      // ─── MONTHLY TICKET VOLUME ───
      mergeRow(R, '     MONTHLY TICKET VOLUME', C.GREEN_DARK, C.WHITE, { bold: true, sz: 13 }); rowHeights[R] = { hpt: 34 }; R++;
      const mHeaders = ['#', 'Month', '', 'Total Tickets', '', 'Resolved', '', 'Resolution Rate', '', ''];
      mHeaders.forEach((h, c) => setCell(R, c, sc(h, C.GREEN_MID, '000000', { bold: true, sz: 10, center: true })));
      rowHeights[R] = { hpt: 28 }; R++;
      monthlyData.forEach((d, i) => {
        const bg = i % 2 === 0 ? C.WHITE : C.ALT_ROW;
        const rate = d.tickets > 0 ? `${Math.round((d.resolved / d.tickets) * 100)}%` : '0%';
        setCell(R, 0, sc(i + 1, bg, '000000', { center: true, sz: 10 }));
        setCell(R, 1, sc(d.name, bg, '000000', { sz: 10 })); setCell(R, 2, sc('', bg, bg));
        merges.push({ s: { r: R, c: 1 }, e: { r: R, c: 2 } });
        setCell(R, 3, sc(d.tickets, bg, '000000', { center: true, sz: 10 })); setCell(R, 4, sc('', bg, bg));
        merges.push({ s: { r: R, c: 3 }, e: { r: R, c: 4 } });
        setCell(R, 5, sc(d.resolved, bg, C.GREEN_TEXT, { center: true, bold: true, sz: 10 })); setCell(R, 6, sc('', bg, bg));
        merges.push({ s: { r: R, c: 5 }, e: { r: R, c: 6 } });
        setCell(R, 7, sc(rate, bg, '000000', { center: true, sz: 10 })); setCell(R, 8, sc('', bg, bg)); setCell(R, 9, sc('', bg, bg));
        merges.push({ s: { r: R, c: 7 }, e: { r: R, c: 9 } });
        rowHeights[R] = { hpt: 26 }; R++;
      });

      // Spacer
      mergeRow(R, '', C.WHITE, C.WHITE, { border: false }); rowHeights[R] = { hpt: 20 }; R++;

      // ─── SLA COMPLIANCE ───
      mergeRow(R, '     SLA COMPLIANCE TREND', C.GREEN_DARK, C.WHITE, { bold: true, sz: 13 }); rowHeights[R] = { hpt: 34 }; R++;
      const sHeaders = ['#', 'Month', '', 'Within SLA (%)', '', 'Breached (%)', '', '', '', ''];
      sHeaders.forEach((h, c) => setCell(R, c, sc(h, C.GREEN_MID, '000000', { bold: true, sz: 10, center: true })));
      rowHeights[R] = { hpt: 28 }; R++;
      slaData.forEach((d, i) => {
        const bg = i % 2 === 0 ? C.WHITE : C.ALT_ROW;
        setCell(R, 0, sc(i + 1, bg, '000000', { center: true, sz: 10 }));
        setCell(R, 1, sc(d.name, bg, '000000', { sz: 10 })); setCell(R, 2, sc('', bg, bg));
        merges.push({ s: { r: R, c: 1 }, e: { r: R, c: 2 } });
        setCell(R, 3, sc(`${d.withinSla}%`, bg, C.GREEN_TEXT, { center: true, bold: true, sz: 10 })); setCell(R, 4, sc('', bg, bg));
        merges.push({ s: { r: R, c: 3 }, e: { r: R, c: 4 } });
        setCell(R, 5, sc(`${d.breached}%`, bg, d.breached > 0 ? 'DC2626' : '000000', { center: true, sz: 10 })); setCell(R, 6, sc('', bg, bg));
        merges.push({ s: { r: R, c: 5 }, e: { r: R, c: 6 } });
        setCell(R, 7, sc('', bg, bg)); setCell(R, 8, sc('', bg, bg)); setCell(R, 9, sc('', bg, bg));
        merges.push({ s: { r: R, c: 7 }, e: { r: R, c: 9 } });
        rowHeights[R] = { hpt: 26 }; R++;
      });

      // Spacer
      mergeRow(R, '', C.WHITE, C.WHITE, { border: false }); rowHeights[R] = { hpt: 20 }; R++;

      // ─── TICKETS BY CATEGORY ───
      mergeRow(R, '     TICKETS BY CATEGORY', C.GREEN_DARK, C.WHITE, { bold: true, sz: 13 }); rowHeights[R] = { hpt: 34 }; R++;
      const cHeaders = ['#', 'Category', '', '', '', '', 'Count', '', '', ''];
      cHeaders.forEach((h, c) => setCell(R, c, sc(h, C.GREEN_MID, '000000', { bold: true, sz: 10, center: true })));
      rowHeights[R] = { hpt: 28 }; R++;
      categoryData.forEach((d, i) => {
        const bg = i % 2 === 0 ? C.WHITE : C.ALT_ROW;
        setCell(R, 0, sc(i + 1, bg, '000000', { center: true, sz: 10 }));
        setCell(R, 1, sc(d.name, bg, '000000', { sz: 10 }));
        for (let c = 2; c < 6; c++) setCell(R, c, sc('', bg, bg));
        merges.push({ s: { r: R, c: 1 }, e: { r: R, c: 5 } });
        setCell(R, 6, sc(d.count, bg, C.GREEN_TEXT, { center: true, bold: true, sz: 11 }));
        for (let c = 7; c < COLS; c++) setCell(R, c, sc('', bg, bg));
        merges.push({ s: { r: R, c: 6 }, e: { r: R, c: COLS - 1 } });
        rowHeights[R] = { hpt: 26 }; R++;
      });

      // Spacer
      mergeRow(R, '', C.WHITE, C.WHITE, { border: false }); rowHeights[R] = { hpt: 14 }; R++;

      // Footer
      mergeRow(R, `   End of Report  •  Generated ${dateStr} ${timeStr}  •  Maptech Information Solutions Inc.`, C.GREEN_DARK, C.WHITE, { italic: true, sz: 9, center: true, border: false });
      rowHeights[R] = { hpt: 26 }; R++;

      // Sheet metadata
      ws['!ref'] = XLSXStyle.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: R - 1, c: COLS - 1 } });
      ws['!cols'] = colWidths;
      ws['!rows'] = rowHeights;
      ws['!merges'] = merges;

      const wb = XLSXStyle.utils.book_new();
      XLSXStyle.utils.book_append_sheet(wb, ws, 'Reports');
      XLSXStyle.writeFile(wb, `reports_${dateStr}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [rawTickets, statsResp] = await Promise.all([fetchTickets(), fetchTicketStats().catch(() => null)]);
        if (cancelled) return;
        setTickets(rawTickets);
        setStats(statsResp as TicketStats ?? null);

        // Monthly data: last 6 months, by created_at
        const now = new Date();
        const months: { key: string; name: string; start: Date; end: Date }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const name = d.toLocaleString('default', { month: 'short' });
          const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0);
          months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, name, start, end });
        }

        const monthly = months.map((m) => {
          const ticketsIn = rawTickets.filter((t) => {
            const created = new Date(t.created_at);
            return created >= m.start && created < m.end;
          });
          const resolvedIn = ticketsIn.filter((t) => ['pending_closure', 'closed', 'resolved', 'closed'].includes(t.status) || t.status === 'pending_closure');
          return { name: m.name, tickets: ticketsIn.length, resolved: resolvedIn.length };
        });
        setMonthlyData(monthly);

        // SLA data: within vs breached per month among resolved tickets
        const slaMonthly = months.map((m) => {
          const resolved = rawTickets.filter((t) => {
            const updated = new Date(t.updated_at);
            return updated >= m.start && updated < m.end && (t.status === 'pending_closure' || t.status === 'closed' || t.status === 'resolved');
          });
          let within = 0;
          for (const t of resolved) {
            const created = new Date(t.created_at).getTime();
            const updated = new Date(t.updated_at).getTime();
            const slaDays = t.sla_estimated_days ?? t.type_of_service_detail?.estimated_resolution_days ?? 0;
            const allowed = slaDays * 24 * 60 * 60 * 1000;
            if (allowed === 0) {
              within += 1; // unknown SLA treated as within
            } else if ((updated - created) <= allowed) {
              within += 1;
            }
          }
          const total = resolved.length;
          const withinPct = total === 0 ? 100 : Math.round((within / total) * 100);
          const breachedPct = 100 - withinPct;
          return { name: m.name, withinSla: withinPct, breached: breachedPct };
        });
        setSlaData(slaMonthly);

        // Category data: group by device_equipment (fallback to 'Unspecified')
        const counts: Record<string, number> = {};
        for (const t of rawTickets) {
          const key = (t.device_equipment || t.type_of_service_detail?.name || 'Unspecified') as string;
          counts[key] = (counts[key] || 0) + 1;
        }
        const catArr = Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 12);
        setCategoryData(catArr);
      } catch (err) {
        // ignore; charts will stay empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6" ref={reportRef}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-500 dark:text-gray-400">Analytics and performance overview</p>
        </div>
        <div className="relative">
          <GreenButton onClick={() => setShowExportMenu((v) => !v)}>
            <FileDown className="w-4 h-4 mr-2" /> Export Report
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
                  onClick={handleExportXLSX}
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

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard title="Total Tickets" value={loading ? '—' : String(totalTicketsVal)} icon={BarChart3} color="blue" trend={{ value: totalTicketsVal, isPositive: true }} />
        <StatCard title="Resolved" value={loading ? '—' : String(resolvedVal)} icon={TrendingUp} color="green" trend={{ value: resolvedVal, isPositive: true }} />
        <StatCard title="Avg Resolution" value={loading ? '—' : avgResVal} icon={Clock} color="orange" trend={{ value: 0, isPositive: true }} />
        <StatCard title="SLA Compliance" value={loading ? '—' : slaComplianceVal} icon={Users} color="purple" trend={{ value: 0, isPositive: true }} />
        <StatCard title="Supervisor-Owned" value={loading ? '—' : String(supervisorTicketTotal)} icon={Users} color="blue" trend={{ value: supervisorTicketTotal, isPositive: true }} />
        <StatCard title="Sales-Created" value={loading ? '—' : String(salesCreatedTotal)} icon={TrendingUp} color="green" trend={{ value: salesCreatedTotal, isPositive: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card accent>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Monthly Ticket Volume</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loading ? [] : monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="tickets" fill="#3BC25B" radius={[4, 4, 0, 0]} name="Total Tickets" />
                <Bar dataKey="resolved" fill="#0E8F79" radius={[4, 4, 0, 0]} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card accent>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">SLA Compliance Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={loading ? [] : slaData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="withinSla" stroke="#3BC25B" strokeWidth={2} dot={{ fill: '#3BC25B' }} name="Within SLA %" />
                <Line type="monotone" dataKey="breached" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} name="Breached %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card accent>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tickets by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loading ? [] : categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#0E8F79" radius={[0, 4, 4, 0]} name="Tickets" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card accent>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tickets Created by Role</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={loading ? [] : creatorRoleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(loading ? [] : creatorRoleData).map((entry, i) => (
                    <Cell key={`${entry.name}-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
