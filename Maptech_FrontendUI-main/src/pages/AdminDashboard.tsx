import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { GreenButton } from '../components/ui/GreenButton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { SLATimer } from '../components/ui/SLATimer';
import {
  Ticket,
  UserCheck,
  Clock,
  AlertOctagon,
  Filter,
  MoreHorizontal,
  ArrowUpRight,
  Share2,
  Building2,
  History } from
'lucide-react';
import { toast } from 'sonner';
const MOCK_ESCALATIONS = [
{
  id: 1,
  ticketId: 'TK-8818',
  type: 'Escalated',
  to: 'Senior Engineer',
  reason: 'Complex network configuration required',
  time: '2h ago'
},
{
  id: 2,
  ticketId: 'TK-8815',
  type: 'Cascaded',
  to: 'Cisco Support (Principal)',
  reason: 'Hardware failure confirmed, warranty claim',
  time: '5h ago'
},
{
  id: 3,
  ticketId: 'TK-8802',
  type: 'Cascaded',
  to: 'Local Distributor',
  reason: 'Part replacement needed',
  time: '1d ago'
}];

export function AdminDashboard() {
  const [escalationType, setEscalationType] = useState<
    'Higher' | 'Distributor' | 'Principal'>(
    'Higher');
  const [escalationReason, setEscalationReason] = useState('');
  const handleEscalate = () => {
    if (!escalationReason) {
      toast.error('Please provide a reason for escalation');
      return;
    }
    toast.success('Ticket escalated successfully');
    setEscalationReason('');
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Console
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage tickets, assignments, and team performance
          </p>
        </div>
        <GreenButton>+ Create Ticket</GreenButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Unassigned"
          value="12"
          icon={Ticket}
          color="orange"
          subtext="Needs immediate assignment" />

        <StatCard
          title="Pending Evaluation"
          value="8"
          icon={Clock}
          color="blue"
          subtext="Waiting for approval" />

        <StatCard
          title="Active Agents"
          value="14/18"
          icon={UserCheck}
          color="green" />

        <StatCard
          title="SLA Breaches"
          value="2"
          icon={AlertOctagon}
          color="purple"
          trend={{
            value: 50,
            isPositive: false
          }} />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Table */}
        <Card className="lg:col-span-2" accent>
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Incoming Tickets
            </h3>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Search tickets..."
                  className="w-full pl-4 pr-10 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]" />

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
                  <th className="px-6 py-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {[
                {
                  id: 'TK-8821',
                  subject: 'System outage in North Wing',
                  client: 'TechCorp Inc.',
                  priority: 'Critical',
                  status: 'New',
                  sla: 2,
                  totalSla: 4,
                  assignee: null
                },
                {
                  id: 'TK-8820',
                  subject: 'Printer configuration error',
                  client: 'Logistics Ltd.',
                  priority: 'Medium',
                  status: 'Assigned',
                  sla: 18,
                  totalSla: 24,
                  assignee: 'John D.'
                },
                {
                  id: 'TK-8819',
                  subject: 'Software license renewal',
                  client: 'Alpha Group',
                  priority: 'Low',
                  status: 'In Progress',
                  sla: 45,
                  totalSla: 48,
                  assignee: 'Sarah M.'
                },
                {
                  id: 'TK-8818',
                  subject: 'Network latency issues',
                  client: 'Beta Systems',
                  priority: 'High',
                  status: 'Escalated',
                  sla: 1,
                  totalSla: 8,
                  assignee: 'Mike R.'
                },
                {
                  id: 'TK-8817',
                  subject: 'New user onboarding',
                  client: 'Gamma Corp',
                  priority: 'Low',
                  status: 'Resolved',
                  sla: 0,
                  totalSla: 24,
                  assignee: 'Jenny L.'
                }].
                map((ticket) =>
                <tr
                  key={ticket.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">

                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 dark:text-white text-xs block mb-1">
                        {ticket.id}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {ticket.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {ticket.client}
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4">
                      {ticket.status !== 'Resolved' &&
                    ticket.status !== 'Closed' &&
                    <SLATimer
                      hoursRemaining={ticket.sla}
                      totalHours={ticket.totalSla} />

                    }
                    </td>
                    <td className="px-6 py-4">
                      {ticket.assignee ?
                    <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300">
                            {ticket.assignee.charAt(0)}
                          </div>
                          <span className="text-gray-600 dark:text-gray-400">
                            {ticket.assignee}
                          </span>
                        </div> :

                    <button className="text-xs font-medium text-[#0E8F79] dark:text-green-400 hover:underline">
                          + Assign Agent
                        </button>
                    }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing 5 of 24 tickets
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">
                Previous
              </button>
              <button className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                Next
              </button>
            </div>
          </div>
        </Card>

        {/* Escalation Module */}
        <div className="space-y-6">
          <Card className="border-t-4 border-t-orange-500">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
              Escalation Module
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Ticket
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm">
                  <option>TK-8821 - System outage...</option>
                  <option>TK-8820 - Printer config...</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Escalation Type
                </label>
                <div className="flex flex-col gap-2">
                  {[
                  {
                    key: 'Higher',
                    label: 'Escalate to Higher Position',
                    icon: ArrowUpRight,
                    active:
                    'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                  },
                  {
                    key: 'Distributor',
                    label: 'Cascade to Distributor',
                    icon: Share2,
                    active:
                    'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300'
                  },
                  {
                    key: 'Principal',
                    label: 'Cascade to Principal',
                    icon: Building2,
                    active:
                    'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-[#0E8F79] dark:text-green-400'
                  }].
                  map(({ key, label, icon: Icon, active }) =>
                  <button
                    key={key}
                    onClick={() => setEscalationType(key as any)}
                    className={`flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-all ${escalationType === key ? active : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>

                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none resize-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Explain why this ticket needs escalation..." />

              </div>
              <GreenButton onClick={handleEscalate} fullWidth>
                Submit Escalation
              </GreenButton>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">
                Escalation History
              </h3>
            </div>
            <div className="space-y-4">
              {MOCK_ESCALATIONS.map((item) =>
              <div
                key={item.id}
                className={`pl-3 border-l-4 ${item.type === 'Escalated' ? 'border-orange-400' : 'border-[#0E8F79]'}`}>

                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {item.ticketId}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {item.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.type === 'Escalated' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' : 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'}`}>

                      {item.type}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      to {item.to}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                    "{item.reason}"
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>);

}