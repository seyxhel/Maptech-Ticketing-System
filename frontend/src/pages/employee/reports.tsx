import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { fetchTickets } from '../../services/api';
import type { BackendTicket } from '../../services/api';
import { BarChart3, FileDown, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { toast } from 'sonner';
import { buildPdfDocument, openPrintWindow } from '../../utils/pdfTemplate';

export default function EmployeeReports() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<BackendTicket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const raw = await fetchTickets();
        if (cancelled) return;
        setTickets(raw);
      } catch {
        if (!cancelled) setTickets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const myId = user?.id ?? null;
  const myTickets = (tickets || []).filter((t) => t.assigned_to?.id === myId);

  const assigned = myTickets.filter((t) => t.status === 'open' || (t.status === 'open' && t.assigned_to));
  const ongoing = myTickets.filter((t) => t.status === 'in_progress');
  const resolved = myTickets.filter((t) => t.status === 'pending_closure' || t.status === 'closed');

  const pieData = useMemo(() => [
    { name: 'Assigned', value: assigned.length },
    { name: 'Ongoing', value: ongoing.length },
    { name: 'Resolved', value: resolved.length },
  ], [assigned.length, ongoing.length, resolved.length]);

  const COLORS = ['#60A5FA', '#F59E0B', '#10B981'];

  // Monthly handled tickets (last 6 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { key: string; name: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const name = d.toLocaleString('default', { month: 'short' });
      const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, name, start, end });
    }
    return months.map((m) => {
      const created = myTickets.filter((t) => {
        const c = new Date(t.created_at);
        return c >= m.start && c < m.end;
      }).length;
      const closed = myTickets.filter((t) => {
        const u = new Date(t.updated_at);
        return u >= m.start && u < m.end && (t.status === 'pending_closure' || t.status === 'closed');
      }).length;
      return { name: m.name, created, closed };
    });
  }, [myTickets]);

  const handleExportCSV = () => {
    const rows = [['stf_no', 'status', 'priority', 'client', 'created_at', 'updated_at']];
    for (const t of myTickets) {
      rows.push([t.stf_no, t.status, t.priority || '', t.client || '', t.created_at || '', t.updated_at || '']);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee_${user?.id ?? 'me'}_tickets_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    setShowExportMenu(false);
    const dateTag = new Date().toISOString().slice(0,10);
    const body = `
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-label">Assigned</div><div class="stat-value">${assigned.length}</div></div>
        <div class="stat-card"><div class="stat-label">Ongoing</div><div class="stat-value">${ongoing.length}</div></div>
        <div class="stat-card"><div class="stat-label">Resolved</div><div class="stat-value">${resolved.length}</div></div>
      </div>
      <h3>Recent Tickets</h3>
      <table>
        <thead><tr><th>STF</th><th>Status</th><th>Created</th></tr></thead>
        <tbody>
          ${myTickets.slice(0,20).map((t) => `<tr><td>${t.stf_no}</td><td>${t.status}</td><td>${new Date(t.created_at).toLocaleDateString()}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
    const html = buildPdfDocument('Employee Reports - Maptech Ticketing System', 'Employee Reports', body, `${myTickets.length} tickets`);
    void openPrintWindow(html, `employee_reports_${dateTag}.pdf`).then(() => toast.success('PDF downloaded')).catch(() => toast.error('PDF export failed'));
  };

  const renderList = (items: BackendTicket[]) => (
    <div className="space-y-2">
      {items.length === 0 && <div className="text-sm text-gray-500">No tickets</div>}
      {items.slice(0, 6).map((t) => (
        <div key={t.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
          <div className="flex-1">
            <div className="font-mono text-xs font-bold text-gray-900 dark:text-white">{t.stf_no}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 truncate">{t.description_of_problem || t.type_of_service_detail?.name || 'No description'}</div>
          </div>
          <div className="ml-4 text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-500 dark:text-gray-400">Tickets assigned / in progress / resolved by you</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowExportMenu((v) => !v)} className="inline-flex items-center gap-2 px-3 py-2 bg-[#0E8F79] text-white rounded-md">
            <FileDown className="w-4 h-4" /> Export
            <ChevronDown className="w-4 h-4" />
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 mt-2 w-44 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-50 overflow-hidden">
                <button onClick={handleExportPDF} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><FileDown className="w-4 h-4 text-red-500" /> Export PDF</button>
                <button onClick={handleExportCSV} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><FileSpreadsheet className="w-4 h-4 text-[#0E8F79]" /> Export CSV</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Assigned" value={loading ? '—' : String(assigned.length)} icon={BarChart3} color="blue" />
        <StatCard title="Ongoing" value={loading ? '—' : String(ongoing.length)} icon={BarChart3} color="orange" />
        <StatCard title="Resolved" value={loading ? '—' : String(resolved.length)} icon={BarChart3} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Tickets by Status</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">Employee overview</span>
          </div>
          <div className="h-72">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">No ticket data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.map((p, i) => ({ ...p, color: COLORS[i % COLORS.length] }))}
                    cx="50%"
                    cy="46%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: '#111827',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#6b7280', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold mb-4">Monthly Handling</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="created" fill="#3BC25B" name="Created" />
                <Bar dataKey="closed" fill="#0E8F79" name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold mb-4">Recent Resolved</h3>
          {loading ? <div className="text-sm text-gray-500">Loading…</div> : renderList(resolved)}
        </Card>
      </div>
    </div>
  );
}
