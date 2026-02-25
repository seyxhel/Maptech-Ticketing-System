import { useRef } from 'react';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { GreenButton } from '../components/ui/GreenButton';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  FileDown,
} from 'lucide-react';
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
} from 'recharts';

const monthlyData = [
  { name: 'Jan', tickets: 45, resolved: 40 },
  { name: 'Feb', tickets: 52, resolved: 48 },
  { name: 'Mar', tickets: 61, resolved: 55 },
  { name: 'Apr', tickets: 55, resolved: 52 },
  { name: 'May', tickets: 72, resolved: 65 },
  { name: 'Jun', tickets: 68, resolved: 64 },
];

const slaData = [
  { name: 'Jan', withinSla: 92, breached: 8 },
  { name: 'Feb', withinSla: 88, breached: 12 },
  { name: 'Mar', withinSla: 95, breached: 5 },
  { name: 'Apr', withinSla: 90, breached: 10 },
  { name: 'May', withinSla: 87, breached: 13 },
  { name: 'Jun', withinSla: 93, breached: 7 },
];

const categoryData = [
  { name: 'Network', count: 38 },
  { name: 'Hardware', count: 25 },
  { name: 'Software', count: 42 },
  { name: 'Email', count: 18 },
  { name: 'Security', count: 12 },
  { name: 'Other', count: 8 },
];

export function Reports() {
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = () => {
    // Use browser print API to generate PDF
    const printContents = reportRef.current;
    if (!printContents) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admin Reports - Maptech Ticketing System</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1f2937; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          h2 { font-size: 18px; margin: 24px 0 12px; color: #374151; }
          .subtitle { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
          .header { border-bottom: 2px solid #3BC25B; padding-bottom: 16px; margin-bottom: 24px; }
          .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
          .stat-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
          .stat-value { font-size: 28px; font-weight: 700; color: #111827; }
          .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .table th, .table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
          .table th { background: #f9fafb; font-weight: 600; color: #374151; text-transform: uppercase; font-size: 11px; }
          .timestamp { font-size: 11px; color: #9ca3af; text-align: right; margin-top: 32px; }
          .logo { color: #0E8F79; font-weight: 700; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1><span class="logo">Maptech</span> — Admin Reports</h1>
          <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString()}</p>
        </div>
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-label">Total Tickets</div><div class="stat-value">353</div></div>
          <div class="stat-card"><div class="stat-label">Resolved</div><div class="stat-value">324</div></div>
          <div class="stat-card"><div class="stat-label">Avg Resolution</div><div class="stat-value">4.2h</div></div>
          <div class="stat-card"><div class="stat-label">SLA Compliance</div><div class="stat-value">91%</div></div>
        </div>
        <h2>Monthly Ticket Volume</h2>
        <table class="table">
          <thead><tr><th>Month</th><th>Total Tickets</th><th>Resolved</th><th>Resolution Rate</th></tr></thead>
          <tbody>
            ${monthlyData.map((d) => `<tr><td>${d.name}</td><td>${d.tickets}</td><td>${d.resolved}</td><td>${Math.round((d.resolved / d.tickets) * 100)}%</td></tr>`).join('')}
          </tbody>
        </table>
        <h2>SLA Compliance</h2>
        <table class="table">
          <thead><tr><th>Month</th><th>Within SLA (%)</th><th>Breached (%)</th></tr></thead>
          <tbody>
            ${slaData.map((d) => `<tr><td>${d.name}</td><td>${d.withinSla}%</td><td>${d.breached}%</td></tr>`).join('')}
          </tbody>
        </table>
        <h2>Tickets by Category</h2>
        <table class="table">
          <thead><tr><th>Category</th><th>Count</th></tr></thead>
          <tbody>
            ${categoryData.map((d) => `<tr><td>${d.name}</td><td>${d.count}</td></tr>`).join('')}
          </tbody>
        </table>
        <p class="timestamp">Maptech Information Solutions Inc. — Confidential Report</p>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  };

  return (
    <div className="space-y-6" ref={reportRef}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-500 dark:text-gray-400">Analytics and performance overview</p>
        </div>
        <GreenButton onClick={handleExportPDF}>
          <FileDown className="w-4 h-4 mr-2" /> Export Report
        </GreenButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Tickets" value="353" icon={BarChart3} color="blue" trend={{ value: 12, isPositive: true }} />
        <StatCard title="Resolved" value="324" icon={TrendingUp} color="green" trend={{ value: 8, isPositive: true }} />
        <StatCard title="Avg Resolution" value="4.2h" icon={Clock} color="orange" trend={{ value: 15, isPositive: true }} />
        <StatCard title="SLA Compliance" value="91%" icon={Users} color="purple" trend={{ value: 3, isPositive: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card accent>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Monthly Ticket Volume</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
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
              <LineChart data={slaData}>
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
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#0E8F79" radius={[0, 4, 4, 0]} name="Tickets" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
