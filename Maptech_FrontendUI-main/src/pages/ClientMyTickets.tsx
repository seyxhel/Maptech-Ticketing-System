import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { GreenButton } from '../components/ui/GreenButton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { SLATimer } from '../components/ui/SLATimer';

const MOCK_TICKETS = [
  { id: 'TK-9012', issue: 'Database connection failure', priority: 'Critical' as const, status: 'In Progress' as const, sla: 1, total: 4 },
  { id: 'TK-9008', issue: 'Email sync issues', priority: 'High' as const, status: 'Assigned' as const, sla: 3, total: 8 },
  { id: 'TK-8995', issue: 'Software license renewal', priority: 'Low' as const, status: 'Resolved' as const, sla: 0, total: 24 },
];

export function ClientMyTickets() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tickets</h1>
          <p className="text-gray-500 dark:text-gray-400">View and track your support tickets</p>
        </div>
        <GreenButton onClick={() => navigate('/client/create-ticket')}>+ New Ticket</GreenButton>
      </div>
      <Card accent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Response Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {MOCK_TICKETS.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                  onClick={() => navigate('/client/ticket-details')}
                >
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900 dark:text-white">{ticket.id}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{ticket.issue}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                  <td className="px-4 py-3">
                    {ticket.status !== 'Resolved' && (
                      <SLATimer hoursRemaining={ticket.sla} totalHours={ticket.total} />
                    )}
                    {ticket.status === 'Resolved' && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
