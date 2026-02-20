import React from 'react';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { GreenButton } from '../components/ui/GreenButton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { SLATimer } from '../components/ui/SLATimer';
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
  const handleTicketClick = () => {
    if (onNavigate) onNavigate('ticket-view');
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Workspace
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Welcome back, Alex. You have 4 tickets needing attention.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Status: Online
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Assigned to Me"
          value="8"
          icon={ListTodo}
          color="blue" />

        <StatCard title="In Progress" value="4" icon={Clock} color="orange" />
        <StatCard
          title="Avg Resolution"
          value="2.4h"
          icon={CheckCircle}
          color="green"
          subtext="Top 10% of team" />

        <StatCard title="My Rating" value="4.8/5" icon={Star} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Priority Tickets
          </h3>
          {[
          {
            id: 'TK-9012',
            title: 'Database connection failure',
            client: 'FinTech Corp',
            priority: 'Critical',
            status: 'In Progress',
            sla: 1,
            total: 4
          },
          {
            id: 'TK-9015',
            title: 'Email sync issues',
            client: 'Global Logistics',
            priority: 'High',
            status: 'Assigned',
            sla: 3,
            total: 8
          },
          {
            id: 'TK-9018',
            title: 'VPN access request',
            client: 'Remote Team',
            priority: 'Medium',
            status: 'Assigned',
            sla: 12,
            total: 24
          }].
          map((ticket) =>
          <Card
            key={ticket.id}
            className="hover:border-[#3BC25B] dark:hover:border-[#3BC25B] hover:shadow-md transition-all group"
            onClick={() => onNavigate?.('ticket-view')}
          >

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                      {ticket.id}
                    </span>
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-[#0E8F79] dark:group-hover:text-green-400 transition-colors">
                    {ticket.title}
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
                    totalHours={ticket.total} />

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

        <div className="space-y-6">
          <Card accent>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Weekly Goals
            </h3>
            <div className="space-y-4">
              {[
              {
                label: 'Tickets Resolved',
                value: '18/25',
                pct: '72%',
                color: 'bg-[#3BC25B]'
              },
              {
                label: 'CSAT Score',
                value: '4.8/5.0',
                pct: '96%',
                color: 'bg-[#0E8F79]'
              },
              {
                label: 'Response Time',
                value: '15m avg',
                pct: '85%',
                color: 'bg-blue-500'
              }].
              map((item) =>
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
            <button className="w-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 rounded-lg transition-colors">
              Open Knowledge Base
            </button>
          </Card>
        </div>
      </div>
    </div>);

}