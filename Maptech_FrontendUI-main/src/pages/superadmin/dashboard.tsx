import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { GreenButton } from '../../components/ui/GreenButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Ticket, AlertTriangle, Users, ShieldCheck, Plus, Pencil, Trash2, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../../services/api';
import type { AnnouncementData } from '../../services/api';
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
const WEEK_DATA = [
  { name: 'Mon', tickets: 45 }, { name: 'Tue', tickets: 52 }, { name: 'Wed', tickets: 38 },
  { name: 'Thu', tickets: 65 }, { name: 'Fri', tickets: 48 }, { name: 'Sat', tickets: 25 }, { name: 'Sun', tickets: 15 },
];
const MONTH_DATA = [
  { name: 'Wk 1', tickets: 193 }, { name: 'Wk 2', tickets: 224 }, { name: 'Wk 3', tickets: 156 }, { name: 'Wk 4', tickets: 210 },
];
const YEAR_DATA = [
  { name: 'Jan', tickets: 824 }, { name: 'Feb', tickets: 741 }, { name: 'Mar', tickets: 963 },
  { name: 'Apr', tickets: 897 }, { name: 'May', tickets: 1050 }, { name: 'Jun', tickets: 978 },
  { name: 'Jul', tickets: 1124 }, { name: 'Aug', tickets: 1066 }, { name: 'Sep', tickets: 932 },
  { name: 'Oct', tickets: 1013 }, { name: 'Nov', tickets: 889 }, { name: 'Dec', tickets: 764 },
];

const RECENT_SUBJECTS = [
  'Network outage in Building A',
  'Database server unresponsive',
  'Email gateway failure',
  'SSL certificate expired on portal',
  'VPN access down for remote staff',
];

const PRIORITY_DATA = [
{
  name: 'Low',
  value: 35,
  color: '#3BC25B'
},
{
  name: 'Medium',
  value: 45,
  color: '#F59E0B'
},
{
  name: 'High',
  value: 15,
  color: '#EF4444'
},
{
  name: 'Critical',
  value: 5,
  color: '#991B1B'
}];

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('Last 7 Days');

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
    loadAnnouncements();
  }, []);

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

  const chartData = dateRange === 'Last 30 Days' ? MONTH_DATA : dateRange === 'This Year' ? YEAR_DATA : WEEK_DATA;

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
        <div className="flex gap-3">
          <GreenButton variant="outline" onClick={() => navigate('/superadmin/reports')}>Download Report</GreenButton>
          <GreenButton onClick={() => navigate('/superadmin/settings')}>System Settings</GreenButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tickets (Monthly)"
          value="1,284"
          icon={Ticket}
          trend={{
            value: 12,
            isPositive: true
          }}
          color="green" />

        <StatCard
          title="Critical Issues"
          value="23"
          icon={AlertTriangle}
          trend={{
            value: 5,
            isPositive: false
          }}
          subtext="Requires immediate attention"
          color="orange" />

        <StatCard
          title="SLA Compliance"
          value="94.2%"
          icon={ShieldCheck}
          trend={{
            value: 1.2,
            isPositive: true
          }}
          color="blue" />

        <StatCard
          title="Active Users"
          value="842"
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
                  data={PRIORITY_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value">

                  {PRIORITY_DATA.map((entry, i) =>
                  <Cell key={i} fill={entry.color} />
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f9fafb'
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
                1.2 hrs
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                High Priority Resolution
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                4.5 hrs
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
              {[1, 2, 3, 4, 5].map((i) =>
              <tr
                key={i}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/40">

                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white font-mono text-xs">
                    STF-MT-20260226{String(100000 + i).slice(1)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {RECENT_SUBJECTS[i - 1]}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                        C{i}
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Client Corp {i}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={i === 1 ? 'Critical' : 'High'} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status="Escalated" />
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    Sarah Engineer
                  </td>
                </tr>
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