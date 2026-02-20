import React from 'react';
import { TrendingUp, TrendingDown, BoxIcon } from 'lucide-react';
interface StatCardProps {
  title: string;
  value: string;
  icon: BoxIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtext?: string;
  color?: 'green' | 'orange' | 'blue' | 'purple' | 'red';
}
const colorMap = {
  green: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    icon: 'text-[#3BC25B]'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    icon: 'text-orange-500'
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    icon: 'text-blue-500'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    icon: 'text-purple-500'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    icon: 'text-red-500'
  }
};
export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtext,
  color = 'green'
}: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {subtext &&
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {subtext}
            </p>
          }
          {trend &&
          <div
            className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>

              {trend.isPositive ?
            <TrendingUp className="w-3 h-3" /> :

            <TrendingDown className="w-3 h-3" />
            }
              {trend.value}% vs last period
            </div>
          }
        </div>
        <div className={`p-3 rounded-xl ${c.bg}`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
      </div>
    </div>);

}