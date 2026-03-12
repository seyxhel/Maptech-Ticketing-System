import React from 'react';
interface PriorityBadgeProps {
  priority: string;
}

// Case-insensitive matching — works with both backend (lowercase) and UI (Title Case)
const priorityStyles: Record<string, string> = {
  'low':      'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
  'medium':   'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700',
  'high':     'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700',
  'critical': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
};

const pulseDotColor: Record<string, string> = {
  'high':     'bg-orange-500',
  'critical': 'bg-red-500',
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const key = priority.toLowerCase();
  const style =
    priorityStyles[key] ??
    'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
  const display = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  const shouldPulse = key === 'critical' || key === 'high';
  const dotColor = pulseDotColor[key];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}
    >
      {shouldPulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
        </span>
      )}
      {display}
    </span>
  );
}