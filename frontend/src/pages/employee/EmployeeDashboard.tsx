import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { SLATimer } from '../../components/ui/SLATimer';
import { fetchTickets, fetchTicketStats } from '../../services/api';
import type { BackendTicket, TicketStats } from '../../services/api';
import { mapBackendTicketToEmployee } from '../../services/ticketMapper';
import type { UIEmployeeTicket } from '../../services/ticketMapper';
import { useAuth } from '../../context/AuthContext';
import { AnnouncementBanner } from '../../components/ui/AnnouncementBanner';
import {
  CheckCircle,
  Clock,
  Star,
  ListTodo,
  ChevronRight,
  ArrowRight } from
'lucide-react';
interface EmployeeDashboardProps {
  onNavigate?: (page: string) => void;
}
export function EmployeeDashboard({ onNavigate }: EmployeeDashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] || 'there';

  const [rawTickets, setRawTickets] = useState<BackendTicket[]>([]);
  const [tickets, setTickets] = useState<UIEmployeeTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [raw, statsData] = await Promise.all([
          fetchTickets(),
          fetchTicketStats().catch(() => null),
        ]);
        if (cancelled) return;
        setRawTickets(raw);
        setTickets(raw.map(mapBackendTicketToEmployee));
        if (statsData) setStats(statsData);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const inProgressCount = stats?.in_progress ?? tickets.filter((t) => t.status === 'In Progress').length;
  const avgResolution = stats?.avg_resolution_time != null ? `${stats.avg_resolution_time.toFixed(1)}h` : '0h';
  const weeklyGoals = React.useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const recentTickets = rawTickets.filter((ticket) => {
      const createdAt = new Date(ticket.created_at).getTime();
      return !Number.isNaN(createdAt) && createdAt >= sevenDaysAgo && createdAt <= now;
    });

    const resolvedThisWeek = recentTickets.filter((ticket) => {
      const status = (ticket.status || '').toLowerCase();
      return status === 'closed' || status === 'pending_closure';
    }).length;
    const weeklyTotal = recentTickets.length;
    const resolvedPct = weeklyTotal > 0 ? Math.round((resolvedThisWeek / weeklyTotal) * 100) : 0;

    const ratings = rawTickets
      .map((ticket) => ticket.csat_feedback?.rating)
      .filter((rating): rating is number => typeof rating === 'number');
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : null;
    const qualityPct = avgRating != null ? Math.round((Math.min(avgRating, 5) / 5) * 100) : 0;

    const responseTimesMins = rawTickets
      .map((ticket) => {
        if (!ticket.time_in) return null;
        const createdAt = new Date(ticket.created_at).getTime();
        const startedAt = new Date(ticket.time_in).getTime();
        if (Number.isNaN(createdAt) || Number.isNaN(startedAt) || startedAt <= createdAt) return null;
        return (startedAt - createdAt) / 60000;
      })
      .filter((minutes): minutes is number => typeof minutes === 'number');

    const avgResponseMinutes = responseTimesMins.length > 0
      ? responseTimesMins.reduce((sum, minutes) => sum + minutes, 0) / responseTimesMins.length
      : null;
    const startedThisWeek = recentTickets.filter((ticket) => !!ticket.time_in).length;
    const responsePct = weeklyTotal > 0 ? Math.round((startedThisWeek / weeklyTotal) * 100) : 0;

    const responseValue = avgResponseMinutes == null
      ? 'N/A'
      : avgResponseMinutes < 60
        ? `${Math.round(avgResponseMinutes)}m avg`
        : `${(avgResponseMinutes / 60).toFixed(1)}h avg`;

    return [
      {
        label: 'Tickets Resolved',
        value: `${resolvedThisWeek}/${weeklyTotal}`,
        pct: `${resolvedPct}%`,
        color: 'bg-[#3BC25B]',
      },
      {
        label: 'Quality Score',
        value: avgRating == null ? 'N/A' : `${avgRating.toFixed(1)}/5.0`,
        pct: `${qualityPct}%`,
        color: 'bg-[#0E8F79]',
      },
      {
        label: 'Response Time',
        value: responseValue,
        pct: `${responsePct}%`,
        color: 'bg-blue-500',
      },
    ];
  }, [rawTickets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3BC25B]"></div>
        <span className="ml-3 text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Workspace
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Welcome back, {firstName}. You have {tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length} tickets needing attention.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Status: Online
        </div>
      </div>

      <AnnouncementBanner />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Assigned to Me"
          value={String(tickets.length)}
          icon={ListTodo}
          color="blue" />

        <StatCard title="In Progress" value={String(inProgressCount)} icon={Clock} color="orange" />
        <StatCard
          title="Avg Resolution"
          value={avgResolution}
          icon={CheckCircle}
          color="green" />

        <StatCard title="Resolved / Closed" value={String((stats?.closed ?? 0) + tickets.filter(t => t.status === 'Resolved').length)} icon={Star} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Priority Tickets
          </h3>
          <div className="max-h-[540px] overflow-y-auto space-y-4 pr-1">
          {tickets.length === 0 && (
            <p className="text-gray-400 dark:text-gray-500 text-center py-8">No tickets assigned to you.</p>
          )}
          {tickets.map((ticket) =>
          <Card
            key={ticket.id}
            className="hover:border-[#3BC25B] dark:hover:border-[#3BC25B] hover:shadow-md transition-all group"
            onClick={() => navigate(`/employee/ticket-details?stf=${encodeURIComponent(ticket.id)}`)}
          >

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                      {ticket.id}
                    </span>
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  <h4
                    className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-[#0E8F79] dark:group-hover:text-green-400 transition-colors break-all overflow-hidden"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {ticket.issue}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Client: {ticket.client}
                  </p>
                </div>
                <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0 md:pl-6">
                  <div className="flex flex-col items-end min-w-[100px]">
                    <span className="text-xs text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider">
                      SLA Timer
                    </span>
                    <SLATimer
                    hoursRemaining={ticket.sla}
                    totalHours={ticket.total}
                    status={ticket.status} />

                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-[#3BC25B]" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-700 flex justify-end">
                <span className="text-sm font-medium text-[#0E8F79] dark:text-green-400 flex items-center gap-1">
                  View Details <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Card>
          )}
          </div>
        </div>

        <div className="space-y-6">
          <Card accent>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Weekly Goals
            </h3>
            <div className="space-y-4">
              {weeklyGoals.map((item) =>
              <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      {item.label}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.value}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{
                      width: item.pct
                    }} />

                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-[#0E8F79] to-[#0a0a0a] text-white border-none">
            <h3 className="text-lg font-bold mb-2">Need Help?</h3>
            <p className="text-white/80 text-sm mb-4">
              Check the internal knowledge base for troubleshooting guides or
              escalate complex issues.
            </p>
            <button
              onClick={() => onNavigate?.('knowledge-hub')}
              className="w-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              Open Knowledge Base
            </button>
          </Card>
        </div>
      </div>
    </div>);

}