import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Ticket,
  ArrowUpRight,
  CheckCircle,
  Check,
  AlertTriangle,
  FileText,
  X,
} from 'lucide-react';

type Role = 'SuperAdmin' | 'Admin' | 'Employee' | 'Client';

interface NotificationItem {
  id: string;
  type: 'assignment' | 'escalation' | 'approval' | 'resolution' | 'sla_warning' | 'new_client_ticket';
  title: string;
  ticketId?: string;
  time: string;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', type: 'assignment', title: 'Ticket Assignment', ticketId: 'TK-9012', time: '2m ago' },
  { id: '2', type: 'escalation', title: 'Ticket Escalation', ticketId: 'TK-9015', time: '15m ago' },
  { id: '3', type: 'approval', title: 'Ticket Approval', ticketId: 'TK-9018', time: '1h ago' },
  { id: '4', type: 'resolution', title: 'Resolution Confirmation', ticketId: 'TK-9012', time: '2h ago' },
  { id: '5', type: 'sla_warning', title: 'SLA Warning', ticketId: 'TK-9015', time: '30m ago' },
  { id: '6', type: 'new_client_ticket', title: 'New Client Ticket', ticketId: 'TK-9020', time: '5m ago' },
];

function getTicketDetailsPath(role: Role): string {
  switch (role) {
    case 'Employee':
      return '/employee/ticket-details';
    case 'Client':
      return '/client/ticket-details';
    case 'Admin':
      return '/admin/tickets';
    case 'SuperAdmin':
      return '/superadmin/dashboard';
    default:
      return '/';
  }
}

function getIcon(type: NotificationItem['type']) {
  switch (type) {
    case 'assignment': return Ticket;
    case 'escalation': return ArrowUpRight;
    case 'approval': return Check;
    case 'resolution': return CheckCircle;
    case 'sla_warning': return AlertTriangle;
    case 'new_client_ticket': return FileText;
    default: return Bell;
  }
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
}

export function NotificationPanel({ isOpen, onClose, role }: NotificationPanelProps) {
  const navigate = useNavigate();
  const ticketPath = getTicketDetailsPath(role);

  const handleClick = (item: NotificationItem) => {
    onClose();
    navigate(ticketPath, item.ticketId ? { state: { ticketId: item.ticketId } } : undefined);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 flex flex-col"
        role="dialog"
        aria-label="Notifications"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0E8F79]" />
            Notifications
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {MOCK_NOTIFICATIONS.map((item) => {
            const Icon = getIcon(item.type);
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                className="w-full flex items-start gap-3 p-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#0E8F79]/10 dark:bg-[#0E8F79]/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#0E8F79]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                  {item.ticketId && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.ticketId}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{item.time}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
