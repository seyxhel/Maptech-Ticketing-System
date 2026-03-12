import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
interface SLATimerProps {
  hoursRemaining: number;
  totalHours: number;
  status?: string;
}
export function SLATimer({ hoursRemaining, totalHours, status }: SLATimerProps) {
  if (status === 'Resolved' || status === 'Closed') {
    return (
      <div className="flex flex-col gap-1 min-w-[90px]">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span className="text-xs font-bold text-green-600 dark:text-green-400">Done</span>
        </div>
        <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden w-full">
          <div className="h-full bg-green-500 rounded-full w-full" />
        </div>
      </div>
    );
  }
  const pct = Math.max(0, Math.min(100, hoursRemaining / totalHours * 100));
  const isUrgent = pct <= 25;
  const isWarning = pct <= 50 && pct > 25;
  const barColor = isUrgent ?
  'bg-red-500' :
  isWarning ?
  'bg-yellow-500' :
  'bg-[#3BC25B]';
  const textColor = isUrgent ?
  'text-red-600 dark:text-red-400' :
  isWarning ?
  'text-yellow-600 dark:text-yellow-400' :
  'text-[#0E8F79] dark:text-green-400';
  return (
    <div className="flex flex-col gap-1 min-w-[90px]">
      <div className="flex items-center gap-1">
        <Clock className={`w-3 h-3 ${textColor}`} />
        <span className={`text-xs font-bold ${textColor}`}>
          {hoursRemaining}h left
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden w-full">
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{
            width: `${pct}%`
          }} />

      </div>
    </div>);

}