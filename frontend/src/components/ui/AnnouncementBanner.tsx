import { useState, useEffect } from 'react';
import { Info, AlertTriangle, CheckCircle, AlertOctagon, X } from 'lucide-react';
import { fetchAnnouncements } from '../../services/api';
import type { AnnouncementData } from '../../services/api';

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: string; iconComponent: typeof Info }> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-300 dark:border-blue-700',
    icon: 'text-blue-600 dark:text-blue-400',
    iconComponent: Info,
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-300 dark:border-amber-700',
    icon: 'text-amber-600 dark:text-amber-400',
    iconComponent: AlertTriangle,
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-300 dark:border-green-700',
    icon: 'text-green-600 dark:text-green-400',
    iconComponent: CheckCircle,
  },
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-300 dark:border-red-700',
    icon: 'text-red-600 dark:text-red-400',
    iconComponent: AlertOctagon,
  },
};

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchAnnouncements()
      .then(setAnnouncements)
      .catch(() => {});
  }, []);

  const visible = announcements.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      {visible.map((ann) => {
        const style = TYPE_STYLES[ann.announcement_type] || TYPE_STYLES.info;
        const Icon = style.iconComponent;
        return (
          <div
            key={ann.id}
            className={`flex items-start gap-3 rounded-lg border p-4 ${style.bg} ${style.border}`}
          >
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${style.icon}`}>{ann.title}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-line">
                {ann.description}
              </p>
            </div>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(ann.id))}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
