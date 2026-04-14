import { useState, useEffect, useMemo } from 'react';
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
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import { AnnouncementBanner } from '../../components/ui/AnnouncementBanner';
import { fetchTickets, fetchClients, fetchProducts } from '../../services/api';
import { mapBackendTicketToUI } from '../../services/ticketMapper';
import type { UITicket } from '../../services/ticketMapper';

const ITEMS_PER_PAGE = 5;
const RECENT_TABLE_ROW_HEIGHT_PX = 44;
const RECENT_TABLE_MAX_HEIGHT_PX = RECENT_TABLE_ROW_HEIGHT_PX * ITEMS_PER_PAGE;
const PRODUCT_CATEGORY_COLORS = ['#9333EA', '#14B8A6', '#F59E0B', '#0EA5E9', '#22C55E', '#EC4899', '#6366F1'];
const PRODUCT_CATEGORY_CHART_MIN_WIDTH_PX = 560;
const PRODUCT_CATEGORY_CHART_PER_ITEM_WIDTH_PX = 76;
const GRAPH_RANGE_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
] as const;

function truncateText(value: string | undefined | null, maxLength: number): string {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

type TrendPoint = {
  day: string;
  value: number;
};

type MetricDateSources = {
  tickets: Array<string | null | undefined>;
  clients: Array<string | null | undefined>;
  products: Array<string | null | undefined>;
};

function formatSeriesDayLabel(day: Date, rangeDays: number): string {
  if (rangeDays <= 7) {
    return day.toLocaleDateString(undefined, { weekday: 'short' });
  }
  return day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function buildSeriesByRange(dates: Array<string | null | undefined>, rangeDays: number): TrendPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: rangeDays }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (rangeDays - 1 - index));
    return day;
  });

  const valuesByDay = new Map<string, number>(
    days.map((day) => [day.toISOString().slice(0, 10), 0])
  );

  dates.forEach((value) => {
    if (!value) return;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    const key = date.toISOString().slice(0, 10);
    if (!valuesByDay.has(key)) return;
    valuesByDay.set(key, (valuesByDay.get(key) ?? 0) + 1);
  });

  return days.map((day) => {
    const key = day.toISOString().slice(0, 10);
    return {
      day: formatSeriesDayLabel(day, rangeDays),
      value: valuesByDay.get(key) ?? 0,
    };
  });
}

function getXAxisTickStep(rangeDays: number): number {
  if (rangeDays <= 7) return 1;
  if (rangeDays <= 30) return 5;
  return 15;
}

export default function SalesDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<UITicket[]>([]);
  const [products, setProducts] = useState<Array<{ created_at: string; category_detail: { name: string } | null; device_equipment: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphRangeDays, setGraphRangeDays] = useState<number>(7);
  const [stats, setStats] = useState({
    totalTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
    escalatedTickets: 0,
    totalClients: 0,
    totalProducts: 0,
  });
  const [metricDateSources, setMetricDateSources] = useState<MetricDateSources>({
    tickets: [],
    clients: [],
    products: [],
  });

  const metricTrends = useMemo(() => ({
    tickets: buildSeriesByRange(metricDateSources.tickets, graphRangeDays),
    clients: buildSeriesByRange(metricDateSources.clients, graphRangeDays),
    products: buildSeriesByRange(metricDateSources.products, graphRangeDays),
  }), [metricDateSources, graphRangeDays]);

  const graphXAxisTickStep = getXAxisTickStep(graphRangeDays);
  const graphXAxisMinTickGap = graphRangeDays <= 7 ? 10 : graphRangeDays <= 30 ? 16 : 20;
  const graphTickFormatter = (value: string, index: number) => (
    index % graphXAxisTickStep === 0 || index === graphRangeDays - 1 ? value : ''
  );
  const getYAxisWidth = (series: TrendPoint[]) => {
    const maxValue = Math.max(...series.map((point) => point.value), 0);
    if (maxValue >= 100) return 34;
    if (maxValue >= 10) return 28;
    return 24;
  };

  const ticketPieData = useMemo(() => {
    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - (graphRangeDays - 1));

    const counts = {
      Pending: 0,
      'In Progress': 0,
      'For Observation': 0,
      Resolved: 0,
      Closed: 0,
    };

    tickets.forEach((ticket) => {
      const created = new Date(ticket.created);
      if (Number.isNaN(created.getTime()) || created < rangeStart) return;

      if (ticket.status === 'Pending') {
        counts.Pending += 1;
      } else if (['Assigned', 'In Progress'].includes(ticket.status)) {
        counts['In Progress'] += 1;
      } else if (ticket.status === 'For Observation') {
        counts['For Observation'] += 1;
      } else if (ticket.status === 'Resolved') {
        counts.Resolved += 1;
      } else if (ticket.status === 'Closed') {
        counts.Closed += 1;
      }
    });

    return [
      { name: 'Pending', value: counts.Pending, color: '#0EA5E9' },
      { name: 'In Progress', value: counts['In Progress'], color: '#3B82F6' },
      { name: 'For Observation', value: counts['For Observation'], color: '#A855F7' },
      { name: 'Resolved', value: counts.Resolved, color: '#22C55E' },
      { name: 'Closed', value: counts.Closed, color: '#64748B' },
    ];
  }, [tickets, graphRangeDays]);
  const ticketPieTotal = ticketPieData.reduce((sum, item) => sum + item.value, 0);

  const productCategoryData = useMemo(() => {
    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - (graphRangeDays - 1));

    const categoryCounts = new Map<string, number>();

    products.forEach((product) => {
      const created = new Date(product.created_at);
      if (Number.isNaN(created.getTime()) || created < rangeStart) return;

      const rawCategory = product.category_detail?.name || product.device_equipment || 'Uncategorized';
      const category = rawCategory.trim() || 'Uncategorized';
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    });

    return Array.from(categoryCounts.entries())
      .map(([category, value], index) => ({
        category,
        value,
        color: PRODUCT_CATEGORY_COLORS[index % PRODUCT_CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [products, graphRangeDays]);
  const productCategoryChartWidth = Math.max(
    PRODUCT_CATEGORY_CHART_MIN_WIDTH_PX,
    productCategoryData.length * PRODUCT_CATEGORY_CHART_PER_ITEM_WIDTH_PX
  );
  const productCategoryYAxisSeries = productCategoryData.map((item) => ({ day: item.category, value: item.value }));
  const productCategoryYAxisWidth = getYAxisWidth(productCategoryYAxisSeries);
  const productCategoryYAxisMax = Math.max(...productCategoryData.map((item) => item.value), 0) || 1;
  const productCategoryYAxisContainerWidth = productCategoryYAxisWidth + 8;

  const ticketPieLegendPayload = ticketPieData.map((item) => ({
    value: item.name,
    type: 'circle' as const,
    color: item.color,
  }));

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
      const safeClients = Array.isArray(clientsData) ? clientsData : [];
      const safeProducts = Array.isArray(productsData) ? productsData : [];
      setProducts(safeProducts.map((product) => ({
        created_at: product.created_at,
        category_detail: product.category_detail,
        device_equipment: product.device_equipment,
      })));

      setStats({
        totalTickets: mapped.length,
        pendingTickets: pending,
        resolvedTickets: resolved,
        escalatedTickets: escalated,
        totalClients: safeClients.length,
        totalProducts: safeProducts.length,
      });

      setMetricDateSources({
        tickets: ticketsData.map((ticket) => ticket.created_at),
        clients: safeClients.map((client) => client.created_at),
        products: safeProducts.map((product) => product.created_at),
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

  const filteredTickets = tickets;

  // Recent tickets list is scrollable with a 5-row viewport.
  const recentTickets = filteredTickets;

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
    <div className="flex flex-col gap-3">
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <StatCard
          title="Total Tickets"
          value={String(stats.totalTickets)}
          icon={Ticket}
          color="blue"
        />
        <StatCard
          title="Pending"
          value={String(stats.pendingTickets)}
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Resolved"
          value={String(stats.resolvedTickets)}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Escalated"
          value={String(stats.escalatedTickets)}
          icon={AlertTriangle}
          color="purple"
        />
        <StatCard
          title="Clients"
          value={String(stats.totalClients)}
          icon={Users}
          color="orange"
        />
        <StatCard
          title="Products"
          value={String(stats.totalProducts)}
          icon={Package}
          color="blue"
        />
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        <div className="lg:col-span-12 flex items-center justify-end gap-2">
          <label htmlFor="sales-graph-range" className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Graph Range
          </label>
          <select
            id="sales-graph-range"
            value={graphRangeDays}
            onChange={(e) => setGraphRangeDays(Number(e.target.value))}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
          >
            {GRAPH_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

      <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2.5">
        <div className="md:col-span-2 lg:col-span-8">
        <Card>
          <div className="p-2.5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Tickets</h2>
            </div>
          </div>

          {recentTickets.length === 0 ? (
            <div className="p-8 text-center">
              <Ticket className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No tickets yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="overflow-y-auto" style={{ maxHeight: `${RECENT_TABLE_MAX_HEIGHT_PX}px` }}>
              <table className="w-full min-w-[600px] text-[11px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50/95 dark:bg-gray-800/90 backdrop-blur-sm">
                    <th scope="col" className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Ticket ID
                    </th>
                    <th scope="col" className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Client
                    </th>
                    <th scope="col" className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Subject
                    </th>
                    <th scope="col" className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Priority
                    </th>
                    <th scope="col" className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
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
                      <td className="px-3 py-1.5">
                        <span className="font-medium text-gray-900 dark:text-white">{ticket.id}</span>
                      </td>
                      <td className="px-3 py-1.5 text-gray-600 dark:text-gray-300">
                        {truncateText(ticket.client, 20)}
                      </td>
                      <td className="px-3 py-1.5 text-gray-600 dark:text-gray-300">
                        {truncateText(ticket.subject, 30)}
                      </td>
                      <td className="px-3 py-1.5">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-3 py-1.5">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-3 py-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                        {new Date(ticket.created).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </Card>
        </div>

        <Card
          className="md:col-span-1 lg:col-span-4 cursor-pointer hover:border-[#3BC25B] transition-colors"
          onClick={() => navigate('/sales/tickets')}
        >
          <div className="p-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white">View All Tickets</p>
              </div>
            </div>

            <div className="mt-4 h-36 w-full">
              {ticketPieTotal === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                  No ticket data in selected range.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ticketPieData.filter((item) => item.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="58%"
                      innerRadius={28}
                      outerRadius={56}
                      paddingAngle={2}
                    >
                      {ticketPieData.filter((item) => item.value > 0).map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      height={10}
                      iconType="circle"
                      payload={ticketPieLegendPayload}
                      wrapperStyle={{ fontSize: '10px', color: '#94A3B8', paddingTop: '4px', bottom: '-30px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#E2E8F0',
                        fontSize: '11px',
                        padding: '6px 8px',
                      }}
                      labelStyle={{ color: '#E2E8F0', fontWeight: 600 }}
                      formatter={(value, name) => [String(value), String(name)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </Card>

        <Card
          className="md:col-span-1 lg:col-span-6 cursor-pointer hover:border-[#3BC25B] transition-colors"
          onClick={() => navigate('/sales/clients')}
        >
          <div className="p-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Manage Clients</p>
              </div>
            </div>

            <div className="mt-2 h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricTrends.clients} margin={{ top: 6, right: 8, left: 6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.35} />
                  <XAxis
                    dataKey="day"
                    axisLine={{ stroke: '#64748B' }}
                    tickLine={{ stroke: '#64748B' }}
                    tick={{ fill: '#CBD5E1', fontSize: 9 }}
                    height={22}
                    interval="preserveStartEnd"
                    minTickGap={graphXAxisMinTickGap}
                    tickFormatter={graphTickFormatter}
                  />
                  <YAxis
                    allowDecimals={false}
                    domain={[0, 'auto']}
                    axisLine={{ stroke: '#64748B' }}
                    tickLine={{ stroke: '#64748B' }}
                    tick={{ fill: '#CBD5E1', fontSize: 9 }}
                    width={getYAxisWidth(metricTrends.clients)}
                    tickCount={4}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#E2E8F0',
                      fontSize: '11px',
                      padding: '6px 8px',
                    }}
                    labelStyle={{ color: '#E2E8F0', fontWeight: 600 }}
                    formatter={(value) => [String(value), 'Count']}
                  />
                  <Line name="New Clients" type="linear" dataKey="value" stroke="#16A34A" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card
          className="md:col-span-2 lg:col-span-6 cursor-pointer hover:border-[#3BC25B] transition-colors"
          onClick={() => navigate('/sales/products')}
        >
          <div className="p-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Product Catalog</p>
              </div>
            </div>

            <div className="mt-2 h-28 w-full">
              {productCategoryData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                  No product category data in selected range.
                </div>
              ) : (
                <div className="h-full flex">
                  <div
                    className="h-full shrink-0 border-r border-slate-200/80 dark:border-slate-700/70 bg-slate-100/70 dark:bg-slate-800/65 backdrop-blur-sm flex flex-col"
                    style={{ width: `${productCategoryYAxisContainerWidth}px` }}
                  >
                    <div className="min-h-0 flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productCategoryData} margin={{ top: 6, right: 0, left: 0, bottom: 12 }}>
                          <YAxis
                            allowDecimals={false}
                            domain={[0, productCategoryYAxisMax]}
                            axisLine={{ stroke: '#94A3B8' }}
                            tickLine={{ stroke: '#94A3B8' }}
                            tick={{ fill: '#94A3B8', fontSize: 9 }}
                            width={productCategoryYAxisWidth}
                            tickCount={4}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-4" />
                  </div>
                  <div className="h-full flex-1 flex flex-col">
                    <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-2.5">
                      <div className="h-full" style={{ width: `${productCategoryChartWidth}px`, minWidth: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={productCategoryData} margin={{ top: 6, right: 8, left: 6, bottom: 0 }} barCategoryGap="2%">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.35} />
                            <XAxis
                              dataKey="category"
                              axisLine={{ stroke: '#64748B' }}
                              tick={false}
                              tickLine={false}
                              height={12}
                            />
                            <YAxis hide width={0} allowDecimals={false} domain={[0, productCategoryYAxisMax]} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0F172A',
                                border: '1px solid #334155',
                                borderRadius: '6px',
                                color: '#E2E8F0',
                                fontSize: '11px',
                                padding: '6px 8px',
                              }}
                              labelStyle={{ color: '#E2E8F0', fontWeight: 600 }}
                              formatter={(value, name, props) => [String(value), String(props?.payload?.category || name)]}
                            />
                            <Bar name="Registered Products" dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={26}>
                              {productCategoryData.map((item) => (
                                <Cell key={item.category} fill={item.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <p className="h-4 text-[10px] leading-4 text-center text-slate-500 dark:text-slate-400">Categories</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
}
