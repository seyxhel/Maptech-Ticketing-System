import React from 'react';
import { Card } from '../components/ui/Card';
import { GreenButton } from '../components/ui/GreenButton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { SLATimer } from '../components/ui/SLATimer';
import { Filter, MoreHorizontal } from 'lucide-react';

const MOCK_TICKETS = [
  { id: 'TK-8821', subject: 'System outage in North Wing', client: 'TechCorp Inc.', priority: 'Critical' as const, status: 'New' as const, sla: 2, totalSla: 4, assignee: null as string | null },
  { id: 'TK-8820', subject: 'Printer configuration error', client: 'Logistics Ltd.', priority: 'Medium' as const, status: 'Assigned' as const, sla: 18, totalSla: 24, assignee: 'John D.' },
  { id: 'TK-8819', subject: 'Software license renewal', client: 'Alpha Group', priority: 'Low' as const, status: 'In Progress' as const, sla: 45, totalSla: 48, assignee: 'Sarah M.' },
  { id: 'TK-8818', subject: 'Network latency issues', client: 'Beta Systems', priority: 'High' as const, status: 'Escalated' as const, sla: 1, totalSla: 8, assignee: 'Mike R.' },
  { id: 'TK-8817', subject: 'New user onboarding', client: 'Gamma Corp', priority: 'Low' as const, status: 'Resolved' as const, sla: 0, totalSla: 24, assignee: 'Jenny L.' },
];

export function AdminTickets() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tickets</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage and assign tickets</p>
        </div>
        <GreenButton>+ Create Ticket</GreenButton>
      </div>

      <Card accent>
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Incoming Tickets</h3>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Search tickets..."
                className="w-full pl-4 pr-10 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]"
              />
            </div>
            <button className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Ticket Details</th>
                <th className="px-6 py-4 font-semibold">Client</th>
                <th className="px-6 py-4 font-semibold">Priority</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">SLA Timer</th>
                <th className="px-6 py-4 font-semibold">Assignee</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {MOCK_TICKETS.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900 dark:text-white text-xs block mb-1">{ticket.id}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{ticket.subject}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{ticket.client}</td>
                  <td className="px-6 py-4"><PriorityBadge priority={ticket.priority} /></td>
                  <td className="px-6 py-4"><StatusBadge status={ticket.status} /></td>
                  <td className="px-6 py-4">
                    {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                      <SLATimer hoursRemaining={ticket.sla} totalHours={ticket.totalSla} />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {ticket.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300">
                          {ticket.assignee.charAt(0)}
                        </div>
                        <span className="text-gray-600 dark:text-gray-400">{ticket.assignee}</span>
                      </div>
                    ) : (
                      <button className="text-xs font-medium text-[#0E8F79] dark:text-green-400 hover:underline">+ Assign Agent</button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">Showing 5 of 24 tickets</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">Previous</button>
            <button className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
