import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Package,
  PlusCircle,
  ChevronRight,
  Search,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { AnnouncementBanner } from '../../components/ui/AnnouncementBanner';
import { fetchTickets, fetchClients, fetchProducts } from '../../services/api';
import { mapBackendTicketToUI } from '../../services/ticketMapper';
import type { UITicket } from '../../services/ticketMapper';

const ITEMS_PER_PAGE = 5;

function truncateText(value: string | undefined | null, maxLength: number): string {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

export default function SalesDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<UITicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
    escalatedTickets: 0,
    totalClients: 0,
    totalProducts: 0,
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketsData, clientsData, productsData] = await Promise.all([
        fetchTickets(),
        fetchClients().catch(() => []),
        fetchProducts().catch(() => []),
      ]);

      const mapped = ticketsData.map(mapBackendTicketToUI);
      setTickets(mapped);

      // Calculate stats
      const pending = mapped.filter(t => ['Pending', 'Assigned', 'In Progress'].includes(t.status)).length;
      const resolved = mapped.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
      const escalated = mapped.filter(t => t.status === 'Escalated').length;

      setStats({
        totalTickets: mapped.length,
        pendingTickets: pending,
        resolvedTickets: resolved,
        escalatedTickets: escalated,
        totalClients: Array.isArray(clientsData) ? clientsData.length : 0,
        totalProducts: Array.isArray(productsData) ? productsData.length : 0,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter tickets by search
  const filteredTickets = tickets.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.client.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q)
    );
  });

  // Get recent tickets (last 5)
  const recentTickets = filteredTickets.slice(0, ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3BC25B]"></div>
        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-[#3BC25B] text-white rounded-lg hover:bg-[#33a34d] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnnouncementBanner />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Overview of tickets, clients, and products</p>
        </div>
        <button
          onClick={() => navigate('/sales/create-ticket')}
          className="flex items-center gap-2 px-4 py-2 bg-[#3BC25B] text-white rounded-lg hover:bg-[#33a34d] transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Create Ticket
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Tickets"
          value={stats.totalTickets}
          icon={Ticket}
          trend={null}
        />
        <StatCard
          title="Pending"
          value={stats.pendingTickets}
          icon={Clock}
          trend={null}
        />
        <StatCard
          title="Resolved"
          value={stats.resolvedTickets}
          icon={CheckCircle2}
          trend={null}
        />
        <StatCard
          title="Escalated"
          value={stats.escalatedTickets}
          icon={AlertTriangle}
          trend={null}
        />
        <StatCard
          title="Clients"
          value={stats.totalClients}
          icon={Users}
          trend={null}
        />
        <StatCard
          title="Products"
          value={stats.totalProducts}
          icon={Package}
          trend={null}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:border-[#3BC25B] transition-colors"
          onClick={() => navigate('/sales/tickets')}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">View All Tickets</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Browse and manage tickets</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:border-[#3BC25B] transition-colors"
          onClick={() => navigate('/sales/clients')}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Manage Clients</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View and edit client info</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:border-[#3BC25B] transition-colors"
          onClick={() => navigate('/sales/products')}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Product Catalog</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Browse products</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Tickets</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
                />
              </div>
              <button
                onClick={() => navigate('/sales/tickets')}
                className="text-sm text-[#3BC25B] hover:text-[#33a34d] font-medium"
              >
                View All
              </button>
            </div>
          </div>
        </div>

        {recentTickets.length === 0 ? (
          <div className="p-8 text-center">
            <Ticket className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No tickets match your search' : 'No tickets yet'}
            </p>
            <button
              onClick={() => navigate('/sales/create-ticket')}
              className="mt-4 text-sm text-[#3BC25B] hover:text-[#33a34d] font-medium"
            >
              Create your first ticket
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Ticket ID
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Client
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Subject
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Priority
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/sales/ticket-details?stf=${encodeURIComponent(ticket.id)}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-white">{ticket.id}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {truncateText(ticket.client, 20)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {truncateText(ticket.subject, 30)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(ticket.created).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
