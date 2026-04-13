import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { GreenButton } from '../../components/ui/GreenButton';
import { Users, UserCheck, UserCog, UserPlus, Plus, Pencil, Trash2, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchTickets,
  fetchUsers,
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../../services/api';
import type { AnnouncementData, BackendTicket, BackendUser } from '../../services/api';
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

function normalize(value: string | null | undefined) {
  return (value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<BackendTicket[]>([]);
  const [users, setUsers] = useState<BackendUser[]>([]);
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
      const [ticketData, userData] = await Promise.all([
        fetchTickets(),
        fetchUsers().catch(() => []),
      ]);
      setTickets(ticketData);
      setUsers(userData);
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

  const activeUsers = useMemo(() => users.filter((user) => user.is_active).length, [users]);
  const supervisorCount = useMemo(() => users.filter((user) => normalize(user.role) === 'admin').length, [users]);
  const salesCount = useMemo(() => users.filter((user) => normalize(user.role) === 'sales').length, [users]);

  const userRoleData = useMemo(() => {
    const buckets: Record<string, number> = {};
    users.forEach((user) => {
      const role = normalize(user.role);
      if (!role) return;
      buckets[role] = (buckets[role] || 0) + 1;
    });

    return Object.entries(buckets)
      .map(([role, count]) => ({
        name: role === 'admin' ? 'Supervisors' : role === 'employee' ? 'Technical' : role === 'sales' ? 'Sales' : role === 'superadmin' ? 'Superadmin' : role,
        users: count,
      }))
      .sort((a, b) => b.users - a.users);
  }, [users]);

  const ticketCreatorRoleData = useMemo(() => {
    const buckets: Record<string, number> = {
      supervisor: 0,
      sales: 0,
      technical: 0,
      superadmin: 0,
      other: 0,
    };

    tickets.forEach((ticket) => {
      const role = normalize(String(ticket.created_by?.role || ''));
      if (role === 'admin') buckets.supervisor += 1;
      else if (role === 'sales') buckets.sales += 1;
      else if (role === 'employee') buckets.technical += 1;
      else if (role === 'superadmin') buckets.superadmin += 1;
      else buckets.other += 1;
    });

    return [
      { name: 'Supervisors', value: buckets.supervisor, color: '#0E8F79' },
      { name: 'Sales', value: buckets.sales, color: '#3BC25B' },
      { name: 'Technical', value: buckets.technical, color: '#F59E0B' },
      { name: 'Superadmin', value: buckets.superadmin, color: '#3B82F6' },
      { name: 'Other', value: buckets.other, color: '#6B7280' },
    ];
  }, [tickets]);

  const supervisorLoad = useMemo(() => {
    const buckets: Record<string, number> = {};
    tickets.forEach((ticket) => {
      const sup = ticket.supervisor;
      if (!sup) return;
      const label = `${sup.first_name || ''} ${sup.last_name || ''}`.trim() || sup.username || `Supervisor #${sup.id}`;
      buckets[label] = (buckets[label] || 0) + 1;
    });

    return Object.entries(buckets)
      .map(([name, count]) => ({ name, tickets: count }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 6);
  }, [tickets]);

  const salesCreated = useMemo(() => {
    const buckets: Record<string, number> = {};
    tickets.forEach((ticket) => {
      const createdBy = ticket.created_by;
      if (normalize(createdBy?.role) !== 'sales') return;
      const label = `${createdBy.first_name || ''} ${createdBy.last_name || ''}`.trim() || createdBy.username || `Sales #${createdBy.id}`;
      buckets[label] = (buckets[label] || 0) + 1;
    });

    return Object.entries(buckets)
      .map(([name, count]) => ({ name, tickets: count }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 6);
  }, [tickets]);

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
            Super Administrator Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            User distribution, participation, and ticket ownership insights
          </p>
        </div>
        <GreenButton onClick={() => navigate('/superadmin/reports')}>
          View Detailed Reports
        </GreenButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={users.length.toLocaleString()}
          icon={Users}
          color="green" />

        <StatCard
          title="Active Users"
          value={activeUsers.toLocaleString()}
          icon={UserCheck}
          color="orange" />

        <StatCard
          title="Supervisors"
          value={supervisorCount.toLocaleString()}
          icon={UserCog}
          color="blue" />

        <StatCard
          title="Sales Team"
          value={salesCount.toLocaleString()}
          icon={UserPlus}
          color="purple" />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" accent>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Users by Role
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userRoleData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB" />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280' }} />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280' }} />

                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    backgroundColor: '#fff',
                    color: '#111'
                  }} />

                <Bar
                  dataKey="users"
                  fill="url(#usersGradient)"
                  radius={[4, 4, 0, 0]} />

                <defs>
                  <linearGradient
                    id="usersGradient"
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
            Ticket Creators by Role
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ticketCreatorRoleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value">

                  {ticketCreatorRoleData.map((entry, i) =>
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
                  wrapperStyle={{ color: '#6b7280' }} />

              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card accent>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Supervisor Ticket Ownership
            </h3>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supervisorLoad} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
                <Tooltip />
                <Bar dataKey="tickets" fill="#0E8F79" radius={[0, 4, 4, 0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card accent>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Sales Ticket Creation
          </h3>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesCreated} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
                <Tooltip />
                <Bar dataKey="tickets" fill="#3BC25B" radius={[0, 4, 4, 0]} name="Created Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card accent>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
          User Role Activity Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">User Count</th>
                <th className="px-4 py-3">Created Tickets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {userRoleData.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={3}>
                    No role analytics available.
                  </td>
                </tr>
              ) : (
                userRoleData.map((entry) => {
                  const creatorEntry = ticketCreatorRoleData.find((item) => normalize(item.name) === normalize(entry.name));
                  return (
                  <tr
                    key={entry.name}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/40"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {entry.name}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {entry.users}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {creatorEntry?.value ?? 0}
                    </td>
                  </tr>
                  );
                })
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