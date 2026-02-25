import React from 'react';
interface PriorityBadgeProps {
  priority: string;
}
const priorityStyles: Record<string, string> = {
  Low: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
  Medium:
  'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700',
  High: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700',
  Critical:
  'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700'
};
export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const style =
  priorityStyles[priority] ??
  'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>

      {priority}
    </span>);

}