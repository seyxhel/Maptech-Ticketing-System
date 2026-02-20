import React from 'react';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { GreenButton } from '../components/ui/GreenButton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line } from
'recharts';
import { FileText, TrendingUp, Clock, Star } from 'lucide-react';
const DATA = [
{
  month: 'Jan',
  tickets: 120,
  resolved: 110
},
{
  month: 'Feb',
  tickets: 145,
  resolved: 130
},
{
  month: 'Mar',
  tickets: 98,
  resolved: 95
},
{
  month: 'Apr',
  tickets: 167,
  resolved: 150
},
{
  month: 'May',
  tickets: 134,
  resolved: 128
},
{
  month: 'Jun',
  tickets: 189,
  resolved: 175
}];

export function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            System-wide performance metrics and trends
          </p>
        </div>
        <GreenButton variant="outline">Export Report</GreenButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Tickets"
          value="853"
          icon={FileText}
          trend={{
            value: 8,
            isPositive: true
          }}
          color="green" />

        <StatCard
          title="Resolution Rate"
          value="94%"
          icon={TrendingUp}
          trend={{
            value: 2,
            isPositive: true
          }}
          color="blue" />

        <StatCard
          title="Avg Response"
          value="1.4h"
          icon={Clock}
          trend={{
            value: 12,
            isPositive: true
          }}
          color="orange" />

        <StatCard
          title="CSAT Score"
          value="4.7/5"
          icon={Star}
          trend={{
            value: 0.2,
            isPositive: true
          }}
          color="purple" />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card accent>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Monthly Ticket Volume
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DATA}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB" />

                <XAxis
                  dataKey="month"
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
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    backgroundColor: '#fff',
                    color: '#111'
                  }} />

                <Bar
                  dataKey="tickets"
                  fill="#3BC25B"
                  radius={[4, 4, 0, 0]}
                  name="Tickets" />

                <Bar
                  dataKey="resolved"
                  fill="#0E8F79"
                  radius={[4, 4, 0, 0]}
                  name="Resolved" />

              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card accent>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Resolution Trend
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DATA}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB" />

                <XAxis
                  dataKey="month"
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
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    backgroundColor: '#fff',
                    color: '#111'
                  }} />

                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#63D44A"
                  strokeWidth={2}
                  dot={{
                    fill: '#63D44A'
                  }}
                  name="Resolved" />

              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>);

}