import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { GreenButton } from '../components/ui/GreenButton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { SLATimer } from '../components/ui/SLATimer';
import { Ticket, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { MOCK_TICKETS } from '../data/mockTickets';
export function ClientDashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Client Portal
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track your support tickets and service history
          </p>
        </div>
        <GreenButton onClick={() => navigate('/client/create-ticket')}>+ New Ticket</GreenButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Open Tickets" value="3" icon={Ticket} color="blue" />
        <StatCard title="In Progress" value="2" icon={Clock} color="orange" />
        <StatCard
          title="Resolved"
          value="12"
          icon={CheckCircle}
          color="green" />

        <StatCard
          title="Avg Response"
          value="1.8h"
          icon={AlertCircle}
          color="purple" />

      </div>

      <Card accent>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Recent Tickets
          </h3>
          <GreenButton variant="ghost" className="text-sm" onClick={() => navigate('/client/my-tickets')}>
            View All
          </GreenButton>
        </div>
        <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50">Ticket</th>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50">Issue</th>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50">Priority</th>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50">Status</th>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50">Response Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {MOCK_TICKETS.slice(0, 10).map((ticket) =>
              <tr
                key={ticket.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">

                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900 dark:text-white">
                    {ticket.id}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {ticket.issue}
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    {ticket.status !== 'Resolved' &&
                  <SLATimer
                    hoursRemaining={ticket.sla}
                    totalHours={ticket.total} />

                  }
                    {ticket.status === 'Resolved' &&
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        ✓ Resolved
                      </span>
                  }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>);

}