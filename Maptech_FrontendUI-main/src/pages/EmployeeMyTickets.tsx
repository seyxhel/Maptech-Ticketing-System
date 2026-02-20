import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { SLATimer } from '../components/ui/SLATimer';
import { ChevronRight } from 'lucide-react';

const MOCK_TICKETS = [
  { id: 'TK-9012', title: 'Database connection failure', client: 'FinTech Corp', priority: 'Critical' as const, status: 'In Progress' as const, sla: 1, total: 4 },
  { id: 'TK-9015', title: 'Email sync issues', client: 'Global Logistics', priority: 'High' as const, status: 'Assigned' as const, sla: 3, total: 8 },
  { id: 'TK-9018', title: 'VPN access request', client: 'Remote Team', priority: 'Medium' as const, status: 'Assigned' as const, sla: 12, total: 24 },
];

export function EmployeeMyTickets() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tickets</h1>
        <p className="text-gray-500 dark:text-gray-400">Tickets assigned to you</p>
      </div>
      <div className="space-y-4">
        {MOCK_TICKETS.map((ticket) => (
          <Card
            key={ticket.id}
            className="hover:border-[#3BC25B] dark:hover:border-[#3BC25B] hover:shadow-md transition-all cursor-pointer group"
            onClick={() => navigate('/employee/ticket-details')}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{ticket.id}</span>
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-[#0E8F79] dark:group-hover:text-green-400 transition-colors">
                  {ticket.title}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Client: {ticket.client}</p>
              </div>
              <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0 md:pl-6">
                <div className="flex flex-col items-end min-w-[100px]">
                  <span className="text-xs text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider">SLA Timer</span>
                  <SLATimer hoursRemaining={ticket.sla} totalHours={ticket.total} />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-[#3BC25B]" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
