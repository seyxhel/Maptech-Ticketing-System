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
} from 'lucide-react';

type Role = 'SuperAdmin' | 'Admin' | 'Employee' | 'Client';

export interface NotificationItem {
  id: string;
  type: 'assignment' | 'escalation' | 'approval' | 'resolution' | 'sla_warning' | 'new_client_ticket';
  title: string;
  ticketId?: string;
  time: string;
  read: boolean;
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', type: 'assignment',        title: 'Ticket Assignment',       ticketId: 'STF-MT-20260223000012', time: '2m ago',  read: false },
  { id: '2', type: 'escalation',        title: 'Ticket Escalation',       ticketId: 'STF-MT-20260223000015', time: '15m ago', read: false },
  { id: '3', type: 'approval',          title: 'Ticket Approval',         ticketId: 'STF-MT-20260223000018', time: '1h ago',  read: false },
  { id: '4', type: 'resolution',        title: 'Resolution Confirmation', ticketId: 'STF-MT-20260223000012', time: '2h ago',  read: true  },
  { id: '5', type: 'sla_warning',       title: 'SLA Warning',             ticketId: 'STF-MT-20260223000015', time: '30m ago', read: true  },
  { id: '6', type: 'new_client_ticket', title: 'New Client Ticket',       ticketId: 'STF-MT-20260223000020', time: '5m ago',  read: false },
];

function getNotificationPath(role: Role, type: NotificationItem['type']): string {
  switch (role) {
    case 'Admin':
      switch (type) {
        case 'escalation':        return '/admin/escalation';
        case 'new_client_ticket': return '/admin/tickets';
        default:                  return '/admin/ticket-details';
      }
    case 'Employee':
      return '/employee/ticket-details';
    case 'Client':
      return '/client/ticket-details';
    case 'SuperAdmin':
      switch (type) {
        case 'escalation': return '/superadmin/dashboard';
        default:           return '/superadmin/dashboard';
      }
    default:
      return '/';
  }
}

function getIcon(type: NotificationItem['type']) {
  switch (type) {
    case 'assignment':        return Ticket;
    case 'escalation':        return ArrowUpRight;
    case 'approval':          return Check;
    case 'resolution':        return CheckCircle;
    case 'sla_warning':       return AlertTriangle;
    case 'new_client_ticket': return FileText;
    default:                  return Bell;
  }
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  notifications: NotificationItem[];
  onNotificationsChange: (notifications: NotificationItem[]) => void;
}

export function NotificationPanel({ isOpen, onClose, role, notifications, onNotificationsChange }: NotificationPanelProps) {
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = (item: NotificationItem) => {
    onNotificationsChange(notifications.map((n) => n.id === item.id ? { ...n, read: true } : n));
    onClose();
    const path = getNotificationPath(role, item.type);
    navigate(path, item.ticketId ? { state: { ticketId: item.ticketId } } : undefined);
  };

  const markAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNotificationsChange(notifications.map((n) => ({ ...n, read: true })));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible backdrop to close on outside click */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dropdown below bell */}
      <div
        className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col max-h-[70vh] overflow-hidden z-50"
        role="dialog"
        aria-label="Notifications"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#0E8F79]" />
            Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </h2>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-[#0E8F79] hover:underline font-medium"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.map((item) => {
            const Icon = getIcon(item.type);
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                  item.read
                    ? 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    : 'bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#0E8F79]/10 dark:bg-[#0E8F79]/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#0E8F79]" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${item.read ? 'font-normal text-gray-600 dark:text-gray-300' : 'font-semibold text-gray-900 dark:text-white'}`}>
                    {item.title}
                  </p>
                  {item.ticketId && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{item.ticketId}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.time}</p>
                </div>

                {/* Read/Unread dot */}
                <div className="flex-shrink-0 mt-1.5">
                  {item.read
                    ? <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 inline-block" title="Read" />
                    : <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" title="Unread" />
                  }
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
