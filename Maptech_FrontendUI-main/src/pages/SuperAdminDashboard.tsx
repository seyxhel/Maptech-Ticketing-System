import React from 'react';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { GreenButton } from '../components/ui/GreenButton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { Ticket, AlertTriangle, Users, ShieldCheck } from 'lucide-react';
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
const TICKET_DATA = [
{
  name: 'Mon',
  tickets: 45
},
{
  name: 'Tue',
  tickets: 52
},
{
  name: 'Wed',
  tickets: 38
},
{
  name: 'Thu',
  tickets: 65
},
{
  name: 'Fri',
  tickets: 48
},
{
  name: 'Sat',
  tickets: 25
},
{
  name: 'Sun',
  tickets: 15
}];

const PRIORITY_DATA = [
{
  name: 'Low',
  value: 35,
  color: '#3BC25B'
},
{
  name: 'Medium',
  value: 45,
  color: '#F59E0B'
},
{
  name: 'High',
  value: 15,
  color: '#EF4444'
},
{
  name: 'Critical',
  value: 5,
  color: '#991B1B'
}];

export function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            SuperAdmin Overview
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Global system monitoring and performance metrics
          </p>
        </div>
        <div className="flex gap-3">
          <GreenButton variant="outline">Download Report</GreenButton>
          <GreenButton>System Settings</GreenButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tickets (Monthly)"
          value="1,284"
          icon={Ticket}
          trend={{
            value: 12,
            isPositive: true
          }}
          color="green" />

        <StatCard
          title="Critical Issues"
          value="23"
          icon={AlertTriangle}
          trend={{
            value: 5,
            isPositive: false
          }}
          subtext="Requires immediate attention"
          color="orange" />

        <StatCard
          title="SLA Compliance"
          value="94.2%"
          icon={ShieldCheck}
          trend={{
            value: 1.2,
            isPositive: true
          }}
          color="blue" />

        <StatCard
          title="Active Users"
          value="842"
          icon={Users}
          subtext="Clients & Employees"
          color="purple" />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" accent>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Ticket Volume Trends
            </h3>
            <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 focus:ring-2 focus:ring-[#3BC25B] outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TICKET_DATA}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB" />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#6B7280'
                  }} />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#6B7280'
                  }} />

                <Tooltip
                  cursor={{
                    fill: '#F3F4F6'
                  }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    backgroundColor: '#fff',
                    color: '#111'
                  }} />

                <Bar
                  dataKey="tickets"
                  fill="url(#colorGradient)"
                  radius={[4, 4, 0, 0]} />

                <defs>
                  <linearGradient
                    id="colorGradient"
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
            Tickets by Priority
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PRIORITY_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value">

                  {PRIORITY_DATA.map((entry, i) =>
                  <Cell key={i} fill={entry.color} />
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f9fafb'
                  }} />

                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{
                    color: '#6b7280'
                  }} />

              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Critical Resolution Time
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                1.2 hrs
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                High Priority Resolution
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                4.5 hrs
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card accent>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Recent Escalations
          </h3>
          <GreenButton variant="ghost" className="text-sm">
            View All
          </GreenButton>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3">Ticket ID</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {[1, 2, 3, 4, 5].map((i) =>
              <tr
                key={i}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/40">

                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    #TK-2024-{100 + i}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    Server downtime in region {i}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                        C{i}
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Client Corp {i}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={i === 1 ? 'Critical' : 'High'} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status="Escalated" />
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    Sarah Engineer
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>);

}