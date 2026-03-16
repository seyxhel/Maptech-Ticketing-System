import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { GreenButton } from '../../components/ui/GreenButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Ticket, AlertTriangle, Users, ShieldCheck, Plus, Pencil, Trash2, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchTickets,
  fetchTicketStats,
  fetchUsers,
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../../services/api';
import type { AnnouncementData, BackendTicket, BackendUser, TicketStats } from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend } from
'recharts';

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#3BC25B',
  Medium: '#F59E0B',
  High: '#EF4444',
  Critical: '#991B1B',
};

function formatLabel(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalize(value: string | null | undefined) {
  return (value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function dateOnlyIso(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function buildWeekData(tickets: BackendTicket[]) {
  const today = startOfDay(new Date());
  const counts: Record<string, number> = {};

  for (const ticket of tickets) {
    const createdAt = new Date(ticket.created_at);
    if (Number.isNaN(createdAt.getTime())) continue;
    counts[dateOnlyIso(createdAt.toISOString())] = (counts[dateOnlyIso(createdAt.toISOString())] || 0) + 1;
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      tickets: counts[key] || 0,
    };
  });
}

function buildMonthData(tickets: BackendTicket[]) {
  const today = startOfDay(new Date());
  const buckets = [0, 0, 0, 0];

  for (const ticket of tickets) {
    const createdAt = startOfDay(new Date(ticket.created_at));
    if (Number.isNaN(createdAt.getTime())) continue;
    const dayDiff = Math.floor((today.getTime() - createdAt.getTime()) / 86400000);
    if (dayDiff < 0 || dayDiff > 27) continue;
    const bucket = 3 - Math.floor(dayDiff / 7);
    buckets[bucket] += 1;
  }

  return buckets.map((count, index) => ({
    name: `Wk ${index + 1}`,
    tickets: count,
  }));
}

function buildYearData(tickets: BackendTicket[]) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const buckets = Array.from({ length: 12 }, () => 0);

  for (const ticket of tickets) {
    const createdAt = new Date(ticket.created_at);
    if (Number.isNaN(createdAt.getTime())) continue;
    if (createdAt.getFullYear() !== currentYear) continue;
    buckets[createdAt.getMonth()] += 1;
  }

  return buckets.map((count, index) => ({
    name: new Date(currentYear, index, 1).toLocaleDateString('en-US', { month: 'short' }),
    tickets: count,
  }));
}

function getAverageResolutionHours(tickets: BackendTicket[], priorityName: string) {
  const normalizedPriority = normalize(priorityName);
  const resolved = tickets.filter((ticket) => {
    const status = normalize(ticket.status);
    return normalize(ticket.priority) === normalizedPriority && (status === 'resolved' || status === 'closed');
  });

  if (resolved.length === 0) return null;

  let total = 0;
  let count = 0;
  for (const ticket of resolved) {
    const start = new Date(ticket.created_at).getTime();
    const end = new Date(ticket.updated_at || ticket.created_at).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) continue;
    total += (end - start) / 3600000;
    count += 1;
  }

  if (count === 0) return null;
  return total / count;
}

function formatDuration(hours: number | null) {
  if (hours == null) return 'N/A';
  if (hours < 24) return `${hours.toFixed(1)} hrs`;
  return `${(hours / 24).toFixed(1)} days`;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [tickets, setTickets] = useState<BackendTicket[]>([]);
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // ── Announcement management state ──
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    announcement_type: 'info' as string,
    visibility: 'all' as string,
    is_active: true,
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    void loadAnnouncements();
    void loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoadingDashboard(true);
    try {
      const [ticketData, userData, statsData] = await Promise.all([
        fetchTickets(),
        fetchUsers().catch(() => []),
        fetchTicketStats().catch(() => null),
      ]);
      setTickets(ticketData);
      setUsers(userData);
      setStats(statsData);
    } catch {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoadingDashboard(false);
    }
  }

  async function loadAnnouncements() {
    try {
      const data = await fetchAnnouncements();
      setAnnouncements(data);
    } catch {
      // silent
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      announcement_type: 'info',
      visibility: 'all',
      is_active: true,
      start_date: '',
      end_date: '',
    });
    setEditingId(null);
    setShowForm(false);
  }

  function openEditForm(ann: AnnouncementData) {
    setFormData({
      title: ann.title,
      description: ann.description,
      announcement_type: ann.announcement_type,
      visibility: ann.visibility,
      is_active: ann.is_active,
      start_date: ann.start_date ? ann.start_date.slice(0, 16) : '',
      end_date: ann.end_date ? ann.end_date.slice(0, 16) : '',
    });
    setEditingId(ann.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required.');
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        announcement_type: formData.announcement_type,
        visibility: formData.visibility,
        is_active: formData.is_active,
      };
      if (formData.start_date) payload.start_date = new Date(formData.start_date).toISOString();
      if (formData.end_date) payload.end_date = new Date(formData.end_date).toISOString();
      else payload.end_date = null;

      if (editingId) {
        await updateAnnouncement(editingId, payload);
        toast.success('Announcement updated.');
      } else {
        await createAnnouncement(payload as Parameters<typeof createAnnouncement>[0]);
        toast.success('Announcement created.');
      }
      resetForm();
      loadAnnouncements();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save announcement.');
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteAnnouncement(id);
      toast.success('Announcement deleted.');
      loadAnnouncements();
    } catch {
      toast.error('Failed to delete announcement.');
    }
  }

  const TYPE_COLORS: Record<string, string> = {
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };

  const chartData = useMemo(() => {
    if (dateRange === 'Last 30 Days') return buildMonthData(tickets);
    if (dateRange === 'This Year') return buildYearData(tickets);
    return buildWeekData(tickets);
  }, [dateRange, tickets]);

  const priorityData = useMemo(() => {
    const base = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    if (stats?.by_priority) {
      Object.entries(stats.by_priority).forEach(([key, value]) => {
        const normalized = normalize(key);
        if (normalized in base) {
          base[normalized as keyof typeof base] += Number(value) || 0;
        }
      });
    } else {
      tickets.forEach((ticket) => {
        const normalized = normalize(ticket.priority);
        if (normalized in base) {
          base[normalized as keyof typeof base] += 1;
        }
      });
    }

    return [
      { name: 'Low', value: base.low, color: PRIORITY_COLORS.Low },
      { name: 'Medium', value: base.medium, color: PRIORITY_COLORS.Medium },
      { name: 'High', value: base.high, color: PRIORITY_COLORS.High },
      { name: 'Critical', value: base.critical, color: PRIORITY_COLORS.Critical },
    ];
  }, [stats, tickets]);

  const now = new Date();
  const totalTicketsMonthly = useMemo(() => {
    return tickets.filter((ticket) => {
      const createdAt = new Date(ticket.created_at);
      return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth();
    }).length;
  }, [tickets, now]);

  const criticalIssues = stats?.by_priority?.critical ?? priorityData.find((entry) => entry.name === 'Critical')?.value ?? 0;

  const activeUsers = useMemo(() => users.filter((user) => user.is_active).length, [users]);

  const slaCompliance = useMemo(() => {
    const measurable = tickets.filter((ticket) => {
      const status = normalize(ticket.status);
      return (status === 'resolved' || status === 'closed') && (ticket.sla_estimated_days || 0) > 0;
    });

    if (measurable.length === 0) return 0;

    const compliant = measurable.filter((ticket) => {
      const start = new Date(ticket.created_at).getTime();
      const end = new Date(ticket.updated_at || ticket.created_at).getTime();
      if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return false;
      const days = (end - start) / 86400000;
      return days <= (ticket.sla_estimated_days || 0);
    }).length;

    return (compliant / measurable.length) * 100;
  }, [tickets]);

  const escalatedTickets = useMemo(() => {
    return [...tickets]
      .filter((ticket) => {
        const status = normalize(ticket.status);
        return status === 'escalated' || Boolean(ticket.external_escalated_at) || (ticket.escalation_logs?.length || 0) > 0;
      })
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 5);
  }, [tickets]);

  const criticalResolutionHours = useMemo(() => getAverageResolutionHours(tickets, 'Critical'), [tickets]);
  const highResolutionHours = useMemo(() => getAverageResolutionHours(tickets, 'High'), [tickets]);

  if (loadingDashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3BC25B]"></div>
        <span className="ml-3 text-gray-500">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            SuperAdmin Overview
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Global system monitoring and performance metrics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tickets (Monthly)"
          value={totalTicketsMonthly.toLocaleString()}
          icon={Ticket}
          color="green" />

        <StatCard
          title="Critical Issues"
          value={String(criticalIssues)}
          icon={AlertTriangle}
          subtext="Requires immediate attention"
          color="orange" />

        <StatCard
          title="SLA Compliance"
          value={`${slaCompliance.toFixed(1)}%`}
          icon={ShieldCheck}
          color="blue" />

        <StatCard
          title="Active Users"
          value={activeUsers.toLocaleString()}
          icon={Users}
          subtext="Clients & Technicals"
          color="purple" />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" accent>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Ticket Volume Trends
            </h3>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 focus:ring-2 focus:ring-[#3BC25B] outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB" />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#6B7280'
                  }} />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#6B7280'
                  }} />

                <Tooltip
                  cursor={{
                    fill: '#F3F4F6'
                  }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    backgroundColor: '#fff',
                    color: '#111'
                  }} />

                <Bar
                  dataKey="tickets"
                  fill="url(#colorGradient)"
                  radius={[4, 4, 0, 0]} />

                <defs>
                  <linearGradient
                    id="colorGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1">

                    <stop offset="0%" stopColor="#63D44A" />
                    <stop offset="100%" stopColor="#0E8F79" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card accent>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Tickets by Priority
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value">

                  {priorityData.map((entry, i) =>
                  <Cell key={i} fill={entry.color} />
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: '#111827',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }} />

                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{
                    color: '#6b7280'
                  }} />

              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Critical Resolution Time
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDuration(criticalResolutionHours)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                High Priority Resolution
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDuration(highResolutionHours)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card accent>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Recent Escalations
          </h3>
          <GreenButton variant="ghost" className="text-sm" onClick={() => navigate('/superadmin/reports')}>
            View All
          </GreenButton>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3">Ticket ID</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {escalatedTickets.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={6}>
                    No escalated tickets found.
                  </td>
                </tr>
              ) : (
                escalatedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/40"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white font-mono text-xs">
                      {ticket.stf_no}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {ticket.description_of_problem || 'No subject provided'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                          {(ticket.client || 'C').slice(0, 1).toUpperCase()}
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {ticket.client || 'Unknown Client'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={formatLabel(ticket.priority || 'medium')} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={formatLabel(ticket.status || 'escalated')} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {ticket.assigned_to ? `${ticket.assigned_to.first_name} ${ticket.assigned_to.last_name}`.trim() || ticket.assigned_to.username : 'Unassigned'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Announcement Management ── */}
      <Card accent>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#0E8F79]" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Announcements</h3>
          </div>
          <GreenButton onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New Announcement
          </GreenButton>
        </div>

        {/* Create / Edit Form */}
        {showForm && (
          <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-800/50 space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Edit Announcement' : 'Create Announcement'}
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#3BC25B] outline-none"
                placeholder="Announcement title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#3BC25B] outline-none resize-none"
                placeholder="Announcement details..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select
                  value={formData.announcement_type}
                  onChange={(e) => setFormData({ ...formData, announcement_type: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#3BC25B] outline-none"
                >
                  <option value="info">Info (Blue)</option>
                  <option value="warning">Warning (Amber)</option>
                  <option value="success">Success (Green)</option>
                  <option value="critical">Critical (Red)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#3BC25B] outline-none"
                >
                  <option value="all">All (Supervisors & Technicians)</option>
                  <option value="admin">Supervisors Only</option>
                  <option value="employee">Technicians Only</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-[#3BC25B] focus:ring-[#3BC25B]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#3BC25B] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date <span className="text-gray-400">(leave blank for no expiry)</span></label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#3BC25B] outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <GreenButton onClick={handleSave}>
                {editingId ? 'Update' : 'Create'}
              </GreenButton>
              <GreenButton variant="outline" onClick={resetForm}>Cancel</GreenButton>
            </div>
          </div>
        )}

        {/* Announcements List */}
        {announcements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
            <Megaphone className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No announcements yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`rounded-xl border p-4 transition-colors ${
                  ann.is_currently_active
                    ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[ann.announcement_type] || TYPE_COLORS.info}`}>
                        {ann.announcement_type.charAt(0).toUpperCase() + ann.announcement_type.slice(1)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {ann.visibility === 'all' ? 'All' : ann.visibility === 'admin' ? 'Supervisors' : 'Technicians'}
                      </span>
                      {!ann.is_active && (
                        <span className="text-xs text-gray-400 italic">Inactive</span>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{ann.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{ann.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {ann.start_date ? new Date(ann.start_date).toLocaleDateString() : 'Now'}
                      {ann.end_date ? ` — ${new Date(ann.end_date).toLocaleDateString()}` : ' — No expiry'}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditForm(ann)}
                      className="p-2 rounded-lg text-gray-400 hover:text-[#0E8F79] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>);

}